import type { Session } from '@supabase/supabase-js'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { supabase } from '../lib/supabaseClient'

const { width, height } = Dimensions.get('window')

export default function AuthScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sessionEmail, setSessionEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Animation values — untouched
  const [monkeyPosition] = useState(new Animated.Value(0))
  const [eyeAnimation] = useState(new Animated.Value(0))
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current
  const scaleAnim = useRef(new Animated.Value(0.9)).current
  const titleSlideAnim = useRef(new Animated.Value(-50)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.timing(titleSlideAnim, { toValue: 0, duration: 600, useNativeDriver: true, easing: Easing.out(Easing.back(1.5)) }),
    ]).start()

    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      setSessionEmail(data.session?.user?.email ?? null)
    })
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => { setSessionEmail(session?.user?.email ?? null) }
    )
    return () => { authListener.subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    Animated.sequence([
      Animated.timing(monkeyPosition, { toValue: showPassword ? -10 : 10, duration: 300, useNativeDriver: true, easing: Easing.elastic(1) }),
      Animated.timing(monkeyPosition, { toValue: 0, duration: 200, useNativeDriver: true, easing: Easing.bounce }),
    ]).start()
    Animated.timing(eyeAnimation, { toValue: showPassword ? 1 : 0, duration: 300, useNativeDriver: true }).start()
  }, [showPassword])

  const validateInputs = () => {
    if (!email || !password) { Alert.alert('Oops!', 'Please fill in all fields'); return false }
    if (password.length < 6) { Alert.alert('Uh oh!', 'Password must be at least 6 characters'); return false }
    return true
  }

  const signIn = async () => {
    if (!validateInputs()) return
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) return Alert.alert('Login error', error.message)
    router.replace('/(tabs)')
  }

  const signOut = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    setLoading(false)
  }

  const navigateToSignUp = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 300, useNativeDriver: true }),
    ]).start(() => { router.push('/signup') })
  }

  const togglePasswordVisibility = () => { setShowPassword(!showPassword) }

  // ── Logged-in state ──────────────────────────────────────────
  if (sessionEmail) {
    return (
      <View style={styles.root}>
        <LinearGradient colors={['#0F0C29', '#1a1a4e', '#24243e']} style={StyleSheet.absoluteFillObject} />
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="light-content" />
          <View style={styles.loggedInContent}>
            <Animated.View style={[styles.successIcon, { transform: [{ translateY: monkeyPosition }] }]}>
            </Animated.View>
            <Text style={styles.loggedInTitle}>Welcome Back! 🎉</Text>
            <Text style={styles.loggedInEmail}>{sessionEmail}</Text>
            <TouchableOpacity style={styles.logoutButton} onPress={signOut} disabled={loading}>
              <LinearGradient colors={['#7F7FD5', '#86A8E7', '#91EAE4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientButton}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign Out 👋</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    )
  }

  // ── Login state ──────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <LinearGradient colors={['#0F0C29', '#1a1a4e', '#24243e']} style={StyleSheet.absoluteFillObject} />

      {/* Decorative orbs — purely visual */}
      <View pointerEvents="none" style={styles.orb1} />
      <View pointerEvents="none" style={styles.orb2} />
      <View pointerEvents="none" style={styles.orb3} />

      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.gradientWrapper}>
            <Animated.View
              style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}
            >
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={true}
                overScrollMode="always"
                alwaysBounceVertical={true}
                decelerationRate="normal"
                keyboardShouldPersistTaps="handled"
              >
                {/* Title */}
                <Animated.View style={{ transform: [{ translateY: titleSlideAnim }] }}>
                  <View style={styles.titleContainer}>
                    <Text style={styles.titlePrefix}>Split</Text>
                    <Text style={styles.titleHighlight}>It</Text>
                    <Text style={styles.titleSuffix}>Up</Text>
                  </View>
                </Animated.View>

                <Animated.Text style={[styles.subtitle, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                  Split bills. Not friendships.
                </Animated.Text>

                {/* Form card */}
                <View style={styles.card}>
                  <View style={styles.cardGlow} />

                  <Text style={styles.cardTitle}>Sign in</Text>

                  {/* Email */}
                  <Animated.View style={[styles.inputWrapper, { opacity: fadeAnim, transform: [{ translateX: slideAnim.interpolate({ inputRange: [0, 30], outputRange: [0, 20] }) }] }]}>
                    <Text style={styles.inputLabel}>EMAIL</Text>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputIcon}>✉️</Text>
                      <TextInput
                        placeholder="your@email.com"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                        style={styles.input}
                        editable={!loading}
                      />
                    </View>
                  </Animated.View>

                  {/* Password */}
                  <Animated.View style={[styles.inputWrapper, { opacity: fadeAnim, transform: [{ translateX: slideAnim.interpolate({ inputRange: [0, 30], outputRange: [0, 10] }) }] }]}>
                    <Text style={styles.inputLabel}>PASSWORD</Text>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputIcon}>🔒</Text>
                      <TextInput
                        placeholder="••••••••"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                        style={[styles.input, styles.passwordInput]}
                        editable={!loading}
                      />
                      <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeButton}>
                        <Text style={styles.eyeButtonText}>{showPassword ? '🙈' : '🐵'}</Text>
                      </TouchableOpacity>
                    </View>
                  </Animated.View>

                  {/* Forgot password */}
                  <View style={styles.forgotPasswordContainer}>
                    <TouchableOpacity style={styles.forgotPassword} onPress={() => router.push('/reset-password')}>
                      <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Sign in button */}
                  <Animated.View style={[styles.buttonWrapper, { opacity: fadeAnim, transform: [{ scale: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] }]}>
                    <TouchableOpacity onPress={signIn} disabled={loading}>
                      <LinearGradient colors={['#7F7FD5', '#86A8E7', '#91EAE4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientButton}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In →</Text>}
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>

                  {/* Divider */}
                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>new here?</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  {/* Sign up */}
                  <Animated.View style={[styles.toggleContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 30], outputRange: [0, 10] }) }] }]}>
                    <TouchableOpacity onPress={navigateToSignUp} disabled={loading}>
                      <Text style={styles.toggleButton}>Create an account 🎉</Text>
                    </TouchableOpacity>
                  </Animated.View>
                </View>

              </ScrollView>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F0C29' },
  safeArea: { flex: 1 },
  container: { flex: 1 },
  gradientWrapper: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 40 },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },

  // Orbs
  orb1: { position: 'absolute', top: -60, left: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: '#7F7FD5', opacity: 0.18 },
  orb2: { position: 'absolute', top: height * 0.3, right: -80, width: 180, height: 180, borderRadius: 90, backgroundColor: '#86A8E7', opacity: 0.13 },
  orb3: { position: 'absolute', bottom: 80, left: width * 0.2, width: 140, height: 140, borderRadius: 70, backgroundColor: '#91EAE4', opacity: 0.1 },

  // Title
  titleContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'baseline', marginBottom: 8 },
  titlePrefix: { fontSize: 44, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1.5 },
  titleHighlight: { fontSize: 54, fontWeight: '900', color: '#FFE66D', letterSpacing: -2, marginHorizontal: 2, transform: [{ rotate: '-3deg' }], textShadowColor: 'rgba(255,230,109,0.4)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 12 },
  titleSuffix: { fontSize: 44, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1.5 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 32, letterSpacing: 0.3 },

  // Card
  card: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 28, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', overflow: 'hidden', marginBottom: 16 },
  cardGlow: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: '#7F7FD5', opacity: 0.08 },
  cardTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginBottom: 20, letterSpacing: -0.5 },

  // Inputs
  inputWrapper: { marginBottom: 16 },
  inputLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.5)', letterSpacing: 1, marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 14, overflow: 'hidden' },
  inputIcon: { fontSize: 15, marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#FFFFFF' },
  passwordInput: { paddingRight: 50 },
  eyeButton: { position: 'absolute', right: 12, padding: 8 },
  eyeButtonText: { fontSize: 22 },

  // Forgot
  forgotPasswordContainer: { alignItems: 'flex-end', marginBottom: 16 },
  forgotPassword: { padding: 4 },
  forgotPasswordText: { color: '#91EAE4', fontSize: 13, fontWeight: '600' },

  // Button
  buttonWrapper: { borderRadius: 16, overflow: 'hidden', shadowColor: '#86A8E7', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
  gradientButton: { padding: 17, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFF', fontSize: 17, fontWeight: '700', letterSpacing: 0.5 },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText: { marginHorizontal: 12, fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.8 },

  // Toggle
  toggleContainer: { flexDirection: 'row', justifyContent: 'center' },
  toggleButton: { color: '#FFE66D', fontSize: 15, fontWeight: '700' },

  // Logged in
  loggedInContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  successIcon: { marginBottom: 24 },
  successIconText: { fontSize: 100 },
  loggedInTitle: { fontSize: 32, fontWeight: '800', color: '#FFF', marginBottom: 8 },
  loggedInEmail: { fontSize: 18, color: 'rgba(255,255,255,0.7)', marginBottom: 32, textAlign: 'center' },
  logoutButton: { width: '100%', maxWidth: 300, borderRadius: 16, overflow: 'hidden', elevation: 5 },
})