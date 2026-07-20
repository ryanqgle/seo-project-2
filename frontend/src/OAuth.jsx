import { supabase } from './dbConnection'

export default function OAuth(){
    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google'
        })

        if (error) console.error("Error logging in:", error.message)
    }

    const handleMicrosoftLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'azure'
        });

        if (error) {
        console.error('Error logging in with Microsoft:', error.message);
        }
    };

    return(
        <>
        <button onClick={handleGoogleLogin}>Sign in with Google</button>
        <button onClick={handleMicrosoftLogin}>Sign in with Microsoft</button>
        </>
    )

}