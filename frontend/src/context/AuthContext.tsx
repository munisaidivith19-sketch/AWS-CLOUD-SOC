import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '../types'

interface AuthContextType {
  user: User | null
  loginUser: (userData: User) => void
  logoutUser: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('soc_user')
    if (stored) setUser(JSON.parse(stored))
  }, [])

  const loginUser = (userData: User) => {
    setUser(userData)
    localStorage.setItem('soc_user', JSON.stringify(userData))
    localStorage.setItem('soc_token', userData.access_token)
  }

  const logoutUser = () => {
    setUser(null)
    localStorage.clear()
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