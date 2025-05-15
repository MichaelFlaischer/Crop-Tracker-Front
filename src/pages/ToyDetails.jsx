import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { Loader } from '../cmps/Loader'
import { ToyImg } from '../cmps/ToyImg'

import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service'
import { toyService } from '../services/toy.service'
import { Popup } from '../cmps/Popup'
import { Chat } from '../cmps/Chat'

export function ToyDetails() {
    const user = useSelector(storeState => storeState.userModule.loggedInUser)

    const [toy, setToy] = useState(null)
    const [isOpen, setIsOpen] = useState(false)
    const { toyId } = useParams()
    const navigate = useNavigate()

    useEffect(() => {
        window.addEventListener('keyup', handleIsOpen)
        return () => {
            window.removeEventListener('keyup', handleIsOpen)
        }
    }, [])

    useEffect(() => {
        loadToy()
    }, [toyId])

    function handleIsOpen({ key }) {
        if (key === 'Escape') setIsOpen(false)
    }

    async function loadToy() {
        try {
            const toy = await toyService.getById(toyId)
            setToy(toy)
        } catch (error) {
            console.log('Had issues in toy details', error)
            showErrorMsg('Cannot load toy')
            navigate('/toy')
        }
    }

    async function onSaveMsg(msg) {
        try {
          const savedMsg = await toyService.addMsg(toy._id, msg)
          setToy(prevToy => ({
            ...prevToy,
            msgs: [...(prevToy.msgs || []), savedMsg],
          }))
          showSuccessMsg('Message saved!')
        } catch (error) {
          showErrorMsg('Cannot save message')
        }
      }

    if (!toy) return <Loader />

    return (
        <section className="toy-details">
            <ToyImg toyName={toy.name} />
            <p>Toy name: <span>{toy.name}</span></p>
            <p>Toy price: <span>${toy.price}</span></p>
            {!!toy.labels?.length && (
                <p>Labels: <span>{toy.labels.join(' ,')}</span></p>
            )}
            <p className={toy.inStock ? 'green' : 'red'}>
                {toy.inStock ? 'In stock' : 'Not in stock'}
            </p>
            <div>
                <Link className="btn" to="/toy">Back</Link>
                <button 
                    className="btn" 
                    onClick={() => { setIsOpen(true) }}
                    disabled={!user}
                >
                    Chat
                </button>
            </div>
            {user && isOpen && (
                <Popup
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    heading="Lets chat!"
                    footing={<button className="btn" onClick={() => setIsOpen(false)}>Close</button>}
                >
                    <Chat msgs={toy.msgs || []} user={user} onSend={onSaveMsg} />
                </Popup>
            )}
        </section>
    )
}
