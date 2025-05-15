import {
    AdvancedMarker,
    APIProvider,
    Map,
    Pin,
    useMap,
} from '@vis.gl/react-google-maps'
import React, { useEffect, useState } from 'react'
import logoUrl from '../assets/img/toys-favicon.png'

const API_KEY =
    import.meta.env.GOOGLE_MAP_API || 'AIzaSyD051H7dzgi09CB_LuUyUnF40rutHzSGd4'

const branches = [
    {
        city: 'Haifa',
        id: 101,
        position: {
            lat: 32.820789,
            lng: 34.963488,
        },
    },
    {
        city: 'Tel Aviv',
        id: 102,
        position: {
            lat: 32.071035,
            lng: 34.779118,
        },
    },
    {
        city: 'Jerusalem',
        id: 103,
        position: {
            lat: 31.773362,
            lng: 35.221193,
        },
    },
]

export function ToyMap() {
    return (
        <APIProvider apiKey={API_KEY}>
            <MapController />
        </APIProvider>
    )
}

// separate component that uses the map context
function MapController() {
    const [coords, setCoords] = useState(null)
    const [selectedBranch, setSelectedBranch] = useState(null)

    const map = useMap()

    useEffect(() => {
        if (map && selectedBranch) {
            map.panTo(selectedBranch.position)
            map.setZoom(12)
        }
    }, [map, selectedBranch])

    function handleClick({ map, detail }) {
        map.panTo(detail.latLng)
        setCoords(detail.latLng)
    }

    return (
        <>
            {branches.map(branch => (
                <button
                    className="btn"
                    key={branch.city}
                    onClick={() => setSelectedBranch(branch)}
                >
                    {branch.city}
                </button>
            ))}

            <div className="toy-map" style={{ height: '58vh', width: '100%' }}>
                <Map
                    defaultCenter={{ lat: 32.0853, lng: 34.7818 }}
                    defaultZoom={8}
                    onClick={handleClick}
                    disableDefaultUI={true}
                    mapId="DEMO_MAP_ID"
                >
                    {branches.map(branch => (
                        <AdvancedMarker
                            position={branch.position}
                            key={branch.id}
                        >
                            <Marker />
                        </AdvancedMarker>
                    ))}
                    {coords && (
                        <AdvancedMarker position={coords}>
                            <Pin
                                background={'dodgerblue'}
                                glyphColor={'hotpink'}
                                borderColor={'black'}
                            />
                        </AdvancedMarker>
                    )}
                </Map>
            </div>
        </>
    )
}

function Marker() {
    return (
        <div className="branch-img">
            <img src={logoUrl} alt="Branch logo" />
        </div>
    )
}
