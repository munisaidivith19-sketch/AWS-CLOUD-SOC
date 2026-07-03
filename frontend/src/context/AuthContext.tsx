import { createContext, useContext, useState, ReactNode } from 'react'

interface User {
  username: string
  role: string
  full_name: string
  access_token: string
}

interface AuthContextType {
  user: User | null
  loginUser: (u: User) => void
  logoutUser: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loginUser: () => {},
  logoutUser: () => {},
  isAuthenticated: false
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const s = localStorage.getItem('soc_user')
      return s ? JSON.parse(s) : null
    } catch {
      return null
    }
  })

  const loginUser = (userData: User) => {
    setUser(userData)
    try {
      localStorage.setItem('soc_user', JSON.stringify(userData))
      localStorage.setItem('soc_token', userData.access_token)
    } catch {}
  }

  const logoutUser = () => {
    setUser(null)
    try { localStorage.clear() } catch {}
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{
      user,
      loginUser,
      logoutUser,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)