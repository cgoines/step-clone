import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { apiService } from '../services/api'
import { CheckCircle, XCircle, Clock, Mail } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

export default function VerifyEmailChangePage() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('verifying') // verifying, success, error, expired
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token provided')
      setLoading(false)
      return
    }

    handleVerification()
  }, [token])

  const handleVerification = async () => {
    try {
      setLoading(true)
      const response = await apiService.verifyEmailChange(token)
      setStatus('success')
      setMessage('Your email address has been changed successfully! You can now log in with your new email.')
    } catch (error) {
      console.error('Email change verification error:', error)
      const errorMessage = error.response?.data?.error || 'Verification failed'
      
      if (errorMessage.includes('expired')) {
        setStatus('expired')
        setMessage('Your email change verification link has expired. Please request a new one from your profile page.')
      } else if (errorMessage.includes('no longer available')) {
        setStatus('error')
        setMessage('The email address is no longer available. Please try with a different email address.')
      } else {
        setStatus('error')
        setMessage(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const getIcon = () => {
    switch (status) {
      case 'verifying':
        return <LoadingSpinner size="large" />
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-600" />
      case 'expired':
        return <Clock className="h-16 w-16 text-yellow-600" />
      case 'error':
        return <XCircle className="h-16 w-16 text-red-600" />
      default:
        return <Mail className="h-16 w-16 text-blue-600" />
    }
  }

  const getTitle = () => {
    switch (status) {
      case 'verifying':
        return 'Verifying Email Change...'
      case 'success':
        return 'Email Changed!'
      case 'expired':
        return 'Verification Link Expired'
      case 'error':
        return 'Verification Failed'
      default:
        return 'Email Change Verification'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            {getIcon()}
          </div>

          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            {getTitle()}
          </h2>

          <p className="text-gray-600 mb-8">
            {message}
          </p>

          <div className="space-y-4">
            {status === 'success' && (
              <Link
                to="/login"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white font-medium bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Continue to Login
              </Link>
            )}

            {(status === 'expired' || status === 'error') && (
              <>
                <Link
                  to="/profile"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white font-medium bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2"
                >
                  Back to Profile
                </Link>

                <Link
                  to="/login"
                  className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back to Login
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
