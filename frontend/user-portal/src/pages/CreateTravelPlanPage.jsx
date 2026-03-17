import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiService } from '../services/api'
import {
  Globe,
  Calendar,
  MapPin,
  Phone,
  User,
  FileText,
  Save,
  ArrowLeft
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function CreateTravelPlanPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)

  const [formData, setFormData] = useState({
    destinationCountryId: '',
    departureDate: '',
    returnDate: '',
    purpose: 'tourism',
    accommodationAddress: '',
    localContactName: '',
    localContactPhone: '',
    description: ''
  })

  const [countries, setCountries] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingCountries, setLoadingCountries] = useState(true)
  const [loadingPlan, setLoadingPlan] = useState(false)

  useEffect(() => {
    fetchCountries()
    if (isEditing) {
      fetchTravelPlan()
    }
  }, [id])

  const fetchCountries = async () => {
    try {
      const response = await apiService.getCountries({ limit: 300 })
      setCountries(response.data.countries || [])
    } catch (error) {
      console.error('Error fetching countries:', error)
      toast.error('Failed to load countries')
    } finally {
      setLoadingCountries(false)
    }
  }

  const fetchTravelPlan = async () => {
    try {
      setLoadingPlan(true)
      const response = await apiService.getTravelPlan(id)
      const plan = response.data

      // Format dates for input fields (YYYY-MM-DD)
      const departureDate = plan.departureDate ? plan.departureDate.split('T')[0] : ''
      const returnDate = plan.returnDate ? plan.returnDate.split('T')[0] : ''

      setFormData({
        destinationCountryId: plan.destination?.id || '',
        departureDate,
        returnDate,
        purpose: plan.purpose || 'tourism',
        accommodationAddress: plan.accommodationAddress || '',
        localContactName: plan.localContactName || '',
        localContactPhone: plan.localContactPhone || '',
        description: plan.description || ''
      })
    } catch (error) {
      console.error('Error fetching travel plan:', error)
      toast.error('Failed to load travel plan')
      navigate('/travel-plans')
    } finally {
      setLoadingPlan(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (!formData.destinationCountryId) {
      toast.error('Please select a destination country')
      return
    }

    if (!formData.departureDate || !formData.returnDate) {
      toast.error('Please select both departure and return dates')
      return
    }

    if (new Date(formData.departureDate) >= new Date(formData.returnDate)) {
      toast.error('Return date must be after departure date')
      return
    }

    setLoading(true)

    try {
      const submitData = {
        ...formData,
        destinationCountryId: parseInt(formData.destinationCountryId)
      }

      if (isEditing) {
        await apiService.updateTravelPlan(id, submitData)
        toast.success('Travel plan updated successfully!')
      } else {
        await apiService.createTravelPlan(submitData)
        toast.success('Travel plan created successfully!')
      }

      navigate('/travel-plans')
    } catch (error) {
      console.error('Error saving travel plan:', error)
      const message = error.response?.data?.error || `Failed to ${isEditing ? 'update' : 'create'} travel plan`
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleBack = () => {
    navigate('/travel-plans')
  }

  if (loadingPlan) {
    return <LoadingSpinner />
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={handleBack}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Travel Plan' : 'Create New Travel Plan'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEditing ? 'Update your travel information' : 'Plan your trip and stay informed about safety alerts'}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Destination */}
          <div>
            <label htmlFor="destinationCountryId" className="form-label">
              Destination Country *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Globe className="h-5 w-5 text-gray-400" />
              </div>
              <select
                id="destinationCountryId"
                name="destinationCountryId"
                required
                className="form-input pl-10"
                value={formData.destinationCountryId}
                onChange={handleChange}
                disabled={loadingCountries}
              >
                <option value="">Select destination country</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name} {country.risk_level && `(${country.risk_level} risk)`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="departureDate" className="form-label">
                Departure Date *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="departureDate"
                  name="departureDate"
                  type="date"
                  required
                  className="form-input pl-10"
                  value={formData.departureDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div>
              <label htmlFor="returnDate" className="form-label">
                Return Date *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="returnDate"
                  name="returnDate"
                  type="date"
                  required
                  className="form-input pl-10"
                  value={formData.returnDate}
                  onChange={handleChange}
                  min={formData.departureDate || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </div>

          {/* Purpose */}
          <div>
            <label htmlFor="purpose" className="form-label">
              Travel Purpose
            </label>
            <select
              id="purpose"
              name="purpose"
              className="form-input"
              value={formData.purpose}
              onChange={handleChange}
            >
              <option value="tourism">Tourism</option>
              <option value="business">Business</option>
              <option value="family">Family Visit</option>
              <option value="study">Study</option>
              <option value="work">Work</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Accommodation */}
          <div>
            <label htmlFor="accommodationAddress" className="form-label">
              Accommodation Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
              <textarea
                id="accommodationAddress"
                name="accommodationAddress"
                rows={2}
                className="form-input pl-10"
                placeholder="Enter your accommodation address"
                value={formData.accommodationAddress}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Local Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="localContactName" className="form-label">
                Local Contact Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="localContactName"
                  name="localContactName"
                  type="text"
                  className="form-input pl-10"
                  placeholder="Contact person name"
                  value={formData.localContactName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="localContactPhone" className="form-label">
                Local Contact Phone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="localContactPhone"
                  name="localContactPhone"
                  type="tel"
                  className="form-input pl-10"
                  placeholder="Contact phone number"
                  value={formData.localContactPhone}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="form-label">
              Additional Notes
            </label>
            <div className="relative">
              <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
                <FileText className="h-5 w-5 text-gray-400" />
              </div>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="form-input pl-10"
                placeholder="Any additional information about your trip..."
                value={formData.description}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading || loadingCountries}
              className="btn-primary flex items-center space-x-2"
            >
              {loading ? (
                <LoadingSpinner size="small" />
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{isEditing ? 'Update Travel Plan' : 'Create Travel Plan'}</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleBack}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Safety Reminder */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <MapPin className="h-5 w-5 text-blue-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Stay Informed About Your Destination
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Once you create your travel plan, you'll receive relevant safety alerts and updates
                for your destination. Make sure to check the alerts section regularly before and during your trip.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}