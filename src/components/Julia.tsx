import { useEffect, useRef, useState } from 'react'

interface JuliaProps {
  width?: number
  height?: number
  maxIterations?: number
  cRe?: number
  cIm?: number
}

interface ParameterState {
  maxIterations: number
  cRe: number
  cIm: number
}

type AutoVaryParam = 'maxIterations' | 'cRe' | 'cIm' | null
type Direction = 1 | -1

const PRESETS = [
  { name: 'デフォルト', cRe: -0.8, cIm: 0.156155 },
  { name: 'ドラゴン', cRe: 0.2835, cIm: 0.7645 },
  { name: 'リング', cRe: 0.25, cIm: 0.75 },
  { name: 'フラワーズ', cRe: -0.1, cIm: 0.7912 },
  { name: 'スパイラル', cRe: 0.37, cIm: 0.35 },
]

export default function Julia({
  width = 800,
  height = 600,
  maxIterations: defaultMaxIterations = 1000,
  cRe: defaultCRe = -0.8,
  cIm: defaultCIm = 0.156155,
}: JuliaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // State for parameters
  const [params, setParams] = useState<ParameterState>({
    maxIterations: defaultMaxIterations,
    cRe: defaultCRe,
    cIm: defaultCIm,
  })

  // State for auto-vary functionality
  const [autoVaryParam, setAutoVaryParam] = useState<AutoVaryParam>(null)
  const [autoVaryDirection, setAutoVaryDirection] = useState<Direction>(1)

  // Helper function to increment/decrement parameter by 0.0002
  const adjustParameter = (param: keyof ParameterState, direction: 1 | -1) => {
    setParams((p) => {
      const currentValue = p[param]
      let newValue = currentValue + (direction === 1 ? 0.0002 : -0.0002)

      // Clamp values - 10-1000 for maxIterations, -1.5 to 1.5 for cRe/cIm
      if (param === 'maxIterations') {
        newValue = Math.max(10, Math.min(1000, newValue))
      } else {
        newValue = Math.max(-1.5, Math.min(1.5, newValue))
      }

      return { ...p, [param]: newValue }
    })
  }

  // Auto-vary effect
  useEffect(() => {
    if (!autoVaryParam) return

    const interval = setInterval(() => {
      setParams((p) => {
        const currentValue = p[autoVaryParam]
        // Use step 1 for maxIterations, 0.0002 for cRe/cIm
        const step = autoVaryParam === 'maxIterations' ? 1 : 0.0002
        let newValue = currentValue + (autoVaryDirection === 1 ? step : -step)

        // Clamp values
        if (autoVaryParam === 'maxIterations') {
          newValue = Math.max(10, Math.min(1000, newValue))
        } else {
          newValue = Math.max(-1.5, Math.min(1.5, newValue))
        }

        return { ...p, [autoVaryParam]: newValue }
      })
    }, 10) // Update every 10ms

    return () => clearInterval(interval)
  }, [autoVaryParam, autoVaryDirection])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = width
    const h = height

    // Clear with black background
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, w, h)

    // Create image data
    const imageData = ctx.createImageData(w, h)
    const data = imageData.data

    // Complex plane boundaries - centered on c value
    const viewSize = 2
    const xMin = params.cRe - viewSize
    const xMax = params.cRe + viewSize
    const yMin = params.cIm - viewSize
    const yMax = params.cIm + viewSize

    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        // Convert pixel coordinates to complex plane (z)
        const zr = xMin + (px / w) * (xMax - xMin)
        const zi = yMin + (py / h) * (yMax - yMin)

        // Julia iteration: z = z² + c (c is fixed)
        let curR = zr, curI = zi
        let n = 0
        while (curR * curR + curI * curI <= 4 && n < params.maxIterations) {
          const zr2 = curR * curR - curI * curI
          curI = 2 * curR * curI + params.cIm
          curR = zr2 + params.cRe
          n++
        }

        // Set pixel color
        const idx = (py * w + px) * 4
        if (n >= params.maxIterations) {
          // Inside set: black
          data[idx] = 0
          data[idx + 1] = 0
          data[idx + 2] = 0
        } else {
          // Outside: gradient based on iterations
          const t = n / params.maxIterations
          data[idx] = 255 * t
          data[idx + 1] = 255 * t * t
          data[idx + 2] = 255 * t * t * t
        }
        data[idx + 3] = 255
      }
    }

    ctx.putImageData(imageData, 0, 0)
  }, [width, height, params, autoVaryParam])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Control Panel */}
      <div
        style={{
          padding: '1rem',
          background: '#1a1a2e',
          borderRadius: '8px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
        }}
      >
        {/* Max Iterations */}
        <div>
          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: '0.875rem',
              color: '#e0e0e0',
            }}
          >
            <span>Max Iterations: {params.maxIterations}</span>
            <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.25rem' }}>
              <button
                onClick={() => {
                  setAutoVaryParam('maxIterations')
                  setAutoVaryDirection(1)
                }}
                onMouseDown={() => {
                  setAutoVaryParam('maxIterations')
                  setAutoVaryDirection(1)
                }}
                onMouseUp={() => setAutoVaryParam(null)}
                onMouseLeave={() => setAutoVaryParam(null)}
                onTouchStart={() => {
                  setAutoVaryParam('maxIterations')
                  setAutoVaryDirection(1)
                }}
                onTouchEnd={() => setAutoVaryParam(null)}
                style={{
                  padding: '0.25rem 0.5rem',
                  background: autoVaryParam === 'maxIterations' && autoVaryDirection === 1 ? '#5a5a8e' : '#3a3a5e',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                ▲
              </button>
              <input
                type="range"
                min="10"
                max="1000"
                value={params.maxIterations}
                onChange={(e) =>
                  setParams((p) => ({ ...p, maxIterations: Number(e.target.value) }))
                }
                style={{ cursor: 'grabber', flex: 1 }}
              />
              <button
                onClick={() => {
                  setAutoVaryParam('maxIterations')
                  setAutoVaryDirection(-1)
                }}
                onMouseDown={() => {
                  setAutoVaryParam('maxIterations')
                  setAutoVaryDirection(-1)
                }}
                onMouseUp={() => setAutoVaryParam(null)}
                onMouseLeave={() => setAutoVaryParam(null)}
                onTouchStart={() => {
                  setAutoVaryParam('maxIterations')
                  setAutoVaryDirection(-1)
                }}
                onTouchEnd={() => setAutoVaryParam(null)}
                style={{
                  padding: '0.25rem 0.5rem',
                  background: autoVaryParam === 'maxIterations' && autoVaryDirection === -1 ? '#5a5a8e' : '#3a3a5e',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                ▼
              </button>
            </div>
            <input
              type="number"
              min="10"
              max="1000"
              value={params.maxIterations}
              onChange={(e) =>
                setParams((p) => ({ ...p, maxIterations: Number(e.target.value) }))
              }
              style={{
                width: '80px',
                padding: '0.25rem',
                background: '#2a2a3e',
                color: '#fff',
                border: '1px solid #4a4a6e',
                borderRadius: '4px',
                fontSize: '0.875rem',
              }}
            />
          </label>
        </div>

        {/* cRe (Real part) */}
        <div>
          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: '0.875rem',
              color: '#e0e0e0',
            }}
          >
            <span>c (Real): {params.cRe.toFixed(4)}</span>
            <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.25rem' }}>
              <button
                onClick={() => {
                  setAutoVaryParam('cRe')
                  setAutoVaryDirection(1)
                }}
                onMouseDown={() => {
                  setAutoVaryParam('cRe')
                  setAutoVaryDirection(1)
                }}
                onMouseUp={() => setAutoVaryParam(null)}
                onMouseLeave={() => setAutoVaryParam(null)}
                onTouchStart={() => {
                  setAutoVaryParam('cRe')
                  setAutoVaryDirection(1)
                }}
                onTouchEnd={() => setAutoVaryParam(null)}
                style={{
                  padding: '0.25rem 0.5rem',
                  background: autoVaryParam === 'cRe' && autoVaryDirection === 1 ? '#5a5a8e' : '#3a3a5e',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                ▲
              </button>
              <input
                type="range"
                min="-1.5"
                max="1.5"
                step="0.0001"
                value={params.cRe}
                onChange={(e) =>
                  setParams((p) => ({ ...p, cRe: Number(e.target.value) }))
                }
                style={{ cursor: 'grabber', flex: 1 }}
              />
              <button
                onClick={() => {
                  setAutoVaryParam('cRe')
                  setAutoVaryDirection(-1)
                }}
                onMouseDown={() => {
                  setAutoVaryParam('cRe')
                  setAutoVaryDirection(-1)
                }}
                onMouseUp={() => setAutoVaryParam(null)}
                onMouseLeave={() => setAutoVaryParam(null)}
                onTouchStart={() => {
                  setAutoVaryParam('cRe')
                  setAutoVaryDirection(-1)
                }}
                onTouchEnd={() => setAutoVaryParam(null)}
                style={{
                  padding: '0.25rem 0.5rem',
                  background: autoVaryParam === 'cRe' && autoVaryDirection === -1 ? '#5a5a8e' : '#3a3a5e',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                ▼
              </button>
            </div>
            <input
              type="number"
              min="-1.5"
              max="1.5"
              step="0.0001"
              value={params.cRe}
              onChange={(e) =>
                setParams((p) => ({ ...p, cRe: Number(e.target.value) }))
              }
              style={{
                width: '100px',
                padding: '0.25rem',
                background: '#2a2a3e',
                color: '#fff',
                border: '1px solid #4a4a6e',
                borderRadius: '4px',
                fontSize: '0.875rem',
              }}
            />
          </label>
        </div>

        {/* cIm (Imaginary part) */}
        <div>
          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: '0.875rem',
              color: '#e0e0e0',
            }}
          >
            <span>c (Imag): {params.cIm.toFixed(4)}</span>
            <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.25rem' }}>
              <button
                onClick={() => {
                  setAutoVaryParam('cIm')
                  setAutoVaryDirection(1)
                }}
                onMouseDown={() => {
                  setAutoVaryParam('cIm')
                  setAutoVaryDirection(1)
                }}
                onMouseUp={() => setAutoVaryParam(null)}
                onMouseLeave={() => setAutoVaryParam(null)}
                onTouchStart={() => {
                  setAutoVaryParam('cIm')
                  setAutoVaryDirection(1)
                }}
                onTouchEnd={() => setAutoVaryParam(null)}
                style={{
                  padding: '0.25rem 0.5rem',
                  background: autoVaryParam === 'cIm' && autoVaryDirection === 1 ? '#5a5a8e' : '#3a3a5e',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                ▲
              </button>
              <input
                type="range"
                min="-1.5"
                max="1.5"
                step="0.0001"
                value={params.cIm}
                onChange={(e) =>
                  setParams((p) => ({ ...p, cIm: Number(e.target.value) }))
                }
                style={{ cursor: 'grabber', flex: 1 }}
              />
              <button
                onClick={() => {
                  setAutoVaryParam('cIm')
                  setAutoVaryDirection(-1)
                }}
                onMouseDown={() => {
                  setAutoVaryParam('cIm')
                  setAutoVaryDirection(-1)
                }}
                onMouseUp={() => setAutoVaryParam(null)}
                onMouseLeave={() => setAutoVaryParam(null)}
                onTouchStart={() => {
                  setAutoVaryParam('cIm')
                  setAutoVaryDirection(-1)
                }}
                onTouchEnd={() => setAutoVaryParam(null)}
                style={{
                  padding: '0.25rem 0.5rem',
                  background: autoVaryParam === 'cIm' && autoVaryDirection === -1 ? '#5a5a8e' : '#3a3a5e',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                ▼
              </button>
            </div>
            <input
              type="number"
              min="-1.5"
              max="1.5"
              step="0.0001"
              value={params.cIm}
              onChange={(e) =>
                setParams((p) => ({ ...p, cIm: Number(e.target.value) }))
              }
              style={{
                width: '100px',
                padding: '0.25rem',
                background: '#2a2a3e',
                color: '#fff',
                border: '1px solid #4a4a6e',
                borderRadius: '4px',
                fontSize: '0.875rem',
              }}
            />
          </label>
        </div>

        {/* Presets */}
        <div>
          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: '0.875rem',
              color: '#e0e0e0',
            }}
          >
            <span>Preset</span>
            <select
              value={PRESETS.findIndex((p) => p.cRe === params.cRe && p.cIm === params.cIm)}
              onChange={(e) => {
                const preset = PRESETS[Number(e.target.value)]
                setParams((p) => ({ ...p, cRe: preset.cRe, cIm: preset.cIm }))
              }}
              style={{
                padding: '0.5rem',
                background: '#2a2a3e',
                color: '#fff',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {PRESETS.map((preset, i) => (
                <option key={preset.name} value={i}>
                  {preset.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Stop Auto-Vary Button */}
        <button
          onClick={() => {
            setAutoVaryParam(null)
            setAutoVaryDirection(1)
          }}
          style={{
            padding: '0.5rem 1rem',
            background: autoVaryParam !== null ? '#c94a4a' : '#4a4a6e',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginLeft: 'auto',
          }}
        >
          {autoVaryParam !== null ? 'Stop Auto-Vary' : 'Auto-Vary Off'}
        </button>

        {/* Reset Button */}
        <button
          onClick={() => {
            setParams({
              maxIterations: defaultMaxIterations,
              cRe: defaultCRe,
              cIm: defaultCIm,
            })
            setAutoVaryParam(null)
            setAutoVaryDirection(1)
          }}
          style={{
            padding: '0.5rem 1rem',
            background: '#4a4a6e',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Reset
        </button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ width: '100%', height: '100%', borderRadius: '8px' }}
      />
    </div>
  )
}
