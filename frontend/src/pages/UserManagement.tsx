import { useEffect, useState } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const glass: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
}

const ROLES = [
  'admin','soc_manager','soc_analyst','threat_hunter',
  'incident_responder','cloud_security_engineer','security_engineer','viewer'
]

const STATUS_COLOR: Record<string,string> = {
  ACTIVE:   '#06d6a0',
  DISABLED: '#ff4d6d',
}

interface User {
  user_id: string
  username: string
  full_name: string
  email: string
  department: string
  designation: string
  role: string
  status: string
  mfa_enabled: boolean
  failed_logins: number
  last_login?: string
  created_at: string
}

export default function UserManagement() {
  const [users, setUsers]         = useState<User[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [selected, setSelected]   = useState<User | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [tempPw, setTempPw]       = useState('')
  const [newPw, setNewPw]         = useState('')
  const [form, setForm] = useState({
    username: '', full_name: '', email: '', password: '',
    department: '', designation: '', phone: '', role: 'viewer',
    mfa_enabled: false, force_password_change: false,
  })
  const { user: currentUser } = useAuth()

  const token   = localStorage.getItem('soc_token')
  const headers = { Authorization: `Bearer ${token}` }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/v1/users', { headers })
      setUsers(res.data.items || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchUsers() }, [])

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole   = !filterRole   || u.role === filterRole
    const matchStatus = !filterStatus || u.status === filterStatus
    return matchSearch && matchRole && matchStatus
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await axios.post('/api/v1/users', form, { headers })
      setShowCreate(false)
      setForm({ username:'',full_name:'',email:'',password:'',department:'',designation:'',phone:'',role:'viewer',mfa_enabled:false,force_password_change:false })
      await fetchUsers()
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed to create user')
    }
  }

  const handleDisable = async (u: User) => {
    try {
      await axios.post(`/api/v1/users/${u.user_id}/disable`, {}, { headers })
      await fetchUsers()
    } catch (e) { console.error(e) }
  }

  const handleEnable = async (u: User) => {
    try {
      await axios.post(`/api/v1/users/${u.user_id}/enable`, {}, { headers })
      await fetchUsers()
    } catch (e) { console.error(e) }
  }

  const handleDelete = async (u: User) => {
    if (!confirm(`Delete user "${u.username}"? This cannot be undone.`)) return
    try {
      await axios.delete(`/api/v1/users/${u.user_id}`, { headers })
      setSelected(null)
      await fetchUsers()
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed to delete user')
    }
  }

  const handleGenTempPw = async (u: User) => {
    try {
      const res = await axios.post(`/api/v1/users/${u.user_id}/temp-password`, {}, { headers })
      setTempPw(res.data.temp_password)
    } catch (e) { console.error(e) }
  }

  const handleResetPw = async () => {
    if (!selected || !newPw) return
    try {
      await axios.post(`/api/v1/users/${selected.user_id}/reset-password`, { new_password: newPw, force_change: true }, { headers })
      setShowReset(false)
      setNewPw('')
      alert('Password reset successfully')
    } catch (e) { console.error(e) }
  }

  const inp = (label: string, key: string, type = 'text') => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '600', letterSpacing: '0.06em' }}>
        {label.toUpperCase()}
      </label>
      <input
        type={type}
        value={(form as any)[key]}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        required={['username','full_name','email','password'].includes(key)}
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', color: 'white', fontSize: '13px', outline: 'none' }}
      />
    </div>
  )

  if (currentUser?.role !== 'admin') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ ...glass, padding: '48px', textAlign: 'center' }}>
          <p style={{ color: '#ff4d6d', fontSize: '18px', fontWeight: '700', margin: '0 0 8px' }}>🔒 Access Denied</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: 0 }}>
            User Management requires Admin role
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ ...glass, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: '#f8fafc', fontSize: '18px', fontWeight: '700', margin: 0 }}>User Management</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: 0 }}>
            Manage SOC platform users · {filtered.length} users
          </p>
        </div>
        <button onClick={() => setShowCreate(true)}
          style={{ padding: '9px 18px', background: '#2563eb', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
          + Create User
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { label: 'Total Users',  value: users.length,                             color: '#4cc9f0' },
          { label: 'Active',       value: users.filter(u => u.status === 'ACTIVE').length,   color: '#06d6a0' },
          { label: 'Disabled',     value: users.filter(u => u.status === 'DISABLED').length, color: '#ff4d6d' },
          { label: 'Admins',       value: users.filter(u => u.role === 'admin').length,       color: '#ffd166' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ ...glass, padding: '14px 18px', borderColor: `${color}22` }}>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', margin: '0 0 6px' }}>{label.toUpperCase()}</p>
            <p style={{ color, fontSize: '26px', fontWeight: '800', margin: 0, fontFamily: 'monospace' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search users..."
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 14px', color: 'white', fontSize: '13px', outline: 'none', width: '220px' }} />
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 14px', color: '#d1d5db', fontSize: '13px', outline: 'none' }}>
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r.replace('_',' ')}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 14px', color: '#d1d5db', fontSize: '13px', outline: 'none' }}>
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="DISABLED">Disabled</option>
        </select>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 340px' : '1fr', gap: '16px' }}>

        {/* Table */}
        <div style={{ ...glass, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>Loading users...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {['Username','Full Name','Email','Role','Department','Status','Last Login','Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', fontWeight: '700' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.user_id} onClick={() => setSelected(selected?.user_id === u.user_id ? null : u)}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer', background: selected?.user_id === u.user_id ? 'rgba(76,201,240,0.06)' : 'transparent', transition: 'background 0.15s' }}>
                    <td style={{ padding: '11px 14px', color: '#4cc9f0', fontSize: '12px', fontFamily: 'monospace', fontWeight: '600' }}>{u.username}</td>
                    <td style={{ padding: '11px 14px', color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>{u.full_name}</td>
                    <td style={{ padding: '11px 14px', color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>{u.email}</td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ padding: '2px 8px', background: 'rgba(76,201,240,0.1)', border: '1px solid rgba(76,201,240,0.2)', borderRadius: '4px', color: '#4cc9f0', fontSize: '10px', fontWeight: '600' }}>
                        {u.role.replace('_',' ')}
                      </span>
                    </td>
                    <td style={{ padding: '11px 14px', color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{u.department}</td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', color: STATUS_COLOR[u.status] || '#9ca3af', background: `${STATUS_COLOR[u.status] || '#9ca3af'}15` }}>
                        {u.status}
                      </span>
                    </td>
                    <td style={{ padding: '11px 14px', color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontFamily: 'monospace' }}>
                      {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {u.status === 'ACTIVE' ? (
                          <button onClick={e => { e.stopPropagation(); handleDisable(u) }}
                            style={{ padding: '3px 8px', background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.2)', borderRadius: '4px', color: '#ff4d6d', cursor: 'pointer', fontSize: '10px' }}>
                            Disable
                          </button>
                        ) : (
                          <button onClick={e => { e.stopPropagation(); handleEnable(u) }}
                            style={{ padding: '3px 8px', background: 'rgba(6,214,160,0.1)', border: '1px solid rgba(6,214,160,0.2)', borderRadius: '4px', color: '#06d6a0', cursor: 'pointer', fontSize: '10px' }}>
                            Enable
                          </button>
                        )}
                        <button onClick={e => { e.stopPropagation(); handleDelete(u) }}
                          style={{ padding: '3px 8px', background: 'rgba(255,77,109,0.06)', border: '1px solid rgba(255,77,109,0.15)', borderRadius: '4px', color: '#ff4d6d', cursor: 'pointer', fontSize: '10px' }}>
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>No users found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div style={{ ...glass, padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: '#f8fafc', fontSize: '14px', fontWeight: '700', margin: 0 }}>User Detail</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '18px' }}>×</button>
            </div>

            {/* Avatar */}
            <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#2563eb', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '800', color: 'white', marginBottom: '10px' }}>
                {selected.full_name?.charAt(0).toUpperCase()}
              </div>
              <p style={{ color: 'white', fontSize: '15px', fontWeight: '700', margin: 0 }}>{selected.full_name}</p>
              <p style={{ color: '#4cc9f0', fontSize: '12px', margin: '3px 0 0', fontFamily: 'monospace' }}>@{selected.username}</p>
              <span style={{ padding: '3px 10px', background: 'rgba(76,201,240,0.1)', border: '1px solid rgba(76,201,240,0.2)', borderRadius: '6px', color: '#4cc9f0', fontSize: '10px', fontWeight: '600' }}>
                {selected.role.replace('_',' ').toUpperCase()}
              </span>
            </div>

            {/* Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              {[
                ['User ID',     selected.user_id],
                ['Email',       selected.email],
                ['Department',  selected.department],
                ['Designation', selected.designation],
                ['Status',      selected.status],
                ['MFA',         selected.mfa_enabled ? 'Enabled' : 'Disabled'],
                ['Failed Logins', String(selected.failed_logins || 0)],
                ['Last Login',  selected.last_login ? new Date(selected.last_login).toLocaleString() : 'Never'],
                ['Created',     new Date(selected.created_at).toLocaleString()],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '7px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ color: 'rgba(255,255,255,0.35)' }}>{k}</span>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace', fontSize: '11px', textAlign: 'right' }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={() => { setShowReset(true); setTempPw('') }}
                style={{ padding: '9px', background: 'rgba(255,209,102,0.1)', border: '1px solid rgba(255,209,102,0.2)', borderRadius: '8px', color: '#ffd166', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                🔑 Reset Password
              </button>
              <button onClick={() => handleGenTempPw(selected)}
                style={{ padding: '9px', background: 'rgba(76,201,240,0.1)', border: '1px solid rgba(76,201,240,0.2)', borderRadius: '8px', color: '#4cc9f0', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                🎲 Generate Temp Password
              </button>
              {selected.status === 'ACTIVE' ? (
                <button onClick={() => handleDisable(selected)}
                  style={{ padding: '9px', background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.2)', borderRadius: '8px', color: '#ff4d6d', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                  🚫 Disable Account
                </button>
              ) : (
                <button onClick={() => handleEnable(selected)}
                  style={{ padding: '9px', background: 'rgba(6,214,160,0.1)', border: '1px solid rgba(6,214,160,0.2)', borderRadius: '8px', color: '#06d6a0', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                  ✅ Enable Account
                </button>
              )}
            </div>

            {/* Temp Password Display */}
            {tempPw && (
              <div style={{ padding: '12px', background: 'rgba(6,214,160,0.08)', border: '1px solid rgba(6,214,160,0.2)', borderRadius: '8px' }}>
                <p style={{ color: '#06d6a0', fontSize: '11px', fontWeight: '700', margin: '0 0 6px' }}>TEMPORARY PASSWORD</p>
                <p style={{ color: 'white', fontFamily: 'monospace', fontSize: '14px', fontWeight: '800', margin: 0, letterSpacing: '0.1em' }}>{tempPw}</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', margin: '4px 0 0' }}>User must change on next login</p>
              </div>
            )}

            {/* Reset Password Form */}
            {showReset && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
                <input value={newPw} onChange={e => setNewPw(e.target.value)} type="password" placeholder="New password"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', color: 'white', fontSize: '13px', outline: 'none' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => { setShowReset(false); setNewPw('') }}
                    style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '12px' }}>
                    Cancel
                  </button>
                  <button onClick={handleResetPw}
                    style={{ flex: 1, padding: '8px', background: '#2563eb', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ ...glass, padding: '28px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: '#f8fafc', fontSize: '16px', fontWeight: '700', margin: 0 }}>Create New User</h3>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '20px' }}>×</button>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {inp('Username', 'username')}
                {inp('Full Name', 'full_name')}
                {inp('Email', 'email', 'email')}
                {inp('Password', 'password', 'password')}
                {inp('Department', 'department')}
                {inp('Designation', 'designation')}
                {inp('Phone', 'phone')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '600', letterSpacing: '0.06em' }}>ROLE</label>
                <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                  style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', color: 'white', fontSize: '13px', outline: 'none' }}>
                  {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g,' ')}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.5)', fontSize: '12px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.mfa_enabled} onChange={e => setForm(p => ({ ...p, mfa_enabled: e.target.checked }))} />
                  MFA Enabled
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.5)', fontSize: '12px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.force_password_change} onChange={e => setForm(p => ({ ...p, force_password_change: e.target.checked }))} />
                  Force Password Change
                </label>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowCreate(false)}
                  style={{ flex: 1, padding: '11px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '13px' }}>
                  Cancel
                </button>
                <button type="submit"
                  style={{ flex: 1, padding: '11px', background: '#2563eb', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}