import { useState, useEffect } from 'react'

export default function UserProfile() {
    const [profile, setProfile] = useState({
        first_name: '',
        last_name: '',
        role: '',
        profile_picture: ''
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem('supabaseToken')
            if (!token) return

            try {
                const res = await fetch('http://127.0.0.1:5000/api/profile', {
                  headers: { 'Authorization': `Bearer ${token}` }
                })
                const data = await res.json()

                if (data.status === 'success') {
                    setProfile(data.profile)
                }
            } catch (err) {
                console.error('Error fetching profile:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchProfile()
    }, [])

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)
        const token = localStorage.getItem('supabaseToken')

        try {
            const res = await fetch('http://127.0.0.1:5000/api/profile', {
             method: 'PUT',
             headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
             },
             body: JSON.stringify(profile)
            });
            const data = await res.json()

            if (data.status === 'success') {
                alert('Profile updated successfully!')
                setProfile(data.profile)
            }
        } catch (err) {
            console.error('Error updating profile:', err)
        } finally {
            setSaving(false)
        }
    }

    const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    if (loading) return <p>Loading profile...</p>

    return (
        <>
        <h2>Edit Profile</h2>
        <form onSubmit={handleSave}>
            <label>First Name:</label>
            <input
                name="first_name"
                type="text"
                value={profile.first_name || ''}
                onChange={handleChange}
            />

            <label>Last Name:</label>
            <input
                name="last_name"
                type="text"
                value={profile.last_name || ''}
                onChange={handleChange}
            />

            <label>Role:</label>
            <select
                name="role"
                value={profile.role || ''}
                onChange={handleChange}
            >
                <option value="">Select a role</option>
                <option value="driver">Driver</option>
                <option value="passenger">Passenger</option>
            </select>

            <label>Profile Picture URL:</label>
            <input
                name="profile_picture"
                type="text"
                value={profile.profile_picture || ''}
                onChange={handleChange}
            />

            <label>School:</label>
            <input
                name="school"
                type="text"
                value={profile.school || ''}
                onChange={handleChange}
            />

            <button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
            </button>
        </form>
    </>
    )
}
