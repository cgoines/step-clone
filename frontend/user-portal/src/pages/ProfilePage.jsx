import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { apiService } from '../services/api'
import {
  User,
  Mail,
  Phone,
  Globe,
  Bell,
  MessageSquare,
  Smartphone,
  Save,
  CheckCircle,
  XCircle,
  Edit,
  Clock
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    countryId: '',
    email: ''
  })
  const [isEditingEmail, setIsEditingEmail] = useState(false)
  const [pendingEmail, setPendingEmail] = useState(null)
  const [preferences, setPreferences] = useState({
    smsEnabled: true,
    pushEnabled: true,
    emailEnabled: true
  })
  const [countries, setCountries] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingCountries, setLoadingCountries] = useState(true)
  const [loadingProfile, setLoadingProfile] = useState(true)

  useEffect(() => {
    fetchCountries()
    fetchProfile()
  }, [])

  const fetchCountries = async () => {
    try {
      const response = await apiService.getCountries({ limit: 300 })
      setCountries(response.data.countries || [])
    } catch (error) {
      console.error('Error fetching countries:', error)
    } finally {
      setLoadingCountries(false)
    }
  }

  const fetchProfile = async () => {
    try {
      const response = await apiService.getUserProfile()
      const profile = response.data

      setProfileData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || '',
        countryId: profile.country?.id || '',
        email: profile.email || ''
      })

      // Check for pending email change
      if (profile.pendingEmail) {
        setPendingEmail(profile.pendingEmail)
      }

      setPreferences({
        smsEnabled: profile.preferences?.smsEnabled ?? true,
        pushEnabled: profile.preferences?.pushEnabled ?? true,
        emailEnabled: profile.preferences?.emailEnabled ?? true
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoadingProfile(false)
    }
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Exclude email from profile update (handled separately)
      const { email, ...updateData } = profileData
      updateData.countryId = updateData.countryId ? parseInt(updateData.countryId) : null

      const response = await apiService.updateUserProfile(updateData)

      // Update the auth context with new user data
      const updatedProfile = await apiService.getUserProfile()
      updateUser(updatedProfile.data)

      toast.success('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      const message = error.response?.data?.error || 'Failed to update profile'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handlePreferencesSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await apiService.updateUserPreferences(preferences)
      toast.success('Notification preferences updated successfully!')
    } catch (error) {
      console.error('Error updating preferences:', error)
      const message = error.response?.data?.error || 'Failed to update preferences'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    })
  }

  const handlePreferenceChange = (preference) => {
    setPreferences({
      ...preferences,
      [preference]: !preferences[preference]
    })
  }

  const handleEmailChangeRequest = async () => {
    if (!profileData.email || profileData.email === user?.email) {
      toast.error('Please enter a new email address')
      return
    }

    try {
      setLoading(true)
      await apiService.changeEmail(profileData.email)
      toast.success('Verification email sent to your new address. Please check your inbox.')
      setPendingEmail(profileData.email)
      setIsEditingEmail(false)
    } catch (error) {
      console.error('Error requesting email change:', error)
      const message = error.response?.data?.error || 'Failed to request email change'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const cancelEmailEdit = () => {
    setProfileData({
      ...profileData,
      email: user?.email || ''
    })
    setIsEditingEmail(false)
  }

  if (loadingProfile) {
    return <LoadingSpinner />
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-1">Manage your personal information and notification preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <User className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="form-label">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  className="form-input"
                  value={profileData.firstName}
                  onChange={handleProfileChange}
                />
              </div>
              <div>
                <label htmlFor="lastName" className="form-label">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  className="form-input"
                  value={profileData.lastName}
                  onChange={handleProfileChange}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                {!isEditingEmail && !pendingEmail && (
                  <button
                    type="button"
                    onClick={() => setIsEditingEmail(true)}
                    className="text-sm text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                  >
                    <Edit className="h-3 w-3" />
                    <span>Change</span>
                  </button>
                )}
              </div>

              {pendingEmail && (
                <div className="mb-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium">Email change pending</p>
                      <p>Verification sent to: <strong>{pendingEmail}</strong></p>
                      <p className="text-xs">Check your inbox to complete the change.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className={`form-input pl-10 ${!isEditingEmail ? 'bg-gray-50' : ''}`}
                  value={profileData.email}
                  disabled={!isEditingEmail}
                  onChange={handleProfileChange}
                />
                {isEditingEmail && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleEmailChangeRequest}
                      disabled={loading}
                      className="text-sm text-green-600 hover:text-green-700"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelEmailEdit}
                      className="text-sm text-gray-600 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {!isEditingEmail && !pendingEmail && (
                <p className="text-xs text-gray-500 mt-1">Current email address</p>
              )}

              {isEditingEmail && (
                <p className="text-xs text-gray-500 mt-1">
                  A verification email will be sent to your new address
                </p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="form-label">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="form-input pl-10"
                  placeholder="+1 (555) 123-4567"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="countryId" className="form-label">
                Country
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Globe className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="countryId"
                  name="countryId"
                  className="form-input pl-10"
                  value={profileData.countryId}
                  onChange={handleProfileChange}
                  disabled={loadingCountries}
                >
                  <option value="">Select your country</option>
                  {countries.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center space-x-2"
              >
                {loading ? (
                  <LoadingSpinner size="small" />
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Profile</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Notification Preferences */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <Bell className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
          </div>

          <form onSubmit={handlePreferencesSubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-600" />
                  <div>
                    <div className="font-medium text-gray-900">Email Notifications</div>
                    <div className="text-sm text-gray-500">Receive alerts via email</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handlePreferenceChange('emailEnabled')}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                    preferences.emailEnabled ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      preferences.emailEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="h-5 w-5 text-gray-600" />
                  <div>
                    <div className="font-medium text-gray-900">SMS Notifications</div>
                    <div className="text-sm text-gray-500">Receive alerts via SMS</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handlePreferenceChange('smsEnabled')}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                    preferences.smsEnabled ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      preferences.smsEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Smartphone className="h-5 w-5 text-gray-600" />
                  <div>
                    <div className="font-medium text-gray-900">Push Notifications</div>
                    <div className="text-sm text-gray-500">Receive alerts on your device</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handlePreferenceChange('pushEnabled')}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                    preferences.pushEnabled ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      preferences.pushEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center space-x-2"
              >
                {loading ? (
                  <LoadingSpinner size="small" />
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Preferences</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Account Status */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <CheckCircle className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Account Status</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
              user?.isVerified ? 'bg-green-100' : 'bg-yellow-100'
            }`}>
              {user?.isVerified ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-yellow-600" />
              )}
            </div>
            <div>
              <div className="font-medium text-gray-900">Email Verification</div>
              <div className={`text-sm ${user?.isVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                {user?.isVerified ? 'Verified' : 'Pending verification'}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Account Type</div>
              <div className="text-sm text-blue-600">Standard User</div>
            </div>
          </div>
        </div>

        {!user?.isVerified && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Your email address is not verified. Please check your inbox for a verification email.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}