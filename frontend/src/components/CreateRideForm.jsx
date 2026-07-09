import { useState } from 'react'
import '../css/createRide.css'

const CATEGORY_CHOICES = ['campus', 'grocery', 'airport', 'other']

const initialForm = {
  title: '',
  destination: '',
  departure_time: '',
  category: CATEGORY_CHOICES[0],
  available_seats: 1,
  cost: '',
  description: '',
  round_trip: false,
}

function CreateRideForm() {
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm({ ...form, [e.target.name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const token = localStorage.getItem('supabaseToken')

    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...form,
          available_seats: Number(form.available_seats),
          cost: Number(form.cost),
        })
      })
      const data = await res.json()

      if (data.status === 'success') {
        alert('Ride posted!')
        setForm(initialForm)
      } else {
        setError(data.message || 'Could not post ride.')
      }
    } catch (err) {
      console.error('Error creating trip:', err)
      setError('Could not post ride.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <h2>Post a Ride</h2>
      <form onSubmit={handleSubmit}>
        <label>Title:</label>
        <input name="title" type="text" value={form.title} onChange={handleChange} required />

        <label>Destination:</label>
        <input name="destination" type="text" value={form.destination} onChange={handleChange} required />

        <label>Departure Time:</label>
        <input name="departure_time" type="datetime-local" value={form.departure_time} onChange={handleChange} required />

        <label>Category:</label>
        <select name="category" value={form.category} onChange={handleChange}>
          {CATEGORY_CHOICES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <label>Available Seats:</label>
        <input name="available_seats" type="number" min="1" value={form.available_seats} onChange={handleChange} required />

        <label>Cost:</label>
        <input name="cost" type="number" min="0" step="0.01" value={form.cost} onChange={handleChange} required />

        <label>Description:</label>
        <textarea name="description" value={form.description} onChange={handleChange} />

        <label>
          <input name="round_trip" type="checkbox" checked={form.round_trip} onChange={handleChange} />
          Round trip
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Posting...' : 'Post Ride'}
        </button>

        {error && <p className="create-ride__error">{error}</p>}
      </form>
    </>
  )
}

export default CreateRideForm
