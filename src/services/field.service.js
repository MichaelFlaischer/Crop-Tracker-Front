import { httpService } from './http.service.js'

const FIELD_API = 'field/'

export const fieldService = {
  query,
  getById,
  save,
  remove,
}

function query() {
  return httpService.get(FIELD_API)
}

function getById(id) {
  return httpService.get(FIELD_API + id)
}

function save(field) {
  if (field._id) {
    return httpService.put(FIELD_API + field._id, field)
  } else {
    return httpService.post(FIELD_API, field)
  }
}

function remove(id) {
  return httpService.delete(FIELD_API + id)
}
