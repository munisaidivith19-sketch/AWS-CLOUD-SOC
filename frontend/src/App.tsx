import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Threats from './pages/Threats'
import Incidents from './pages/Incidents'
import Assets from './pages/Assets'
import Analytics from './pages/Analytics'

function ProtectedLayout() {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{
        flex: 1,
        marginLeft: '256px',
        padding: '24px',
        minHeight: '100vh',
        background: '#030712'
      }}>
        <Routes>
          <Route path="/"          element={<Dashboard />} />
          <Route path="/threats"   element={<Threats />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/assets"    element={<Assets />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="*"          element={<Dashboard />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*"     element={<ProtectedLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}