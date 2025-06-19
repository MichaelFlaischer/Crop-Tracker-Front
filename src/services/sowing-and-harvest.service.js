import { httpService } from './http.service.js'

const BASE_URL = 'sowing-and-harvest'

export const sowingAndHarvestService = {
  query,
  getById,
  add,
  update,
  remove,
  addHarvestLog,
}

async function query() {
  return await httpService.get(BASE_URL)
}

async function getById(id) {
  return await httpService.get(`${BASE_URL}/${id}`)
}

async function add(data) {
  const cleanedData = {
    ...data,
  }
  return await httpService.post(BASE_URL, cleanedData)
}

async function update(id, data) {
  const cleanedData = {
    ...data,
  }
  return await httpService.put(`${BASE_URL}/${id}`, cleanedData)
}

async function remove(id) {
  return await httpService.delete(`${BASE_URL}/${id}`)
}

async function addHarvestLog(id, log) {
  const cleanedLog = {
    ...log,
  }
  return await httpService.post(`${BASE_URL}/${id}/harvest-log`, cleanedLog)
}
