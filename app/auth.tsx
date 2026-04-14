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
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import { THEME_PALETTES } from '../lib/app-theme'
import { supabase } from '../lib/supabaseClient'

const { width, height } = Dimensions.get('window')
const INTRO_LOGO_SETTLED_Y = -(height * 0.31)
const INTRO_MESSAGES = [
  'Split bills. Not friendships.',
  'Keep every expense clean and easy.',
  'Track shared costs without the mess.',
  'Make group spending feel simple.',
  'Sort out expenses in seconds.',
  'Stay on top of every shared bill.',
]
const INTRO_BOTTOM_MESSAGES = [
  'Remember to drink water. Your organs are doing unpaid labor.',
  'Hope you did something fun today. If not, this intro counts a little.',
  'Tiny reminder: future you loves when present you taps buttons carefully.',
  'Stretch your neck. The shrimp posture lobby has enough power.',
  'If today was chaotic, at least the bills can be organized.',
  'Blink twice. Screens are sneaky little rectangles.',
  'Text that friend back. Or pretend this message never happened.',
  'You made it here. The app is already impressed, quietly.',
]
let hasPlayedAuthIntro = false

const pickRandomMessage = (messages: string[], current?: string) => {
  const options = messages.filter((message) => message !== current)
  const pool = options.length > 0 ? options : messages
  return pool[Math.floor(Math.random() * pool.length)]
}

export default function AuthScreen() {
  const router = useRouter()
  const C = THEME_PALETTES.dark
  const styles = createStyles(C)
  const pageGradient: [string, string, string] = ['#0F0C29', '#1a1a4e', '#24243e']
  const placeholderColor = 'rgba(255,255,255,0.3)'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sessionEmail, setSessionEmail] = useState<string | null>(null)
  const [welcomeName, setWelcomeName] = useState('')
  const [introMessage, setIntroMessage] = useState(() => pickRandomMessage(INTRO_MESSAGES))
  const [introBottomMessage, setIntroBottomMessage] = useState(() => pickRandomMessage(INTRO_BOTTOM_MESSAGES))
  const [showIntro, setShowIntro] = useState(true)
  const [entryPhase, setEntryPhase] = useState<'idle' | 'success' | 'loading'>('idle')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const entryTimers = useRef<ReturnType<typeof setTimeout>[]>([])
  const introTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  // Animation values — untouched
  const [monkeyPosition] = useState(new Animated.Value(0))
  const [eyeAnimation] = useState(new Animated.Value(0))
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current
  const scaleAnim = useRef(new Animated.Value(0.9)).current
  const titleSlideAnim = useRef(new Animated.Value(-50)).current
  const logoFloatAnim = useRef(new Animated.Value(0)).current
  const introOverlayOpacity = useRef(new Animated.Value(1)).current
  const introLogoTranslateY = useRef(new Animated.Value(height * 0.18)).current
  const introLogoScale = useRef(new Animated.Value(0.82)).current
  const introLogoOpacity = useRef(new Animated.Value(0)).current
  const introWelcomeOpacity = useRef(new Animated.Value(0)).current
  const introWelcomeShift = useRef(new Animated.Value(18)).current
  const introBottomOpacity = useRef(new Animated.Value(0)).current
  const introBottomShift = useRef(new Animated.Value(16)).current
  const introContentOpacity = useRef(new Animated.Value(0)).current
  const introContentShift = useRef(new Animated.Value(22)).current
  const authExitOpacity = useRef(new Animated.Value(1)).current
  const authExitScale = useRef(new Animated.Value(1)).current
  const successOpacity = useRef(new Animated.Value(0)).current
  const successScale = useRef(new Animated.Value(0.92)).current
  const successSlide = useRef(new Animated.Value(20)).current
  const loadingOpacity = useRef(new Animated.Value(0)).current
  const loadingScale = useRef(new Animated.Value(0.94)).current
  const loadingSlide = useRef(new Animated.Value(26)).current
  const loadingGlow = useRef(new Animated.Value(0.92)).current
  const loadingProgress = useRef(new Animated.Value(0)).current

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
    return () => {
      authListener.subscription.unsubscribe()
      entryTimers.current.forEach((timer) => clearTimeout(timer))
      introTimers.current.forEach((timer) => clearTimeout(timer))
    }
  }, [])

  useEffect(() => {
    if (sessionEmail) {
      setShowIntro(false)
      introOverlayOpacity.setValue(0)
      introContentOpacity.setValue(1)
      introContentShift.setValue(0)
      introLogoOpacity.setValue(0)
      introWelcomeOpacity.setValue(0)
      introWelcomeShift.setValue(18)
      introBottomOpacity.setValue(0)
      introBottomShift.setValue(16)
      return
    }

    if (hasPlayedAuthIntro) {
      setShowIntro(false)
      introOverlayOpacity.setValue(0)
      introContentOpacity.setValue(1)
      introContentShift.setValue(0)
      introLogoOpacity.setValue(0)
      introWelcomeOpacity.setValue(0)
      introWelcomeShift.setValue(18)
      introBottomOpacity.setValue(0)
      introBottomShift.setValue(16)
      return
    }

    setShowIntro(true)
    hasPlayedAuthIntro = true
    setIntroMessage((current) => pickRandomMessage(INTRO_MESSAGES, current))
    setIntroBottomMessage((current) => pickRandomMessage(INTRO_BOTTOM_MESSAGES, current))
    introOverlayOpacity.setValue(1)
    introLogoTranslateY.setValue(height * 0.18)
    introLogoScale.setValue(0.82)
    introLogoOpacity.setValue(0)
    introWelcomeOpacity.setValue(0)
    introWelcomeShift.setValue(18)
    introBottomOpacity.setValue(0)
    introBottomShift.setValue(16)
    introContentOpacity.setValue(0)
    introContentShift.setValue(28)

    const logoTimer = setTimeout(() => {
      Animated.parallel([
        Animated.spring(introLogoTranslateY, {
          toValue: 0,
          tension: 56,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.spring(introLogoScale, {
          toValue: 1,
          tension: 70,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(introLogoOpacity, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start()
    }, 260)

    const messageTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(introWelcomeOpacity, {
          toValue: 1,
          duration: 460,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(introWelcomeShift, {
          toValue: 0,
          duration: 460,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start()
    }, 980)

    const bottomTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(introBottomOpacity, {
          toValue: 1,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(introBottomShift, {
          toValue: 0,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start()
    }, 1620)

    const settleTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(introLogoTranslateY, {
          toValue: INTRO_LOGO_SETTLED_Y,
          duration: 1020,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(introLogoScale, {
          toValue: 0.9,
          duration: 1020,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(introWelcomeOpacity, {
          toValue: 0,
          duration: 340,
          delay: 120,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(introWelcomeShift, {
          toValue: -12,
          duration: 340,
          delay: 120,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(introBottomOpacity, {
          toValue: 0,
          duration: 360,
          delay: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(introBottomShift, {
          toValue: 10,
          duration: 360,
          delay: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(introContentOpacity, {
          toValue: 1,
          duration: 780,
          delay: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(introContentShift, {
          toValue: 0,
          duration: 780,
          delay: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start()
    }, 2780)

    const finishTimer = setTimeout(() => {
      Animated.timing(introOverlayOpacity, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => setShowIntro(false))
    }, 4720)

    introTimers.current.push(logoTimer, messageTimer, bottomTimer, settleTimer, finishTimer)

    return () => {
      clearTimeout(logoTimer)
      clearTimeout(messageTimer)
      clearTimeout(bottomTimer)
      clearTimeout(settleTimer)
      clearTimeout(finishTimer)
    }
  }, [
    introBottomOpacity,
    introBottomShift,
    introContentOpacity,
    introContentShift,
    introLogoScale,
    introLogoOpacity,
    introLogoTranslateY,
    introOverlayOpacity,
    introWelcomeOpacity,
    introWelcomeShift,
    sessionEmail,
  ])

  useEffect(() => {
    const floatingLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(logoFloatAnim, {
          toValue: -7,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(logoFloatAnim, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    )

    floatingLoop.start()

    return () => {
      floatingLoop.stop()
    }
  }, [logoFloatAnim])

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

  const resolveWelcomeName = async (userId: string, emailValue: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, username')
      .eq('id', userId)
      .single()

    return (
      data?.username ||
      data?.full_name ||
      emailValue.split('@')[0] ||
      'friend'
    )
  }

  const queueTimer = (callback: () => void, delay: number) => {
    const timer = setTimeout(callback, delay)
    entryTimers.current.push(timer)
  }

  const playWelcomeAnimation = (name: string) => {
    setWelcomeName(name)
    setEntryPhase('success')
    authExitOpacity.setValue(1)
    authExitScale.setValue(1)
    successOpacity.setValue(0)
    successScale.setValue(0.92)
    successSlide.setValue(20)
    loadingOpacity.setValue(0)
    loadingScale.setValue(0.94)
    loadingSlide.setValue(26)
    loadingGlow.setValue(0.92)
    loadingProgress.setValue(0)

    Animated.parallel([
      Animated.timing(authExitOpacity, {
        toValue: 0.16,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(authExitScale, {
        toValue: 0.97,
        duration: 460,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(successOpacity, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(successScale, {
        toValue: 1,
        tension: 82,
        friction: 11,
        useNativeDriver: true,
      }),
      Animated.spring(successSlide, {
        toValue: 0,
        tension: 78,
        friction: 11,
        useNativeDriver: true,
      }),
    ]).start()

    queueTimer(() => {
      Animated.parallel([
        Animated.timing(successOpacity, {
          toValue: 0,
          duration: 180,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(successScale, {
          toValue: 0.98,
          duration: 180,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(successSlide, {
          toValue: -10,
          duration: 180,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setEntryPhase('loading')
        Animated.parallel([
          Animated.timing(loadingOpacity, {
            toValue: 1,
            duration: 260,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.spring(loadingScale, {
            toValue: 1,
            tension: 76,
            friction: 11,
            useNativeDriver: true,
          }),
          Animated.spring(loadingSlide, {
            toValue: 0,
            tension: 74,
            friction: 11,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(loadingGlow, {
              toValue: 1.08,
              duration: 620,
              useNativeDriver: true,
            }),
            Animated.timing(loadingGlow, {
              toValue: 0.96,
              duration: 700,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(loadingProgress, {
            toValue: 1,
            duration: 1600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
        ]).start()
      })
    }, 950)

    queueTimer(() => {
      router.replace('/(tabs)')
    }, 2850)
  }

  const signIn = async () => {
    if (!validateInputs()) return
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) return Alert.alert('Login error', error.message)

    const user = data.user
    const name = user
      ? await resolveWelcomeName(user.id, user.email ?? email)
      : email.split('@')[0]

    playWelcomeAnimation(name)
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
  if (sessionEmail && entryPhase === 'idle') {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.root}>
        <LinearGradient colors={pageGradient} style={StyleSheet.absoluteFillObject} />
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
      </TouchableWithoutFeedback>
    )
  }

  // ── Login state ──────────────────────────────────────────────
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <View style={styles.root}>
      <LinearGradient colors={pageGradient} style={StyleSheet.absoluteFillObject} />

      {/* Decorative orbs — purely visual */}
      <View pointerEvents="none" style={styles.orb1} />
      <View pointerEvents="none" style={styles.orb2} />
      <View pointerEvents="none" style={styles.orb3} />

      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
        <Animated.View
          style={[
            styles.authShell,
            { opacity: authExitOpacity, transform: [{ scale: authExitScale }] },
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
          >
            <View style={styles.gradientWrapper}>
              <Animated.View
                style={[
                  styles.content,
                  {
                    opacity: Animated.multiply(fadeAnim, introContentOpacity),
                    transform: [{ translateY: slideAnim }, { translateY: introContentShift }, { scale: scaleAnim }],
                  },
                ]}
              >
                <ScrollView
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                  bounces={true}
                  overScrollMode="always"
                  alwaysBounceVertical={true}
                  decelerationRate="normal"
                  keyboardShouldPersistTaps="never"
                  keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                >
                {/* Title */}
                <Animated.View style={{ transform: [{ translateY: titleSlideAnim }, { translateY: logoFloatAnim }] }}>
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
                        placeholderTextColor={placeholderColor}
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
                        placeholderTextColor={placeholderColor}
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
        </Animated.View>
      </SafeAreaView>

      {showIntro && !sessionEmail && (
        <Animated.View pointerEvents="none" style={[styles.introOverlay, { opacity: introOverlayOpacity }]}>
          <LinearGradient
            colors={['rgba(15,12,41,0.98)', 'rgba(22,20,56,0.96)', 'rgba(15,12,41,0.92)']}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.introOrbMain} />
          <View style={styles.introOrbAccent} />
          <Animated.View
            style={[
              styles.introLogoWrap,
              {
                opacity: introLogoOpacity,
                transform: [
                  { translateY: introLogoTranslateY },
                  { scale: introLogoScale },
                  { translateY: logoFloatAnim },
                ],
              },
            ]}
          >
              <View style={styles.titleContainer}>
                <Text style={styles.titlePrefix}>Split</Text>
                <Text style={styles.titleHighlight}>It</Text>
                <Text style={styles.titleSuffix}>Up</Text>
              </View>
          </Animated.View>
          <Animated.View
            style={[
              styles.introMessageCard,
              {
                opacity: introWelcomeOpacity,
                transform: [{ translateY: introWelcomeShift }],
              },
            ]}
          >
            <View style={styles.introTextWrap}>
              <Text style={styles.introEyebrow}>Ready when you are</Text>
              <Text style={styles.introSubtitle}>{introMessage}</Text>
            </View>
          </Animated.View>
          <Animated.View
            style={[
              styles.introBottomNote,
              {
                opacity: introBottomOpacity,
                transform: [{ translateY: introBottomShift }],
              },
            ]}
          >
            <Text style={styles.introBottomText}>{introBottomMessage}</Text>
          </Animated.View>
        </Animated.View>
      )}

      {entryPhase !== 'idle' && (
        <Animated.View
          pointerEvents="auto"
          style={[
            styles.welcomeOverlay,
            {
              opacity: entryPhase === 'success' ? successOpacity : loadingOpacity,
            },
          ]}
        >
          {entryPhase === 'success' ? (
            <Animated.View
              style={[
                styles.successStageCard,
                {
                  transform: [
                    { scale: successScale },
                    { translateY: successSlide },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={['#7F7FD5', '#86A8E7', '#91EAE4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.successStageEmojiWrap}
              >
                <Text style={styles.successStageEmoji}>:)</Text>
              </LinearGradient>
              <Text style={styles.successStageTitle}>Successful</Text>
              <Text style={styles.successStageSubtitle}>
                You are signed in, {welcomeName}.
              </Text>
            </Animated.View>
          ) : (
            <>
              <Animated.View
                style={[
                  styles.welcomeBackdropGlow,
                  { transform: [{ scale: loadingGlow }] },
                ]}
              />
              <View style={styles.welcomeBackdropGlowSecondary} />
              <Animated.View
                style={[
                  styles.welcomeCard,
                  {
                    transform: [
                      { scale: loadingScale },
                      { translateY: loadingSlide },
                    ],
                  },
                ]}
              >
                <LinearGradient
                  colors={['#7F7FD5', '#86A8E7', '#91EAE4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.welcomeBadge}
                >
                  <Text style={styles.welcomeBadgeText}>
                    {welcomeName ? welcomeName.charAt(0).toUpperCase() : 'W'}
                  </Text>
                </LinearGradient>
                <View style={styles.loadingStageTextWrap}>
                  <Text style={styles.welcomeEyebrow}>Welcome back</Text>
                  <Text style={styles.welcomeName}>{welcomeName}</Text>
                  <Text style={styles.welcomeSubtitle}>Redirecting to home page...</Text>
                </View>
                <View style={styles.welcomeProgressTrack}>
                  <Animated.View
                    style={[
                      styles.welcomeProgressFill,
                      {
                        width: loadingProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                      },
                    ]}
                  />
                </View>
              </Animated.View>
            </>
          )}
        </Animated.View>
      )}
    </View>
    </TouchableWithoutFeedback>
  )
}

const createStyles = (C: typeof THEME_PALETTES.dark) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  safeArea: { flex: 1 },
  authShell: { flex: 1 },
  container: { flex: 1 },
  gradientWrapper: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 40 },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },

  introOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(15, 12, 41, 0.95)',
  },
  introOrbMain: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: C.mode === 'dark' ? 'rgba(127,127,213,0.22)' : 'rgba(124,58,237,0.14)',
    top: height * 0.16,
  },
  introOrbAccent: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: C.mode === 'dark' ? 'rgba(145,234,228,0.12)' : 'rgba(56,189,248,0.12)',
    top: height * 0.24,
    right: width * 0.2,
  },
  introLogoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  introMessageCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: C.mode === 'dark' ? 'rgba(255,255,255,0.055)' : 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: C.mode === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(24,24,38,0.08)',
    shadowColor: C.mode === 'dark' ? '#0B0918' : '#c7d2fe',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  introTextWrap: {
    alignItems: 'center',
  },
  introEyebrow: {
    color: C.mode === 'dark' ? 'rgba(145,234,228,0.88)' : C.accent,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  introSubtitle: {
    color: C.textSecondary,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
    textAlign: 'center',
  },
  introBottomNote: {
    position: 'absolute',
    left: 28,
    right: 28,
    bottom: Platform.OS === 'ios' ? 58 : 42,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: C.mode === 'dark' ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: C.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(24,24,38,0.08)',
  },
  introBottomText: {
    color: C.mode === 'dark' ? 'rgba(255,255,255,0.72)' : C.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    textAlign: 'center',
  },

  // Orbs
  orb1: { position: 'absolute', top: -60, left: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: C.orbPrimary, opacity: 0.18 },
  orb2: { position: 'absolute', top: height * 0.3, right: -80, width: 180, height: 180, borderRadius: 90, backgroundColor: C.blue, opacity: 0.13 },
  orb3: { position: 'absolute', bottom: 80, left: width * 0.2, width: 140, height: 140, borderRadius: 70, backgroundColor: C.orbSecondary, opacity: 0.1 },

  // Title
  titleContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'baseline', marginBottom: 8 },
  titlePrefix: { fontSize: 44, fontWeight: '800', color: C.textPrimary, letterSpacing: -1.5 },
  titleHighlight: { fontSize: 54, fontWeight: '900', color: '#FFE66D', letterSpacing: -2, marginHorizontal: 2, transform: [{ rotate: '-3deg' }], textShadowColor: 'rgba(255,230,109,0.4)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 12 },
  titleSuffix: { fontSize: 44, fontWeight: '800', color: C.textPrimary, letterSpacing: -1.5 },
  subtitle: { fontSize: 15, color: C.textSecondary, textAlign: 'center', marginBottom: 32, letterSpacing: 0.3 },

  // Card
  card: { backgroundColor: C.mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.78)', borderRadius: 28, padding: 24, borderWidth: 1, borderColor: C.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(24,24,38,0.08)', overflow: 'hidden', marginBottom: 16 },
  cardGlow: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: C.accent, opacity: 0.08 },
  cardTitle: { fontSize: 22, fontWeight: '700', color: C.textPrimary, marginBottom: 20, letterSpacing: -0.5 },

  // Inputs
  inputWrapper: { marginBottom: 16 },
  inputLabel: { fontSize: 11, fontWeight: '600', color: C.textSecondary, letterSpacing: 1, marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(24,24,38,0.04)', borderRadius: 14, borderWidth: 1, borderColor: C.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(24,24,38,0.08)', paddingHorizontal: 14, overflow: 'hidden' },
  inputIcon: { fontSize: 15, marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: C.textPrimary },
  passwordInput: { paddingRight: 50 },
  eyeButton: { position: 'absolute', right: 12, padding: 8 },
  eyeButtonText: { fontSize: 22 },

  // Forgot
  forgotPasswordContainer: { alignItems: 'flex-end', marginBottom: 16 },
  forgotPassword: { padding: 4 },
  forgotPasswordText: { color: C.blue, fontSize: 13, fontWeight: '600' },

  // Button
  buttonWrapper: { borderRadius: 16, overflow: 'hidden', shadowColor: '#86A8E7', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
  gradientButton: { padding: 17, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFF', fontSize: 17, fontWeight: '700', letterSpacing: 0.5 },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(24,24,38,0.1)' },
  dividerText: { marginHorizontal: 12, fontSize: 11, color: C.textMuted, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.8 },

  // Toggle
  toggleContainer: { flexDirection: 'row', justifyContent: 'center' },
  toggleButton: { color: '#FFE66D', fontSize: 15, fontWeight: '700' },

  // Logged in
  loggedInContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  successIcon: { marginBottom: 24 },
  successIconText: { fontSize: 100 },
  loggedInTitle: { fontSize: 32, fontWeight: '800', color: C.textPrimary, marginBottom: 8 },
  loggedInEmail: { fontSize: 18, color: C.textSecondary, marginBottom: 32, textAlign: 'center' },
  logoutButton: { width: '100%', maxWidth: 300, borderRadius: 16, overflow: 'hidden', elevation: 5 },
  welcomeOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.mode === 'dark' ? 'rgba(7, 6, 22, 0.7)' : 'rgba(245,247,255,0.76)',
    paddingHorizontal: 24,
  },
  successStageCard: {
    width: '100%',
    maxWidth: 300,
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 28,
    backgroundColor: C.mode === 'dark' ? 'rgba(17, 16, 40, 0.98)' : 'rgba(255,255,255,0.98)',
    borderWidth: 1,
    borderColor: C.mode === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(24,24,38,0.08)',
    alignItems: 'center',
    shadowColor: '#0B0918',
    shadowOpacity: 0.26,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  successStageEmojiWrap: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  successStageEmoji: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },
  successStageTitle: {
    color: C.textPrimary,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.9,
    marginBottom: 8,
  },
  successStageSubtitle: {
    color: C.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  welcomeBackdropGlow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: C.mode === 'dark' ? 'rgba(127, 127, 213, 0.22)' : 'rgba(124,58,237,0.14)',
  },
  welcomeBackdropGlowSecondary: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: C.mode === 'dark' ? 'rgba(145, 234, 228, 0.12)' : 'rgba(56,189,248,0.12)',
    bottom: '34%',
  },
  welcomeCard: {
    width: '100%',
    maxWidth: 332,
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 30,
    backgroundColor: C.mode === 'dark' ? 'rgba(15, 14, 36, 0.96)' : 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: C.mode === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(24,24,38,0.08)',
    alignItems: 'center',
    shadowColor: '#0B0918',
    shadowOpacity: 0.32,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  welcomeBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  welcomeBadgeText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
  },
  loadingStageTextWrap: {
    alignItems: 'center',
  },
  welcomeEyebrow: {
    color: C.mode === 'dark' ? 'rgba(145,234,228,0.82)' : C.accent,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginBottom: 10,
  },
  welcomeName: {
    color: C.textPrimary,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    color: C.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  welcomeProgressTrack: {
    width: '100%',
    height: 7,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: C.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(24,24,38,0.08)',
  },
  welcomeProgressFill: {
    height: '100%',
    backgroundColor: '#91EAE4',
  },
})
