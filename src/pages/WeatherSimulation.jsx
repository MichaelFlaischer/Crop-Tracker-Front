import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { weatherSimulationService } from '../services/weatherSimulationService'
import { weatherAnalyzerService } from '../services/weatherAnalyzerService'
import { fieldService } from '../services/field.service'
import { cropService } from '../services/crop.service'

export function WeatherSimulation() {
  const [fields, setFields] = useState([])
  const [crops, setCrops] = useState([])

  const [selectedFieldId, setSelectedFieldId] = useState('')
  const [selectedCropId, setSelectedCropId] = useState('')

  const [manualConditions, setManualConditions] = useState({
    tempMin: '',
    tempMax: '',
    precipitationMin: '',
    precipitationMax: '',
  })

  const [climateData, setClimateData] = useState([])
  const [analysisResult, setAnalysisResult] = useState(null)
  const [optimalSowing, setOptimalSowing] = useState(null)
  const [topSowingDates, setTopSowingDates] = useState([])

  const [cropConditions, setCropConditions] = useState(null)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const navigate = useNavigate()

  useEffect(() => {
    loadFields()
    loadCrops()
  }, [])

  async function loadFields() {
    try {
      const fields = await fieldService.query()
      setFields(fields)
      if (fields.length > 0) setSelectedFieldId(String(fields[0]._id))
    } catch (err) {
      console.error('Error loading fields', err)
    }
  }

  async function loadCrops() {
    try {
      const crops = await cropService.query()
      setCrops(crops)
    } catch (err) {
      console.error('Error loading crops', err)
    }
  }

  async function onRunSimulation(ev) {
    ev.preventDefault()
    setIsLoading(true)
    setError(null)
    setAnalysisResult(null)
    setOptimalSowing(null)
    setTopSowingDates([])

    try {
      const selectedField = fields.find((field) => String(field._id) === String(selectedFieldId))
      if (!selectedField?.location?.lat || !selectedField?.location?.lng) {
        throw new Error('לשדה אין מיקום גיאוגרפי')
      }

      const latitude = selectedField.location.lat
      const longitude = selectedField.location.lng

      const data = await weatherSimulationService.fetchYearlyClimate(latitude, longitude)
      setClimateData(data)

      const newCropConditions = selectedCropId ? getConditionsFromSelectedCrop(selectedCropId) : getConditionsFromManual()
      setCropConditions(newCropConditions)

      const analysis = weatherAnalyzerService.analyzeWeatherForCrop(data, newCropConditions)
      setAnalysisResult(analysis)

      let crop = null
      let computedTopSowingDates = []
      let computedOptimalSowing = null

      if (selectedCropId) {
        crop = crops.find((crop) => String(crop._id) === String(selectedCropId))
        computedOptimalSowing = weatherAnalyzerService.findOptimalSowingDate(data, newCropConditions, crop.growthTime)
        setOptimalSowing(computedOptimalSowing)

        computedTopSowingDates = weatherAnalyzerService.findTopSowingDates(data, newCropConditions, crop.growthTime, 10)
        setTopSowingDates(computedTopSowingDates)
      } else {
        computedTopSowingDates = weatherAnalyzerService.findTopSowingDates(data, newCropConditions, 90, 10)
        setTopSowingDates(computedTopSowingDates)
      }

      navigate('/weather-simulation/result', {
        state: {
          analyzedDays: analysis.analyzedDays,
          suitableDaysCount: analysis.suitableDaysCount,
          unsuitableDaysCount: analysis.unsuitableDaysCount,
          totalIrrigationDays: analysis.totalIrrigationDays,
          totalDrainageDays: analysis.totalDrainageDays,
          optimalSowing: computedOptimalSowing,
          topSowingDates: computedTopSowingDates,
          minTemperature: newCropConditions.minTemperature,
          maxTemperature: newCropConditions.maxTemperature,
          minRainfall: newCropConditions.minRainfall,
          maxRainfall: newCropConditions.maxRainfall,
          selectedFieldName: selectedField?.fieldName,
          selectedCropName: selectedCropId ? crop?.cropName : null,
          growthPeriodInDays: selectedCropId ? crop?.growthTime : null,
        },
      })
    } catch (err) {
      console.error(err)
      setError('שגיאה בהרצת הסימולציה: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  function handleManualConditionChange(ev) {
    const { name, value } = ev.target
    setManualConditions((prev) => ({ ...prev, [name]: value }))
  }

  function getConditionsFromSelectedCrop(cropId) {
    const crop = crops.find((crop) => String(crop._id) === String(cropId))
    return {
      minTemperature: crop.minTemp,
      maxTemperature: crop.maxTemp,
      minRainfall: crop.minRainfall,
      maxRainfall: crop.maxRainfall,
    }
  }

  function getConditionsFromManual() {
    const minRainfall = manualConditions.precipitationMin ? +manualConditions.precipitationMin : undefined
    const maxRainfall = manualConditions.precipitationMax ? +manualConditions.precipitationMax : undefined

    return {
      minTemperature: +manualConditions.tempMin || -999,
      maxTemperature: +manualConditions.tempMax || 999,
      minRainfall,
      maxRainfall,
    }
  }

  return (
    <section className='weather-simulation'>
      <h1>סימולציית תנאי מזג אוויר לשנה</h1>

      <form onSubmit={onRunSimulation}>
        <label>
          בחר שדה:
          <select value={selectedFieldId} onChange={(e) => setSelectedFieldId(e.target.value)}>
            {fields.map((field) => (
              <option key={String(field._id)} value={String(field._id)}>
                {field.fieldName}
              </option>
            ))}
          </select>
        </label>

        <label>
          בחר יבול:
          <select value={selectedCropId} onChange={(e) => setSelectedCropId(e.target.value)}>
            <option value=''>-- ללא --</option>
            {crops.map((crop) => (
              <option key={String(crop._id)} value={String(crop._id)}>
                {crop.cropName}
              </option>
            ))}
          </select>
        </label>

        {!selectedCropId ? (
          <>
            <h3>או הזן תנאים ידניים:</h3>
            <label>
              טמפ' מינימלית (°C):
              <input type='number' name='tempMin' value={manualConditions.tempMin} onChange={handleManualConditionChange} required />
            </label>

            <label>
              טמפ' מקסימלית (°C):
              <input type='number' name='tempMax' value={manualConditions.tempMax} onChange={handleManualConditionChange} required />
            </label>

            <h4>תנאי משקעים:</h4>

            <label>
              משקעים מינימליים (מ״מ):
              <input type='number' name='precipitationMin' value={manualConditions.precipitationMin} onChange={handleManualConditionChange} />
            </label>

            <label>
              משקעים מקסימליים (מ״מ):
              <input type='number' name='precipitationMax' value={manualConditions.precipitationMax} onChange={handleManualConditionChange} />
            </label>
          </>
        ) : (
          <p style={{ fontStyle: 'italic', color: '#555' }}>נבחר יבול — התנאים יילקחו אוטומטית מהגדרות היבול.</p>
        )}
        {selectedCropId &&
          (() => {
            const crop = crops.find((crop) => String(crop._id) === String(selectedCropId))
            if (!crop) return null

            return (
              <div
                style={{
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginTop: '1rem',
                  background: '#f9f9f9',
                  maxWidth: '400px',
                }}
              >
                <h4 style={{ marginTop: 0 }}>פרטי יבול:</h4>
                <p>
                  <strong>טמפ׳ מינימלית:</strong> {crop.minTemp}°C
                </p>
                <p>
                  <strong>טמפ׳ מקסימלית:</strong> {crop.maxTemp}°C
                </p>
                <p>
                  <strong>משקעים מינימליים:</strong> {crop.minRainfall} מ״מ
                </p>
                <p>
                  <strong>משקעים מקסימליים:</strong> {crop.maxRainfall} מ״מ
                </p>
                <p>
                  <strong>מס׳ ימי גידול:</strong> {crop.growthTime} ימים
                </p>
              </div>
            )
          })()}

        <button type='submit'>הרץ סימולציה</button>
      </form>

      {isLoading && <p>טוען נתונים...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </section>
  )
}
