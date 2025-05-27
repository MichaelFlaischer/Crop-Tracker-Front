import { httpService } from './http.service.js'

const BASE_URL = 'customer'

export const clientService = {
  query,
  getById,
  add,
  update,
  remove,
}

async function query() {
  return await httpService.get(BASE_URL)
}

async function getById(clientId) {
  return await httpService.get(`${BASE_URL}/${clientId}`)
}

async function add(client) {
  return await httpService.post(BASE_URL, client)
}

async function update(clientId, client) {
  return await httpService.put(`${BASE_URL}/${clientId}`, client)
}

async function remove(clientId) {
  return await httpService.delete(`${BASE_URL}/${clientId}`)
}
