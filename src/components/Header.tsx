export type FractalType = 'mandelbrot' | 'julia' | null
export type ViewerMode = 'fractal' | 'burningShip'

interface HeaderProps {
  onTypeChange: (type: FractalType) => void
  onModeChange: (mode: ViewerMode) => void
  type: FractalType
  mode: ViewerMode
  zoomLevel: number
}

export default function Header({ onTypeChange, onModeChange, type, mode, zoomLevel }: HeaderProps) {
  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        padding: '16px 24px',
        background: '#222',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
      }}
    >
      <h1 style={{ margin: 0, fontSize: '20px', color: '#fff' }}>
        {mode === 'fractal' ? 'Fractal Viewer' : 'Burning Ship'}
      </h1>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {mode === 'fractal' && type === 'mandelbrot' && (
          <span style={{ color: '#888', fontSize: '12px', padding: '4px 8px', background: '#333', borderRadius: '4px' }}>
            🖱️ Scroll to zoom ({zoomLevel.toFixed(1)}x)
          </span>
        )}
        <button
          onClick={() => onModeChange(mode === 'fractal' ? 'burningShip' : 'fractal')}
          style={{
            padding: '10px 20px',
            background: mode === 'fractal' ? '#4a9eff' : '#444',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Fractal
        </button>
        <button
          onClick={() => onModeChange(mode === 'burningShip' ? 'fractal' : 'burningShip')}
          style={{
            padding: '10px 20px',
            background: mode === 'burningShip' ? '#ff6b4a' : '#444',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Burning Ship
        </button>
        {mode === 'fractal' && (
          <>
            <button
              onClick={() => onTypeChange(type === 'mandelbrot' ? null : 'mandelbrot')}
              style={{
                padding: '10px 20px',
                background: type === 'mandelbrot' ? '#4a9eff' : '#444',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Mandelbrot
            </button>
            <button
              onClick={() => onTypeChange(type === 'julia' ? null : 'julia')}
              style={{
                padding: '10px 20px',
                background: type === 'julia' ? '#4a9eff' : '#444',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Julia
            </button>
          </>
        )}
      </div>
    </header>
  )
}