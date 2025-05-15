import { Link } from 'react-router-dom'
import { ToyImg } from './ToyImg'

export function ToyPreview({ toy }) {
    return (
        <Link to={`/toy/${toy._id}`}>
            <article className="toy-preview flex flex-column align-center">
                <h2 className="toy-name">{toy.name}</h2>
                <ToyImg toyName={toy.name} />
                <p>Price: ${toy.price}</p>
                <p className={toy.inStock ? 'green' : 'red'}>
                    {toy.inStock ? 'In stock' : 'Not in stock'}
                </p>
            </article>
        </Link>
    )
}
