import { httpService } from './http.service.js'

const ENDPOINT = 'field-operation'

export const operationService = {
  query,
  getById,
  save,
  remove,
}

// שליפת כל הפעולות
function query() {
  return httpService.get(ENDPOINT)
}

// שליפת פעולה לפי מזהה
function getById(operationId) {
  return httpService.get(`${ENDPOINT}/${operationId}`)
}

// הוספה או עדכון פעולה
function save(operation) {
  if (operation._id) {
    return httpService.put(`${ENDPOINT}/${operation._id}`, operation)
  } else {
    return httpService.post(ENDPOINT, operation)
  }
}

// מחיקת פעולה לפי מזהה
function remove(operationId) {
  return httpService.delete(`${ENDPOINT}/${operationId}`)
}
