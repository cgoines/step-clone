import { useState, useEffect } from 'react'
import {
  Bell,
  Search,
  Filter,
  Calendar,
  Mail,
  MessageSquare,
  Smartphone,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  User
} from 'lucide-react'
import { apiService } from '../services/api'
import toast from 'react-hot-toast'

const CHANNEL_ICONS = {
  email: Mail,
  sms: MessageSquare,
  push: Smartphone
}

const CHANNEL_COLORS = {
  email: 'bg-blue-100 text-blue-800',
  sms: 'bg-green-100 text-green-800',
  push: 'bg-purple-100 text-purple-800'
}

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  sent: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  delivered: 'bg-blue-100 text-blue-800'
}

const STATUS_ICONS = {
  pending: Clock,
  sent: CheckCircle,
  failed: XCircle,
  delivered: CheckCircle
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterChannel, setFilterChannel] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showTestModal, setShowTestModal] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    failed: 0,
    pending: 0
  })
  const [periodStats, setPeriodStats] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState('7d')

  useEffect(() => {
    console.log('NotificationsPage: Starting to fetch data')
    fetchNotifications()
    fetchStats()
  }, [selectedPeriod])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Fetching admin notifications...')
      const response = await apiService.getAdminNotifications({ limit: 100 })
      console.log('Admin notifications response:', response.data)
      setNotifications(response.data.notifications || [])
      console.log('Admin notifications set successfully')
    } catch (error) {
      console.error('Error fetching admin notifications:', error)
      setError(error.message)
      toast.error('Failed to load notifications')
      setNotifications([]) // Ensure notifications is always an array
    } finally {
      setLoading(false)
      console.log('Loading set to false')
    }
  }

  const fetchStats = async () => {
    try {
      const response = await apiService.getAdminNotificationsStats(selectedPeriod)
      const apiStats = response.data.overall

      // Map API field names to frontend field names
      setStats({
        total: parseInt(apiStats.total_notifications || '0'),
        sent: parseInt(apiStats.sent_count || '0'),
        failed: parseInt(apiStats.failed_count || '0'),
        pending: parseInt(apiStats.delivered_count || '0') // Using delivered_count as pending equivalent
      })
      setPeriodStats(response.data.daily || [])
    } catch (error) {
      console.error('Error fetching admin notification stats:', error)
      // Set default stats on error
      setStats({
        total: 0,
        sent: 0,
        failed: 0,
        pending: 0
      })
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch =
      notification.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.alert?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.alert?.message?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesChannel = filterChannel === 'all' || notification.channel === filterChannel
    const matchesStatus = filterStatus === 'all' || notification.status === filterStatus

    return matchesSearch && matchesChannel && matchesStatus
  })

  console.log('NotificationsPage render:', { loading, notifications: notifications.length, stats })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="ml-4">Loading notifications...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">Monitor and manage notification delivery</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            className="form-input text-sm"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            onClick={() => setShowTestModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Send className="h-5 w-5" />
            <span>Send Test</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bell className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Sent</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Delivered</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.sent}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.failed}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Rate Chart */}
      {periodStats.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Trends</h3>
          <div className="grid grid-cols-7 gap-2">
            {periodStats.slice(-7).map((day, index) => {
              const total = day.total || 0
              const success = day.sent || 0
              const rate = total > 0 ? (success / total) * 100 : 0

              return (
                <div key={index} className="text-center">
                  <div className="text-xs text-gray-500 mb-1">
                    {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                  </div>
                  <div className="bg-gray-200 rounded-full h-20 flex items-end justify-center">
                    <div
                      className="bg-primary-500 rounded-full w-full transition-all duration-300"
                      style={{ height: `${Math.max(rate, 5)}%` }}
                      title={`${rate.toFixed(1)}% success rate`}
                    />
                  </div>
                  <div className="text-xs font-medium text-gray-900 mt-1">
                    {rate.toFixed(0)}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {total} sent
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

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
              placeholder="Search notifications by title, message, or recipient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              className="form-input"
              value={filterChannel}
              onChange={(e) => setFilterChannel(e.target.value)}
            >
              <option value="all">All Channels</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="push">Push</option>
            </select>
            <select
              className="form-input"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="card">
        {filteredNotifications.length > 0 ? (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Channel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sent At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredNotifications.map((notification) => {
                  const ChannelIcon = CHANNEL_ICONS[notification.channel]
                  const StatusIcon = STATUS_ICONS[notification.status]

                  return (
                    <tr key={notification.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {notification.title || notification.alert?.title || 'No title'}
                          </div>
                          <div className="text-sm text-gray-500 max-w-md truncate">
                            {notification.message || notification.alert?.message}
                          </div>
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
                              {notification.user?.firstName} {notification.user?.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {notification.user?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${CHANNEL_COLORS[notification.channel]}`}>
                          <ChannelIcon className="h-3 w-3 mr-1" />
                          {notification.channel?.toUpperCase()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[notification.status]}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {notification.status}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(notification.createdAt).toLocaleString()}
                        </div>
                        {notification.deliveredAt && (
                          <div className="text-xs text-gray-400 mt-1">
                            Delivered: {new Date(notification.deliveredAt).toLocaleString()}
                          </div>
                        )}
                        {notification.sentAt && !notification.deliveredAt && (
                          <div className="text-xs text-gray-400 mt-1">
                            Sent: {new Date(notification.sentAt).toLocaleString()}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
            <p className="text-gray-500">
              {searchTerm || filterChannel !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'No notifications have been sent yet'}
            </p>
          </div>
        )}
      </div>

      {/* Test Notification Modal */}
      {showTestModal && (
        <TestNotificationModal
          onClose={() => setShowTestModal(false)}
          onSent={() => {
            fetchNotifications()
            fetchStats()
            setShowTestModal(false)
          }}
        />
      )}
    </div>
  )
}

function TestNotificationModal({ onClose, onSent }) {
  const [formData, setFormData] = useState({
    channel: 'email',
    message: 'This is a test notification from STEP Clone admin dashboard.'
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await apiService.sendTestNotification(formData.channel, formData.message)
      toast.success('Test notification sent successfully')
      onSent()
    } catch (error) {
      console.error('Error sending test notification:', error)
      toast.error('Failed to send test notification')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Send Test Notification
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="channel" className="block text-sm font-medium text-gray-700">
                Channel *
              </label>
              <select
                id="channel"
                name="channel"
                required
                className="form-input"
                value={formData.channel}
                onChange={handleChange}
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="push">Push Notification</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Test notification will be sent to your own registered account
              </p>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={4}
                className="form-input"
                placeholder="Enter test message..."
                value={formData.message}
                onChange={handleChange}
              />
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
                className="btn-primary flex items-center space-x-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span>{loading ? 'Sending...' : 'Send Test'}</span>
              </button>
            </div>
          </form>

          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Test Notification Info
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Email: Sent to your registered admin email</li>
                    <li>SMS: Requires valid phone number in profile</li>
                    <li>Push: Requires registered device token</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}