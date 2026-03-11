import { useEffect, useRef, useState, useCallback } from 'react'

// カラーパレット関数：t (0〜1) から RGB 値を返す
interface ColorPalette {
  name: string
  getColor: (t: number) => [number, number, number]
}

const colorPalettes: ColorPalette[] = [
  {
    name: 'Original',
    getColor: (t) => [255 * t, 255 * t * t, 255 * t * t * t]
  },
  {
    name: 'Fire',
    getColor: (t) => {
      const r = Math.min(255, 255 * t * 2)
      const g = Math.min(255, 255 * Math.sin(t * Math.PI))
      const b = 255 * (1 - t)
      return [r, g, b]
    }
  },
  {
    name: 'Ocean',
    getColor: (t) => {
      const r = 255 * t * t
      const g = 255 * t
      const b = 255
      return [r, g, b]
    }
  },
  {
    name: 'Aurora',
    getColor: (t) => {
      const r = 255 * Math.sin(t * Math.PI)
      const g = 255 * (0.5 + 0.5 * Math.cos(t * Math.PI))
      const b = 255 * (0.7 + 0.3 * Math.sin(t * Math.PI))
      return [r, g, b]
    }
  },
  {
    name: 'Sunset',
    getColor: (t) => {
      const r = 255
      const g = 255 * (1 - t)
      const b = 255 * t * 1.5
      return [r, g, b]
    }
  },
  {
    name: 'Neon',
    getColor: (t) => {
      const hue = t * 360
      const s = 100
      const l = 50 + 25 * Math.sin(t * 6 * Math.PI)
      // HSL to RGB
      const c = (1 - Math.abs(2 * (l / 100) - 1)) * (s / 100)
      const x = c * (1 - Math.abs((hue / 60) % 2 - 1))
      const m = (l / 100) - c / 2
      let r = 0, g = 0, b = 0
      if (hue < 60) { r = c; g = x; b = 0 }
      else if (hue < 120) { r = x; g = c; b = 0 }
      else if (hue < 180) { r = 0; g = c; b = x }
      else if (hue < 240) { r = 0; g = x; b = c }
      else if (hue < 300) { r = x; g = 0; b = c }
      else { r = c; g = 0; b = x }
      return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]
    }
  },
  {
    name: 'Golden',
    getColor: (t) => {
      const r = 255
      const g = 200 * t
      const b = 50 * t
      return [r, g, b]
    }
  },
]

interface Props {
  width?: number
  height?: number
  maxIterations?: number
  colorScheme?: number
}

export default function BurningShip({ width = 800, height = 600, maxIterations = 100, colorScheme = 0 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // View state: center point and zoom scale
  const [view, setView] = useState({ centerX: -0.77, centerY: 0, scale: 1.5 })

  // Pan state
  const isPanningRef = useRef(false)
  const lastMouseRef = useRef({ x: 0, y: 0 })

  // Auto-repeat for ▲/▼ buttons
  const repeatTimerRef = useRef<NodeJS.Timeout | null>(null)
  const repeatDirectionRef = useRef<'up' | 'down' | null>(null)

  // Color scheme state
  const [activeColorScheme, setActiveColorScheme] = useState(colorScheme)

  // Draw the fractal with current view
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = width
    const h = height

    // Create image data
    const imageData = ctx.createImageData(w, h)
    const data = imageData.data

    // Calculate visible area based on center and scale
    const viewWidth = 4 / view.scale
    const viewHeight = 4 / view.scale
    const xMin = view.centerX - viewWidth / 2
    const xMax = view.centerX + viewWidth / 2
    const yMin = view.centerY - viewHeight / 2
    const yMax = view.centerY + viewHeight / 2

    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        // Convert pixel coordinates to complex plane
        const cRe = xMin + (px / w) * (xMax - xMin)
        const cIm = yMin + (py / h) * (yMax - yMin)

        // Burning Ship iteration: z = |z²| + c
        // This is the key difference from Mandelbrot!
        // Formula: z_new = |z_old²| + c
        // Where |a+bi|² means taking absolute value of real and imaginary parts separately
        let xr = 0, xi = 0
        let n = 0
        while (n < maxIterations) {
          // z² = (xr + xi*i)² = (xr² - xi²) + 2*xr*xi*i
          const realPart = xr * xr - xi * xi
          const imagPart = 2 * xr * xi

          // Take absolute value and add c
          xr = Math.abs(realPart) + cRe
          xi = Math.abs(imagPart) + cIm

          // Check if escaped (using 4 as escape radius for z²)
          if (xr * xr + xi * xi > 16) break
          n++
        }

        // Set pixel color
        const idx = (py * w + px) * 4
        if (n === maxIterations) {
          // Inside set: black
          data[idx] = 0
          data[idx + 1] = 0
          data[idx + 2] = 0
        } else {
          // Outside: gradient based on iterations
          const t = n / maxIterations
          const [r, g, b] = colorPalettes[activeColorScheme].getColor(t)
          data[idx] = r
          data[idx + 1] = g
          data[idx + 2] = b
        }
        data[idx + 3] = 255
      }
    }

    ctx.putImageData(imageData, 0, 0)
  }, [width, height, maxIterations, view, activeColorScheme])

  useEffect(() => {
    draw()
  }, [draw])

  // Handle zoom with mouse wheel
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // Calculate complex coordinate at mouse position
    const viewWidth = 4 / view.scale
    const viewHeight = 4 / view.scale
    const xMin = view.centerX - viewWidth / 2
    const yMin = view.centerY - viewHeight / 2
    const mouseCRe = xMin + (mouseX / width) * viewWidth
    const mouseCIm = yMin + (mouseY / height) * viewHeight

    // Calculate new scale
    const newScale = view.scale * (e.deltaY < 0 ? 1.2 : 0.8)

    // Adjust center to zoom toward mouse position
    const offsetX = (mouseCRe - view.centerX) * (newScale / view.scale - 1)
    const offsetY = (mouseCIm - view.centerY) * (newScale / view.scale - 1)

    setView(prev => ({
      centerX: prev.centerX + offsetX,
      centerY: prev.centerY + offsetY,
      scale: newScale
    }))
  }, [view, width])

  // Handle pan with mouse drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // Left click
      isPanningRef.current = true
      lastMouseRef.current = { x: e.clientX, y: e.clientY }
    }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanningRef.current) return

    const dx = e.clientX - lastMouseRef.current.x
    const dy = e.clientY - lastMouseRef.current.y

    // Convert pixel delta to complex plane delta
    const viewWidth = 4 / view.scale
    const viewHeight = 4 / view.scale
    const cDeltaX = (dx / width) * viewWidth
    const cDeltaY = (dy / height) * viewHeight

    setView(prev => ({
      ...prev,
      centerX: prev.centerX - cDeltaX,
      centerY: prev.centerY - cDeltaY
    }))

    lastMouseRef.current = { x: e.clientX, y: e.clientY }
  }, [view, width])

  const handleMouseUp = useCallback(() => {
    isPanningRef.current = false
  }, [])

  // Reset view to initial state
  const handleReset = useCallback(() => {
    setView({ centerX: -0.77, centerY: 0, scale: 1.5 })
    setActiveColorScheme(0)
  }, [])

  // Zoom step size
  const ZOOM_FACTOR = 1.1

  // Auto-repeat zoom on ▲/▼ button hold
  const startAutoRepeat = useCallback((direction: 'up' | 'down') => {
    if (repeatTimerRef.current) return

    repeatDirectionRef.current = direction

    // Initial execution
    setView(prev => ({
      ...prev,
      scale: direction === 'up' ? prev.scale * ZOOM_FACTOR : prev.scale / ZOOM_FACTOR
    }))

    // Repeat every 10ms
    repeatTimerRef.current = setInterval(() => {
      setView(prev => ({
        ...prev,
        scale: direction === 'up' ? prev.scale * ZOOM_FACTOR : prev.scale / ZOOM_FACTOR
      }))
    }, 10) as unknown as NodeJS.Timeout
  }, [])

  const stopAutoRepeat = useCallback(() => {
    if (repeatTimerRef.current) {
      clearInterval(repeatTimerRef.current)
      repeatTimerRef.current = null
      repeatDirectionRef.current = null
    }
  }, [])

  const handleZoomButtonMouseDown = useCallback((direction: 'up' | 'down') => {
    startAutoRepeat(direction)
  }, [startAutoRepeat])

  const handleZoomButtonMouseUp = useCallback(() => {
    stopAutoRepeat()
  }, [stopAutoRepeat])

  const handleZoomButtonMouseLeave = useCallback(() => {
    stopAutoRepeat()
  }, [stopAutoRepeat])

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ width: '100%', height: '100%', cursor: 'crosshair' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        background: 'rgba(0,0,0,0.7)',
        color: '#fff',
        padding: '12px',
        borderRadius: '6px',
        fontSize: '13px',
        fontFamily: 'monospace'
      }}>
        <div>Zoom: {view.scale.toFixed(1)}x</div>
        <div style={{ marginTop: 8 }}>
          <label style={{ marginRight: 8 }}>Color:</label>
          <select
            value={activeColorScheme}
            onChange={(e) => setActiveColorScheme(Number(e.target.value))}
            style={{
              background: '#333',
              color: '#fff',
              border: '1px solid #555',
              borderRadius: '3px',
              padding: '2px 6px',
              cursor: 'pointer'
            }}
          >
            {colorPalettes.map((palette, index) => (
              <option key={palette.name} value={index}>{palette.name}</option>
            ))}
          </select>
        </div>
        <div style={{ marginTop: 8 }}>
          <button
            onClick={handleReset}
            style={{
              padding: '4px 10px',
              cursor: 'pointer',
              background: '#4a7',
              border: 'none',
              borderRadius: '3px',
              color: '#000'
            }}
          >
            Reset View
          </button>
        </div>
      </div>
    </div>
  )
}
