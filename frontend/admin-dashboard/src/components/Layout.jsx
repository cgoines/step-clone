import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  Home,
  Users,
  AlertTriangle,
  Globe,
  MapPin,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Shield
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Alerts', href: '/alerts', icon: AlertTriangle },
  { name: 'Countries', href: '/countries', icon: Globe },
  { name: 'Travel Plans', href: '/travel-plans', icon: MapPin },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()

  const isActivePath = (path) => {
    if (path === '/') return location.pathname === path
    return location.pathname.startsWith(path)
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div className="fixed inset-0 bg-primary-800 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-primary-700">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <SidebarContent navigation={navigation} isActivePath={isActivePath} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <SidebarContent navigation={navigation} isActivePath={isActivePath} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top bar */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow border-b border-primary-200">
          <button
            type="button"
            className="px-4 border-r border-primary-200 text-primary-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <div className="relative w-full text-primary-400 focus-within:text-primary-600">
                  <div className="flex items-center h-16">
                    <h1 className="text-lg font-semibold text-primary-700">
                      STEP Clone Admin
                    </h1>
                  </div>
                </div>
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-primary-700">
                  Welcome, {user?.firstName || 'Admin'}
                </span>
                <button
                  onClick={logout}
                  className="p-2 text-primary-500 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function SidebarContent({ navigation, isActivePath }) {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-primary-700">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <Shield className="h-8 w-8 text-white" />
          <span className="ml-2 text-xl font-bold text-white">STEP Clone</span>
        </div>
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            const isActive = isActivePath(item.href)
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  isActive
                    ? 'bg-white text-primary-700'
                    : 'text-primary-100 hover:bg-primary-600 hover:text-white'
                } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors`}
              >
                <item.icon
                  className={`${
                    isActive ? 'text-primary-600' : 'text-primary-200 group-hover:text-white'
                  } mr-3 flex-shrink-0 h-5 w-5`}
                />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}