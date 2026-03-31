import { useState, memo } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from 'react-simple-maps'
import { AlertTriangle } from 'lucide-react'

const geoUrl = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson"

const WorldMap = memo(({ alerts = [], countries = [], onCountryClick, selectedCountryId }) => {
  const [tooltipData, setTooltipData] = useState(null)

  // Create a mapping from 2-letter country codes to 3-letter ISO codes
  const countryCodeMap = countries.reduce((acc, country) => {
    if (country.code && country.iso_code) {
      acc[country.code.toUpperCase()] = country.iso_code.toUpperCase()
    }
    return acc
  }, {})

  // Create a map of 3-letter ISO codes to alert counts and severity
  const countryAlertData = alerts.reduce((acc, alert) => {
    if (alert.country && alert.country.code) {
      const twoLetterCode = alert.country.code.toUpperCase()
      const threeLetterCode = countryCodeMap[twoLetterCode]

      if (threeLetterCode) {
        if (!acc[threeLetterCode]) {
          acc[threeLetterCode] = {
            count: 0,
            maxSeverity: 'info',
            countryName: alert.country.name,
            twoLetterCode: twoLetterCode
          }
        }
        acc[threeLetterCode].count++

        // Determine max severity (emergency > critical > warning > info)
        const severityOrder = { info: 0, warning: 1, critical: 2, emergency: 3 }
        if (severityOrder[alert.severity] > severityOrder[acc[threeLetterCode].maxSeverity]) {
          acc[threeLetterCode].maxSeverity = alert.severity
        }
      }
    }
    return acc
  }, {})

  // Get country fill color based on alert severity
  const getCountryFill = (geo, isSelected = false) => {
    const threeLetterCode = geo.properties.ISO_A3 // This is the 3-letter ISO code from geojson
    const alertData = countryAlertData[threeLetterCode]

    if (isSelected) {
      return "#1e40af" // blue-700 for selected
    }

    if (!alertData) {
      return "#f3f4f6" // gray-100 for no alerts
    }

    switch (alertData.maxSeverity) {
      case 'emergency':
        return "#dc2626" // red-600
      case 'critical':
        return "#ea580c" // orange-600
      case 'warning':
        return "#d97706" // amber-600
      case 'info':
        return "#2563eb" // blue-600
      default:
        return "#f3f4f6"
    }
  }

  const handleCountryClick = (geo) => {
    const threeLetterCode = geo.properties.ISO_A3 // This is the 3-letter ISO code from geojson
    const alertData = countryAlertData[threeLetterCode]

    if (alertData && onCountryClick) {
      // Find the country object from the countries list using iso_code
      const country = countries.find(c => c.iso_code?.toUpperCase() === threeLetterCode)
      if (country) {
        onCountryClick(country)
      }
    }
  }

  const handleMouseEnter = (geo) => {
    const threeLetterCode = geo.properties.ISO_A3 // This is the 3-letter ISO code from geojson
    const alertData = countryAlertData[threeLetterCode]
    const countryName = geo.properties.NAME // Natural Earth uses properties.NAME

    if (alertData) {
      setTooltipData({
        name: countryName,
        count: alertData.count,
        severity: alertData.maxSeverity
      })
    } else {
      setTooltipData({
        name: countryName,
        count: 0,
        severity: null
      })
    }
  }

  const handleMouseLeave = () => {
    setTooltipData(null)
  }

  return (
    <div className="relative w-full bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Legend */}
      <div className="absolute top-4 left-4 z-10 bg-white bg-opacity-90 p-3 rounded-lg shadow-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Alert Levels</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-red-600"></div>
            <span>Emergency</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-orange-600"></div>
            <span>Critical</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-amber-600"></div>
            <span>Warning</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-blue-600"></div>
            <span>Info</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-gray-100 border border-gray-300"></div>
            <span>No alerts</span>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltipData && (
        <div className="absolute top-4 right-4 z-10 bg-gray-900 text-white p-2 rounded shadow-lg text-sm max-w-xs">
          <div className="font-medium">{tooltipData.name}</div>
          {tooltipData.count > 0 ? (
            <div className="text-gray-300">
              {tooltipData.count} alert{tooltipData.count !== 1 ? 's' : ''}
              {tooltipData.severity && ` (${tooltipData.severity})`}
            </div>
          ) : (
            <div className="text-gray-300">No active alerts</div>
          )}
          {tooltipData.count > 0 && (
            <div className="text-xs text-gray-400 mt-1">Click to view alerts</div>
          )}
        </div>
      )}

      {/* Map */}
      <ComposableMap
        projection="geoNaturalEarth1"
        projectionConfig={{
          scale: 160,
          center: [0, 0]
        }}
        width={900}
        height={400}
        style={{ width: "100%", height: "400px" }}
      >
        <ZoomableGroup>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const threeLetterCode = geo.properties.ISO_A3 // This is the 3-letter ISO code from geojson
                const alertData = countryAlertData[threeLetterCode]
                const isSelected = selectedCountryId &&
                  countries.find(c => c.id === selectedCountryId)?.iso_code?.toUpperCase() === threeLetterCode

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={() => handleMouseEnter(geo)}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => handleCountryClick(geo)}
                    style={{
                      default: {
                        fill: getCountryFill(geo, isSelected),
                        stroke: "#9ca3af",
                        strokeWidth: 0.8,
                        outline: "none",
                      },
                      hover: {
                        fill: alertData ? "#374151" : "#d1d5db",
                        stroke: "#6b7280",
                        strokeWidth: 1.2,
                        outline: "none",
                        cursor: alertData ? "pointer" : "default",
                      },
                      pressed: {
                        fill: "#1f2937",
                        stroke: "#6b7280",
                        strokeWidth: 1.2,
                        outline: "none",
                      },
                    }}
                  />
                )
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 right-4 text-center">
        <div className="inline-flex items-center space-x-1 bg-white bg-opacity-90 px-3 py-1 rounded-full text-sm text-gray-600">
          <AlertTriangle className="h-4 w-4" />
          <span>Click on countries with alerts to view details</span>
        </div>
      </div>
    </div>
  )
})

WorldMap.displayName = 'WorldMap'

export default WorldMap