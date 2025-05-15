import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { ToyPreview } from './ToyPreview'

export function ToyList({ toys, onRemoveToy, loggedInUser }) {
    return (
        <section className="toy-list">
            {!toys.length ? (
                <h1 style={{ alignSelf: 'center' }}>It's empty here...</h1>
            ) : (
                <ul>
                    {toys.map(toy => (
                        <li key={toy._id}>
                            <ToyPreview toy={toy} />
                            {loggedInUser?.isAdmin && <div className="flex justify-center">
                                <Link className="btn" to={`/toy/edit/${toy._id}`}>
                                    Edit
                                </Link>
                                <button className="btn" onClick={() => onRemoveToy(toy._id)}>
                                    Remove
                                </button>
                            </div>}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    )
}

ToyList.propTypes = {
    toys: PropTypes.arrayOf(
        PropTypes.shape({
            _id: PropTypes.string,
            name: PropTypes.string,
            price: PropTypes.number,
            inStock: PropTypes.bool,
            createdAt: PropTypes.number,
            labels: PropTypes.arrayOf(PropTypes.string),
        })
    ),
    onRemoveToy: PropTypes.func.isRequired,
}
