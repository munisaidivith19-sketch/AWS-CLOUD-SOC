import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../services/api'
import { useAuth } from '../context/AuthContext'

// ── Canvas Particle Animation ────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animFrameId: number
    let W = canvas.width  = window.innerWidth
    let H = canvas.height = window.innerHeight

    const onResize = () => {
      W = canvas.width  = window.innerWidth
      H = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', onResize)

    // ── Particle definition ──────────────────────────────
    const PARTICLE_COUNT = 80
    const CONNECTION_DIST = 140

    interface Particle {
      x: number; y: number
      vx: number; vy: number
      r: number
      color: string
      alpha: number
      pulse: number
      pulseSpeed: number
    }

    const COLORS = ['#4cc9f0', '#7209b7', '#06d6a0', '#ff4d6d', '#4361ee']

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      x:          Math.random() * W,
      y:          Math.random() * H,
      vx:         (Math.random() - 0.5) * 0.6,
      vy:         (Math.random() - 0.5) * 0.6,
      r:          Math.random() * 2.5 + 1,
      color:      COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha:      Math.random() * 0.6 + 0.2,
      pulse:      0,
      pulseSpeed: Math.random() * 0.02 + 0.01,
    }))

    // ── Traveling line beams ─────────────────────────────
    interface Beam {
      x: number; y: number
      tx: number; ty: number   // target direction
      progress: number
      speed: number
      color: string
      width: number
      length: number
      alpha: number
    }

    const beams: Beam[] = []

    const spawnBeam = () => {
      const edge   = Math.floor(Math.random() * 4)
      let sx = 0, sy = 0, tx = 0, ty = 0
      if (edge === 0) { sx = Math.random() * W; sy = 0;  tx = Math.random() * W; ty = H }
      if (edge === 1) { sx = W; sy = Math.random() * H;  tx = 0;                 ty = Math.random() * H }
      if (edge === 2) { sx = Math.random() * W; sy = H;  tx = Math.random() * W; ty = 0 }
      if (edge === 3) { sx = 0; sy = Math.random() * H;  tx = W;                 ty = Math.random() * H }
      beams.push({
        x: sx, y: sy, tx, ty,
        progress: 0,
        speed: Math.random() * 0.003 + 0.002,
        color:  COLORS[Math.floor(Math.random() * COLORS.length)],
        width:  Math.random() * 1.5 + 0.5,
        length: Math.random() * 0.15 + 0.05,
        alpha:  Math.random() * 0.5 + 0.3,
      })
    }

    // Spawn initial beams
    for (let i = 0; i < 6; i++) spawnBeam()

    // ── Geometric shapes in background ──────────────────
    interface Shape {
      x: number; y: number; size: number
      rotation: number; rotSpeed: number
      sides: number; color: string; alpha: number
    }

    const shapes: Shape[] = Array.from({ length: 8 }, () => ({
      x:        Math.random() * W,
      y:        Math.random() * H,
      size:     Math.random() * 80 + 30,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.003,
      sides:    [3,4,6,8][Math.floor(Math.random() * 4)],
      color:    COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha:    0.03 + Math.random() * 0.04,
    }))

    const drawPolygon = (
      x: number, y: number, sides: number,
      size: number, rotation: number,
      color: string, alpha: number
    ) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rotation)
      ctx.beginPath()
      for (let i = 0; i < sides; i++) {
        const angle = (Math.PI * 2 / sides) * i
        const px    = Math.cos(angle) * size
        const py    = Math.sin(angle) * size
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.strokeStyle = color
      ctx.globalAlpha = alpha
      ctx.lineWidth   = 1
      ctx.stroke()
      ctx.restore()
    }

    // ── Main animation loop ──────────────────────────────
    let tick = 0

    const draw = () => {
      tick++
      ctx.clearRect(0, 0, W, H)
      ctx.globalAlpha = 1

      // Background
      ctx.fillStyle = '#060818'
      ctx.fillRect(0, 0, W, H)

      // Grid
      ctx.globalAlpha = 0.04
      ctx.strokeStyle = '#4cc9f0'
      ctx.lineWidth   = 0.5
      const gs = 50
      for (let gx = 0; gx < W; gx += gs) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke()
      }
      for (let gy = 0; gy < H; gy += gs) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke()
      }

      // Geometric shapes
      shapes.forEach(s => {
        s.rotation += s.rotSpeed
        drawPolygon(s.x, s.y, s.sides, s.size, s.rotation, s.color, s.alpha)
      })

      // ── Particle connections ─────────────────────────
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx   = particles[i].x - particles[j].x
          const dy   = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < CONNECTION_DIST) {
            const lineAlpha = (1 - dist / CONNECTION_DIST) * 0.35
            ctx.globalAlpha = lineAlpha
            ctx.strokeStyle = particles[i].color
            ctx.lineWidth   = 0.6
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }

      // ── Draw and move particles ──────────────────────
      particles.forEach(p => {
        p.pulse += p.pulseSpeed
        const pulsedR = p.r + Math.sin(p.pulse) * 0.8

        // Glow
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, pulsedR * 4)
        grad.addColorStop(0,   p.color + 'cc')
        grad.addColorStop(1,   p.color + '00')
        ctx.globalAlpha = p.alpha * 0.5
        ctx.fillStyle   = grad
        ctx.beginPath()
        ctx.arc(p.x, p.y, pulsedR * 4, 0, Math.PI * 2)
        ctx.fill()

        // Core dot
        ctx.globalAlpha = p.alpha
        ctx.fillStyle   = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, pulsedR, 0, Math.PI * 2)
        ctx.fill()

        // Move
        p.x += p.vx
        p.y += p.vy

        // Bounce
        if (p.x < 0 || p.x > W) p.vx *= -1
        if (p.y < 0 || p.y > H) p.vy *= -1
      })

      // ── Traveling beam lines ─────────────────────────
      if (tick % 90 === 0 && beams.length < 12) spawnBeam()

      beams.forEach((b, idx) => {
        b.progress += b.speed

        const curX  = b.x  + (b.tx - b.x)  * b.progress
        const curY  = b.y  + (b.ty - b.y)  * b.progress
        const tailP = Math.max(0, b.progress - b.length)
        const tailX = b.x  + (b.tx - b.x)  * tailP
        const tailY = b.y  + (b.ty - b.y)  * tailP

        const grad = ctx.createLinearGradient(tailX, tailY, curX, curY)
        grad.addColorStop(0,   b.color + '00')
        grad.addColorStop(0.5, b.color + '88')
        grad.addColorStop(1,   b.color + 'ff')

        ctx.globalAlpha = b.alpha
        ctx.strokeStyle = grad
        ctx.lineWidth   = b.width
        ctx.lineCap     = 'round'
        ctx.shadowBlur  = 8
        ctx.shadowColor = b.color
        ctx.beginPath()
        ctx.moveTo(tailX, tailY)
        ctx.lineTo(curX,  curY)
        ctx.stroke()
        ctx.shadowBlur = 0

        if (b.progress >= 1.2) {
          beams.splice(idx, 1)
          spawnBeam()
        }
      })

      // ── Scan line sweep ──────────────────────────────
      const scanY = ((tick * 0.8) % (H + 40)) - 20
      const scanGrad = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30)
      scanGrad.addColorStop(0,   'rgba(76,201,240,0)')
      scanGrad.addColorStop(0.5, 'rgba(76,201,240,0.06)')
      scanGrad.addColorStop(1,   'rgba(76,201,240,0)')
      ctx.globalAlpha = 1
      ctx.fillStyle   = scanGrad
      ctx.fillRect(0, scanY - 30, W, 60)

      ctx.globalAlpha = 1
      animFrameId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animFrameId)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, display: 'block' }}
    />
  )
}

// ── Animated Shield Icon ─────────────────────────────────
function ShieldIcon() {
  return (
    <>
      <style>{`
        @keyframes shieldFloat  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes ringExpand   { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(1.8);opacity:0} }
        @keyframes scanPulse    { 0%,100%{opacity:.3} 50%{opacity:1} }
        @keyframes dotGlow      { 0%,100%{filter:drop-shadow(0 0 2px #4cc9f0)} 50%{filter:drop-shadow(0 0 10px #4cc9f0)} }
        @keyframes gradShift    {
          0%   { stop-color: #4cc9f0; }
          50%  { stop-color: #7209b7; }
          100% { stop-color: #4cc9f0; }
        }
      `}</style>

      <div style={{ position: 'relative', display: 'inline-flex', marginBottom: '20px' }}>

        {/* Pulse rings */}
        {[1, 2].map(i => (
          <div key={i} style={{
            position: 'absolute',
            inset: `-${i * 12}px`,
            borderRadius: '20px',
            border: '1px solid rgba(76,201,240,0.3)',
            animation: `ringExpand 2s ease-out infinite`,
            animationDelay: `${i * 0.6}s`,
          }} />
        ))}

        {/* Glass card */}
        <div style={{
          padding: '20px 24px',
          background: 'rgba(76,201,240,0.06)',
          border: '1px solid rgba(76,201,240,0.25)',
          borderRadius: '18px',
          backdropFilter: 'blur(20px)',
          animation: 'shieldFloat 3s ease-in-out infinite',
          boxShadow: '0 0 40px rgba(76,201,240,0.15), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}>
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" style={{ animation: 'dotGlow 2s ease-in-out infinite' }}>
            <defs>
              <linearGradient id="lg1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%"   stopColor="#4cc9f0"/>
                <stop offset="100%" stopColor="#7209b7"/>
              </linearGradient>
            </defs>

            {/* Shield body */}
            <path
              d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
              fill="rgba(76,201,240,0.08)"
              stroke="url(#lg1)"
              strokeWidth="1.5"
            />

            {/* Scan lines */}
            <line x1="8.5" y1="11" x2="15.5" y2="11"
              stroke="#4cc9f0" strokeWidth="1.2" strokeLinecap="round"
              style={{ animation: 'scanPulse 1.5s ease-in-out infinite' }} />
            <line x1="9.5" y1="13.5" x2="14.5" y2="13.5"
              stroke="#4cc9f0" strokeWidth="0.8" strokeLinecap="round"
              style={{ animation: 'scanPulse 1.5s ease-in-out infinite', animationDelay: '0.3s' }} />
            <line x1="10.5" y1="16" x2="13.5" y2="16"
              stroke="#7209b7" strokeWidth="0.6" strokeLinecap="round"
              style={{ animation: 'scanPulse 1.5s ease-in-out infinite', animationDelay: '0.6s' }} />

            {/* Center dot */}
            <circle cx="12" cy="9" r="1.8"
              fill="#4cc9f0"
              style={{ animation: 'scanPulse 2s ease-in-out infinite' }} />
          </svg>
        </div>
      </div>
    </>
  )
}

// ── Main Login Page ──────────────────────────────────────
export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [showPass, setShowPass] = useState(false)
  const { loginUser }           = useAuth()
  const navigate                = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await login(username, password)
      loginUser({ ...res.data, access_token: res.data.access_token })
      setTimeout(() => navigate('/'), 100)
    } catch {
      setError('Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#060818', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', position: 'relative', overflow: 'hidden' }}>

      <style>{`
        @keyframes cardIn    { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin      { to{transform:rotate(360deg)} }
        @keyframes blink     { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes errorIn   { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
      `}</style>

      {/* Full-screen canvas animation */}
      <ParticleCanvas />

      {/* Login card */}
      <div style={{
        position: 'relative', zIndex: 10,
        width: '100%', maxWidth: '420px',
        animation: 'cardIn 0.6s ease both',
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <ShieldIcon />

          <h1 style={{
            color: '#f8fafc', fontSize: '26px', fontWeight: '800',
            margin: '0 0 6px', letterSpacing: '0.02em',
          }}>
            AWS Cloud SOC
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: 0, letterSpacing: '0.12em' }}>
            SECURITY OPERATIONS CENTER
          </p>

          {/* Live indicator */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '12px', padding: '4px 12px', background: 'rgba(6,214,160,0.08)', border: '1px solid rgba(6,214,160,0.2)', borderRadius: '999px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#06d6a0', boxShadow: '0 0 8px #06d6a0', animation: 'blink 1.5s infinite' }} />
            <span style={{ color: '#06d6a0', fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em' }}>SYSTEM ONLINE</span>
          </div>
        </div>

        {/* Glass card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}>

          {/* Top shimmer line */}
          <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(76,201,240,0.5),transparent)', borderRadius: '999px' }} />

          <h2 style={{ color: '#f8fafc', fontSize: '17px', fontWeight: '700', margin: '0 0 24px', letterSpacing: '0.02em' }}>
            Sign in to SOC Platform
          </h2>

          <form onSubmit={handleLogin}>

            {/* Username */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.45)', fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', marginBottom: '8px' }}>
                USERNAME
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#4cc9f0', fontSize: '14px' }}>👤</span>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    padding: '12px 14px 12px 40px',
                    color: '#f8fafc', fontSize: '14px', outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e  => e.target.style.borderColor = 'rgba(76,201,240,0.5)'}
                  onBlur={e   => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.45)', fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', marginBottom: '8px' }}>
                PASSWORD
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#4cc9f0', fontSize: '14px' }}>🔒</span>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    padding: '12px 48px 12px 40px',
                    color: '#f8fafc', fontSize: '14px', outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(76,201,240,0.5)'}
                  onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: '11px', fontWeight: '600', letterSpacing: '0.05em' }}
                >
                  {showPass ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.3)', borderRadius: '10px', padding: '11px 14px', color: '#ff4d6d', fontSize: '13px', marginBottom: '16px', animation: 'errorIn 0.3s ease' }}>
                ⚠ {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: loading
                  ? 'rgba(37,99,235,0.4)'
                  : 'linear-gradient(135deg, #2563eb, #7209b7)',
                border: 'none', borderRadius: '12px',
                padding: '13px', color: 'white', fontSize: '14px',
                fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: '0.06em',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(37,99,235,0.4)',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              {loading ? (
                <>
                  <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  AUTHENTICATING...
                </>
              ) : (
                '🔐 SIGN IN'
              )}
            </button>
          </form>

         
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.15)', fontSize: '11px', marginTop: '20px', letterSpacing: '0.08em' }}>
          AWS Cloud SOC Platform · ap-south-2 · Enterprise Security
        </p>
      </div>
    </div>
  )
}
+/
