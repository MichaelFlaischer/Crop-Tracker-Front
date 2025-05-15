import { httpService } from './http.service'

const BASE_URL = 'toy/'

export const toyService = {
    query,
    getById,
    save,
    remove,
    getEmptyToy,
    getDefaultFilter,
    getToyLabels,
    getLabelCounts,
    addMsg,
    removeMsg,
}

const labels = [
    'On wheels',
    'Box game',
    'Art',
    'Baby',
    'Doll',
    'Puzzle',
    'Outdoor',
    'Battery Powered',
]

async function query(filterBy = {}) {
    return httpService.get(BASE_URL, filterBy)
}

async function getById(toyId) {
    return httpService.get(BASE_URL + toyId)
}

async function remove(toyId) {
    return httpService.delete(BASE_URL + toyId)
}

async function save(toy) {
    const BASE_URL = toy._id ? `toy/${toy._id}` : 'toy/'
    const method = toy._id ? 'put' : 'post'
    return httpService[method](BASE_URL, toy)
}

async function addMsg(toyId, msg) {
    return httpService.post(BASE_URL + `${toyId}/msg`, msg)
}

async function removeMsg(toyId, msgId) {
    return httpService.delete(BASE_URL + `${toyId}/msg/${msgId}`)
}

function getDefaultFilter() {
    return {
        txt: '',
        inStock: null,
        labels: [],
        pageIdx: 0,
        sortBy: { type: '', sortDir: 1 },
    }
}

function getEmptyToy() {
    return {
        name: '',
        price: '',
        labels: _getRandomLabels(),
    }
}

function getToyLabels() {
    return [...labels]
}

function _getRandomLabels() {
    const labelsCopy = [...labels]
    const randomLabels = []
    for (let i = 0; i < 2; i++) {
        const randomIdx = Math.floor(Math.random() * labelsCopy.length)
        randomLabels.push(labelsCopy.splice(randomIdx, 1)[0])
    }
    return randomLabels
}

async function getLabelCounts() {
    try {
        const { toys } = await query({ fetchAll: true })
        const labelCounts = {}
        toys.forEach(toy => {
            toy.labels.forEach(label => {
                if (labelCounts[label]) {
                    labelCounts[label]++
                } else {
                    labelCounts[label] = 1
                }
            })
        })
        const labelCountArray = Object.entries(labelCounts).map(
            ([label, count]) => ({
                label,
                count,
            })
        )
        return labelCountArray
    } catch (error) {
        console.log('Could not get label count', error)
    }
}
