export const weatherSimulationService = {
  fetchYearlyClimate,
}

async function fetchYearlyClimate(latitude, longitude) {
  const daysInYear = 365
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - daysInYear)

  const requests = []

  for (let i = 0; i < 12; i++) {
    const chunkStartDate = new Date(startDate)
    chunkStartDate.setMonth(startDate.getMonth() + i)
    const chunkEndDate = new Date(chunkStartDate)
    chunkEndDate.setDate(chunkStartDate.getDate() + 29)
    const startStr = chunkStartDate.toISOString().split('T')[0]
    const endStr = chunkEndDate.toISOString().split('T')[0]

    const url = `https://archive-api.open-meteo.com/v1/era5?latitude=${latitude}&longitude=${longitude}&start_date=${startStr}&end_date=${endStr}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Asia/Jerusalem`

    requests.push(fetch(url).then((res) => res.json()))
  }

  try {
    const responses = await Promise.all(requests)

    const allData = []

    for (const res of responses) {
      if (!res.daily) continue

      const dates = res.daily.time
      const tempsMax = res.daily.temperature_2m_max
      const tempsMin = res.daily.temperature_2m_min
      const precipitation = res.daily.precipitation_sum

      for (let i = 0; i < dates.length; i++) {
        allData.push({
          date: dates[i],
          tempMax: tempsMax[i],
          tempMin: tempsMin[i],
          precipitation: precipitation[i],
        })
      }
    }

    allData.sort((a, b) => new Date(a.date) - new Date(b.date))

    return allData
  } catch (err) {
    console.error('Error fetching yearly climate data:', err)
    throw err
  }
}
