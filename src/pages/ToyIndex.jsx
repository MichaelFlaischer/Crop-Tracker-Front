import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { Loader } from '../cmps/Loader'
import { PaginationButtons } from '../cmps/PaginationButtons'
import { ToyFilter } from '../cmps/ToyFilter'
import { ToyList } from '../cmps/ToyList'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service'

import {
    loadToys,
    removeToyOptimistic,
    setFilter,
} from '../store/actions/toy.actions'

export function ToyIndex() {
    const toys = useSelector(storeState => storeState.toyModule.toys)
    const user = useSelector(storeState => storeState.userModule.loggedInUser)
    const filterBy = useSelector(storeState => storeState.toyModule.filterBy)
    const maxPage = useSelector(storeState => storeState.toyModule.maxPage)
    const isLoading = useSelector(
        storeState => storeState.toyModule.flag.isLoading
    )

    useEffect(() => {
        fetchToys()
    }, [filterBy])

    async function fetchToys() {
        try {
            await loadToys()
        } catch (error) {
            showErrorMsg('Cannot load toys')
        }
    }

    async function onRemoveToy(toyId) {
        try {
            await removeToyOptimistic(toyId)
            loadToys()
            showSuccessMsg('Toy removed')
        } catch (error) {
            console.log('Cannot remove toy', error)
            showErrorMsg('Cannot remove toy')
        }
    }

    function onSetFilter(filterBy) {
        setFilter(filterBy)
    }

    function onChangePageIdx(diff) {
        let newPageIdx = +filterBy.pageIdx + diff
        if (newPageIdx < 0) newPageIdx = maxPage - 1
        if (newPageIdx >= maxPage) newPageIdx = 0
        onSetFilter({ pageIdx: newPageIdx })
    }

    return (
        <section className="toy-index">
            <ToyFilter filterBy={filterBy} onSetFilter={onSetFilter} />
            {user && user.isAdmin && (
                <Link
                    className="btn"
                    to="/toy/edit"
                    style={{ alignSelf: 'center' }}
                >
                    Add Toy
                </Link>
            )}
            {isLoading && <Loader />}
            {!isLoading && (
                <ToyList
                    toys={toys}
                    onRemoveToy={onRemoveToy}
                    loggedInUser={user}
                />
            )}
            {!!toys.length && maxPage > 1 && (
                <PaginationButtons
                    pageIdx={filterBy.pageIdx}
                    onChangePageIdx={onChangePageIdx}
                />
            )}
        </section>
    )
}
