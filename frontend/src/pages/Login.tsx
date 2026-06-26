import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
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
      navigate('/')
    } catch {
      setError('Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0e1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      {/* Background grid */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: '420px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(239,68,68,0.1)', borderRadius: '16px', border: '1px solid rgba(239,68,68,0.3)', marginBottom: '16px' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h1 style={{ color: 'white', fontSize: '28px', fontWeight: 'bold', margin: 0 }}>AWS Cloud SOC</h1>
          <p style={{ color: '#9ca3af', marginTop: '8px' }}>Security Operations Center</p>
        </div>

        {/* Card */}
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '32px' }}>
          <h2 style={{ color: 'white', fontSize: '18px', fontWeight: '600', marginBottom: '24px', marginTop: 0 }}>
            Sign in to SOC Platform
          </h2>

          <form onSubmit={handleLogin}>
            {/* Username */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                style={{ width: '100%', background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', padding: '12px 16px', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  style={{ width: '100%', background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', padding: '12px 48px 12px 16px', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '12px' }}
                >
                  {showPass ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px 16px', color: '#f87171', fontSize: '14px', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', background: loading ? '#374151' : '#2563eb', color: 'white', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '8px' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div style={{ marginTop: '24px', background: '#1f2937', borderRadius: '8px', padding: '16px' }}>
            <p style={{ color: '#6b7280', fontSize: '12px', fontWeight: '600', marginBottom: '8px', marginTop: 0 }}>
              Demo credentials:
            </p>
            <div style={{ fontSize: '12px', lineHeight: '1.8' }}>
              <p style={{ margin: 0, color: '#6b7280' }}>Admin: <span style={{ color: '#d1d5db' }}>admin / Admin@SOC2024</span></p>
              <p style={{ margin: 0, color: '#6b7280' }}>Analyst: <span style={{ color: '#d1d5db' }}>analyst1 / Analyst@SOC2024</span></p>
              <p style={{ margin: 0, color: '#6b7280' }}>Viewer: <span style={{ color: '#d1d5db' }}>viewer1 / Viewer@SOC2024</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}