// app/reset-password.tsx
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as Linking from 'expo-linking'
import { Stack, useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React, { useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { supabase } from '../lib/supabaseClient'

export default function ResetPasswordScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleResetPassword = async () => {
    const cleanEmail = email.trim()

    if (!cleanEmail) {
      Alert.alert('Error', 'Please enter your email address')
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(cleanEmail)) {
      Alert.alert('Error', 'Please enter a valid email address')
      return
    }

    setIsLoading(true)

    try {
      // IMPORTANT: Works in Expo Go + Dev Builds
      const redirectTo = Linking.createURL('reset')
      console.log('RESET redirectTo:', redirectTo)

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo,
      })

      if (error) {
        Alert.alert('Error', error.message)
        return
      }

      setEmailSent(true)
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoBack = () => router.back()
  const handleGoToSignIn = () => router.push('/auth')

  return (
    <>
      <StatusBar style="light" />
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.container}>
        <LinearGradient
          colors={['#0F0C29', '#1a1a4e', '#24243e']}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Decorative orbs (ignore touches) */}
        <View pointerEvents="none" style={styles.orb1} />
        <View pointerEvents="none" style={styles.orb2} />
        <View pointerEvents="none" style={styles.orb3} />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
          >
            {/* Back Button */}
            <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
              <Feather name="arrow-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Header Section */}
            <View style={styles.header}>
              <LinearGradient
                colors={['#7F7FD5', '#86A8E7', '#91EAE4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconContainer}
              >
                <Feather name="lock" size={32} color="#fff" />
              </LinearGradient>

              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>
                {emailSent
                  ? "We've sent you an email with instructions to reset your password."
                  : "Enter your email address and we'll send you instructions to reset your password."}
              </Text>
            </View>

            {/* Main Content */}
            {!emailSent ? (
              <View style={styles.form}>
                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <Feather
                    name="mail"
                    size={18}
                    color="rgba(255,255,255,0.4)"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email address"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    value={email}
                    onChangeText={setEmail}
                    editable={!isLoading}
                    returnKeyType="send"
                    onSubmitEditing={handleResetPassword}
                  />
                </View>

                {/* Reset Button */}
                <TouchableOpacity
                  style={[styles.resetButton, isLoading && styles.resetButtonDisabled]}
                  onPress={handleResetPassword}
                  disabled={isLoading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={isLoading ? ['#444', '#444'] : ['#7F7FD5', '#86A8E7', '#91EAE4']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.resetButtonGradient}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.resetButtonText}>Send Reset Instructions →</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.successContainer}>
                <LinearGradient
                  colors={['rgba(127,127,213,0.4)', 'rgba(145,234,228,0.3)']}
                  style={styles.successIcon}
                >
                  <Feather name="check" size={36} color="#91EAE4" />
                </LinearGradient>

                <Text style={styles.successText}>Check your email</Text>
                <Text style={styles.successSubtext}>We sent reset instructions to</Text>
                <Text style={styles.emailText}>{email.trim()}</Text>

                <TouchableOpacity
                  onPress={() => {
                    setEmailSent(false)
                    setEmail('')
                  }}
                  style={{ marginTop: 18 }}
                >
                  <Text style={[styles.helpText, { color: '#91EAE4', textDecorationLine: 'none' }]}>
                    Send again
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Remember your password?</Text>
              <TouchableOpacity onPress={handleGoToSignIn}>
                <Text style={styles.signInText}>Sign In</Text>
              </TouchableOpacity>
            </View>

            {/* Additional Help */}
            <TouchableOpacity style={styles.helpLink}>
              <Text style={styles.helpText}>Need help? Contact support</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0C29',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },

  // Orbs
  orb1: {
    position: 'absolute',
    top: -60,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#7F7FD5',
    opacity: 0.18,
  },
  orb2: {
    position: 'absolute',
    top: '40%',
    right: -80,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#86A8E7',
    opacity: 0.13,
  },
  orb3: {
    position: 'absolute',
    bottom: 60,
    left: '20%',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#91EAE4',
    opacity: 0.1,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#86A8E7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  form: {
    width: '100%',
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    height: '100%',
  },
  resetButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#86A8E7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  resetButtonDisabled: {
    opacity: 0.6,
  },
  resetButtonGradient: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(145,234,228,0.25)',
  },
  successText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  successSubtext: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  emailText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#91EAE4',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.4)',
    marginRight: 4,
  },
  signInText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFE66D',
  },
  helpLink: {
    alignItems: 'center',
    marginTop: 8,
  },
  helpText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.25)',
    textDecorationLine: 'underline',
  },
})
