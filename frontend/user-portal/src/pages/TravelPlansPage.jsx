import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { apiService } from '../services/api'
import {
  MapPin,
  Calendar,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Globe,
  Clock,
  CheckCircle
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import TravelPlansMap from '../components/TravelPlansMap'
import toast from 'react-hot-toast'

const STATUS_COLORS = {
  upcoming: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800'
}

const STATUS_ICONS = {
  upcoming: Clock,
  active: CheckCircle,
  completed: CheckCircle
}

export default function TravelPlansPage() {
  const [travelPlans, setTravelPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [countries, setCountries] = useState([])
  const [selectedCountry, setSelectedCountry] = useState(null)

  useEffect(() => {
    fetchTravelPlans()
  }, [])

  const fetchTravelPlans = async () => {
    try {
      setLoading(true)

      // Fetch travel plans
      const travelPlansResponse = await apiService.getTravelPlans({ limit: 100 })
      const travelPlansData = travelPlansResponse.data.travelPlans || []

      // Fetch countries for world map
      const countriesResponse = await apiService.getCountries({ limit: 300 })
      const countriesData = countriesResponse.data.countries || []

      setTravelPlans(travelPlansData)
      setCountries(countriesData)
    } catch (error) {
      console.error('Error fetching travel plans:', error)
      toast.error('Failed to load travel plans')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePlan = async (planId) => {
    if (!confirm('Are you sure you want to delete this travel plan?')) return

    try {
      await apiService.deleteTravelPlan(planId)
      toast.success('Travel plan deleted successfully')
      setTravelPlans(travelPlans.filter(plan => plan.id !== planId))
    } catch (error) {
      console.error('Error deleting travel plan:', error)
      toast.error('Failed to delete travel plan')
    }
  }

  const handleCountryClick = (country) => {
    setSelectedCountry(country)
  }

  const getStatusFromDates = (startDate, endDate) => {
    const now = new Date()
    const start = new Date(startDate)
    const end = new Date(endDate)

    const nowDateStr = now.toISOString().split('T')[0]
    const startDateStr = start.toISOString().split('T')[0]
    const endDateStr = end.toISOString().split('T')[0]

    if (startDateStr <= nowDateStr && endDateStr >= nowDateStr) return 'active'
    if (endDateStr < nowDateStr) return 'completed'
    return 'upcoming'
  }

  const filteredTravelPlans = travelPlans.filter(plan => {
    const actualStatus = getStatusFromDates(plan.departureDate, plan.returnDate)
    const destinationName = plan.destination?.name || 'Unknown'

    const matchesSearch =
      destinationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (plan.purpose || '').toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === 'all' || actualStatus === filterStatus

    return matchesSearch && matchesStatus
  })

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Travel Plans</h1>
          <p className="text-gray-600 mt-1">Manage your travel itineraries and stay informed</p>
        </div>
        <Link
          to="/travel-plans/new"
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>New Travel Plan</span>
        </Link>
      </div>

      {/* Travel Plans World Map */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Your Travel Destinations</h3>
          <div className="text-sm text-gray-600">
            Click a country to see your travel plans for that region
          </div>
        </div>
        <TravelPlansMap
          travelPlans={travelPlans}
          countries={countries}
          onCountryClick={handleCountryClick}
          selectedCountryId={selectedCountry?.id}
        />
        {selectedCountry && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">{selectedCountry.name}</h4>
                <p className="text-sm text-gray-600">
                  Travel Plans: <span className="font-medium text-blue-600">
                    {travelPlans.filter(plan => {
                      const status = getStatusFromDates(plan.departureDate, plan.returnDate)
                      return (status === 'upcoming' || status === 'active') &&
                             plan.destination?.code === selectedCountry.code
                    }).length}
                  </span>
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
              placeholder="Search by destination or purpose..."
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
              <option value="upcoming">Upcoming</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Travel Plans Grid */}
      {filteredTravelPlans.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTravelPlans.map((plan) => {
            const actualStatus = getStatusFromDates(plan.departureDate, plan.returnDate)
            const StatusIcon = STATUS_ICONS[actualStatus]

            return (
              <div key={plan.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Globe className="h-5 w-5 text-gray-400" />
                    <h3 className="font-semibold text-gray-900">
                      {plan.destination?.name || 'Unknown Destination'}
                    </h3>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[actualStatus]}`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {actualStatus}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>
                      {new Date(plan.departureDate).toLocaleDateString()} - {new Date(plan.returnDate).toLocaleDateString()}
                    </span>
                  </div>

                  {plan.purpose && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Purpose:</span> {plan.purpose}
                    </div>
                  )}

                  {plan.destination?.riskLevel && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-600">Risk Level:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        plan.destination.riskLevel === 'high' || plan.destination.riskLevel === 'critical'
                          ? 'bg-red-100 text-red-800'
                          : plan.destination.riskLevel === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {plan.destination.riskLevel}
                      </span>
                    </div>
                  )}

                  {plan.accommodationAddress && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Accommodation:</span>
                      <p className="text-xs mt-1">{plan.accommodationAddress}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-200">
                  <Link
                    to={`/travel-plans/${plan.id}/edit`}
                    className="flex-1 btn-outline text-center flex items-center justify-center space-x-1"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit</span>
                  </Link>
                  <button
                    onClick={() => handleDeletePlan(plan.id)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete plan"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filterStatus !== 'all' ? 'No travel plans found' : 'No travel plans yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filterStatus !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Create your first travel plan to get started with STEP Clone'}
          </p>
          <Link
            to="/travel-plans/new"
            className="btn-primary flex items-center space-x-2 mx-auto w-fit"
          >
            <Plus className="h-4 w-4" />
            <span>Create Travel Plan</span>
          </Link>
        </div>
      )}
    </div>
  )
}