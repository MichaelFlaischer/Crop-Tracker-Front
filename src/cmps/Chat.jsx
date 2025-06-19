import { useState } from 'react'

export function Chat({ msgs, user, onSend }) {
  const [input, setInput] = useState({ txt: '' })

  function handleMsgChange(ev) {
    const { name: field, value } = ev.target
    setInput((msg) => ({ ...msg, [field]: value }))
  }

  function sendMsg() {
    const trimmed = input.txt.trim()
    if (!trimmed) return
    onSend(input)
    setInput({ txt: '' })
  }

  return (
    <div className='chat-container'>
      <div className='chat-msgs'>
        {msgs.map((msg) => {
          const isUser = msg.by._id === user._id
          const position = isUser ? 'user' : 'other'

          return (
            <div key={msg.id} className={`chat-msg ${position}`}>
              <strong>{msg.by.fullName === user.fullName ? 'Me' : msg.by.fullName}: </strong>
              {msg.txt}
            </div>
          )
        })}
      </div>
      <div className='chat-input'>
        <input
          type='text'
          value={input.txt}
          name='txt'
          onChange={handleMsgChange}
          placeholder='Type a message...'
          onKeyDown={(ev) => ev.key === 'Enter' && sendMsg()}
        />
        <button className='btn' onClick={sendMsg}>
          Send
        </button>
      </div>
    </div>
  )
}
