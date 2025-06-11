export const weatherAnalyzerService = {
  analyzeWeatherForCrop,
  findOptimalSowingDate,
  findTopSowingDates,
}

function analyzeWeatherForCrop(climateData, cropConditions) {
  const { minTemperature, maxTemperature, minRainfall, maxRainfall } = cropConditions

  let totalIrrigationDays = 0
  let totalDrainageDays = 0

  const analyzedDays = climateData.map((day) => {
    const isTempOk = day.tempMin >= minTemperature && day.tempMax <= maxTemperature

    const needsIrrigation = typeof minRainfall === 'number' ? day.precipitation < minRainfall : false
    const needsDrainage = typeof maxRainfall === 'number' ? day.precipitation > maxRainfall : false

    if (needsIrrigation) totalIrrigationDays++
    if (needsDrainage) totalDrainageDays++

    const isSuitable = isTempOk

    return {
      ...day,
      isSuitable,
      needsIrrigation,
      needsDrainage,
    }
  })

  const suitableDaysCount = analyzedDays.filter((day) => day.isSuitable).length
  const unsuitableDaysCount = analyzedDays.length - suitableDaysCount

  return {
    suitableDaysCount,
    unsuitableDaysCount,
    totalIrrigationDays,
    totalDrainageDays,
    analyzedDays,
  }
}

function findOptimalSowingDate(climateData, cropConditions, growthPeriodInDays) {
  const climateDataExtended = [...climateData, ...climateData.slice(0, growthPeriodInDays)]

  const possibleStartIndexes = climateData.length

  let bestStartDate = null
  let bestScore = -1

  for (let startIdx = 0; startIdx < possibleStartIndexes; startIdx++) {
    const period = climateDataExtended.slice(startIdx, startIdx + growthPeriodInDays)

    const analysis = analyzeWeatherForCrop(period, cropConditions)
    const suitableRatio = analysis.suitableDaysCount / growthPeriodInDays

    if (suitableRatio > bestScore) {
      bestScore = suitableRatio
      bestStartDate = climateDataExtended[startIdx].date
    }
  }

  return {
    bestStartDate,
    bestScore,
  }
}

function findTopSowingDates(climateData, cropConditions, growthPeriodInDays, topN = 10) {
  const climateDataExtended = [...climateData, ...climateData.slice(0, growthPeriodInDays)]

  const possibleStartIndexes = climateData.length

  const results = []

  for (let startIdx = 0; startIdx < possibleStartIndexes; startIdx++) {
    const period = climateDataExtended.slice(startIdx, startIdx + growthPeriodInDays)

    const analysis = analyzeWeatherForCrop(period, cropConditions)
    const suitableRatio = analysis.suitableDaysCount / growthPeriodInDays

    results.push({
      startDate: climateDataExtended[startIdx].date,
      suitableRatio,
      irrigationDays: analysis.totalIrrigationDays,
      drainageDays: analysis.totalDrainageDays,
    })
  }

  results.sort((a, b) => b.suitableRatio - a.suitableRatio)

  let threshold = 0.999
  let filteredResults = []

  while (threshold >= 0.4) {
    filteredResults = results.filter((item) => item.suitableRatio >= threshold)

    if (filteredResults.length >= topN) {
      break
    }

    threshold -= 0.001
  }

  if (filteredResults.length < topN) {
    filteredResults = results.slice(0, Math.min(topN, results.length))
  }

  return filteredResults
}
