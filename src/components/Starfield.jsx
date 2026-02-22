import { useEffect, useRef } from 'react'

export default function Starfield() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let animationId
    let stars = []

    const setCanvasSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.scale(dpr, dpr)
      initStars()
    }

    const initStars = () => {
      const count = Math.min(120, Math.floor((window.innerWidth * window.innerHeight) / 12000))
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 1.2 + 0.3,
        opacity: Math.random() * 0.5 + 0.3,
        twinkle: Math.random() * Math.PI * 2,
      }))
    }

    const draw = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      ctx.clearRect(0, 0, w, h)

      const t = Date.now() * 0.001
      stars.forEach((star) => {
        const twinkle = Math.sin(t + star.twinkle) * 0.3 + 0.7
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * twinkle})`
        ctx.fill()
      })

      // Subtle orbital arcs
      ctx.lineWidth = 1
      ctx.setLineDash([4, 8])
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.08)'
      ctx.beginPath()
      ctx.ellipse(w * 0.72, h * 0.35, w * 0.35, h * 0.2, 0.2, 0, Math.PI * 2)
      ctx.stroke()
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.06)'
      ctx.beginPath()
      ctx.ellipse(w * 0.25, h * 0.6, w * 0.22, h * 0.14, -0.1, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])

      animationId = requestAnimationFrame(draw)
    }

    setCanvasSize()
    window.addEventListener('resize', setCanvasSize)
    draw()
    return () => {
      window.removeEventListener('resize', setCanvasSize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  )
}
