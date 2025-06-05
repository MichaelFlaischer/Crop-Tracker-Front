import { httpService } from './http.service'

const ENDPOINT = 'seasons'

export const seasonService = {
  query,
  getById,
  save,
}

function query() {
  return httpService.get(ENDPOINT)
}

function getById(seasonId) {
  return httpService.get(`${ENDPOINT}/${seasonId}`)
}

function save(season) {
  return httpService.put(`${ENDPOINT}/${season._id}`, season)
}
