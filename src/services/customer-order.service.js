import { httpService } from './http.service.js'

const BASE_URL = 'customer-order'

export const customerOrderService = {
  query,
  getById,
  queryByCustomer,
  add,
  update,
  remove,
}

async function query() {
  return await httpService.get(BASE_URL)
}

async function getById(orderId) {
  return await httpService.get(`${BASE_URL}/${orderId}`)
}

async function queryByCustomer(customerId) {
  return await httpService.get(`${BASE_URL}/by-customer/${customerId}`)
}

async function add(order) {
  return await httpService.post(BASE_URL, order)
}

async function update(orderId, order) {
  return await httpService.put(`${BASE_URL}/${orderId}`, order)
}

async function remove(orderId) {
  return await httpService.delete(`${BASE_URL}/${orderId}`)
}
