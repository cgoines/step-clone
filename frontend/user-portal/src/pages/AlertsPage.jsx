import { useState, useEffect } from 'react'
import { apiService } from '../services/api'
import {
  AlertTriangle,
  Search,
  Filter,
  Globe,
  Calendar,
  Info,
  AlertCircle,
  Shield,
  Zap
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const SEVERITY_COLORS = {
  low: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200'
}

const SEVERITY_ICONS = {
  low: Info,
  medium: AlertCircle,
  high: AlertTriangle,
  critical: Zap,
  warning: AlertTriangle,
  info: Info
}

const ALERT_TYPE_COLORS = {
  security: 'bg-red-50 border-red-200',
  health: 'bg-blue-50 border-blue-200',
  natural_disaster: 'bg-orange-50 border-orange-200',
  civil_unrest: 'bg-purple-50 border-purple-200',
  terrorism: 'bg-red-50 border-red-200',
  crime: 'bg-yellow-50 border-yellow-200',
  transportation: 'bg-indigo-50 border-indigo-200',
  weather: 'bg-blue-50 border-blue-200',
  embassy: 'bg-green-50 border-green-200',
  other: 'bg-gray-50 border-gray-200'
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [selectedAlert, setSelectedAlert] = useState(null)

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      const response = await apiService.getAlerts({ limit: 100 })
      setAlerts(response.data.alerts || [])
    } catch (error) {
      console.error('Error fetching alerts:', error)
      toast.error('Failed to load alerts')
    } finally {
      setLoading(false)
    }
  }

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch =
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (alert.country?.name || '').toLowerCase().includes(searchTerm.toLowerCase())

    const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity
    const matchesType = filterType === 'all' || alert.alertType === filterType

    return matchesSearch && matchesSeverity && matchesType && alert.isActive
  })

  const getUniqueAlertTypes = () => {
    const types = alerts.map(alert => alert.alertType).filter(Boolean)
    return [...new Set(types)]
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Safety Alerts</h1>
        <p className="text-gray-600 mt-1">
          Stay informed about safety conditions in your travel destinations
        </p>
      </div>

      {/* Search and Filter */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="form-input pl-10"
                placeholder="Search alerts, countries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                className="form-input"
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
              >
                <option value="all">All Severity</option>
                <option value="info">Info</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <select
              className="form-input"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              {getUniqueAlertTypes().map(type => (
                <option key={type} value={type}>
                  {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length > 0 ? (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => {
            const SeverityIcon = SEVERITY_ICONS[alert.severity] || AlertTriangle
            const alertTypeClass = ALERT_TYPE_COLORS[alert.alertType] || ALERT_TYPE_COLORS.other

            return (
              <div
                key={alert.id}
                className={`border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow ${alertTypeClass}`}
                onClick={() => setSelectedAlert(alert)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${SEVERITY_COLORS[alert.severity] || SEVERITY_COLORS.medium}`}>
                        <SeverityIcon className="h-3 w-3 mr-1" />
                        {alert.severity.toUpperCase()}
                      </span>

                      {alert.alertType && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white bg-opacity-60 text-gray-700">
                          {alert.alertType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      )}

                      {alert.country && (
                        <div className="flex items-center text-xs text-gray-600">
                          <Globe className="h-3 w-3 mr-1" />
                          {alert.country.name}
                        </div>
                      )}
                    </div>

                    <h3 className="font-semibold text-gray-900 mb-2">{alert.title}</h3>
                    <p className="text-gray-700 text-sm line-clamp-2">{alert.message}</p>

                    <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(alert.createdAt).toLocaleDateString()}
                      </div>
                      {alert.expiresAt && (
                        <div>
                          Expires: {new Date(alert.expiresAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filterSeverity !== 'all' || filterType !== 'all'
              ? 'No alerts found'
              : 'No active alerts'}
          </h3>
          <p className="text-gray-500">
            {searchTerm || filterSeverity !== 'all' || filterType !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'There are currently no active safety alerts'}
          </p>
        </div>
      )}

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <AlertDetailModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
        />
      )}
    </div>
  )
}

function AlertDetailModal({ alert, onClose }) {
  const SeverityIcon = SEVERITY_ICONS[alert.severity] || AlertTriangle
  const alertTypeClass = ALERT_TYPE_COLORS[alert.alertType] || ALERT_TYPE_COLORS.other

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${SEVERITY_COLORS[alert.severity] || SEVERITY_COLORS.medium}`}>
                <SeverityIcon className="h-4 w-4 mr-2" />
                {alert.severity.toUpperCase()}
              </span>
              {alert.alertType && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {alert.alertType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              ✕
            </button>
          </div>

          <div className={`border rounded-lg p-4 ${alertTypeClass}`}>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{alert.title}</h3>

            {alert.country && (
              <div className="flex items-center space-x-2 mb-3">
                <Globe className="h-5 w-5 text-gray-600" />
                <span className="font-medium text-gray-900">{alert.country.name}</span>
                {alert.country.risk_level && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    alert.country.risk_level === 'high' || alert.country.risk_level === 'critical'
                      ? 'bg-red-100 text-red-800'
                      : alert.country.risk_level === 'medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {alert.country.risk_level} risk
                  </span>
                )}
              </div>
            )}

            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 leading-relaxed">{alert.message}</p>
            </div>

            {alert.source && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  <strong>Source:</strong> {alert.source}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Published: {new Date(alert.createdAt).toLocaleString()}
                </div>
                {alert.expiresAt && (
                  <div>
                    Expires: {new Date(alert.expiresAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button onClick={onClose} className="btn-secondary">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}