import { useState, useEffect } from 'react'

export default function WorldTimeBanner() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedCity1, setSelectedCity1] = useState(() => {
    return localStorage.getItem('admin-clock-city1') || 'London, United Kingdom'
  })
  const [selectedCity2, setSelectedCity2] = useState(() => {
    return localStorage.getItem('admin-clock-city2') || 'Tokyo, Japan'
  })
  const [embassyData, setEmbassyData] = useState([])

  useEffect(() => {
    loadEmbassyData()
  }, [])

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Persist selected cities to localStorage
  useEffect(() => {
    localStorage.setItem('admin-clock-city1', selectedCity1)
  }, [selectedCity1])

  useEffect(() => {
    localStorage.setItem('admin-clock-city2', selectedCity2)
  }, [selectedCity2])

  const loadEmbassyData = async () => {
    try {
      // Load embassy data from the JSON file
      const response = await fetch('/resources/embassies.json')
      const data = await response.json()

      // Sort alphabetically by displayname
      const sortedData = data.sort((a, b) => a.displayname.localeCompare(b.displayname))
      setEmbassyData(sortedData)
    } catch (error) {
      console.error('Error loading embassy data:', error)
      // Fallback to empty array if loading fails
      setEmbassyData([])
    }
  }

  const getTimeForTimezone = (timezone) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(currentTime)
  }

  const getTimezoneForCity = (cityDisplayName) => {
    const embassy = embassyData.find(e => e.displayname === cityDisplayName)
    return embassy ? embassy.timezone : 'UTC'
  }

  const handleCity1Change = (e) => {
    setSelectedCity1(e.target.value)
  }

  const handleCity2Change = (e) => {
    setSelectedCity2(e.target.value)
  }

  return (
    <div className="p-4 rounded-lg border bg-blue-50 border-blue-200 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Washington DC Time (Fixed) */}
        <div className="text-center">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Washington, DC</h3>
          <div className="text-2xl font-mono font-bold text-blue-900">
            {getTimeForTimezone('America/New_York')}
          </div>
        </div>

        {/* City 1 Clock */}
        <div className="text-center">
          <select
            value={selectedCity1}
            onChange={handleCity1Change}
            className="mb-2 text-sm border border-blue-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {embassyData.map((embassy) => (
              <option key={embassy.displayname} value={embassy.displayname}>
                {embassy.displayname}
              </option>
            ))}
          </select>
          <div className="text-2xl font-mono font-bold text-blue-900">
            {getTimeForTimezone(getTimezoneForCity(selectedCity1))}
          </div>
        </div>

        {/* City 2 Clock */}
        <div className="text-center">
          <select
            value={selectedCity2}
            onChange={handleCity2Change}
            className="mb-2 text-sm border border-blue-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {embassyData.map((embassy) => (
              <option key={embassy.displayname} value={embassy.displayname}>
                {embassy.displayname}
              </option>
            ))}
          </select>
          <div className="text-2xl font-mono font-bold text-blue-900">
            {getTimeForTimezone(getTimezoneForCity(selectedCity2))}
          </div>
        </div>

        {/* ZULU / UTC Time (Fixed) */}
        <div className="text-center">
          <h3 className="text-sm font-medium text-blue-800 mb-2">ZULU / UTC</h3>
          <div className="text-2xl font-mono font-bold text-blue-900">
            {getTimeForTimezone('UTC')}
          </div>
        </div>
      </div>
    </div>
  )
}