import { useState, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { View, Text, TextInput, Button, Alert } from 'react-native'
import { supabase } from '../lib/supabaseClient'

export default function AuthScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sessionEmail, setSessionEmail] = useState<string | null>(null)


useEffect(() => {
  // load current session
  supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
    setSessionEmail(data.session?.user?.email ?? null)
  })

  // listen for changes
  const { data: authListener } = supabase.auth.onAuthStateChange(
    (_event: string, session: Session | null) => {
      setSessionEmail(session?.user?.email ?? null)
    }
  )

  return () => {
    authListener.subscription.unsubscribe()
  }
}, [])

  const signUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) return Alert.alert('Sign up error', error.message)
    Alert.alert('Check your email', 'Confirm your email to finish sign up (if enabled).')
  }

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return Alert.alert('Login error', error.message)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <View style={{ padding: 20, gap: 10 }}>
      <Text style={{ fontSize: 22, fontWeight: '600' }}>Supabase Auth</Text>

      {sessionEmail ? (
        <>
          <Text>Logged in as: {sessionEmail}</Text>
          <Button title="Logout" onPress={signOut} />
        </>
      ) : (
        <>
          <TextInput
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
          />
          <TextInput
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
          />

          <Button title="Sign Up" onPress={signUp} />
          <Button title="Login" onPress={signIn} />
        </>
      )}
    </View>
  )
}
