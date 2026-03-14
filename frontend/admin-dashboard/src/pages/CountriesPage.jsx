import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Globe,
  Search,
  Filter,
  MapPin,
  AlertTriangle,
  Shield,
  Users,
  Calendar,
  ExternalLink,
  Info
} from 'lucide-react'
import { apiService } from '../services/api'
import toast from 'react-hot-toast'

const RISK_LEVEL_COLORS = {
  low: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-red-100 text-red-800 border-red-200',
  critical: 'bg-red-200 text-red-900 border-red-300'
}

const RISK_LEVEL_ICONS = {
  low: 'text-green-600',
  medium: 'text-yellow-600',
  high: 'text-red-600',
  critical: 'text-red-700'
}

export default function CountriesPage() {
  const [countries, setCountries] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRiskLevel, setFilterRiskLevel] = useState('all')
  const [filterRegion, setFilterRegion] = useState('all')
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [stats, setStats] = useState({
    total: 0,
    byRiskLevel: []
  })

  useEffect(() => {
    fetchCountries()
    fetchStats()
  }, [])

  const fetchCountries = async () => {
    try {
      setLoading(true)
      const response = await apiService.getCountries()
      setCountries(response.data.countries)
    } catch (error) {
      console.error('Error fetching countries:', error)
      toast.error('Failed to load countries')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await apiService.getCountriesStats()
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching country stats:', error)
    }
  }

  const filteredCountries = countries.filter(country => {
    const matchesSearch =
      country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.region?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRiskLevel = filterRiskLevel === 'all' || country.risk_level === filterRiskLevel
    const matchesRegion = filterRegion === 'all' || country.region === filterRegion

    return matchesSearch && matchesRiskLevel && matchesRegion
  })

  // Get unique regions for filter
  const regions = [...new Set(countries.map(c => c.region).filter(Boolean))].sort()

  const getRiskLevelCount = (level) => {
    const found = stats.byRiskLevel.find(item => item.risk_level === level)
    return found ? parseInt(found.count) : 0
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Countries</h1>
          <p className="text-gray-600 mt-1">Monitor travel safety information by country</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            Total: {stats.total} countries
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Globe className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Low Risk</p>
              <p className="text-2xl font-semibold text-gray-900">{getRiskLevelCount('low')}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Medium Risk</p>
              <p className="text-2xl font-semibold text-gray-900">{getRiskLevelCount('medium')}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">High Risk</p>
              <p className="text-2xl font-semibold text-gray-900">{getRiskLevelCount('high')}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-red-200 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-700" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Critical</p>
              <p className="text-2xl font-semibold text-gray-900">{getRiskLevelCount('critical')}</p>
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
              placeholder="Search countries by name, code, or region..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              className="form-input"
              value={filterRiskLevel}
              onChange={(e) => setFilterRiskLevel(e.target.value)}
            >
              <option value="all">All Risk Levels</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <select
              className="form-input"
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
            >
              <option value="all">All Regions</option>
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Countries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCountries.map((country) => (
          <div
            key={country.id}
            className="card hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedCountry(country)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{country.flag || '🏳️'}</div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{country.name}</h3>
                  <p className="text-sm text-gray-500">{country.code}</p>
                </div>
              </div>
              <div className={`flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${RISK_LEVEL_COLORS[country.risk_level]}`}>
                <Shield className={`h-3 w-3 mr-1 ${RISK_LEVEL_ICONS[country.risk_level]}`} />
                {country.risk_level}
              </div>
            </div>

            {country.region && (
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <MapPin className="h-4 w-4 mr-1" />
                {country.region}
              </div>
            )}

            {country.risk_level_reason && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                {country.risk_level_reason}
              </p>
            )}

            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                Updated {country.updated_at ? new Date(country.updated_at).toLocaleDateString() : 'Unknown'}
              </div>
              {country.websiteUrl && (
                <div className="flex items-center">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Travel Info
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredCountries.length === 0 && !loading && (
        <div className="text-center py-12">
          <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No countries found</h3>
          <p className="text-gray-500">
            {searchTerm || filterRiskLevel !== 'all' || filterRegion !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'No countries available'}
          </p>
        </div>
      )}

      {/* Country Detail Modal */}
      {selectedCountry && (
        <CountryDetailModal
          country={selectedCountry}
          onClose={() => setSelectedCountry(null)}
        />
      )}
    </div>
  )
}

function CountryDetailModal({ country, onClose }) {
  const [alerts, setAlerts] = useState([])
  const [loadingAlerts, setLoadingAlerts] = useState(true)

  useEffect(() => {
    fetchCountryAlerts()
  }, [country.id])

  const fetchCountryAlerts = async () => {
    try {
      setLoadingAlerts(true)
      const response = await apiService.getAlerts({ countryId: country.id, limit: 100 })
      setAlerts(response.data.alerts)
    } catch (error) {
      console.error('Error fetching country alerts:', error)
    } finally {
      setLoadingAlerts(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">{country.flag || '🏳️'}</div>
              <div>
                <h3 className="text-xl font-medium text-gray-900">{country.name}</h3>
                <p className="text-sm text-gray-500">{country.code}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {/* Risk Level */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Shield className={`h-5 w-5 mr-2 ${RISK_LEVEL_ICONS[country.risk_level]}`} />
                <span className="font-medium">Risk Level</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${RISK_LEVEL_COLORS[country.risk_level]}`}>
                {country.risk_level}
              </span>
            </div>

            {/* Risk Reason */}
            {country.risk_level_reason && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Risk Assessment</h4>
                <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">
                  {country.risk_level_reason}
                </p>
              </div>
            )}

            {/* Country Info */}
            <div className="grid grid-cols-2 gap-4">
              {country.region && (
                <div>
                  <h5 className="font-medium text-gray-700">Region</h5>
                  <p className="text-gray-600">{country.region}</p>
                </div>
              )}
              {country.capital && (
                <div>
                  <h5 className="font-medium text-gray-700">Capital</h5>
                  <p className="text-gray-600">{country.capital}</p>
                </div>
              )}
              {country.currency && (
                <div>
                  <h5 className="font-medium text-gray-700">Currency</h5>
                  <p className="text-gray-600">{country.currency}</p>
                </div>
              )}
              {country.language && (
                <div>
                  <h5 className="font-medium text-gray-700">Language</h5>
                  <p className="text-gray-600">{country.language}</p>
                </div>
              )}
            </div>

            {/* Travel Advisory Link */}
            {country.websiteUrl && (
              <div>
                <a
                  href={country.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-primary-600 hover:text-primary-700"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Official Travel Advisory
                </a>
              </div>
            )}

            {/* Recent Alerts */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Recent Alerts</h4>
              {loadingAlerts ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                </div>
              ) : alerts.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="border border-gray-200 rounded-lg p-3"
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${RISK_LEVEL_COLORS[alert.severity] || 'bg-gray-100 text-gray-800'}`}>
                          {alert.severity}
                        </span>
                        <span className="text-xs text-gray-500">
                          {alert.createdAt ? new Date(alert.createdAt).toLocaleDateString() : 'Unknown'}
                        </span>
                      </div>
                      <h5 className="font-medium text-sm text-gray-900 mb-1">{alert.title}</h5>
                      <p className="text-xs text-gray-600 line-clamp-2">{alert.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Info className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm">No recent alerts for this country</p>
                </div>
              )}
            </div>

            {/* Last Updated */}
            <div className="text-xs text-gray-500 pt-3 border-t">
              Last updated: {country.updated_at ? new Date(country.updated_at).toLocaleString() : 'Unknown'}
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}