import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  AlertTriangle,
  Globe,
  MapPin,
  Bell,
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
import RiskLevelMap from '../components/RiskLevelMap'
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
  const [countries, setCountries] = useState([])
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedCountry1, setSelectedCountry1] = useState('United Kingdom')
  const [selectedCountry2, setSelectedCountry2] = useState('Japan')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch all the required data
      const alertsRes = await apiService.getAlerts({ limit: 1000 }).catch(() => ({ data: { alerts: [] } }))
      const countriesRes = await apiService.getCountries({ limit: 200 }).catch(() => ({ data: { countries: [] } }))
      const usersRes = await apiService.getUsers({ limit: 1000 }).catch(() => ({ data: { users: [] } }))
      const travelPlansRes = await apiService.getAdminTravelPlans({ limit: 1000 }).catch(() => ({ data: { travelPlans: [] } }))

      // Calculate stats from the actual data
      const alerts = alertsRes.data.alerts || []
      const countries = countriesRes.data.countries || []
      const users = usersRes.data.users || []
      const travelPlans = travelPlansRes.data.travelPlans || []

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

      const userStats = {
        total: users.length,
        verified: users.filter(u => u.isVerified).length
      }

      // Calculate travel plan stats by dates
      const now = new Date()
      const travelPlanStats = {
        total: travelPlans.length,
        active: travelPlans.filter(plan => {
          const start = new Date(plan.departureDate)
          const end = new Date(plan.returnDate)
          return now.toDateString() === start.toDateString() || (now > start && now <= end)
        }).length,
        upcoming: travelPlans.filter(plan => {
          const start = new Date(plan.departureDate)
          return now < start
        }).length
      }

      // Update stats
      setStats(prev => ({
        ...prev,
        alerts: alertStats,
        countries: countryStats,
        users: userStats,
        travelPlans: travelPlanStats
      }))

      setRecentAlerts(alerts.slice(0, 5))
      setCountries(countries)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleCountryClick = (country) => {
    setSelectedCountry(country)
    // Could add additional actions like showing country details or navigation
  }

  // Countries with their primary time zones
  const worldCountries = [
    { name: 'Afghanistan', timezone: 'Asia/Kabul' },
    { name: 'Albania', timezone: 'Europe/Tirane' },
    { name: 'Algeria', timezone: 'Africa/Algiers' },
    { name: 'Andorra', timezone: 'Europe/Andorra' },
    { name: 'Angola', timezone: 'Africa/Luanda' },
    { name: 'Argentina', timezone: 'America/Buenos_Aires' },
    { name: 'Armenia', timezone: 'Asia/Yerevan' },
    { name: 'Australia', timezone: 'Australia/Sydney' },
    { name: 'Austria', timezone: 'Europe/Vienna' },
    { name: 'Azerbaijan', timezone: 'Asia/Baku' },
    { name: 'Bahrain', timezone: 'Asia/Bahrain' },
    { name: 'Bangladesh', timezone: 'Asia/Dhaka' },
    { name: 'Belarus', timezone: 'Europe/Minsk' },
    { name: 'Belgium', timezone: 'Europe/Brussels' },
    { name: 'Belize', timezone: 'America/Belize' },
    { name: 'Benin', timezone: 'Africa/Porto-Novo' },
    { name: 'Bhutan', timezone: 'Asia/Thimphu' },
    { name: 'Bolivia', timezone: 'America/La_Paz' },
    { name: 'Bosnia and Herzegovina', timezone: 'Europe/Sarajevo' },
    { name: 'Botswana', timezone: 'Africa/Gaborone' },
    { name: 'Brazil', timezone: 'America/Sao_Paulo' },
    { name: 'Brunei', timezone: 'Asia/Brunei' },
    { name: 'Bulgaria', timezone: 'Europe/Sofia' },
    { name: 'Burkina Faso', timezone: 'Africa/Ouagadougou' },
    { name: 'Burundi', timezone: 'Africa/Bujumbura' },
    { name: 'Cambodia', timezone: 'Asia/Phnom_Penh' },
    { name: 'Cameroon', timezone: 'Africa/Douala' },
    { name: 'Canada', timezone: 'America/Toronto' },
    { name: 'Cape Verde', timezone: 'Atlantic/Cape_Verde' },
    { name: 'Central African Republic', timezone: 'Africa/Bangui' },
    { name: 'Chad', timezone: 'Africa/Ndjamena' },
    { name: 'Chile', timezone: 'America/Santiago' },
    { name: 'China', timezone: 'Asia/Shanghai' },
    { name: 'Colombia', timezone: 'America/Bogota' },
    { name: 'Comoros', timezone: 'Indian/Comoro' },
    { name: 'Costa Rica', timezone: 'America/Costa_Rica' },
    { name: 'Croatia', timezone: 'Europe/Zagreb' },
    { name: 'Cuba', timezone: 'America/Havana' },
    { name: 'Cyprus', timezone: 'Asia/Nicosia' },
    { name: 'Czech Republic', timezone: 'Europe/Prague' },
    { name: 'Democratic Republic of the Congo', timezone: 'Africa/Kinshasa' },
    { name: 'Denmark', timezone: 'Europe/Copenhagen' },
    { name: 'Djibouti', timezone: 'Africa/Djibouti' },
    { name: 'Dominican Republic', timezone: 'America/Santo_Domingo' },
    { name: 'East Timor', timezone: 'Asia/Dili' },
    { name: 'Ecuador', timezone: 'America/Guayaquil' },
    { name: 'Egypt', timezone: 'Africa/Cairo' },
    { name: 'El Salvador', timezone: 'America/El_Salvador' },
    { name: 'Equatorial Guinea', timezone: 'Africa/Malabo' },
    { name: 'Eritrea', timezone: 'Africa/Asmara' },
    { name: 'Estonia', timezone: 'Europe/Tallinn' },
    { name: 'Ethiopia', timezone: 'Africa/Addis_Ababa' },
    { name: 'Fiji', timezone: 'Pacific/Fiji' },
    { name: 'Finland', timezone: 'Europe/Helsinki' },
    { name: 'France', timezone: 'Europe/Paris' },
    { name: 'Gabon', timezone: 'Africa/Libreville' },
    { name: 'Gambia', timezone: 'Africa/Banjul' },
    { name: 'Georgia', timezone: 'Asia/Tbilisi' },
    { name: 'Germany', timezone: 'Europe/Berlin' },
    { name: 'Ghana', timezone: 'Africa/Accra' },
    { name: 'Greece', timezone: 'Europe/Athens' },
    { name: 'Guatemala', timezone: 'America/Guatemala' },
    { name: 'Guinea', timezone: 'Africa/Conakry' },
    { name: 'Guinea-Bissau', timezone: 'Africa/Bissau' },
    { name: 'Guyana', timezone: 'America/Guyana' },
    { name: 'Haiti', timezone: 'America/Port-au-Prince' },
    { name: 'Honduras', timezone: 'America/Tegucigalpa' },
    { name: 'Hungary', timezone: 'Europe/Budapest' },
    { name: 'Iceland', timezone: 'Atlantic/Reykjavik' },
    { name: 'India', timezone: 'Asia/Kolkata' },
    { name: 'Indonesia', timezone: 'Asia/Jakarta' },
    { name: 'Iran', timezone: 'Asia/Tehran' },
    { name: 'Iraq', timezone: 'Asia/Baghdad' },
    { name: 'Ireland', timezone: 'Europe/Dublin' },
    { name: 'Israel', timezone: 'Asia/Jerusalem' },
    { name: 'Italy', timezone: 'Europe/Rome' },
    { name: 'Ivory Coast', timezone: 'Africa/Abidjan' },
    { name: 'Jamaica', timezone: 'America/Jamaica' },
    { name: 'Japan', timezone: 'Asia/Tokyo' },
    { name: 'Jordan', timezone: 'Asia/Amman' },
    { name: 'Kazakhstan', timezone: 'Asia/Almaty' },
    { name: 'Kenya', timezone: 'Africa/Nairobi' },
    { name: 'Kuwait', timezone: 'Asia/Kuwait' },
    { name: 'Kyrgyzstan', timezone: 'Asia/Bishkek' },
    { name: 'Laos', timezone: 'Asia/Vientiane' },
    { name: 'Latvia', timezone: 'Europe/Riga' },
    { name: 'Lebanon', timezone: 'Asia/Beirut' },
    { name: 'Lesotho', timezone: 'Africa/Maseru' },
    { name: 'Liberia', timezone: 'Africa/Monrovia' },
    { name: 'Libya', timezone: 'Africa/Tripoli' },
    { name: 'Liechtenstein', timezone: 'Europe/Vaduz' },
    { name: 'Lithuania', timezone: 'Europe/Vilnius' },
    { name: 'Luxembourg', timezone: 'Europe/Luxembourg' },
    { name: 'Madagascar', timezone: 'Indian/Antananarivo' },
    { name: 'Malawi', timezone: 'Africa/Blantyre' },
    { name: 'Malaysia', timezone: 'Asia/Kuala_Lumpur' },
    { name: 'Maldives', timezone: 'Indian/Maldives' },
    { name: 'Mali', timezone: 'Africa/Bamako' },
    { name: 'Malta', timezone: 'Europe/Malta' },
    { name: 'Mauritania', timezone: 'Africa/Nouakchott' },
    { name: 'Mauritius', timezone: 'Indian/Mauritius' },
    { name: 'Mexico', timezone: 'America/Mexico_City' },
    { name: 'Moldova', timezone: 'Europe/Chisinau' },
    { name: 'Monaco', timezone: 'Europe/Monaco' },
    { name: 'Mongolia', timezone: 'Asia/Ulaanbaatar' },
    { name: 'Montenegro', timezone: 'Europe/Podgorica' },
    { name: 'Morocco', timezone: 'Africa/Casablanca' },
    { name: 'Mozambique', timezone: 'Africa/Maputo' },
    { name: 'Myanmar', timezone: 'Asia/Yangon' },
    { name: 'Namibia', timezone: 'Africa/Windhoek' },
    { name: 'Nepal', timezone: 'Asia/Kathmandu' },
    { name: 'Netherlands', timezone: 'Europe/Amsterdam' },
    { name: 'New Zealand', timezone: 'Pacific/Auckland' },
    { name: 'Nicaragua', timezone: 'America/Managua' },
    { name: 'Niger', timezone: 'Africa/Niamey' },
    { name: 'Nigeria', timezone: 'Africa/Lagos' },
    { name: 'North Korea', timezone: 'Asia/Pyongyang' },
    { name: 'North Macedonia', timezone: 'Europe/Skopje' },
    { name: 'Norway', timezone: 'Europe/Oslo' },
    { name: 'Oman', timezone: 'Asia/Muscat' },
    { name: 'Pakistan', timezone: 'Asia/Karachi' },
    { name: 'Panama', timezone: 'America/Panama' },
    { name: 'Papua New Guinea', timezone: 'Pacific/Port_Moresby' },
    { name: 'Paraguay', timezone: 'America/Asuncion' },
    { name: 'Peru', timezone: 'America/Lima' },
    { name: 'Philippines', timezone: 'Asia/Manila' },
    { name: 'Poland', timezone: 'Europe/Warsaw' },
    { name: 'Portugal', timezone: 'Europe/Lisbon' },
    { name: 'Qatar', timezone: 'Asia/Qatar' },
    { name: 'Republic of the Congo', timezone: 'Africa/Brazzaville' },
    { name: 'Romania', timezone: 'Europe/Bucharest' },
    { name: 'Russia', timezone: 'Europe/Moscow' },
    { name: 'Rwanda', timezone: 'Africa/Kigali' },
    { name: 'San Marino', timezone: 'Europe/San_Marino' },
    { name: 'Saudi Arabia', timezone: 'Asia/Riyadh' },
    { name: 'Senegal', timezone: 'Africa/Dakar' },
    { name: 'Serbia', timezone: 'Europe/Belgrade' },
    { name: 'Seychelles', timezone: 'Indian/Mahe' },
    { name: 'Sierra Leone', timezone: 'Africa/Freetown' },
    { name: 'Singapore', timezone: 'Asia/Singapore' },
    { name: 'Slovakia', timezone: 'Europe/Bratislava' },
    { name: 'Slovenia', timezone: 'Europe/Ljubljana' },
    { name: 'Somalia', timezone: 'Africa/Mogadishu' },
    { name: 'South Africa', timezone: 'Africa/Johannesburg' },
    { name: 'South Korea', timezone: 'Asia/Seoul' },
    { name: 'South Sudan', timezone: 'Africa/Juba' },
    { name: 'Spain', timezone: 'Europe/Madrid' },
    { name: 'Sri Lanka', timezone: 'Asia/Colombo' },
    { name: 'Sudan', timezone: 'Africa/Khartoum' },
    { name: 'Suriname', timezone: 'America/Paramaribo' },
    { name: 'Sweden', timezone: 'Europe/Stockholm' },
    { name: 'Switzerland', timezone: 'Europe/Zurich' },
    { name: 'Syria', timezone: 'Asia/Damascus' },
    { name: 'Taiwan', timezone: 'Asia/Taipei' },
    { name: 'Tajikistan', timezone: 'Asia/Dushanbe' },
    { name: 'Tanzania', timezone: 'Africa/Dar_es_Salaam' },
    { name: 'Thailand', timezone: 'Asia/Bangkok' },
    { name: 'Togo', timezone: 'Africa/Lome' },
    { name: 'Trinidad and Tobago', timezone: 'America/Port_of_Spain' },
    { name: 'Tunisia', timezone: 'Africa/Tunis' },
    { name: 'Turkey', timezone: 'Europe/Istanbul' },
    { name: 'Turkmenistan', timezone: 'Asia/Ashgabat' },
    { name: 'Uganda', timezone: 'Africa/Kampala' },
    { name: 'Ukraine', timezone: 'Europe/Kiev' },
    { name: 'United Arab Emirates', timezone: 'Asia/Dubai' },
    { name: 'United Kingdom', timezone: 'Europe/London' },
    { name: 'United States', timezone: 'America/New_York' },
    { name: 'Uruguay', timezone: 'America/Montevideo' },
    { name: 'Uzbekistan', timezone: 'Asia/Tashkent' },
    { name: 'Vatican City', timezone: 'Europe/Vatican' },
    { name: 'Venezuela', timezone: 'America/Caracas' },
    { name: 'Vietnam', timezone: 'Asia/Ho_Chi_Minh' },
    { name: 'Yemen', timezone: 'Asia/Aden' },
    { name: 'Zambia', timezone: 'Africa/Lusaka' },
    { name: 'Zimbabwe', timezone: 'Africa/Harare' }
  ]

  const getTimeForTimezone = (timezone) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(currentTime)
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

      {/* World Time Banner */}
      <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Washington DC Time (Fixed) */}
          <div className="text-center">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Washington, DC</h3>
            <div className="text-2xl font-mono font-bold text-blue-900">
              {getTimeForTimezone('America/New_York')}
            </div>
          </div>

          {/* Country 1 Clock */}
          <div className="text-center">
            <select
              value={selectedCountry1}
              onChange={(e) => setSelectedCountry1(e.target.value)}
              className="mb-2 text-sm border border-blue-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {worldCountries.map((country) => (
                <option key={country.name} value={country.name}>
                  {country.name}
                </option>
              ))}
            </select>
            <div className="text-2xl font-mono font-bold text-blue-900">
              {(() => {
                const country = worldCountries.find(c => c.name === selectedCountry1)
                return country ? getTimeForTimezone(country.timezone) : '--:--:--'
              })()}
            </div>
          </div>

          {/* Country 2 Clock */}
          <div className="text-center">
            <select
              value={selectedCountry2}
              onChange={(e) => setSelectedCountry2(e.target.value)}
              className="mb-2 text-sm border border-blue-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {worldCountries.map((country) => (
                <option key={country.name} value={country.name}>
                  {country.name}
                </option>
              ))}
            </select>
            <div className="text-2xl font-mono font-bold text-blue-900">
              {(() => {
                const country = worldCountries.find(c => c.name === selectedCountry2)
                return country ? getTimeForTimezone(country.timezone) : '--:--:--'
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Countries"
          value={stats.countries.total}
          icon={Globe}
          color="blue"
          link="/countries"
          subtitle={`${stats.countries.byRiskLevel.reduce((sum, item) => sum + parseInt(item.count), 0)} assessed for risk`}
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
          subtitle={`${stats.users.verified} verified, ${stats.users.total - stats.users.verified} unverified`}
        />
        <StatCard
          title="Travel Plans"
          value={stats.travelPlans.total}
          icon={MapPin}
          color="purple"
          link="/travel-plans"
          subtitle={`${stats.travelPlans.active} active, ${stats.travelPlans.upcoming} upcoming`}
        />
      </div>

      {/* Risk Level World Map */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Global Risk Assessment</h3>
          <Link to="/countries" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View countries
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