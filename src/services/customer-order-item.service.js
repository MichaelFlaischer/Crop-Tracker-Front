import { httpService } from './http.service.js'

const BASE_URL = 'customer-order-item'

export const customerOrderItemService = {
  query,
  getById,
  queryByOrderId,
  queryByCropAndStatus,
  add,
  update,
  remove,
  removeByOrderId,
}

async function query() {
  return await httpService.get(BASE_URL)
}

async function getById(itemId) {
  return await httpService.get(`${BASE_URL}/${itemId}`)
}

async function queryByOrderId(orderId) {
  return await httpService.get(`${BASE_URL}/by-order/${orderId}`)
}

async function queryByCropAndStatus(cropId, status) {
  return await httpService.get(`${BASE_URL}/by-crop/${cropId}/status/${status}`)
}

async function add(item) {
  return await httpService.post(BASE_URL, item)
}

async function update(itemId, item) {
  return await httpService.put(`${BASE_URL}/${itemId}`, item)
}

async function remove(itemId) {
  return await httpService.delete(`${BASE_URL}/${itemId}`)
}

async function removeByOrderId(orderId) {
  return await httpService.delete(`${BASE_URL}/by-order/${orderId}`)
}
