import { httpService } from './http.service'

export const taskService = {
  query,
  getById,
  add,
  update,
  remove,
}

const BASE_URL = 'task'

async function query() {
  return await httpService.get(BASE_URL)
}

async function getById(id) {
  return await httpService.get(`${BASE_URL}/${id}`)
}

async function add(task) {
  return await httpService.post(BASE_URL, task)
}

async function update(id, task) {
  return await httpService.put(`${BASE_URL}/${id}`, task)
}

async function remove(id) {
  return await httpService.delete(`${BASE_URL}/${id}`)
}
