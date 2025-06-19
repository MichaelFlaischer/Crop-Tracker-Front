import { httpService } from './http.service'

export const userService = {
  login,
  signup,
  logout,
  getLoggedInUser,
  getEmptyCredentials,
  query,
  getById,
  update,
  add,
  remove,
}

const BASE_URL = 'auth/'
const STORAGE_KEY = 'loggedinUser'

async function login({ username, password }) {
  try {
    const user = await httpService.post(BASE_URL + 'login', {
      username,
      password,
    })
    _setLoggedInUser(user)
    return user
  } catch (error) {
    console.log('Could not login')
    throw error
  }
}

async function signup(credentials) {
  try {
    const user = await httpService.post(BASE_URL + 'signup', credentials)
    _setLoggedInUser(user)
    return user
  } catch (error) {
    console.log('Could not signup')
    throw error
  }
}

async function logout() {
  try {
    await httpService.post(BASE_URL + 'logout')
    sessionStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.log('Could not logout')
    throw error
  }
}

function getLoggedInUser() {
  const entity = sessionStorage.getItem(STORAGE_KEY)
  return JSON.parse(entity)
}

function getEmptyCredentials() {
  return {
    username: '',
    password: '',
    fullName: '',
  }
}

function _setLoggedInUser(user) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}

async function query() {
  try {
    return await httpService.get('user')
  } catch (err) {
    console.log('Could not load users')
    throw err
  }
}

async function getById(userId) {
  try {
    return await httpService.get(`user/${userId}`)
  } catch (err) {
    console.log('Could not load user by ID')
    throw err
  }
}

async function update(user) {
  try {
    return await httpService.put(`user/${user._id}`, user)
  } catch (err) {
    console.log('Could not update user')
    throw err
  }
}

async function add(user) {
  try {
    return await httpService.post('user', user)
  } catch (err) {
    console.log('Could not add user')
    throw err
  }
}

async function remove(userId) {
  try {
    return await httpService.delete(`user/${userId}`)
  } catch (err) {
    console.log('Could not delete user', err)
    throw err
  }
}
