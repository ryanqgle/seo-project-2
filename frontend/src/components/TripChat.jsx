import { useState, useEffect } from 'react'
import { supabase } from '../dbConnection'
import { useAuth } from '../auth'
import { apiUrl } from '../api'

function TripChat({tripId, currUserId}){
    const { token } = useAuth()
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState("")

    useEffect(() => {
        if (!token) return

        fetch(apiUrl(`/api/trips/${tripId}/messages`), {
            headers: {'Authorization': `Bearer ${token}`}
        })
            .then(res => res.json())
            .then(data => setMessages(data))

        const chatChannel = supabase.channel(`chat_${tripId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'trip_messages',
                    filter: `trip_id=eq.${tripId}`
                },
                (payload) => {
                    setMessages((prev) => [...prev, payload.new])
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(chatChannel)
        }
    }, [tripId, token])

    const handleSendMessage = async (e) => {
        e.preventDefault()

        const response = await fetch(apiUrl(`/api/trips/${tripId}/messages`), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({text: newMessage})
        })

    setNewMessage('')
    }

    return(
        <div className="chat-container">
      <div className="message-history">
        {messages.map((msg) => (
          <div key={msg.id} className={msg.user_id === currUserId ? 'my-message' : 'their-message'}>
            <p>{msg.text}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSendMessage}>
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)} 
          placeholder="Say hello!" 
        />
        <button type="submit">Send</button>
      </form>
    </div>
  )
}

export default TripChat