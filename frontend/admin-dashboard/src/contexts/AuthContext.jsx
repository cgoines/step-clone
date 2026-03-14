import React, { createContext, useContext, useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { apiService } from '../services/api'

const AuthContext = createContext()

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      apiService.setToken(token)
      verifyToken()
    } else {
      setLoading(false)
    }
  }, [])

  const verifyToken = async () => {
    try {
      const response = await apiService.get('/auth/verify')
      setUser(response.data.user)
    } catch (error) {
      localStorage.removeItem('token')
      apiService.setToken(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await apiService.post('/auth/login', { email, password })
      const { user, token } = response.data

      localStorage.setItem('token', token)
      apiService.setToken(token)
      setUser(user)

      toast.success('Welcome back!')
      return true
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed'
      toast.error(message)
      return false
    }
  }

  const register = async (userData) => {
    try {
      const response = await apiService.post('/auth/register', userData)
      const { user, token } = response.data

      localStorage.setItem('token', token)
      apiService.setToken(token)
      setUser(user)

      toast.success('Registration successful!')
      return true
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed'
      toast.error(message)
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    apiService.setToken(null)
    setUser(null)
    toast.success('Logged out successfully')
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}