import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cropService } from '../services/crop.service.js'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service.js'

export function CropIndex() {
  const [crops, setCrops] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadCrops()
  }, [])

  async function loadCrops() {
    setIsLoading(true)
    try {
      const crops = await cropService.query()
      setCrops(crops)
    } catch (err) {
      console.error('שגיאה בטעינת יבולים', err)
      showErrorMsg('אירעה שגיאה בטעינת היבולים')
    } finally {
      setIsLoading(false)
    }
  }

  function onViewDetails(cropId) {
    navigate(`/crop/${cropId}`)
  }

  function onEditCrop(cropId) {
    navigate(`/crop/edit/${cropId}`)
  }

  async function onDeleteCrop(cropId) {
    const crop = crops.find((c) => c._id === cropId)
    const confirmMsg = `האם אתה בטוח שברצונך למחוק את היבול "${crop?.cropName}"?\nפעולה זו אינה הפיכה.`
    const isConfirmed = window.confirm(confirmMsg)
    if (!isConfirmed) return

    try {
      await cropService.remove(cropId)
      showSuccessMsg(`היבול "${crop?.cropName}" נמחק בהצלחה`)
      setCrops((prev) => prev.filter((crop) => crop._id !== cropId))
    } catch (err) {
      console.error('שגיאה במחיקת יבול', err)
      showErrorMsg('שגיאה במחיקת יבול')
    }
  }

  function onAddCrop() {
    navigate('/crop/add')
  }

  if (isLoading) return <div className='loader'>טוען יבולים...</div>

  return (
    <section className='crop-index main-layout'>
      <h1>רשימת יבולים</h1>
      <button className='btn-add' onClick={onAddCrop}>
        ➕ הוספת יבול חדש
      </button>

      {crops.length === 0 ? (
        <p>לא נמצאו יבולים.</p>
      ) : (
        <table className='crop-table'>
          <thead>
            <tr>
              <th>שם היבול</th>
              <th>תיאור</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {crops.map((crop) => (
              <tr key={crop._id}>
                <td>{crop.cropName}</td>
                <td>{crop.description}</td>
                <td className='actions'>
                  <button onClick={() => onViewDetails(crop._id)}>צפייה</button>
                  <button onClick={() => onEditCrop(crop._id)}>עריכה</button>
                  <button className='danger' onClick={() => onDeleteCrop(crop._id)}>
                    מחיקה
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
