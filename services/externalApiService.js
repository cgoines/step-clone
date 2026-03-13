const axios = require('axios');
const logger = require('../utils/logger');

// Base URLs for external APIs
const STATE_DEPT_API_BASE = process.env.STATE_DEPT_API_BASE || 'https://www.state.gov/wp-json/wp/v2';
const OPENWEATHER_API_URL = process.env.OPENWEATHER_API_URL || 'https://api.openweathermap.org/data/2.5';
const REST_COUNTRIES_API_URL = process.env.REST_COUNTRIES_API_URL || 'https://restcountries.com/v3.1';

/**
 * Fetch travel advisories from State Department API
 * @param {string} countryName - Name of country
 * @returns {Promise<Object>} - Travel advisory data
 */
const getStateDeptTravelAdvisory = async (countryName) => {
    try {
        if (!countryName) {
            throw new Error('Country name is required');
        }

        logger.info(`Fetching State Dept travel advisory for: ${countryName}`);

        // Note: This is a simplified example. The actual State Department API
        // structure may vary and might require authentication
        const response = await axios.get(`${STATE_DEPT_API_BASE}/posts`, {
            params: {
                search: `travel advisory ${countryName}`,
                per_page: 1,
                _fields: 'title,excerpt,date,link'
            },
            timeout: 10000
        });

        if (response.data && response.data.length > 0) {
            const advisory = response.data[0];
            return {
                source: 'state.gov',
                country: countryName,
                title: advisory.title?.rendered || 'Travel Advisory',
                excerpt: advisory.excerpt?.rendered || '',
                date: advisory.date,
                url: advisory.link,
                lastUpdated: new Date().toISOString()
            };
        }

        return null;
    } catch (error) {
        logger.error(`Error fetching State Dept travel advisory for ${countryName}:`, error.message);
        return null;
    }
};

/**
 * Get weather alerts for a location using OpenWeather API
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} countryName - Country name for reference
 * @returns {Promise<Object>} - Weather alert data
 */
const getWeatherAlerts = async (lat, lon, countryName) => {
    try {
        const apiKey = process.env.OPENWEATHER_API_KEY;
        if (!apiKey) {
            logger.warn('OpenWeather API key not configured');
            return null;
        }

        if (!lat || !lon) {
            throw new Error('Latitude and longitude are required');
        }

        logger.info(`Fetching weather alerts for: ${countryName} (${lat}, ${lon})`);

        const response = await axios.get(`${OPENWEATHER_API_URL}/onecall`, {
            params: {
                lat,
                lon,
                appid: apiKey,
                exclude: 'minutely,hourly,daily',
                units: 'metric'
            },
            timeout: 10000
        });

        if (response.data && response.data.alerts) {
            return {
                source: 'openweathermap.org',
                country: countryName,
                location: { lat, lon },
                alerts: response.data.alerts.map(alert => ({
                    event: alert.event,
                    description: alert.description,
                    start: new Date(alert.start * 1000).toISOString(),
                    end: new Date(alert.end * 1000).toISOString(),
                    senderName: alert.sender_name
                })),
                lastUpdated: new Date().toISOString()
            };
        }

        return null;
    } catch (error) {
        logger.error(`Error fetching weather alerts for ${countryName}:`, error.message);
        return null;
    }
};

/**
 * Get enhanced country information from REST Countries API
 * @param {string} countryCode - ISO 2-letter country code
 * @returns {Promise<Object>} - Enhanced country data
 */
const getEnhancedCountryInfo = async (countryCode) => {
    try {
        if (!countryCode) {
            throw new Error('Country code is required');
        }

        logger.info(`Fetching enhanced country info for: ${countryCode}`);

        const response = await axios.get(`${REST_COUNTRIES_API_URL}/alpha/${countryCode}`, {
            params: {
                fields: 'name,capital,population,languages,currencies,timezones,borders,flag'
            },
            timeout: 10000
        });

        if (response.data) {
            const country = response.data;
            return {
                source: 'restcountries.com',
                code: countryCode,
                name: country.name?.common || country.name,
                officialName: country.name?.official,
                capital: country.capital?.[0],
                population: country.population,
                languages: country.languages ? Object.values(country.languages) : [],
                currencies: country.currencies ? Object.keys(country.currencies) : [],
                timezones: country.timezones || [],
                borders: country.borders || [],
                flag: country.flag,
                lastUpdated: new Date().toISOString()
            };
        }

        return null;
    } catch (error) {
        logger.error(`Error fetching enhanced country info for ${countryCode}:`, error.message);
        return null;
    }
};

/**
 * Test connectivity to external APIs
 * @returns {Promise<Object>} - API status information
 */
const testExternalAPIs = async () => {
    const results = {
        timestamp: new Date().toISOString(),
        apis: {}
    };

    // Test State Department API
    try {
        const response = await axios.get(`${STATE_DEPT_API_BASE}/posts`, {
            params: { per_page: 1 },
            timeout: 5000
        });
        results.apis.stateDept = {
            status: 'available',
            responseTime: response.config.responseTime || 'unknown'
        };
    } catch (error) {
        results.apis.stateDept = {
            status: 'unavailable',
            error: error.message
        };
    }

    // Test OpenWeather API (if key is provided)
    if (process.env.OPENWEATHER_API_KEY) {
        try {
            const response = await axios.get(`${OPENWEATHER_API_URL}/weather`, {
                params: {
                    q: 'London',
                    appid: process.env.OPENWEATHER_API_KEY
                },
                timeout: 5000
            });
            results.apis.openWeather = {
                status: 'available',
                authenticated: true
            };
        } catch (error) {
            results.apis.openWeather = {
                status: 'unavailable',
                authenticated: false,
                error: error.message
            };
        }
    } else {
        results.apis.openWeather = {
            status: 'not_configured',
            authenticated: false
        };
    }

    // Test REST Countries API
    try {
        const response = await axios.get(`${REST_COUNTRIES_API_URL}/alpha/US`, {
            timeout: 5000
        });
        results.apis.restCountries = {
            status: 'available'
        };
    } catch (error) {
        results.apis.restCountries = {
            status: 'unavailable',
            error: error.message
        };
    }

    return results;
};

/**
 * Aggregate travel information from multiple external sources
 * @param {string} countryCode - ISO 2-letter country code
 * @param {string} countryName - Country name
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object>} - Aggregated travel data
 */
const getAggregatedTravelData = async (countryCode, countryName, lat, lon) => {
    try {
        logger.info(`Aggregating travel data for: ${countryName} (${countryCode})`);

        // Fetch data from multiple sources in parallel
        const [
            stateDeptAdvisory,
            weatherAlerts,
            enhancedCountryInfo
        ] = await Promise.allSettled([
            getStateDeptTravelAdvisory(countryName),
            getWeatherAlerts(lat, lon, countryName),
            getEnhancedCountryInfo(countryCode)
        ]);

        const result = {
            country: {
                code: countryCode,
                name: countryName
            },
            timestamp: new Date().toISOString(),
            sources: []
        };

        // Process State Department advisory
        if (stateDeptAdvisory.status === 'fulfilled' && stateDeptAdvisory.value) {
            result.travelAdvisory = stateDeptAdvisory.value;
            result.sources.push('state.gov');
        }

        // Process weather alerts
        if (weatherAlerts.status === 'fulfilled' && weatherAlerts.value) {
            result.weatherAlerts = weatherAlerts.value;
            result.sources.push('openweathermap.org');
        }

        // Process enhanced country info
        if (enhancedCountryInfo.status === 'fulfilled' && enhancedCountryInfo.value) {
            result.enhancedInfo = enhancedCountryInfo.value;
            result.sources.push('restcountries.com');
        }

        return result;
    } catch (error) {
        logger.error(`Error aggregating travel data for ${countryName}:`, error);
        throw error;
    }
};

module.exports = {
    getStateDeptTravelAdvisory,
    getWeatherAlerts,
    getEnhancedCountryInfo,
    testExternalAPIs,
    getAggregatedTravelData
};