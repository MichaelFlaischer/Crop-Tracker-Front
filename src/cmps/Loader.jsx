import React from 'react'

import sproutIcon from '../assets/img/crop-refresh-spinner.png'
import waterIcon from '../assets/img/icon-water.png'
import leafIcon from '../assets/img/icon-leaf.png'
import { FaLeaf } from 'react-icons/fa'

export function Loader() {
  return (
    <div className="loader-fullscreen-wrapper">
      <div className="loader-orbit-container">
        <div className="loader-orbit">
          <img className="center-icon" src={sproutIcon} alt="Loading..." />
          <img className="orbit-icon icon1" src={waterIcon} alt="Water" />
          <img className="orbit-icon icon2" src={leafIcon} alt="Leaf" />
        </div>
        <p className="loading-text">
          <FaLeaf className="loader-icon" />
          טוען נתונים מהחווה
        </p>
      </div>
    </div>
  )
}

