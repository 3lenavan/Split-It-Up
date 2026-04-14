import * as ImagePicker from 'expo-image-picker'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
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
import { uploadProfileImage } from '../lib/profile-image'
import { supabase } from '../lib/supabaseClient'

const PRONOUN_OPTIONS = [
  { id: '1', label: 'She/Her', value: 'she/her' },
  { id: '2', label: 'He/Him', value: 'he/him' },
  { id: '3', label: 'They/Them', value: 'they/them' },
  { id: '4', label: 'She/They', value: 'she/they' },
  { id: '5', label: 'He/They', value: 'he/they' },
  { id: '6', label: 'Ze/Zir', value: 'ze/zir' },
  { id: '7', label: 'Other', value: 'other' },
]
let C = THEME_PALETTES.dark
let styles = createStyles(C)

type PasswordCheckState = {
  length: boolean
  match: boolean
  hasNumber: boolean
  hasLetter: boolean
}

type FieldConfig = {
  label: string
  required?: boolean
  value: string
  setter: (text: string) => void
  placeholder: string
  prefix?: string
  keyboard?: 'default' | 'email-address'
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  hint,
}: {
  eyebrow: string
  title: string
  subtitle: string
  hint?: string
}) {
  return (
    <>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
        {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </>
  )
}

export default function SignUpScreen() {
  const router = useRouter()
  C = THEME_PALETTES.dark
  styles = createStyles(C)
  const pageGradient: [string, string, string] = ['#0F0C29', '#1a1a4e', '#24243e']
  const buttonGradient: [string, string, string] = ['#7F7FD5', '#86A8E7', '#91EAE4']
  const placeholderColor = 'rgba(255,255,255,0.3)'
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pronouns, setPronouns] = useState('')
  const [customPronouns, setCustomPronouns] = useState('')
  const [bio, setBio] = useState('')
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [pronounModalVisible, setPronounModalVisible] = useState(false)
  const [showCustomPronoun, setShowCustomPronoun] = useState(false)
  const [passwordChecks, setPasswordChecks] = useState<PasswordCheckState>({
    length: false,
    match: false,
    hasNumber: false,
    hasLetter: false,
  })

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(42)).current
  const scaleAnim = useRef(new Animated.Value(0.96)).current
  const heroFloatAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 820, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.timing(slideAnim, { toValue: 0, duration: 820, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 820, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
    ]).start()
  }, [fadeAnim, scaleAnim, slideAnim])

  useEffect(() => {
    const floatingLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(heroFloatAnim, { toValue: -6, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(heroFloatAnim, { toValue: 0, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    )
    floatingLoop.start()
    return () => floatingLoop.stop()
  }, [heroFloatAnim])

  const validatePassword = (text: string) => {
    setPassword(text)
    setPasswordChecks({
      length: text.length >= 6,
      hasNumber: /\d/.test(text),
      hasLetter: /[a-zA-Z]/.test(text),
      match: text === confirmPassword && text.length > 0,
    })
  }

  const validateConfirmPassword = (text: string) => {
    setConfirmPassword(text)
    setPasswordChecks((prev) => ({ ...prev, match: text === password && text.length > 0 }))
  }

  const selectPronoun = (pronounValue: string) => {
    if (pronounValue === 'other') {
      setShowCustomPronoun(true)
      setPronouns('')
    } else {
      setPronouns(pronounValue)
      setShowCustomPronoun(false)
      setCustomPronouns('')
    }
    setPronounModalVisible(false)
  }

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access your photos')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })
    if (!result.canceled) setProfileImage(result.assets[0].uri)
  }

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permission')
      return
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 })
    if (!result.canceled) setProfileImage(result.assets[0].uri)
  }

  const showImageOptions = () => {
    Alert.alert('Profile Picture', 'Choose an option', [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Gallery', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  const validateInputs = () => {
    if (!fullName || !username || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all required fields')
      return false
    }
    if (!pronouns && !customPronouns) {
      Alert.alert('Error', 'Please select your pronouns')
      return false
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters')
      return false
    }
    if (!passwordChecks.hasNumber || !passwordChecks.hasLetter) {
      Alert.alert('Error', 'Password must contain both letters and numbers')
      return false
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match')
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address')
      return false
    }
    return true
  }

  const signUp = async () => {
    if (!validateInputs()) return
    setLoading(true)
    try {
      const cleanFullName = fullName.trim()
      const cleanUsername = username.trim().toLowerCase()
      const cleanEmail = email.trim().toLowerCase()
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { data: { full_name: cleanFullName, username: cleanUsername } },
      })

      if (error || !data.user) {
        setLoading(false)
        Alert.alert('Sign up error', error?.message ?? 'No user returned')
        return
      }
      let avatarUrl: string | null = null
      let avatarUploadError: unknown = null

      if (profileImage) {
        try {
          avatarUrl = await uploadProfileImage(data.user.id, profileImage)
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              full_name: cleanFullName,
              username: cleanUsername,
              email: cleanEmail,
              avatar_url: avatarUrl,
            })

          if (profileError) throw profileError

          const { error: authError } = await supabase.auth.updateUser({
            data: { full_name: cleanFullName, username: cleanUsername, avatar_url: avatarUrl },
          })

          if (authError) throw authError
        } catch (avatarError) {
          console.error('Profile image upload failed:', avatarError)
          avatarUploadError = avatarError
        }
      }

      setLoading(false)
      if (avatarUploadError) {
        Alert.alert(
          'Account created',
          'Your account was created, but your profile picture could not be saved yet. You can try again from Edit Profile.',
          [{ text: 'Go to Login', onPress: () => router.push('/auth') }]
        )
        return
      }

      Alert.alert('Success!', 'Your account has been created! Please login.', [
        { text: 'Go to Login', onPress: () => router.push('/auth') },
      ])
    } catch (err: unknown) {
      setLoading(false)
      Alert.alert('Error', err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  const navigateToLogin = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -50, duration: 300, useNativeDriver: true }),
    ]).start(() => router.push('/auth'))
  }

  const accountFields: FieldConfig[] = [
    { label: 'Full Name', required: true, value: fullName, setter: setFullName, placeholder: 'Your name...', keyboard: 'default' },
    { label: 'Username', required: true, value: username, setter: setUsername, placeholder: 'username...', prefix: '@', keyboard: 'default' },
    { label: 'Email', required: true, value: email, setter: setEmail, placeholder: 'your@email.com', keyboard: 'email-address' },
  ]

  const passwordFields = [
    { label: 'Password', value: password, setter: validatePassword, show: showPassword, toggle: setShowPassword },
    { label: 'Confirm Password', value: confirmPassword, setter: validateConfirmPassword, show: showConfirmPassword, toggle: setShowConfirmPassword },
  ]

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <View style={styles.root}>
      <LinearGradient colors={pageGradient} style={StyleSheet.absoluteFillObject} />
      <View pointerEvents="none" style={styles.orb1} />
      <View pointerEvents="none" style={styles.orb2} />
      <View pointerEvents="none" style={styles.orb3} />

      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
          <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="never"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            >
              <View style={styles.formContainer}>
                <View style={styles.topBar}>
                  <TouchableOpacity onPress={navigateToLogin} style={styles.backButton}>
                    <Text style={styles.backArrow}>←</Text>
                  </TouchableOpacity>
                  <View style={styles.topBadge}>
                    <Text style={styles.topBadgeText}>Create account</Text>
                  </View>
                </View>

                <Animated.View style={[styles.header, { transform: [{ translateY: heroFloatAnim }] }]}>
                  <View style={styles.heroCard}>
                    <View style={styles.heroGlow} />
                    <Text style={styles.heroEyebrow}>Start your account</Text>
                    <View style={styles.titleRow}>
                      <Text style={styles.titleWhite}>Split</Text>
                      <Text style={styles.titleAccent}>It</Text>
                      <Text style={styles.titleWhite}>Up</Text>
                    </View>
                    <Text style={styles.subtitle}>Join the app with a cleaner, more polished setup flow that still feels quick.</Text>
                    <View style={styles.heroPills}>
                      <View style={styles.heroPill}><Text style={styles.heroPillText}>Fast setup</Text></View>
                      <View style={styles.heroPill}><Text style={styles.heroPillText}>Secure account</Text></View>
                      <View style={styles.heroPill}><Text style={styles.heroPillText}>Shared expenses</Text></View>
                    </View>
                  </View>
                </Animated.View>

                <View style={styles.card}>
                  <View style={styles.cardGlow} />

                  <View style={styles.sectionShell}>
                    <SectionHeader eyebrow="Profile" title="Make the account yours" subtitle="Add a photo so people recognize you right away." hint="Personal touch" />
                    <Animated.View style={[styles.inputWrapper, styles.profileInputWrapper, { opacity: fadeAnim, transform: [{ scale: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] }) }] }]}>
                      <TouchableOpacity onPress={showImageOptions} style={styles.profileImageContainer}>
                        {profileImage ? (
                          <Image source={{ uri: profileImage }} style={styles.profileImage} />
                        ) : (
                          <View style={styles.profileImagePlaceholder}>
                            <Text style={styles.profileImagePlaceholderText}>📷</Text>
                            <Text style={styles.profileImagePlaceholderSubtext}>Tap to add photo</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    </Animated.View>
                  </View>

                  <View style={styles.sectionShell}>
                    <SectionHeader eyebrow="Account" title="Your main details" subtitle="Set up the essentials for login and friend search." hint="Required" />
                    {accountFields.map((field, index) => (
                      <Animated.View
                        key={field.label}
                        style={[
                          styles.inputWrapper,
                          { opacity: fadeAnim, transform: [{ translateX: slideAnim.interpolate({ inputRange: [0, 42], outputRange: [0, 10 * (index + 1)] }) }] },
                        ]}
                      >
                        <Text style={styles.inputLabel}>
                          {field.label} {field.required ? <Text style={styles.requiredStar}>*</Text> : null}
                        </Text>
                        <View style={styles.inputContainer}>
                          {field.prefix ? <Text style={styles.inputPrefix}>{field.prefix}</Text> : null}
                          <TextInput
                            placeholder={field.placeholder}
                            placeholderTextColor={placeholderColor}
                            autoCapitalize="none"
                            keyboardType={field.keyboard}
                            value={field.value}
                            onChangeText={field.setter}
                            style={[styles.input, field.prefix ? styles.inputWithPrefix : null]}
                            editable={!loading}
                          />
                        </View>
                      </Animated.View>
                    ))}
                  </View>

                  <View style={styles.sectionShell}>
                    <SectionHeader eyebrow="Identity" title="A little more about you" subtitle="Round out your profile with pronouns and a short bio." hint="Optional style" />
                    <Animated.View style={[styles.inputWrapper, { opacity: fadeAnim, transform: [{ translateX: slideAnim.interpolate({ inputRange: [0, 42], outputRange: [0, 32] }) }] }]}>
                      <Text style={styles.inputLabel}>Pronouns <Text style={styles.requiredStar}>*</Text></Text>
                      <TouchableOpacity style={styles.inputContainer} onPress={() => setPronounModalVisible(true)}>
                        <Text style={[styles.input, !pronouns && !customPronouns ? styles.placeholderText : null]}>
                          {showCustomPronoun ? customPronouns || 'Enter your pronouns' : pronouns || 'Select pronouns'}
                        </Text>
                        <Text style={styles.dropdownIcon}>›</Text>
                      </TouchableOpacity>
                    </Animated.View>

                    {showCustomPronoun ? (
                      <Animated.View style={[styles.inputWrapper, { opacity: fadeAnim, transform: [{ translateX: slideAnim.interpolate({ inputRange: [0, 42], outputRange: [0, 40] }) }] }]}>
                        <Text style={styles.inputLabel}>Custom Pronouns</Text>
                        <View style={styles.inputContainer}>
                          <TextInput
                            placeholder="e.g., xe/xem, fae/faer"
                            placeholderTextColor={placeholderColor}
                            value={customPronouns}
                            onChangeText={setCustomPronouns}
                            style={styles.input}
                            editable={!loading}
                          />
                        </View>
                      </Animated.View>
                    ) : null}

                    <Animated.View style={[styles.inputWrapper, { opacity: fadeAnim, transform: [{ translateX: slideAnim.interpolate({ inputRange: [0, 42], outputRange: [0, 48] }) }] }]}>
                      <Text style={styles.inputLabel}>Bio <Text style={styles.optionalText}>(optional)</Text></Text>
                      <View style={styles.inputContainer}>
                        <TextInput
                          placeholder="Tell us a little about yourself..."
                          placeholderTextColor={placeholderColor}
                          value={bio}
                          onChangeText={setBio}
                          style={[styles.input, styles.textArea]}
                          multiline
                          numberOfLines={3}
                          textAlignVertical="top"
                          editable={!loading}
                        />
                      </View>
                    </Animated.View>
                  </View>

                  <View style={styles.sectionShell}>
                    <SectionHeader eyebrow="Security" title="Create a strong password" subtitle="Keep your shared balances and account protected." hint="Stay protected" />
                    {passwordFields.map((field, index) => (
                      <Animated.View
                        key={field.label}
                        style={[
                          styles.inputWrapper,
                          { opacity: fadeAnim, transform: [{ translateX: slideAnim.interpolate({ inputRange: [0, 42], outputRange: [0, 56 + index * 8] }) }] },
                        ]}
                      >
                        <Text style={styles.inputLabel}>{field.label} <Text style={styles.requiredStar}>*</Text></Text>
                        <View style={styles.inputContainer}>
                          <TextInput
                            placeholder="••••••••"
                            placeholderTextColor={placeholderColor}
                            secureTextEntry={!field.show}
                            value={field.value}
                            onChangeText={field.setter}
                            style={[styles.input, styles.passwordInput]}
                            editable={!loading}
                          />
                          <TouchableOpacity onPress={() => field.toggle(!field.show)} style={styles.eyeButton}>
                            <Text style={styles.eyeButtonText}>{field.show ? '🙈' : '🐵'}</Text>
                          </TouchableOpacity>
                        </View>
                      </Animated.View>
                    ))}

                    <Animated.View style={[styles.requirementsContainer, { opacity: fadeAnim, transform: [{ scale: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }] }]}>
                      <Text style={styles.requirementsTitle}>Password must:</Text>
                      {[
                        { check: passwordChecks.length, text: 'Be at least 6 characters' },
                        { check: passwordChecks.hasLetter, text: 'Contain at least one letter' },
                        { check: passwordChecks.hasNumber, text: 'Contain at least one number' },
                        { check: passwordChecks.match, text: 'Passwords match' },
                      ].map((req) => (
                        <View key={req.text} style={styles.requirementRow}>
                          <Text style={[styles.requirementIcon, req.check ? styles.requirementMet : null]}>{req.check ? '✓' : '○'}</Text>
                          <Text style={[styles.requirementText, req.check ? styles.requirementMet : null]}>{req.text}</Text>
                        </View>
                      ))}
                    </Animated.View>
                  </View>

                  <Animated.View style={[styles.buttonWrapper, { opacity: fadeAnim, transform: [{ scale: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.84, 1] }) }] }]}>
                    <TouchableOpacity onPress={signUp} disabled={loading}>
                      <LinearGradient colors={buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientButton}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account →</Text>}
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>

                  <Animated.View style={[styles.toggleContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 42], outputRange: [0, 10] }) }] }]}>
                    <Text style={styles.toggleText}>Already have an account? </Text>
                    <TouchableOpacity onPress={navigateToLogin} disabled={loading}>
                      <Text style={styles.toggleButton}>Sign In</Text>
                    </TouchableOpacity>
                  </Animated.View>

                  <Text style={styles.termsText}>By signing up, you agree to our Terms of Service and Privacy Policy</Text>
                  <Text style={styles.requiredNote}><Text style={styles.requiredStar}>*</Text> Required fields</Text>
                </View>
              </View>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal visible={pronounModalVisible} transparent animationType="slide" onRequestClose={() => setPronounModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Pronouns</Text>
              <TouchableOpacity onPress={() => setPronounModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={PRONOUN_OPTIONS}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.pronounOption} onPress={() => selectPronoun(item.value)}>
                  <Text style={styles.pronounOptionText}>{item.label}</Text>
                  {pronouns === item.value ? <Text style={styles.pronounSelected}>✓</Text> : null}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </View>
    </TouchableWithoutFeedback>
  )
}

function createStyles(C: typeof THEME_PALETTES.dark) {
return StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  safeArea: { flex: 1 },
  container: { flex: 1 },
  content: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 56 },
  formContainer: { flex: 1, paddingHorizontal: 24, paddingTop: 34 },
  orb1: { position: 'absolute', top: -60, left: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: C.orbPrimary, opacity: 0.18 },
  orb2: { position: 'absolute', top: '35%', right: -80, width: 180, height: 180, borderRadius: 90, backgroundColor: C.blue, opacity: 0.13 },
  orb3: { position: 'absolute', bottom: 100, left: '15%', width: 150, height: 150, borderRadius: 75, backgroundColor: C.orbSecondary, opacity: 0.1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  backButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(24,24,38,0.08)' },
  backArrow: { fontSize: 20, color: C.textPrimary },
  topBadge: { backgroundColor: C.mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.72)', borderRadius: 999, borderWidth: 1, borderColor: C.mode === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(24,24,38,0.08)', paddingHorizontal: 14, paddingVertical: 9 },
  topBadgeText: { color: C.textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  header: { marginBottom: 22 },
  heroCard: { backgroundColor: C.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.78)', borderRadius: 28, paddingHorizontal: 22, paddingVertical: 24, borderWidth: 1, borderColor: C.mode === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(24,24,38,0.08)', overflow: 'hidden' },
  heroGlow: { position: 'absolute', top: -32, right: -22, width: 150, height: 150, borderRadius: 75, backgroundColor: C.accent, opacity: 0.14 },
  heroEyebrow: { color: C.blue, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10, textAlign: 'center' },
  titleRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'baseline', marginBottom: 10 },
  titleWhite: { fontSize: 44, fontWeight: '800', color: C.textPrimary, letterSpacing: -1.5 },
  titleAccent: { fontSize: 54, fontWeight: '900', color: '#FFE66D', letterSpacing: -2, marginHorizontal: 2, transform: [{ rotate: '-3deg' }], textShadowColor: 'rgba(255,230,109,0.4)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 12 },
  subtitle: { fontSize: 15, color: C.textSecondary, textAlign: 'center', letterSpacing: 0.2, lineHeight: 22 },
  heroPills: { flexDirection: 'row', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginTop: 18 },
  heroPill: { backgroundColor: C.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(24,24,38,0.04)', borderRadius: 999, borderWidth: 1, borderColor: C.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(24,24,38,0.06)', paddingHorizontal: 12, paddingVertical: 8 },
  heroPillText: { color: C.textSecondary, fontSize: 11, fontWeight: '700' },
  card: { backgroundColor: C.mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.78)', borderRadius: 30, padding: 20, borderWidth: 1, borderColor: C.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(24,24,38,0.08)', overflow: 'hidden', marginBottom: 16 },
  cardGlow: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: C.accent, opacity: 0.08 },
  sectionShell: { backgroundColor: C.mode === 'dark' ? 'rgba(10,10,28,0.34)' : 'rgba(245,247,255,0.9)', borderRadius: 22, padding: 18, borderWidth: 1, borderColor: C.mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(24,24,38,0.06)', marginBottom: 16 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sectionEyebrow: { color: C.blue, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.1 },
  sectionHint: { color: C.textMuted, fontSize: 11, fontWeight: '600' },
  sectionTitle: { color: C.textPrimary, fontSize: 18, fontWeight: '800', letterSpacing: -0.4, marginBottom: 6 },
  sectionSubtitle: { color: C.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: 16 },
  inputWrapper: { marginBottom: 20 },
  profileInputWrapper: { marginBottom: 0, alignItems: 'center' },
  inputLabel: { fontSize: 11, fontWeight: '600', color: C.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 },
  requiredStar: { color: '#FF6B8A', fontSize: 13 },
  optionalText: { color: C.textMuted, fontSize: 11, fontWeight: '400', textTransform: 'none' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(24,24,38,0.04)', borderRadius: 16, borderWidth: 1, borderColor: C.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(24,24,38,0.08)', overflow: 'hidden' },
  inputPrefix: { fontSize: 16, color: C.textSecondary, paddingLeft: 16 },
  input: { flex: 1, padding: 14, fontSize: 16, color: C.textPrimary },
  inputWithPrefix: { paddingLeft: 6 },
  placeholderText: { color: C.textMuted },
  dropdownIcon: { fontSize: 20, color: C.textMuted, paddingRight: 14 },
  textArea: { minHeight: 80, paddingTop: 14 },
  passwordInput: { paddingRight: 50 },
  eyeButton: { position: 'absolute', right: 12, padding: 8 },
  eyeButtonText: { fontSize: 22 },
  requirementsContainer: { marginTop: 8, marginBottom: 0, padding: 16, backgroundColor: C.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(24,24,38,0.03)', borderRadius: 16, borderWidth: 1, borderColor: C.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(24,24,38,0.06)' },
  requirementsTitle: { fontSize: 13, fontWeight: '600', color: C.textSecondary, marginBottom: 12 },
  requirementRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  requirementIcon: { width: 20, fontSize: 13, color: C.textMuted, marginRight: 8 },
  requirementText: { fontSize: 13, color: C.textSecondary, flex: 1 },
  requirementMet: { color: '#91EAE4' },
  buttonWrapper: { marginTop: 8, borderRadius: 18, overflow: 'hidden', shadowColor: '#86A8E7', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
  gradientButton: { padding: 17, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  toggleContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  toggleText: { color: C.textSecondary, fontSize: 14 },
  toggleButton: { color: '#FFE66D', fontSize: 14, fontWeight: '700' },
  termsText: { marginTop: 24, textAlign: 'center', color: C.textMuted, fontSize: 11, lineHeight: 16 },
  requiredNote: { marginTop: 12, textAlign: 'center', color: C.textMuted, fontSize: 11 },
  profileImageContainer: { alignItems: 'center', justifyContent: 'center' },
  profileImage: { width: 108, height: 108, borderRadius: 54, borderWidth: 2, borderColor: 'rgba(145,234,228,0.45)' },
  profileImagePlaceholder: { width: 108, height: 108, borderRadius: 54, backgroundColor: C.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(24,24,38,0.04)', borderWidth: 2, borderColor: 'rgba(145,234,228,0.3)', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  profileImagePlaceholderText: { fontSize: 30, marginBottom: 4 },
  profileImagePlaceholderSubtext: { fontSize: 10, color: C.textSecondary, textAlign: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: C.mode === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(24,24,38,0.22)' },
  modalContent: { backgroundColor: C.cardBright, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: '55%', borderTopWidth: 1, borderColor: C.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(24,24,38,0.08)' },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(24,24,38,0.2)', alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(24,24,38,0.08)' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: C.textPrimary, letterSpacing: -0.3 },
  modalClose: { fontSize: 18, color: C.textSecondary },
  pronounOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: C.mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(24,24,38,0.06)' },
  pronounOptionText: { fontSize: 15, color: C.textPrimary, fontWeight: '500' },
  pronounSelected: { fontSize: 15, color: '#91EAE4', fontWeight: '700' },
})
}
