import { useState } from 'react'
import Header, { type FractalType, type ViewerMode } from './components/Header'
import Mandelbrot from './components/Mandelbrot'
import Julia from './components/Julia'
import BurningShip from './components/BurningShip'

function App() {
  const [fractalType, setFractalType] = useState<FractalType>(null)
  const [viewerMode, setViewerMode] = useState<ViewerMode>('fractal')

  return (
    <div style={{ margin: 0, padding: 0 }}>
      <Header
        onTypeChange={setFractalType}
        onModeChange={setViewerMode}
        type={fractalType}
        mode={viewerMode}
      />
      {viewerMode === 'fractal' && fractalType === 'mandelbrot' && (
        <div style={{ paddingTop: '60px', minHeight: '100vh', background: 'black' }}>
          <Mandelbrot width={window.innerWidth} height={window.innerHeight} maxIterations={200} />
        </div>
      )}
      {viewerMode === 'fractal' && fractalType === 'julia' && (
        <div style={{ paddingTop: '60px', minHeight: '100vh', background: 'black' }}>
          <Julia width={window.innerWidth} height={window.innerHeight} maxIterations={200} cRe={-0.8} cIm={0.156155} />
        </div>
      )}
      {viewerMode === 'burningShip' && (
        <div style={{ paddingTop: '60px', minHeight: '100vh', background: 'black' }}>
          <BurningShip width={window.innerWidth} height={window.innerHeight} maxIterations={100} />
        </div>
      )}
    </div>
  )
}

export default App