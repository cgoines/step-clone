import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9999/api'

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  setToken(token) {
    if (token) {
      this.client.defaults.headers.Authorization = `Bearer ${token}`
    } else {
      delete this.client.defaults.headers.Authorization
    }
  }

  // Generic HTTP methods
  async get(url, config = {}) {
    return this.client.get(url, config)
  }

  async post(url, data, config = {}) {
    return this.client.post(url, data, config)
  }

  async put(url, data, config = {}) {
    return this.client.put(url, data, config)
  }

  async delete(url, config = {}) {
    return this.client.delete(url, config)
  }

  // Auth endpoints
  async login(credentials) {
    return this.post('/auth/login', credentials)
  }

  async register(userData) {
    return this.post('/auth/register', userData)
  }

  async verifyEmail(token) {
    return this.post('/auth/verify-email', { token })
  }

  async resendVerification() {
    return this.post('/auth/resend-verification')
  }

  async changeEmail(newEmail) {
    return this.post('/auth/change-email', { newEmail })
  }

  async verifyEmailChange(token) {
    return this.post('/auth/verify-email-change', { token })
  }

  async forgotPassword(email) {
    return this.post('/auth/forgot-password', { email })
  }

  async resetPassword(token, password) {
    return this.post('/auth/reset-password', { token, password })
  }

  // User endpoints
  async getUserProfile() {
    return this.get('/users/profile')
  }

  async updateUserProfile(data) {
    return this.put('/users/profile', data)
  }

  async updateUserPreferences(preferences) {
    return this.put('/users/preferences', preferences)
  }

  // Travel plans endpoints
  async getTravelPlans(params = {}) {
    return this.get('/travel-plans', { params })
  }

  async getTravelPlan(id) {
    return this.get(`/travel-plans/${id}`)
  }

  async createTravelPlan(data) {
    return this.post('/travel-plans', data)
  }

  async updateTravelPlan(id, data) {
    return this.put(`/travel-plans/${id}`, data)
  }

  async deleteTravelPlan(id) {
    return this.delete(`/travel-plans/${id}`)
  }

  // Countries endpoints
  async getCountries(params = {}) {
    return this.get('/countries', { params })
  }

  async getCountry(id) {
    return this.get(`/countries/${id}`)
  }

  // Alerts endpoints
  async getAlerts(params = {}) {
    return this.get('/alerts', { params })
  }

  // Notifications endpoints
  async getNotifications(params = {}) {
    return this.get('/notifications', { params })
  }

  // Health check
  async getHealth() {
    return this.get('/health')
  }
}

export const apiService = new ApiService()
export default apiService