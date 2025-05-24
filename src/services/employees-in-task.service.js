import { httpService } from './http.service'

const ENDPOINT = 'employees-in-tasks'

export const employeesInTaskService = {
  query,
  getById,
  add,
  update,
  remove,
}

// שליפת כל העובדים ששובצו למשימות
function query() {
  return httpService.get(ENDPOINT)
}

// שליפת שיבוץ לפי מזהה פנימי
function getById(id) {
  return httpService.get(`${ENDPOINT}/${id}`)
}

// הוספת שיבוץ עובד למשימה
function add(record) {
  return httpService.post(ENDPOINT, record)
}

// עדכון שיבוץ עובד למשימה
function update(record) {
  console.log(record)

  return httpService.put(`${ENDPOINT}/${record._id}`, record)
}

// מחיקת שיבוץ עובד ממשימה
function remove(id) {
  return httpService.delete(`${ENDPOINT}/${id}`)
}
