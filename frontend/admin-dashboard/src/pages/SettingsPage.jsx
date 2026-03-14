import { useState, useEffect } from 'react'
import {
  Settings,
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Shield,
  Database,
  Globe,
  Activity,
  Save,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Key,
  Server,
  Users,
  Eye,
  EyeOff
} from 'lucide-react'
import { apiService } from '../services/api'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading] = useState(false)
  const [systemHealth, setSystemHealth] = useState(null)
  const [settings, setSettings] = useState({
    general: {
      appName: 'STEP Clone',
      supportEmail: 'admin@stepclone.com',
      maxTravelPlansPerUser: 10,
      alertRetentionDays: 365
    },
    notifications: {
      emailEnabled: true,
      smsEnabled: true,
      pushEnabled: true,
      emailProvider: 'smtp',
      smtpHost: '',
      smtpPort: '',
      smtpUser: '',
      smtpPassword: '',
      twilioSid: '',
      twilioToken: '',
      firebaseProjectId: '',
      firebasePrivateKey: ''
    },
    security: {
      jwtExpirationHours: 24,
      maxLoginAttempts: 5,
      lockoutDurationMinutes: 30,
      requireEmailVerification: true,
      passwordMinLength: 8
    }
  })

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'system', name: 'System', icon: Database }
  ]

  useEffect(() => {
    fetchSystemHealth()
    // In a real app, you would fetch current settings from the API
    // fetchSettings()
  }, [])

  const fetchSystemHealth = async () => {
    try {
      const response = await apiService.getHealth()
      setSystemHealth(response.data)
    } catch (error) {
      console.error('Error fetching system health:', error)
      setSystemHealth({ status: 'unknown' })
    }
  }

  const handleSaveSettings = async () => {
    setLoading(true)
    try {
      // In a real app, you would send these settings to the API
      // await apiService.updateSettings(settings)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      toast.success('Settings saved successfully')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage system configuration and preferences</p>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={loading}
          className="btn-primary flex items-center space-x-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>{loading ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tabs */}
        <div className="lg:w-64">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'bg-primary-100 border-primary-500 text-primary-700'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } w-full flex items-center px-3 py-2 text-sm font-medium border-l-4 transition-colors`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'general' && <GeneralSettings settings={settings.general} onChange={handleInputChange} />}
          {activeTab === 'notifications' && <NotificationSettings settings={settings.notifications} onChange={handleInputChange} />}
          {activeTab === 'security' && <SecuritySettings settings={settings.security} onChange={handleInputChange} />}
          {activeTab === 'system' && <SystemSettings systemHealth={systemHealth} onRefresh={fetchSystemHealth} />}
        </div>
      </div>
    </div>
  )
}

function GeneralSettings({ settings, onChange }) {
  return (
    <div className="card space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label htmlFor="appName" className="block text-sm font-medium text-gray-700">
              Application Name
            </label>
            <input
              type="text"
              id="appName"
              className="form-input"
              value={settings.appName}
              onChange={(e) => onChange('general', 'appName', e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="supportEmail" className="block text-sm font-medium text-gray-700">
              Support Email
            </label>
            <input
              type="email"
              id="supportEmail"
              className="form-input"
              value={settings.supportEmail}
              onChange={(e) => onChange('general', 'supportEmail', e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="maxTravelPlans" className="block text-sm font-medium text-gray-700">
              Max Travel Plans per User
            </label>
            <input
              type="number"
              id="maxTravelPlans"
              min="1"
              max="100"
              className="form-input"
              value={settings.maxTravelPlansPerUser}
              onChange={(e) => onChange('general', 'maxTravelPlansPerUser', parseInt(e.target.value))}
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum number of active travel plans a user can have
            </p>
          </div>

          <div>
            <label htmlFor="alertRetention" className="block text-sm font-medium text-gray-700">
              Alert Retention (Days)
            </label>
            <input
              type="number"
              id="alertRetention"
              min="30"
              max="3650"
              className="form-input"
              value={settings.alertRetentionDays}
              onChange={(e) => onChange('general', 'alertRetentionDays', parseInt(e.target.value))}
            />
            <p className="text-xs text-gray-500 mt-1">
              How long to keep alerts before archiving
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function NotificationSettings({ settings, onChange }) {
  const [showPasswords, setShowPasswords] = useState({})

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  return (
    <div className="card space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h3>

        {/* Channel Toggles */}
        <div className="space-y-4 mb-6">
          <h4 className="text-md font-medium text-gray-800">Notification Channels</h4>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Mail className="h-5 w-5 text-blue-600 mr-3" />
              <div>
                <div className="font-medium">Email Notifications</div>
                <div className="text-sm text-gray-500">Send alerts via email</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.emailEnabled}
                onChange={(e) => onChange('notifications', 'emailEnabled', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <MessageSquare className="h-5 w-5 text-green-600 mr-3" />
              <div>
                <div className="font-medium">SMS Notifications</div>
                <div className="text-sm text-gray-500">Send alerts via SMS</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.smsEnabled}
                onChange={(e) => onChange('notifications', 'smsEnabled', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Smartphone className="h-5 w-5 text-purple-600 mr-3" />
              <div>
                <div className="font-medium">Push Notifications</div>
                <div className="text-sm text-gray-500">Send alerts via push notifications</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.pushEnabled}
                onChange={(e) => onChange('notifications', 'pushEnabled', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>

        {/* Email Configuration */}
        {settings.emailEnabled && (
          <div className="border-t pt-6">
            <h4 className="text-md font-medium text-gray-800 mb-4">Email Configuration</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="smtpHost" className="block text-sm font-medium text-gray-700">
                  SMTP Host
                </label>
                <input
                  type="text"
                  id="smtpHost"
                  className="form-input"
                  placeholder="smtp.gmail.com"
                  value={settings.smtpHost}
                  onChange={(e) => onChange('notifications', 'smtpHost', e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="smtpPort" className="block text-sm font-medium text-gray-700">
                  SMTP Port
                </label>
                <input
                  type="number"
                  id="smtpPort"
                  className="form-input"
                  placeholder="587"
                  value={settings.smtpPort}
                  onChange={(e) => onChange('notifications', 'smtpPort', e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="smtpUser" className="block text-sm font-medium text-gray-700">
                  SMTP Username
                </label>
                <input
                  type="text"
                  id="smtpUser"
                  className="form-input"
                  value={settings.smtpUser}
                  onChange={(e) => onChange('notifications', 'smtpUser', e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="smtpPassword" className="block text-sm font-medium text-gray-700">
                  SMTP Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.smtp ? "text" : "password"}
                    id="smtpPassword"
                    className="form-input pr-10"
                    value={settings.smtpPassword}
                    onChange={(e) => onChange('notifications', 'smtpPassword', e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => togglePasswordVisibility('smtp')}
                  >
                    {showPasswords.smtp ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SMS Configuration */}
        {settings.smsEnabled && (
          <div className="border-t pt-6">
            <h4 className="text-md font-medium text-gray-800 mb-4">SMS Configuration (Twilio)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="twilioSid" className="block text-sm font-medium text-gray-700">
                  Account SID
                </label>
                <input
                  type="text"
                  id="twilioSid"
                  className="form-input"
                  value={settings.twilioSid}
                  onChange={(e) => onChange('notifications', 'twilioSid', e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="twilioToken" className="block text-sm font-medium text-gray-700">
                  Auth Token
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.twilio ? "text" : "password"}
                    id="twilioToken"
                    className="form-input pr-10"
                    value={settings.twilioToken}
                    onChange={(e) => onChange('notifications', 'twilioToken', e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => togglePasswordVisibility('twilio')}
                  >
                    {showPasswords.twilio ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Push Configuration */}
        {settings.pushEnabled && (
          <div className="border-t pt-6">
            <h4 className="text-md font-medium text-gray-800 mb-4">Push Notification Configuration (Firebase)</h4>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="firebaseProjectId" className="block text-sm font-medium text-gray-700">
                  Project ID
                </label>
                <input
                  type="text"
                  id="firebaseProjectId"
                  className="form-input"
                  value={settings.firebaseProjectId}
                  onChange={(e) => onChange('notifications', 'firebaseProjectId', e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="firebasePrivateKey" className="block text-sm font-medium text-gray-700">
                  Private Key (JSON)
                </label>
                <div className="relative">
                  <textarea
                    id="firebasePrivateKey"
                    rows={4}
                    className={`form-input pr-10 ${showPasswords.firebase ? '' : 'font-mono'}`}
                    style={{ fontFamily: showPasswords.firebase ? 'inherit' : 'monospace' }}
                    value={settings.firebasePrivateKey}
                    onChange={(e) => onChange('notifications', 'firebasePrivateKey', e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute top-3 right-3"
                    onClick={() => togglePasswordVisibility('firebase')}
                  >
                    {showPasswords.firebase ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SecuritySettings({ settings, onChange }) {
  return (
    <div className="card space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>

        <div className="space-y-6">
          <div>
            <label htmlFor="jwtExpiration" className="block text-sm font-medium text-gray-700">
              JWT Token Expiration (Hours)
            </label>
            <input
              type="number"
              id="jwtExpiration"
              min="1"
              max="168"
              className="form-input"
              value={settings.jwtExpirationHours}
              onChange={(e) => onChange('security', 'jwtExpirationHours', parseInt(e.target.value))}
            />
            <p className="text-xs text-gray-500 mt-1">
              How long authentication tokens remain valid
            </p>
          </div>

          <div>
            <label htmlFor="maxLoginAttempts" className="block text-sm font-medium text-gray-700">
              Max Failed Login Attempts
            </label>
            <input
              type="number"
              id="maxLoginAttempts"
              min="3"
              max="20"
              className="form-input"
              value={settings.maxLoginAttempts}
              onChange={(e) => onChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
            />
          </div>

          <div>
            <label htmlFor="lockoutDuration" className="block text-sm font-medium text-gray-700">
              Account Lockout Duration (Minutes)
            </label>
            <input
              type="number"
              id="lockoutDuration"
              min="5"
              max="1440"
              className="form-input"
              value={settings.lockoutDurationMinutes}
              onChange={(e) => onChange('security', 'lockoutDurationMinutes', parseInt(e.target.value))}
            />
          </div>

          <div>
            <label htmlFor="passwordMinLength" className="block text-sm font-medium text-gray-700">
              Minimum Password Length
            </label>
            <input
              type="number"
              id="passwordMinLength"
              min="6"
              max="32"
              className="form-input"
              value={settings.passwordMinLength}
              onChange={(e) => onChange('security', 'passwordMinLength', parseInt(e.target.value))}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium">Require Email Verification</div>
              <div className="text-sm text-gray-500">Users must verify their email before accessing the system</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.requireEmailVerification}
                onChange={(e) => onChange('security', 'requireEmailVerification', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

function SystemSettings({ systemHealth, onRefresh }) {
  return (
    <div className="space-y-6">
      {/* System Health */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">System Health</h3>
          <button
            onClick={onRefresh}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>

        {systemHealth ? (
          <div className="space-y-4">
            <div className={`flex items-center p-4 rounded-lg ${
              systemHealth.status === 'healthy'
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className={`p-2 rounded-full ${
                systemHealth.status === 'healthy' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {systemHealth.status === 'healthy' ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600" />
                )}
              </div>
              <div className="ml-4">
                <h4 className={`font-medium ${
                  systemHealth.status === 'healthy' ? 'text-green-900' : 'text-red-900'
                }`}>
                  System Status: {systemHealth.status}
                </h4>
                {systemHealth.uptime && (
                  <p className="text-sm text-gray-600">
                    Uptime: {Math.floor(systemHealth.uptime / 3600)} hours
                  </p>
                )}
              </div>
            </div>

            {systemHealth.services && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(systemHealth.services).map(([service, status]) => (
                  <div key={service} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className={`p-2 rounded-full mr-3 ${
                      status === 'healthy' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {service === 'database' ? (
                        <Database className={`h-4 w-4 ${
                          status === 'healthy' ? 'text-green-600' : 'text-red-600'
                        }`} />
                      ) : service === 'redis' ? (
                        <Server className={`h-4 w-4 ${
                          status === 'healthy' ? 'text-green-600' : 'text-red-600'
                        }`} />
                      ) : (
                        <Activity className={`h-4 w-4 ${
                          status === 'healthy' ? 'text-green-600' : 'text-red-600'
                        }`} />
                      )}
                    </div>
                    <div>
                      <div className="font-medium capitalize">{service}</div>
                      <div className={`text-sm ${
                        status === 'healthy' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        )}
      </div>

      {/* System Information */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">System Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-600">Application Version</span>
              <p className="text-sm text-gray-900">v1.0.0</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Node.js Version</span>
              <p className="text-sm text-gray-900">18.x</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Environment</span>
              <p className="text-sm text-gray-900">Development</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-600">Database</span>
              <p className="text-sm text-gray-900">PostgreSQL 15</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Cache</span>
              <p className="text-sm text-gray-900">Redis 7</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Last Restart</span>
              <p className="text-sm text-gray-900">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Maintenance */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Maintenance</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
              <div>
                <h4 className="font-medium text-yellow-900">Database Cleanup</h4>
                <p className="text-sm text-yellow-700">Remove expired alerts and old notifications</p>
              </div>
            </div>
            <button className="btn-secondary">
              Run Cleanup
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <RefreshCw className="h-5 w-5 text-blue-600 mr-3" />
              <div>
                <h4 className="font-medium text-blue-900">Cache Refresh</h4>
                <p className="text-sm text-blue-700">Clear and rebuild application cache</p>
              </div>
            </div>
            <button className="btn-secondary">
              Clear Cache
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}