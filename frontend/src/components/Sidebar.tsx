import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/',          emoji: '🏠', label: 'Dashboard'        },
  { to: '/threats',   emoji: '⚠️',  label: 'Threats'          },
  { to: '/incidents', emoji: '🛡️',  label: 'Incidents'        },
  { to: '/live',      emoji: '📡', label: 'Live Monitor'     },
  { to: '/ai',        emoji: '🤖', label: 'AI Investigation' },
  { to: '/reports',   emoji: '📊', label: 'Reports'          },
  { to: '/assets',    emoji: '🖥️',  label: 'Assets'           },
  { to: '/analytics', emoji: '📈', label: 'Analytics'        },
  { to: '/users',     emoji: '👥', label: 'User Management'  },
]

export default function Sidebar() {
  const { user, logoutUser } = useAuth()

  return (
    <>
      <style>{`
        @keyframes sidebarFadeIn {
          from { opacity: 0; transform: translateX(-12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes logoPulse {
          0%,100% { filter: drop-shadow(0 0 3px rgba(96,165,250,0.4)); }
          50%      { filter: drop-shadow(0 0 10px rgba(96,165,250,0.8)); }
        }
        @keyframes dotBlink {
          0%,100% { opacity: 0.5; }
          50%      { opacity: 1; }
        }
        .nav-link-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 10px;
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.45);
          border: 1px solid transparent;
          transition: all 0.18s ease;
          margin-bottom: 2px;
          position: relative;
        }
        .nav-link-item:hover {
          color: rgba(255,255,255,0.85) !important;
          background: rgba(255,255,255,0.05) !important;
          border-color: rgba(255,255,255,0.08) !important;
        }
        .nav-link-item.active {
          color: #60a5fa !important;
          background: rgba(96,165,250,0.1) !important;
          border-color: rgba(96,165,250,0.25) !important;
        }
        .nav-link-item.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 20%;
          bottom: 20%;
          width: 2px;
          background: linear-gradient(180deg, #60a5fa, #a78bfa);
          border-radius: 0 2px 2px 0;
        }
        .logout-btn:hover {
          background: rgba(248,113,113,0.08) !important;
          color: #f87171 !important;
          border-color: rgba(248,113,113,0.2) !important;
        }
      `}</style>

      <aside style={{
        width:            '260px',
        height:           '100vh',
        position:         'fixed',
        left:             0,
        top:              0,
        zIndex:           100,
        display:          'flex',
        flexDirection:    'column',
        background:       'rgba(4,6,15,0.85)',
        backdropFilter:   'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        borderRight:      '1px solid rgba(255,255,255,0.07)',
        boxShadow:        '4px 0 32px rgba(0,0,0,0.5), inset -1px 0 0 rgba(255,255,255,0.04)',
        animation:        'sidebarFadeIn 0.4s ease',
      }}>

        {/* ── Logo ── */}
        <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

            {/* Animated shield icon */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ position: 'absolute', inset: '-5px', borderRadius: '12px', border: '1px solid rgba(96,165,250,0.2)', animation: 'dotBlink 2.5s ease-in-out infinite' }} />
              <div style={{ padding: '8px', background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: '10px', backdropFilter: 'blur(8px)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ animation: 'logoPulse 2.5s ease-in-out infinite', display: 'block' }}>
                  <defs>
                    <linearGradient id="sideShieldGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%"   stopColor="#60a5fa"/>
                      <stop offset="100%" stopColor="#a78bfa"/>
                    </linearGradient>
                  </defs>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="rgba(96,165,250,0.1)" stroke="url(#sideShieldGrad)" strokeWidth="1.5"/>
                  <line x1="9"  y1="11"   x2="15" y2="11"   stroke="#60a5fa" strokeWidth="1.2" strokeLinecap="round"/>
                  <line x1="10" y1="13.5" x2="14" y2="13.5" stroke="#60a5fa" strokeWidth="0.8" strokeLinecap="round" opacity="0.6"/>
                  <circle cx="12" cy="8.5" r="1.3" fill="#60a5fa"/>
                </svg>
              </div>
            </div>

            <div>
              <p style={{ color: '#f1f5f9', fontSize: '13px', fontWeight: 700, margin: 0, letterSpacing: '0.02em' }}>
                AWS Cloud SOC
              </p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', margin: '2px 0 0', letterSpacing: '0.08em' }}>
                Security Operations
              </p>
            </div>
          </div>

          {/* Live status */}
          <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '7px', padding: '6px 10px', background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: '8px' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399', animation: 'dotBlink 1.8s infinite' }} />
            <span style={{ color: '#34d399', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em' }}>MONITORING ACTIVE</span>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav style={{ flex: 1, padding: '14px 12px', overflowY: 'auto' }}>

          {/* Main links */}
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.14em', margin: '0 0 8px 14px' }}>MAIN</p>
          {links.slice(0, 5).map(({ to, emoji, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-link-item${isActive ? ' active' : ''}`}
            >
              <span style={{ fontSize: '15px', flexShrink: 0 }}>{emoji}</span>
              <span>{label}</span>
            </NavLink>
          ))}

          {/* Tools */}
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.14em', margin: '16px 0 8px 14px' }}>TOOLS</p>
          {links.slice(5, 8).map(({ to, emoji, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-link-item${isActive ? ' active' : ''}`}
            >
              <span style={{ fontSize: '15px', flexShrink: 0 }}>{emoji}</span>
              <span>{label}</span>
            </NavLink>
          ))}

          {/* Admin */}
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.14em', margin: '16px 0 8px 14px' }}>ADMIN</p>
          {links.slice(8).map(({ to, emoji, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-link-item${isActive ? ' active' : ''}`}
            >
              <span style={{ fontSize: '15px', flexShrink: 0 }}>{emoji}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* ── User section ── */}
        <div style={{ padding: '14px 12px 18px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>

          {/* User card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', marginBottom: '10px', backdropFilter: 'blur(8px)' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg,#60a5fa,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: 'white', flexShrink: 0, boxShadow: '0 0 12px rgba(96,165,250,0.3)' }}>
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ color: '#f1f5f9', fontSize: '13px', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.username}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', margin: '1px 0 0', textTransform: 'capitalize', letterSpacing: '0.04em' }}>
                {user?.role?.replace(/_/g, ' ')}
              </p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={logoutUser}
            className="logout-btn"
            style={{
              width:          '100%',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            '7px',
              padding:        '9px',
              background:     'rgba(255,255,255,0.03)',
              border:         '1px solid rgba(255,255,255,0.07)',
              borderRadius:   '10px',
              color:          'rgba(255,255,255,0.4)',
              cursor:         'pointer',
              fontSize:       '12px',
              fontWeight:     600,
              letterSpacing:  '0.04em',
              transition:     'all 0.18s ease',
            }}
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>

          {/* Version */}
          <p style={{ color: 'rgba(255,255,255,0.12)', fontSize: '10px', textAlign: 'center', margin: '10px 0 0', letterSpacing: '0.06em' }}>
            AWS Cloud SOC v2.0 · ap-south-2
          </p>
        </div>

      </aside>
    </>
  )
}