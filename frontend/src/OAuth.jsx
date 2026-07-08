import { supabase } from './dbConnection'

export default function OAuth(){
    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google'
        })

        if (error) console.error("Error logging in:", error.message)
    }

    return(
        <button onClick={handleGoogleLogin}>Sign in with Student Account</button>
    )
    
}