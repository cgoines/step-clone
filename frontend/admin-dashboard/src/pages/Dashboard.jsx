import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  AlertTriangle,
  Globe,
  MapPin,
  Bell,
  Activity,
  TrendingUp,
  Shield,
  Clock
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'
import { apiService } from '../services/api'
import toast from 'react-hot-toast'

const COLORS = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6']

export default function Dashboard() {
  const [stats, setStats] = useState({
    users: { total: 0, verified: 0 },
    alerts: { total: 0, active: 0, emergency: 0, critical: 0 },
    countries: { total: 0, byRiskLevel: [] },
    travelPlans: { total: 0, active: 0, upcoming: 0 },
    notifications: { total: 0, sent: 0, failed: 0 }
  })
  const [recentAlerts, setRecentAlerts] = useState([])
  const [systemHealth, setSystemHealth] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch basic data that we know works
      const alertsRes = await apiService.getAlerts({ limit: 1000 }).catch(() => ({ data: { alerts: [] } }))
      const countriesRes = await apiService.getCountries().catch(() => ({ data: { countries: [] } }))
      const healthRes = await apiService.getHealth().catch(() => ({ data: { status: 'unknown' } }))

      // Calculate stats from the actual data
      const alerts = alertsRes.data.alerts || []
      const countries = countriesRes.data.countries || []

      const alertStats = {
        total_alerts: alerts.length,
        active_alerts: alerts.filter(a => a.isActive).length,
        emergency_alerts: alerts.filter(a => a.severity === 'emergency').length,
        critical_alerts: alerts.filter(a => a.severity === 'critical').length
      }

      const countryStats = {
        total: countries.length,
        byRiskLevel: countries.reduce((acc, country) => {
          const existing = acc.find(item => item.risk_level === country.risk_level)
          if (existing) {
            existing.count = String(parseInt(existing.count) + 1)
          } else {
            acc.push({ risk_level: country.risk_level, count: '1' })
          }
          return acc
        }, [])
      }

      // Update stats
      setStats(prev => ({
        ...prev,
        alerts: alertStats,
        countries: countryStats
      }))

      setRecentAlerts(alerts.slice(0, 5))
      setSystemHealth(healthRes.data)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const riskLevelData = stats.countries.byRiskLevel.map(item => ({
    name: item.risk_level,
    value: parseInt(item.count),
    color: {
      'low': '#10B981',
      'medium': '#F59E0B',
      'high': '#EF4444',
      'critical': '#DC2626'
    }[item.risk_level] || '#6B7280'
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to STEP Clone admin dashboard</p>
      </div>

      {/* System Health */}
      {systemHealth && (
        <div className={`p-4 rounded-lg border ${
          systemHealth.status === 'healthy'
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center">
            <Activity className={`h-5 w-5 ${
              systemHealth.status === 'healthy' ? 'text-green-600' : 'text-red-600'
            }`} />
            <span className={`ml-2 font-medium ${
              systemHealth.status === 'healthy' ? 'text-green-800' : 'text-red-800'
            }`}>
              System Status: {systemHealth.status}
            </span>
            {systemHealth.services && (
              <div className="ml-4 text-sm text-gray-600">
                Database: {systemHealth.services.database} | Redis: {systemHealth.services.redis}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Countries"
          value={stats.countries.total}
          icon={Globe}
          color="blue"
          link="/countries"
        />
        <StatCard
          title="Active Alerts"
          value={stats.alerts.active_alerts || 0}
          icon={AlertTriangle}
          color="red"
          link="/alerts"
          subtitle={`${stats.alerts.emergency_alerts || 0} emergency, ${stats.alerts.critical_alerts || 0} critical`}
        />
        <StatCard
          title="Total Users"
          value={stats.users.total}
          icon={Users}
          color="green"
          link="/users"
        />
        <StatCard
          title="Travel Plans"
          value={stats.travelPlans.active}
          icon={MapPin}
          color="purple"
          link="/travel-plans"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Levels Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Countries by Risk Level</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskLevelData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {riskLevelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alert Types Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Alert Statistics</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'Total', value: stats.alerts.total_alerts || 0 },
                  { name: 'Active', value: stats.alerts.active_alerts || 0 },
                  { name: 'Emergency', value: stats.alerts.emergency_alerts || 0 },
                  { name: 'Critical', value: stats.alerts.critical_alerts || 0 }
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Alerts</h3>
          <Link to="/alerts" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View all
          </Link>
        </div>
        {recentAlerts.length > 0 ? (
          <div className="space-y-3">
            {recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium severity-${alert.severity}`}>
                      {alert.severity}
                    </span>
                    <span className="text-sm text-gray-500">{alert.alertType}</span>
                  </div>
                  <p className="font-medium text-gray-900 mt-1">{alert.title}</p>
                  <p className="text-sm text-gray-600 line-clamp-2">{alert.message}</p>
                  {alert.country && (
                    <p className="text-xs text-gray-500 mt-1">📍 {alert.country.name}</p>
                  )}
                </div>
                <div className="text-xs text-gray-500 ml-4">
                  {new Date(alert.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p>No recent alerts</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionButton
            icon={AlertTriangle}
            label="Create Alert"
            link="/alerts"
            color="red"
          />
          <QuickActionButton
            icon={Users}
            label="Manage Users"
            link="/users"
            color="blue"
          />
          <QuickActionButton
            icon={Bell}
            label="Notifications"
            link="/notifications"
            color="yellow"
          />
          <QuickActionButton
            icon={Shield}
            label="Settings"
            link="/settings"
            color="gray"
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color, link, subtitle }) {
  const colorClasses = {
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500'
  }

  const content = (
    <div className="card hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value.toLocaleString()}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  )

  return link ? <Link to={link}>{content}</Link> : content
}

function QuickActionButton({ icon: Icon, label, link, color }) {
  const colorClasses = {
    red: 'text-red-600 bg-red-100 hover:bg-red-200',
    blue: 'text-blue-600 bg-blue-100 hover:bg-blue-200',
    yellow: 'text-yellow-600 bg-yellow-100 hover:bg-yellow-200',
    gray: 'text-gray-600 bg-gray-100 hover:bg-gray-200'
  }

  return (
    <Link
      to={link}
      className={`flex flex-col items-center p-4 rounded-lg transition-colors ${colorClasses[color]}`}
    >
      <Icon className="h-8 w-8 mb-2" />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  )
}