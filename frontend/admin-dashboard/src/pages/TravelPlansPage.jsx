import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  MapPin,
  Search,
  Filter,
  Calendar,
  User,
  Globe,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  Plane
} from 'lucide-react'
import { apiService } from '../services/api'
import toast from 'react-hot-toast'

const STATUS_COLORS = {
  planning: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800'
}

const STATUS_ICONS = {
  planning: Clock,
  active: CheckCircle,
  completed: CheckCircle,
  cancelled: XCircle
}

export default function TravelPlansPage() {
  const [travelPlans, setTravelPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCountry, setFilterCountry] = useState('all')
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [countries, setCountries] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    upcoming: 0,
    completed: 0
  })

  useEffect(() => {
    fetchTravelPlans()
    fetchCountries()
  }, [])

  const fetchTravelPlans = async () => {
    try {
      setLoading(true)
      const response = await apiService.getTravelPlans({ limit: 100 })
      const plans = response.data.travelPlans
      setTravelPlans(plans)
      // Fetch stats after travel plans are loaded for fallback calculation
      fetchStats(plans)
    } catch (error) {
      console.error('Error fetching travel plans:', error)
      toast.error('Failed to load travel plans')
    } finally {
      setLoading(false)
    }
  }

  const fetchCountries = async () => {
    try {
      const response = await apiService.getCountries()
      setCountries(response.data.countries)
    } catch (error) {
      console.error('Error fetching countries:', error)
    }
  }

  const fetchStats = async (plansData = null) => {
    try {
      const response = await apiService.getTravelPlansStats()
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching travel plans stats:', error)
      // Fallback: calculate stats from provided or loaded travel plans
      const plansToUse = plansData || travelPlans || []
      const calculatedStats = calculateStatsFromData(plansToUse)
      setStats(calculatedStats)
    }
  }

  const handleDeletePlan = async (planId) => {
    if (!confirm('Are you sure you want to delete this travel plan?')) return

    try {
      await apiService.deleteTravelPlan(planId)
      toast.success('Travel plan deleted successfully')
      fetchTravelPlans()
      fetchStats()
    } catch (error) {
      console.error('Error deleting travel plan:', error)
      toast.error('Failed to delete travel plan')
    }
  }

  const getCountryName = (countryId) => {
    const country = countries.find(c => c.id === countryId)
    return country ? country.name : 'Unknown Country'
  }

  const getStatusFromDates = (startDate, endDate) => {
    const now = new Date()
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (now < start) return 'planning'
    if (now >= start && now <= end) return 'active'
    if (now > end) return 'completed'
    return 'planning'
  }

  // Calculate stats from actual data when API stats fails
  const calculateStatsFromData = (plans) => {
    const now = new Date()

    const stats = {
      total: plans.length,
      active: 0,
      upcoming: 0,
      completed: 0
    }

    plans.forEach(plan => {
      const status = getStatusFromDates(plan.departureDate, plan.returnDate)
      if (status === 'active') stats.active++
      else if (status === 'planning') stats.upcoming++
      else if (status === 'completed') stats.completed++
    })

    return stats
  }

  const filteredTravelPlans = travelPlans.filter(plan => {
    const actualStatus = getStatusFromDates(plan.departureDate, plan.returnDate)
    const countryName = getCountryName(plan.destination?.id)

    const matchesSearch =
      (plan.destination?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (plan.purpose || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      countryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === 'all' || actualStatus === filterStatus
    const matchesCountry = filterCountry === 'all' || plan.destination?.id === filterCountry

    return matchesSearch && matchesStatus && matchesCountry
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
          <h1 className="text-2xl font-bold text-gray-900">Travel Plans</h1>
          <p className="text-gray-600 mt-1">Monitor and manage traveler itineraries</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            Total: {travelPlans.length} plans
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Plans</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Plane className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Active Trips</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Upcoming</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.upcoming}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.completed}</p>
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
              placeholder="Search by title, country, or traveler email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              className="form-input"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
            <select
              className="form-input"
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
            >
              <option value="all">All Countries</option>
              {countries.map(country => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Travel Plans List */}
      <div className="card">
        {filteredTravelPlans.length > 0 ? (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Travel Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Traveler
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Destination
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTravelPlans.map((plan) => {
                  const actualStatus = getStatusFromDates(plan.departureDate, plan.returnDate)
                  const StatusIcon = STATUS_ICONS[actualStatus]
                  const country = countries.find(c => c.id === plan.destination?.id)

                  return (
                    <tr key={plan.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Trip to {plan.destination?.name || 'Unknown Destination'}
                          </div>
                          {plan.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {plan.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                              <User className="h-4 w-4 text-primary-600" />
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {plan.user?.firstName} {plan.user?.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{plan.user?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Globe className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {country?.name || 'Unknown'}
                            </div>
                            {country?.risk_level && (
                              <div className="text-xs text-gray-500">
                                Risk: {country?.risk_level}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                            {new Date(plan.departureDate).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            to {new Date(plan.returnDate).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[actualStatus]}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {actualStatus}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setSelectedPlan(plan)}
                            className="text-gray-400 hover:text-gray-600"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePlan(plan.id)}
                            className="text-gray-400 hover:text-red-600"
                            title="Delete plan"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No travel plans found</h3>
            <p className="text-gray-500">
              {searchTerm || filterStatus !== 'all' || filterCountry !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'No travel plans have been created yet'}
            </p>
          </div>
        )}
      </div>

      {/* Travel Plan Detail Modal */}
      {selectedPlan && (
        <TravelPlanDetailModal
          plan={selectedPlan}
          countries={countries}
          onClose={() => setSelectedPlan(null)}
        />
      )}
    </div>
  )
}

function TravelPlanDetailModal({ plan, countries, onClose }) {
  const country = countries.find(c => c.id === plan.destination?.id)
  const actualStatus = getStatusFromDates(plan.departureDate, plan.returnDate)
  const StatusIcon = STATUS_ICONS[actualStatus]

  const [alerts, setAlerts] = useState([])
  const [loadingAlerts, setLoadingAlerts] = useState(true)

  useEffect(() => {
    if (plan.destination?.id) {
      fetchCountryAlerts()
    }
  }, [plan.destination?.id])

  const fetchCountryAlerts = async () => {
    try {
      setLoadingAlerts(true)
      const response = await apiService.getAlerts({
        countryId: plan.destination?.id,
        limit: 100,
        active: true
      })
      setAlerts(response.data.alerts)
    } catch (error) {
      console.error('Error fetching country alerts:', error)
    } finally {
      setLoadingAlerts(false)
    }
  }

  function getStatusFromDates(startDate, endDate) {
    const now = new Date()
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (now < start) return 'planning'
    if (now >= start && now <= end) return 'active'
    if (now > end) return 'completed'
    return 'planning'
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-medium text-gray-900">Trip to {plan.destination?.name || 'Unknown Destination'}</h3>
              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${STATUS_COLORS[actualStatus]}`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {actualStatus}
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
            {/* Traveler Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Traveler Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Name:</span>
                  <p className="font-medium">{plan.user?.firstName} {plan.user?.lastName}</p>
                </div>
                <div>
                  <span className="text-gray-500">Email:</span>
                  <p className="font-medium">{plan.user?.email}</p>
                </div>
                {plan.user?.phone && (
                  <div>
                    <span className="text-gray-500">Phone:</span>
                    <p className="font-medium">{plan.user.phone}</p>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Verified:</span>
                  <p className="font-medium">
                    {plan.user?.isVerified ? (
                      <span className="text-green-600">Yes</span>
                    ) : (
                      <span className="text-red-600">No</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Trip Details */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Trip Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Destination:</span>
                  <p className="font-medium flex items-center">
                    {country?.flag && <span className="mr-2">{country.flag}</span>}
                    {country?.name || 'Unknown Country'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Risk Level:</span>
                  <p className={`font-medium ${country?.risk_level === 'high' || country?.risk_level === 'critical' ? 'text-red-600' : 'text-green-600'}`}>
                    {country?.risk_level || 'Unknown'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Start Date:</span>
                  <p className="font-medium">{new Date(plan.departureDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">End Date:</span>
                  <p className="font-medium">{new Date(plan.returnDate).toLocaleDateString()}</p>
                </div>
              </div>

              {plan.description && (
                <div className="mt-3">
                  <span className="text-gray-500 text-sm">Description:</span>
                  <p className="mt-1 text-gray-900">{plan.description}</p>
                </div>
              )}
            </div>

            {/* Emergency Contacts */}
            {plan.emergencyContacts && plan.emergencyContacts.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Emergency Contacts</h4>
                <div className="space-y-2">
                  {plan.emergencyContacts.map((contact, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg text-sm">
                      <div className="font-medium">{contact.name}</div>
                      <div className="text-gray-600">{contact.relationship}</div>
                      <div className="text-gray-600">{contact.phone}</div>
                      {contact.email && (
                        <div className="text-gray-600">{contact.email}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Current Alerts for Destination */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Current Alerts for Destination</h4>
              {loadingAlerts ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                </div>
              ) : alerts.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[alert.severity] || 'bg-gray-100 text-gray-800'}`}>
                          {alert.severity}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(alert.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h5 className="font-medium text-sm text-gray-900 mb-1">{alert.title}</h5>
                      <p className="text-xs text-gray-600">{alert.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <CheckCircle className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm">No active alerts for this destination</p>
                </div>
              )}
            </div>

            {/* Timestamps */}
            <div className="text-xs text-gray-500 pt-3 border-t">
              <div>Created: {new Date(plan.createdAt).toLocaleString()}</div>
              <div>Updated: {new Date(plan.updatedAt).toLocaleString()}</div>
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