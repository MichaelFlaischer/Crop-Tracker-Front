import { useState } from 'react'

export function ToyImg({ toyName }) {
    const [isImgLoading, setImgLoading] = useState(true)

    function handleImageLoad() {
        setImgLoading(false)
    }

    return (
        <>
            {isImgLoading && <div className="skeleton-loader"></div>}
            <div className="img-container">
                <img
                    src={`https://robohash.org/${toyName}?set=set1`}
                    alt={toyName}
                    onLoad={handleImageLoad}
                    style={{ display: isImgLoading ? 'none' : 'block' }}
                />
            </div>
        </>
    )
}
