import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { apiService } from '../services/api'
import {
  MapPin,
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Plus,
  ArrowRight
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import RiskLevelMap from '../components/RiskLevelMap'

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    travelPlans: { total: 0, active: 0, upcoming: 0 },
    alerts: { total: 0, high: 0, critical: 0 }
  })
  const [recentTravelPlans, setRecentTravelPlans] = useState([])
  const [recentAlerts, setRecentAlerts] = useState([])
  const [countries, setCountries] = useState([])
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch user's travel plans
      const travelPlansRes = await apiService.getTravelPlans({ limit: 5 })
      const travelPlans = travelPlansRes.data.travelPlans || []

      // Calculate stats
      const now = new Date()
      const travelStats = {
        total: travelPlans.length,
        active: travelPlans.filter(plan => {
          const start = new Date(plan.departureDate)
          const end = new Date(plan.returnDate)
          return now >= start && now <= end
        }).length,
        upcoming: travelPlans.filter(plan => {
          const start = new Date(plan.departureDate)
          return now < start
        }).length
      }

      // Fetch alerts for display and map
      const alertsRes = await apiService.getAlerts({ limit: 1000 })
      const alerts = alertsRes.data.alerts || []
      const alertStats = {
        total: alerts.length,
        high: alerts.filter(a => a.severity === 'high').length,
        critical: alerts.filter(a => a.severity === 'critical').length
      }

      // Fetch countries for risk map
      const countriesRes = await apiService.getCountries({ limit: 300 })
      const countriesData = countriesRes.data.countries || []

      setStats({ travelPlans: travelStats, alerts: alertStats })
      setRecentTravelPlans(travelPlans.slice(0, 3))
      setRecentAlerts(alerts.slice(0, 3))
      setCountries(countriesData)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusFromDates = (startDate, endDate) => {
    const now = new Date()
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (now >= start && now <= end) return 'active'
    if (now > end) return 'completed'
    return 'upcoming'
  }

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    }
    return colors[severity] || colors.medium
  }

  const getStatusColor = (status) => {
    const colors = {
      upcoming: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800'
    }
    return colors[status] || colors.upcoming
  }

  const handleCountryClick = (country) => {
    setSelectedCountry(country)
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's your travel overview and latest safety alerts
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Travel Plans</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.travelPlans.total}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Active Trips</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.travelPlans.active}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Upcoming Trips</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.travelPlans.upcoming}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Global Risk Assessment World Map */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Global Risk Assessment</h3>
          <Link to="/alerts" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center">
            View alerts <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        <RiskLevelMap
          countries={countries}
          onCountryClick={handleCountryClick}
          selectedCountryId={selectedCountry?.id}
        />
        {selectedCountry && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">{selectedCountry.name}</h4>
                <p className="text-sm text-gray-600 capitalize">
                  Risk Level: <span className={`font-medium ${
                    selectedCountry.risk_level === 'low' ? 'text-green-600' :
                    selectedCountry.risk_level === 'medium' ? 'text-yellow-600' :
                    selectedCountry.risk_level === 'high' ? 'text-red-600' :
                    selectedCountry.risk_level === 'critical' ? 'text-red-700' :
                    'text-gray-600'
                  }`}>{selectedCountry.risk_level}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedCountry(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Travel Plans */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Travel Plans</h3>
            <Link to="/travel-plans" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center">
              View all <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {recentTravelPlans.length > 0 ? (
            <div className="space-y-3">
              {recentTravelPlans.map((plan) => {
                const status = getStatusFromDates(plan.departureDate, plan.returnDate)
                return (
                  <div key={plan.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          Trip to {plan.destination?.name || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(plan.departureDate).toLocaleDateString()} - {new Date(plan.returnDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                        {status}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No travel plans yet</p>
              <Link to="/travel-plans/new" className="btn-primary flex items-center space-x-2 mx-auto w-fit">
                <Plus className="h-4 w-4" />
                <span>Create Your First Plan</span>
              </Link>
            </div>
          )}
        </div>

        {/* Recent Alerts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Safety Alerts</h3>
            <Link to="/alerts" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center">
              View all <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {recentAlerts.length > 0 ? (
            <div className="space-y-3">
              {recentAlerts.map((alert) => (
                <div key={alert.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                        {alert.country && (
                          <span className="text-xs text-gray-500">📍 {alert.country.name}</span>
                        )}
                      </div>
                      <p className="font-medium text-sm text-gray-900">{alert.title}</p>
                      <p className="text-xs text-gray-600 line-clamp-2">{alert.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No recent alerts</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}