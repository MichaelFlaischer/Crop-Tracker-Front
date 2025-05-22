import { httpService } from './http.service'

const ENDPOINT = 'crop'

export const cropService = {
  query,
  getById,
  save,
  remove,
}

// שליפת רשימת יבולים
function query() {
  return httpService.get(ENDPOINT)
}

// שליפת יבול לפי מזהה
function getById(cropId) {
  return httpService.get(`${ENDPOINT}/${cropId}`)
}

// שמירה: עדכון או יצירה של יבול
function save(crop) {
  const id = crop._id
  if (id) {
    return httpService.put(`${ENDPOINT}/${id}`, crop)
  }
  return httpService.post(ENDPOINT, crop)
}

// מחיקת יבול לפי מזהה
function remove(cropId) {
  return httpService.delete(`${ENDPOINT}/${cropId}`)
}
