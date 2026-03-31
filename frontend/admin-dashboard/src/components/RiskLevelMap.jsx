import { useState, memo } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from 'react-simple-maps'
import { Shield } from 'lucide-react'

const geoUrl = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson"

const RiskLevelMap = memo(({ countries = [], onCountryClick, selectedCountryId }) => {
  const [tooltipData, setTooltipData] = useState(null)

  // Create a map of 3-letter ISO codes to risk levels
  const countryRiskData = countries.reduce((acc, country) => {
    if (country.iso_code && country.risk_level) {
      acc[country.iso_code.toUpperCase()] = {
        riskLevel: country.risk_level,
        countryName: country.name,
        countryId: country.id
      }
    }
    return acc
  }, {})

  // Get country fill color based on risk level
  const getCountryFill = (geo, isSelected = false) => {
    const threeLetterCode = geo.properties.ISO_A3
    const riskData = countryRiskData[threeLetterCode]

    if (isSelected) {
      return "#1e40af" // blue-700 for selected
    }

    if (!riskData) {
      return "#f3f4f6" // gray-100 for unknown risk
    }

    switch (riskData.riskLevel) {
      case 'low':
        return "#10b981" // green-500
      case 'medium':
        return "#f59e0b" // amber-500
      case 'high':
        return "#ef4444" // red-500
      case 'critical':
        return "#dc2626" // red-600
      default:
        return "#f3f4f6"
    }
  }

  const handleCountryClick = (geo) => {
    const threeLetterCode = geo.properties.ISO_A3
    const riskData = countryRiskData[threeLetterCode]

    if (riskData && onCountryClick) {
      // Find the country object from the countries list
      const country = countries.find(c => c.iso_code?.toUpperCase() === threeLetterCode)
      if (country) {
        onCountryClick(country)
      }
    }
  }

  const handleMouseEnter = (geo) => {
    const threeLetterCode = geo.properties.ISO_A3
    const riskData = countryRiskData[threeLetterCode]
    const countryName = geo.properties.NAME

    setTooltipData({
      name: countryName,
      riskLevel: riskData?.riskLevel || 'unknown'
    })
  }

  const handleMouseLeave = () => {
    setTooltipData(null)
  }

  return (
    <div className="relative w-full bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Legend */}
      <div className="absolute top-4 left-4 z-10 bg-white bg-opacity-90 p-3 rounded-lg shadow-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
          <Shield className="h-4 w-4 mr-1" />
          Risk Levels
        </h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span>Low Risk</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-amber-500"></div>
            <span>Medium Risk</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span>High Risk</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-red-600"></div>
            <span>Critical Risk</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-gray-100 border border-gray-300"></div>
            <span>Unknown</span>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltipData && (
        <div className="absolute top-4 right-4 z-10 bg-gray-900 text-white p-2 rounded shadow-lg text-sm max-w-xs">
          <div className="font-medium">{tooltipData.name}</div>
          <div className="text-gray-300 capitalize">
            {tooltipData.riskLevel} risk
          </div>
          {tooltipData.riskLevel !== 'unknown' && (
            <div className="text-xs text-gray-400 mt-1">Click for details</div>
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
                const threeLetterCode = geo.properties.ISO_A3
                const riskData = countryRiskData[threeLetterCode]
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
                        fill: riskData ? "#374151" : "#d1d5db",
                        stroke: "#6b7280",
                        strokeWidth: 1.2,
                        outline: "none",
                        cursor: riskData ? "pointer" : "default",
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
          <Shield className="h-4 w-4" />
          <span>Click on countries to view details</span>
        </div>
      </div>
    </div>
  )
})

RiskLevelMap.displayName = 'RiskLevelMap'

export default RiskLevelMap