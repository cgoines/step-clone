import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Calendar,
  MapPin,
  Clock,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Globe
} from 'lucide-react'
import { apiService } from '../services/api'
import toast from 'react-hot-toast'

const SEVERITY_COLORS = {
  info: 'bg-blue-100 text-blue-800',
  warning: 'bg-yellow-100 text-yellow-800',
  critical: 'bg-red-100 text-red-800',
  emergency: 'bg-red-200 text-red-900'
}

const ALERT_TYPE_OPTIONS = [
  'security',
  'health',
  'natural_disaster',
  'political_unrest',
  'transportation',
  'general'
]

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingAlert, setEditingAlert] = useState(null)
  const [stats, setStats] = useState({
    total_alerts: 0,
    active_alerts: 0,
    emergency_alerts: 0,
    critical_alerts: 0
  })

  useEffect(() => {
    fetchAlerts()
    fetchStats()
  }, [])

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      const response = await apiService.getAlerts({ limit: 1000 })
      setAlerts(response.data.alerts)
    } catch (error) {
      console.error('Error fetching alerts:', error)
      toast.error('Failed to load alerts')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await apiService.getAlertsStats()
      setStats(response.data.overall)
    } catch (error) {
      console.error('Error fetching alert stats:', error)
    }
  }

  const handleDeleteAlert = async (alertId) => {
    if (!confirm('Are you sure you want to delete this alert?')) return

    try {
      await apiService.delete(`/alerts/${alertId}`)
      toast.success('Alert deleted successfully')
      fetchAlerts()
      fetchStats()
    } catch (error) {
      console.error('Error deleting alert:', error)
      toast.error('Failed to delete alert')
    }
  }

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch =
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.country?.name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity
    const matchesType = filterType === 'all' || alert.alertType === filterType

    return matchesSearch && matchesSeverity && matchesType
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Travel Alerts</h1>
          <p className="text-gray-600 mt-1">Manage travel safety alerts and warnings</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Create Alert</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Alerts</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total_alerts}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Active Alerts</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.active_alerts}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Emergency</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.emergency_alerts}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Critical</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.critical_alerts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="form-input pl-10"
              placeholder="Search alerts by title, message, or country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              className="form-input"
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
            >
              <option value="all">All Severities</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
              <option value="emergency">Emergency</option>
            </select>
            <select
              className="form-input"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              {ALERT_TYPE_OPTIONS.map(type => (
                <option key={type} value={type}>
                  {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="card">
        {filteredAlerts.length > 0 ? (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${SEVERITY_COLORS[alert.severity]}`}>
                        {alert.severity}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {alert.alertType}
                      </span>
                      {alert.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactive
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-medium text-gray-900 mb-2">{alert.title}</h3>
                    <p className="text-gray-600 mb-3 line-clamp-2">{alert.message}</p>

                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      {alert.country && (
                        <div className="flex items-center">
                          <Globe className="h-4 w-4 mr-1" />
                          {alert.country.name}
                        </div>
                      )}
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(alert.createdAt).toLocaleDateString()}
                      </div>
                      {alert.expiresAt && (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Expires {new Date(alert.expiresAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => setEditingAlert(alert)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
                      title="Edit alert"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-md"
                      title="Delete alert"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts found</h3>
            <p className="text-gray-500">
              {searchTerm || filterSeverity !== 'all' || filterType !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'No alerts have been created yet'}
            </p>
          </div>
        )}
      </div>

      {/* Create/Edit Alert Modal */}
      {(showCreateModal || editingAlert) && (
        <AlertModal
          alert={editingAlert}
          onClose={() => {
            setShowCreateModal(false)
            setEditingAlert(null)
          }}
          onSave={() => {
            fetchAlerts()
            fetchStats()
            setShowCreateModal(false)
            setEditingAlert(null)
          }}
        />
      )}
    </div>
  )
}

function AlertModal({ alert, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: alert?.title || '',
    message: alert?.message || '',
    severity: alert?.severity || 'warning',
    alertType: alert?.alertType || 'general',
    countryId: alert?.countryId || '',
    isActive: alert?.isActive ?? true,
    expiresAt: alert?.expiresAt ? new Date(alert.expiresAt).toISOString().split('T')[0] : ''
  })
  const [loading, setLoading] = useState(false)
  const [countries, setCountries] = useState([])

  useEffect(() => {
    fetchCountries()
  }, [])

  const fetchCountries = async () => {
    try {
      const response = await apiService.getCountries()
      setCountries(response.data.countries)
    } catch (error) {
      console.error('Error fetching countries:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const submitData = {
        ...formData,
        expiresAt: formData.expiresAt || null,
        countryId: formData.countryId || null
      }

      if (alert) {
        await apiService.updateAlert(alert.id, submitData)
        toast.success('Alert updated successfully')
      } else {
        await apiService.createAlert(submitData)
        toast.success('Alert created successfully')
      }
      onSave()
    } catch (error) {
      console.error('Error saving alert:', error)
      toast.error('Failed to save alert')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {alert ? 'Edit Alert' : 'Create New Alert'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                className="form-input"
                value={formData.title}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={3}
                className="form-input"
                value={formData.message}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="severity" className="block text-sm font-medium text-gray-700">
                  Severity *
                </label>
                <select
                  id="severity"
                  name="severity"
                  required
                  className="form-input"
                  value={formData.severity}
                  onChange={handleChange}
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>

              <div>
                <label htmlFor="alertType" className="block text-sm font-medium text-gray-700">
                  Type *
                </label>
                <select
                  id="alertType"
                  name="alertType"
                  required
                  className="form-input"
                  value={formData.alertType}
                  onChange={handleChange}
                >
                  {ALERT_TYPE_OPTIONS.map(type => (
                    <option key={type} value={type}>
                      {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="countryId" className="block text-sm font-medium text-gray-700">
                Country (Optional)
              </label>
              <select
                id="countryId"
                name="countryId"
                className="form-input"
                value={formData.countryId}
                onChange={handleChange}
              >
                <option value="">Select a country</option>
                {countries.map(country => (
                  <option key={country.id} value={country.id}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700">
                Expiration Date (Optional)
              </label>
              <input
                type="date"
                id="expiresAt"
                name="expiresAt"
                className="form-input"
                value={formData.expiresAt}
                onChange={handleChange}
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                checked={formData.isActive}
                onChange={handleChange}
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Active alert
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Saving...' : (alert ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}