import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/',              emoji: '🏠', label: 'Dashboard'        },
  { to: '/threats',       emoji: '⚠️',  label: 'Threats'          },
  { to: '/incidents',     emoji: '🛡️',  label: 'Incidents'        },
  { to: '/live',          emoji: '📡', label: 'Live Monitor'     },
  { to: '/ai',            emoji: '🤖', label: 'AI Investigation' },
  { to: '/reports',       emoji: '📊', label: 'Reports'          },
  { to: '/assets',        emoji: '🖥️',  label: 'Assets'           },
  { to: '/analytics',     emoji: '📈', label: 'Analytics'        },
  { to: '/users',         emoji: '👥', label: 'User Management'  },
]
export default function Sidebar() {
  const { user, logoutUser } = useAuth()

  return (
    <aside style={{
      width: '256px', background: '#111827',
      borderRight: '1px solid #1f2937',
      display: 'flex', flexDirection: 'column',
      height: '100vh', position: 'fixed', left: 0, top: 0
    }}>
      {/* Logo */}
      <div style={{ padding: '24px', borderBottom: '1px solid #1f2937' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '8px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div>
            <p style={{ color: 'white', fontWeight: 'bold', fontSize: '14px', margin: 0 }}>AWS Cloud SOC</p>
            <p style={{ color: '#6b7280', fontSize: '12px', margin: 0 }}>Security Operations</p>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {links.map(({ to, emoji, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '10px 16px', borderRadius: '8px',
              textDecoration: 'none', fontSize: '14px', fontWeight: '500',
              background: isActive ? 'rgba(37,99,235,0.2)' : 'transparent',
              color: isActive ? '#60a5fa' : '#9ca3af',
              border: isActive ? '1px solid rgba(37,99,235,0.3)' : '1px solid transparent',
              transition: 'all 0.15s'
            })}
          >
            <span>{emoji}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Live indicator */}
      <div style={{ padding: '12px 24px', borderTop: '1px solid #1f2937', borderBottom: '1px solid #1f2937' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', animation: 'pulse 2s infinite' }} />
          <span style={{ color: '#4ade80', fontSize: '12px', fontWeight: '500' }}>LIVE MONITORING</span>
        </div>
      </div>

      {/* User Info */}
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: '#2563eb', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: 'white', fontSize: '14px', fontWeight: 'bold'
          }}>
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p style={{ color: 'white', fontSize: '14px', fontWeight: '500', margin: 0 }}>{user?.username}</p>
            <p style={{ color: '#6b7280', fontSize: '11px', margin: 0, textTransform: 'capitalize' }}>
              {user?.role?.replace('_', ' ')}
            </p>
          </div>
        </div>
        <button
          onClick={logoutUser}
          style={{
            width: '100%', background: 'none',
            border: '1px solid #374151', borderRadius: '8px',
            padding: '8px', color: '#9ca3af', cursor: 'pointer',
            fontSize: '13px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '6px'
          }}
        >
          🚪 Logout
        </button>
      </div>
    </aside>
  )
}