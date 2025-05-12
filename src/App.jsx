import { useEffect, useState } from 'react'
import axios from 'axios'

function App() {
  const [comments, setComments] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    axios
      .get('http://localhost:3030/api/comments')
      .then((res) => setComments(res.data))
      .catch((err) => setError('⚠️ Failed to fetch comments - ', err))
  }, [])

  if (error) return <h2>{error}</h2>

  return (
    <div style={{ padding: '2rem' }}>
      <h1>תגובות מהמסד 🎬</h1>
      {comments.length === 0 ? (
        <p>טוען תגובות...</p>
      ) : (
        <ul>
          {comments.map((comment) => (
            <li key={comment._id} style={{ marginBottom: '1rem' }}>
              <strong>{comment.name}</strong> ({comment.email})<br />
              <em>{new Date(comment.date).toLocaleString()}</em>
              <br />
              <p>{comment.text}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default App
