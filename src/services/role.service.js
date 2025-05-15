import { httpService } from './http.service' // או axios לפי מה שאתה משתמש

export const roleService = {
  query,
  getById,
  remove,
  save,
}

const BASE_URL = 'role'

function query() {
  return httpService.get(BASE_URL)
}

function getById(roleId) {
  return httpService.get(`${BASE_URL}/${roleId}`)
}

function remove(roleId) {
  return httpService.delete(`${BASE_URL}/${roleId}`)
}

function save(role) {
  if (role._id) {
    return httpService.put(`${BASE_URL}/${role._id}`, role)
  } else {
    return httpService.post(BASE_URL, role)
  }
}
