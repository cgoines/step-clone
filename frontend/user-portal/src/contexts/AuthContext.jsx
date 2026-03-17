import React, { createContext, useContext, useState, useEffect } from 'react'
import { apiService } from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        apiService.setToken(token)
        const response = await apiService.getUserProfile()
        setUser(response.data)
        setIsAuthenticated(true)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem('token')
      apiService.setToken(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials) => {
    try {
      const response = await apiService.login(credentials)
      const { token, user } = response.data

      localStorage.setItem('token', token)
      apiService.setToken(token)
      setUser(user)
      setIsAuthenticated(true)

      toast.success('Welcome back!')
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      const message = error.response?.data?.error || 'Login failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const register = async (userData) => {
    try {
      const response = await apiService.register(userData)
      toast.success('Account created successfully! Please check your email to verify your account.')
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Registration error:', error)
      const message = error.response?.data?.error || 'Registration failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    apiService.setToken(null)
    setUser(null)
    setIsAuthenticated(false)
    toast.success('Logged out successfully')
  }

  const updateUser = (updatedUser) => {
    setUser(updatedUser)
  }

  const verifyEmail = async (token) => {
    try {
      await apiService.verifyEmail(token)
      toast.success('Email verified successfully! You can now log in.')
      return { success: true }
    } catch (error) {
      console.error('Email verification error:', error)
      const message = error.response?.data?.error || 'Email verification failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const resendVerification = async () => {
    try {
      await apiService.resendVerification()
      toast.success('Verification email sent! Please check your inbox.')
      return { success: true }
    } catch (error) {
      console.error('Resend verification error:', error)
      const message = error.response?.data?.error || 'Failed to resend verification email'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    verifyEmail,
    resendVerification
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}