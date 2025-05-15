import { toyService } from '../../services/toy.service'
import {
    ADD_TOY,
    REMOVE_TOY,
    SET_FILTER_BY,
    SET_IS_LOADING,
    SET_MAX_PAGE,
    SET_TOYS,
    TOY_UNDO,
    UPDATE_TOY,
} from '../reducers/toy.reducer'
import { store } from '../store'

export async function loadToys() {
    const { filterBy } = store.getState().toyModule

    try {
        store.dispatch({ type: SET_IS_LOADING, isLoading: true })
        const { toys, maxPage } = await toyService.query(filterBy)
        store.dispatch({ type: SET_TOYS, toys })
        store.dispatch({ type: SET_MAX_PAGE, maxPage })
    } catch (error) {
        console.log('toy action -> Cannot load toys')
        throw error
    } finally {
        setTimeout(() => {
            store.dispatch({ type: SET_IS_LOADING, isLoading: false })
        }, 350)
    }
}

export async function removeToy(toyId) {
    try {
        await toyService.remove(toyId)
        store.dispatch({ type: REMOVE_TOY, toyId })
    } catch (error) {
        console.log('toy action -> Cannot remove toy', error)
        throw error
    }
}

export async function removeToyOptimistic(toyId) {
    try {
        store.dispatch({ type: REMOVE_TOY, toyId })
        await toyService.remove(toyId)
    } catch (error) {
        store.dispatch({ type: TOY_UNDO })
        console.log('toy action -> Cannot remove toy', error)
        throw error
    }
}

export async function saveToy(toy) {
    try {
        const type = toy._id ? UPDATE_TOY : ADD_TOY
        const toyToSave = await toyService.save(toy)
        store.dispatch({ type, toy: toyToSave })
        return toyToSave
    } catch (error) {
        console.log('toy action -> Cannot save toy', error)
        throw error
    }
}

export function setFilter(filterBy = toyService.getDefaultFilter()) {
    store.dispatch({ type: SET_FILTER_BY, filterBy })
}
