/* weather.service.js - OpenWeatherMap Free Plan Service */

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY
const BASE_URL = 'https://api.openweathermap.org/data/2.5'
const GEO_URL = 'http://api.openweathermap.org/geo/1.0'

/**
 * Fetch JSON helper
 * @param {string} url
 */
async function _getJSON(url) {
  console.log('Fetching:', url)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`OpenWeatherMap API error: ${res.status}`)
  return res.json()
}

/**
 * Get current weather for coordinates
 */
export async function getCurrentWeather(lat, lon, units = 'metric') {
  const url = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`
  return _getJSON(url)
}

/**
 * Get 5-day forecast (every 3h) for coordinates
 */
export async function getForecastByCoords(lat, lon, units = 'metric') {
  const url = `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`
  return _getJSON(url)
}

/**
 * Get coordinates by city name
 */
export async function getCoordsByCity(cityName) {
  const url = `${GEO_URL}/direct?q=${encodeURIComponent(cityName)}&limit=1&appid=${API_KEY}`
  const data = await _getJSON(url)
  return data[0] || null
}

/**
 * Get city name by coordinates
 */
export async function getCityByCoords(lat, lon) {
  const url = `${GEO_URL}/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`
  const data = await _getJSON(url)
  return data[0] || null
}

/**
 * Get daily summary (current data) for coordinates
 */
export async function getDailyWeatherSummary(lat, lon, units = 'metric') {
  const data = await getCurrentWeather(lat, lon, units)
  return {
    temp: data.main.temp,
    feelsLike: data.main.feels_like,
    humidity: data.main.humidity,
    clouds: data.clouds.all,
    windSpeed: data.wind.speed,
    windDeg: data.wind.deg,
    visibility: data.visibility,
    weatherDesc: data.weather?.[0]?.description || '',
    weatherIcon: data.weather?.[0]?.icon || '',
    sunrise: data.sys.sunrise,
    sunset: data.sys.sunset,
  }
}

/**
 * Get weekly summary by grouping 5-day forecast into daily stats
 */
export async function getWeeklyWeatherSummary(lat, lon, units = 'metric') {
  const { list } = await getForecastByCoords(lat, lon, units)
  const days = {}

  list.forEach((item) => {
    const date = item.dt_txt.split(' ')[0]
    if (!days[date]) days[date] = { count: 0, tempMin: Infinity, tempMax: -Infinity, humiditySum: 0, popSum: 0 }
    const day = days[date]
    day.count += 1
    day.tempMin = Math.min(day.tempMin, item.main.temp_min)
    day.tempMax = Math.max(day.tempMax, item.main.temp_max)
    day.humiditySum += item.main.humidity
    day.popSum += item.pop
  })

  return Object.entries(days).map(([date, stats]) => ({
    date: new Date(date),
    tempMin: stats.tempMin,
    tempMax: stats.tempMax,
    humidity: Math.round(stats.humiditySum / stats.count),
    pop: +(stats.popSum / stats.count).toFixed(2),
  }))
}
