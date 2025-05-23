import { httpService } from './http.service.js'

const ENDPOINT = 'warehouse'

export const warehouseService = {
  query,
  getById,
  save,
  remove,
}

async function query() {
  return await httpService.get(ENDPOINT)
}

async function getById(id) {
  return await httpService.get(`${ENDPOINT}/${id}`)
}

async function save(warehouse) {
  if (warehouse._id) {
    return await httpService.put(`${ENDPOINT}/${warehouse._id}`, warehouse)
  } else {
    return await httpService.post(ENDPOINT, warehouse)
  }
}

async function remove(id) {
  return await httpService.delete(`${ENDPOINT}/${id}`)
}
