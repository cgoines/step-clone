import { useState, memo } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from 'react-simple-maps'
import { MapPin } from 'lucide-react'

const geoUrl = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson"

const TravelPlansMap = memo(({ travelPlans = [], countries = [], onCountryClick, selectedCountryId }) => {
  const [tooltipData, setTooltipData] = useState(null)

  // Debug: Basic info
  console.log('TravelPlansMap:', `${travelPlans.length} plans, ${countries.length} countries`)

  // Helper function to get status from dates
  const getStatusFromDates = (startDate, endDate) => {
    const now = new Date()
    now.setHours(0, 0, 0, 0) // Reset time to beginning of day

    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)

    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999) // Set to end of day

    if (start <= now && end >= now) return 'active'
    if (end < now) return 'completed'
    return 'upcoming'
  }

  // Create a mapping from 2-letter country codes to 3-letter ISO codes
  const countryCodeMap = countries.reduce((acc, country) => {
    if (country.code && country.iso_code) {
      acc[country.code.toUpperCase()] = country.iso_code.toUpperCase()
    }
    return acc
  }, {})
  console.log('Country mappings:', Object.keys(countryCodeMap).length)

  // Filter for upcoming and active travel plans only
  const relevantTravelPlans = travelPlans.filter(plan => {
    const status = getStatusFromDates(plan.departureDate, plan.returnDate)
    return status === 'upcoming' || status === 'active'
  })
  console.log('Relevant plans:', relevantTravelPlans.length)

  // Create a map of 3-letter ISO codes to travel plan data
  const countryTravelData = relevantTravelPlans.reduce((acc, plan) => {
    if (plan.destination && plan.destination.code) {
      const twoLetterCode = plan.destination.code.toUpperCase()
      const threeLetterCode = countryCodeMap[twoLetterCode]

      if (threeLetterCode) {
        if (!acc[threeLetterCode]) {
          acc[threeLetterCode] = {
            plans: [],
            countryName: plan.destination.name,
            twoLetterCode: twoLetterCode
          }
        }
        acc[threeLetterCode].plans.push({
          ...plan,
          status: getStatusFromDates(plan.departureDate, plan.returnDate)
        })
      } else {
        console.warn(`No 3-letter mapping found for ${plan.destination.name} (${twoLetterCode})`)
      }
    }
    return acc
  }, {})
  console.log('Countries to highlight:', Object.keys(countryTravelData).join(', '))

  // Get country fill color based on travel plans
  const getCountryFill = (geo, isSelected = false) => {
    const threeLetterCode = geo.properties.ISO_A3 // This is the 3-letter ISO code from geojson
    const travelData = countryTravelData[threeLetterCode]

    if (isSelected) {
      return "#1e40af" // blue-700 for selected
    }


    if (!travelData) {
      return "#f3f4f6" // gray-100 for no travel plans
    }

    const hasActive = travelData.plans.some(plan => plan.status === 'active')
    const hasUpcoming = travelData.plans.some(plan => plan.status === 'upcoming')

    if (hasActive && hasUpcoming) {
      return "#7c3aed" // violet-600 for both active and upcoming
    } else if (hasActive) {
      return "#16a34a" // green-600 for active trips
    } else if (hasUpcoming) {
      return "#2563eb" // blue-600 for upcoming trips
    }

    return "#f3f4f6"
  }

  const handleCountryClick = (geo) => {
    const threeLetterCode = geo.properties.ISO_A3 // This is the 3-letter ISO code from geojson
    const travelData = countryTravelData[threeLetterCode]

    if (travelData && onCountryClick) {
      // Find the country object from the countries list using iso_code
      const country = countries.find(c => c.iso_code?.toUpperCase() === threeLetterCode)
      if (country) {
        onCountryClick(country)
      }
    }
  }

  const handleMouseEnter = (geo) => {
    const threeLetterCode = geo.properties.ISO_A3 // This is the 3-letter ISO code from geojson
    const travelData = countryTravelData[threeLetterCode]
    const countryName = geo.properties.NAME // Natural Earth uses properties.NAME

    if (travelData) {
      const activePlans = travelData.plans.filter(plan => plan.status === 'active')
      const upcomingPlans = travelData.plans.filter(plan => plan.status === 'upcoming')

      setTooltipData({
        name: countryName,
        activePlans: activePlans.length,
        upcomingPlans: upcomingPlans.length,
        totalPlans: travelData.plans.length
      })
    } else {
      setTooltipData({
        name: countryName,
        activePlans: 0,
        upcomingPlans: 0,
        totalPlans: 0
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
        <h4 className="text-sm font-medium text-gray-900 mb-2">Travel Plans</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-green-600"></div>
            <span>Active Trip</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-blue-600"></div>
            <span>Upcoming Trip</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-violet-600"></div>
            <span>Active & Upcoming</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-gray-100 border border-gray-300"></div>
            <span>No trips</span>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltipData && (
        <div className="absolute top-4 right-4 z-10 bg-gray-900 text-white p-2 rounded shadow-lg text-sm max-w-xs">
          <div className="font-medium">{tooltipData.name}</div>
          {tooltipData.totalPlans > 0 ? (
            <div className="text-gray-300">
              {tooltipData.activePlans > 0 && (
                <div>Active: {tooltipData.activePlans}</div>
              )}
              {tooltipData.upcomingPlans > 0 && (
                <div>Upcoming: {tooltipData.upcomingPlans}</div>
              )}
            </div>
          ) : (
            <div className="text-gray-300">No travel plans</div>
          )}
          {tooltipData.totalPlans > 0 && (
            <div className="text-xs text-gray-400 mt-1">Click to view plans</div>
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
                const travelData = countryTravelData[threeLetterCode]
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
                        fill: travelData ? "#374151" : "#d1d5db",
                        stroke: "#6b7280",
                        strokeWidth: 1.2,
                        outline: "none",
                        cursor: travelData ? "pointer" : "default",
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
          <MapPin className="h-4 w-4" />
          <span>Click on countries with travel plans to view details</span>
        </div>
      </div>
    </div>
  )
})

TravelPlansMap.displayName = 'TravelPlansMap'

export default TravelPlansMap