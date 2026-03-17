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

  async post(url, data = {}, config = {}) {
    return this.client.post(url, data, config)
  }

  async put(url, data = {}, config = {}) {
    return this.client.put(url, data, config)
  }

  async delete(url, config = {}) {
    return this.client.delete(url, config)
  }

  // Auth endpoints
  async login(email, password) {
    return this.post('/auth/login', { email, password })
  }

  async register(userData) {
    return this.post('/auth/register', userData)
  }

  async verifyToken() {
    return this.get('/auth/verify')
  }

  // Users endpoints
  async getUsers(params = {}) {
    return this.get('/users', { params })
  }

  async getUserProfile() {
    return this.get('/users/profile')
  }

  async updateUserProfile(data) {
    return this.put('/users/profile', data)
  }

  async updateUserPreferences(data) {
    return this.put('/users/preferences', data)
  }

  // Countries endpoints
  async getCountries(params = {}) {
    return this.get('/countries', { params })
  }

  async getCountry(id) {
    return this.get(`/countries/${id}`)
  }

  async getCountriesStats() {
    return this.get('/countries/stats')
  }

  // Alerts endpoints
  async getAlerts(params = {}) {
    return this.get('/alerts', { params })
  }

  async getAlert(id) {
    return this.get(`/alerts/${id}`)
  }

  async createAlert(data) {
    return this.post('/alerts', data)
  }

  async updateAlert(id, data) {
    return this.put(`/alerts/${id}`, data)
  }

  async getAlertsStats() {
    return this.get('/alerts/stats')
  }

  async getMyDestinationAlerts() {
    return this.get('/alerts/my-destinations')
  }

  // Travel Plans endpoints
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

  async getTravelPlansStats() {
    return this.get('/travel-plans/stats')
  }

  // Admin travel plans endpoints
  async getAdminTravelPlans(params = {}) {
    return this.get('/travel-plans/admin', { params })
  }

  // Notifications endpoints
  async getNotifications(params = {}) {
    return this.get('/notifications', { params })
  }

  async getNotificationsStats(period = '30d') {
    return this.get(`/notifications/stats?period=${period}`)
  }

  // Admin notifications endpoints
  async getAdminNotifications(params = {}) {
    return this.get('/notifications/admin', { params })
  }

  async getAdminNotificationsStats(period = '30d') {
    return this.get(`/notifications/admin/stats?period=${period}`)
  }

  async sendTestNotification(channel, message) {
    return this.post('/notifications/test', { channel, message })
  }

  async acknowledgeNotifications(notificationIds) {
    return this.post('/notifications/acknowledge', { notificationIds })
  }

  async getUnreadCount() {
    return this.get('/notifications/unread-count')
  }

  // Device management
  async registerDevice(token, platform) {
    return this.post('/users/devices', { token, platform })
  }

  async getUserDevices() {
    return this.get('/users/devices')
  }

  // Health check
  async getHealth() {
    return this.client.get('/health', { baseURL: 'http://localhost:9999' })
  }

  async getApiInfo() {
    return this.client.get('/api', { baseURL: 'http://localhost:9999' })
  }
}

export const apiService = new ApiService()
export default apiService