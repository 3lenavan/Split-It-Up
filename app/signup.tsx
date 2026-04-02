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
  View,
} from 'react-native'
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

export default function SignUpScreen() {
  const router = useRouter()

  // ── All original state — untouched ──────────────────────────
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
  const [passwordChecks, setPasswordChecks] = useState({
  length: false,
  match: false,
  hasNumber: false,
  hasLetter: false,
})

  // ── All original animations — untouched ─────────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const scaleAnim = useRef(new Animated.Value(0.95)).current
  const formItemsAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
    ]).start()
    Animated.stagger(100, [
      Animated.timing(formItemsAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start()
  }, [])

  // ── All original logic — untouched ──────────────────────────
  const validatePassword = (text: string) => {
    setPassword(text)
    setPasswordChecks({ length: text.length >= 6, hasNumber: /\d/.test(text), hasLetter: /[a-zA-Z]/.test(text), match: text === confirmPassword && text.length > 0 })
  }

  const validateConfirmPassword = (text: string) => {
    setConfirmPassword(text)
    setPasswordChecks(prev => ({ ...prev, match: text === password && text.length > 0 }))
  }

  const selectPronoun = (pronounValue: string) => {
    if (pronounValue === 'other') { setShowCustomPronoun(true); setPronouns('') }
    else { setPronouns(pronounValue); setShowCustomPronoun(false); setCustomPronouns('') }
    setPronounModalVisible(false)
  }

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
  Alert.alert('Permission needed', 'Please grant permission to access your photos')
  return
}
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 })
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
      { text: 'Cancel', style: 'cancel' }
    ])
  }

  const validateInputs = () => {
    if (!fullName || !username || !email || !password || !confirmPassword) { Alert.alert('Error', 'Please fill in all required fields'); return false }
    if (!pronouns && !customPronouns) { Alert.alert('Error', 'Please select your pronouns'); return false }
    if (password.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters'); return false }
    if (!passwordChecks.hasNumber || !passwordChecks.hasLetter) { Alert.alert('Error', 'Password must contain both letters and numbers'); return false }
    if (password !== confirmPassword) { Alert.alert('Error', 'Passwords do not match'); return false }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) { Alert.alert('Error', 'Please enter a valid email address'); return false }
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
      options: {
        data: {
          full_name: cleanFullName,
          username: cleanUsername,
        },
      },
    })

    setLoading(false)

    if (error || !data.user) {
      return Alert.alert('Sign up error', error?.message ?? 'No user returned')
    }

    Alert.alert('Success!', 'Your account has been created! Please login.', [
      {
        text: 'Go to Login',
        onPress: () => router.push('/auth'),
      },
    ])
  } catch (err: any) {
    setLoading(false)
    Alert.alert('Error', err?.message ?? 'Something went wrong')
  }
}

  const navigateToLogin = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -50, duration: 300, useNativeDriver: true }),
    ]).start(() => { router.push('/auth') })
  }

  // ── JSX — same structure, dark theme styles ──────────────────
  return (
    <View style={styles.root}>
      <LinearGradient colors={['#0F0C29', '#1a1a4e', '#24243e']} style={StyleSheet.absoluteFillObject} />

      {/* Static orbs — pointerEvents="none" so they never block touches */}
      <View pointerEvents="none" style={styles.orb1} />
      <View pointerEvents="none" style={styles.orb2} />
      <View pointerEvents="none" style={styles.orb3} />

      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
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
                bouncesZoom={true}
                decelerationRate="normal"
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.formContainer}>
                  {/* Back button */}
<TouchableOpacity onPress={navigateToLogin} style={styles.backButton}>
  <Text style={styles.backArrow}>←</Text>
</TouchableOpacity>
                  {/* Header */}
                  <Animated.View
                    pointerEvents="box-none"
                    style={[styles.header, { opacity: fadeAnim, transform: [{ translateX: slideAnim.interpolate({ inputRange: [0, 50], outputRange: [0, 20] }) }] }]}
                  >
                    <View style={styles.titleRow}>
                      <Text style={styles.titleWhite}>Split</Text>
                      <Text style={styles.titleAccent}>It</Text>
                      <Text style={styles.titleWhite}>Up</Text>
                    </View>
                    <Text style={styles.subtitle}>Create your account</Text>
                  </Animated.View>

                  {/* Form card */}
                  <View style={styles.card}>
                    <View style={styles.cardGlow} />

                    {/* Profile Picture */}
                    <Animated.View
                      pointerEvents="box-none"
                      style={[styles.inputWrapper, { opacity: fadeAnim, transform: [{ scale: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] }]}
                    >
                      <Text style={styles.inputLabel}>Profile Picture</Text>
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

                    {/* Text fields */}
                    {(() => {
                      type FieldConfig = {
                        label: string; required?: boolean; value: string
                        setter: (text: string) => void; placeholder: string
                        prefix?: string; keyboard?: React.ComponentProps<typeof TextInput>['keyboardType']
                      }
                      const fields: FieldConfig[] = [
                        { label: 'Full Name', required: true, value: fullName, setter: setFullName, placeholder: 'Your name...' },
                        { label: 'Username', required: true, value: username, setter: setUsername, placeholder: 'username...', prefix: '@' },
                        { label: 'Email', required: true, value: email, setter: setEmail, placeholder: 'your@email.com', keyboard: 'email-address' },
                      ]
                      return fields.map((field, index) => (
                        <Animated.View
                          key={field.label}
                          pointerEvents="box-none"
                          style={[styles.inputWrapper, { opacity: fadeAnim, transform: [{ translateX: slideAnim.interpolate({ inputRange: [0, 50], outputRange: [0, 10 * (index + 1)] }) }] }]}
                        >
                          <Text style={styles.inputLabel}>
                            {field.label} {field.required && <Text style={styles.requiredStar}>*</Text>}
                          </Text>
                          <View style={styles.inputContainer}>
                            {field.prefix && <Text style={styles.inputPrefix}>{field.prefix}</Text>}
                            <TextInput
                              placeholder={field.placeholder}
                              placeholderTextColor="rgba(255,255,255,0.3)"
                              autoCapitalize="none"
                              keyboardType={field.keyboard || 'default'}
                              value={field.value}
                              onChangeText={field.setter}
                              style={[styles.input, field.prefix && styles.inputWithPrefix]}
                              editable={!loading}
                            />
                          </View>
                        </Animated.View>
                      ))
                    })()}

                    {/* Pronouns */}
                    <Animated.View
                      pointerEvents="box-none"
                      style={[styles.inputWrapper, { opacity: fadeAnim, transform: [{ translateX: slideAnim.interpolate({ inputRange: [0, 50], outputRange: [0, 40] }) }] }]}
                    >
                      <Text style={styles.inputLabel}>Pronouns <Text style={styles.requiredStar}>*</Text></Text>
                      <TouchableOpacity style={styles.inputContainer} onPress={() => setPronounModalVisible(true)}>
                        <Text style={[styles.input, !pronouns && !customPronouns && styles.placeholderText]}>
                          {showCustomPronoun ? customPronouns || 'Enter your pronouns' : pronouns || 'Select pronouns'}
                        </Text>
                        <Text style={styles.dropdownIcon}>›</Text>
                      </TouchableOpacity>
                    </Animated.View>

                    {/* Custom pronouns */}
                    {showCustomPronoun && (
                      <Animated.View
                        pointerEvents="box-none"
                        style={[styles.inputWrapper, { opacity: fadeAnim, transform: [{ translateX: slideAnim.interpolate({ inputRange: [0, 50], outputRange: [0, 50] }) }] }]}
                      >
                        <Text style={styles.inputLabel}>Custom Pronouns</Text>
                        <View style={styles.inputContainer}>
                          <TextInput
                            placeholder="e.g., xe/xem, fae/faer"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            value={customPronouns}
                            onChangeText={setCustomPronouns}
                            style={styles.input}
                            editable={!loading}
                          />
                        </View>
                      </Animated.View>
                    )}

                    {/* Bio */}
                    <Animated.View
                      pointerEvents="box-none"
                      style={[styles.inputWrapper, { opacity: fadeAnim, transform: [{ translateX: slideAnim.interpolate({ inputRange: [0, 50], outputRange: [0, 60] }) }] }]}
                    >
                      <Text style={styles.inputLabel}>Bio <Text style={styles.optionalText}>(optional)</Text></Text>
                      <View style={styles.inputContainer}>
                        <TextInput
                          placeholder="Tell us a little about yourself..."
                          placeholderTextColor="rgba(255,255,255,0.3)"
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

                    {/* Password fields */}
                    {[
                      { label: 'Password', value: password, setter: validatePassword, show: showPassword, toggle: setShowPassword },
                      { label: 'Confirm Password', value: confirmPassword, setter: validateConfirmPassword, show: showConfirmPassword, toggle: setShowConfirmPassword },
                    ].map((field, index) => (
                      <Animated.View
                        key={field.label}
                        pointerEvents="box-none"
                        style={[styles.inputWrapper, { opacity: fadeAnim, transform: [{ translateX: slideAnim.interpolate({ inputRange: [0, 50], outputRange: [0, 70 + (index * 10)] }) }] }]}
                      >
                        <Text style={styles.inputLabel}>{field.label} <Text style={styles.requiredStar}>*</Text></Text>
                        <View style={styles.inputContainer}>
                          <TextInput
                            placeholder="••••••••"
                            placeholderTextColor="rgba(255,255,255,0.3)"
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

                    {/* Password requirements */}
                    <Animated.View
                      pointerEvents="box-none"
                      style={[styles.requirementsContainer, { opacity: fadeAnim, transform: [{ scale: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] }]}
                    >
                      <Text style={styles.requirementsTitle}>Password must:</Text>
                      {[
                        { check: passwordChecks.length, text: 'Be at least 6 characters' },
                        { check: passwordChecks.hasLetter, text: 'Contain at least one letter' },
                        { check: passwordChecks.hasNumber, text: 'Contain at least one number' },
                        { check: passwordChecks.match, text: 'Passwords match' },
                      ].map((req, index) => (
                        <View key={index} style={styles.requirementRow}>
                          <Text style={[styles.requirementIcon, req.check && styles.requirementMet]}>{req.check ? '✓' : '○'}</Text>
                          <Text style={[styles.requirementText, req.check && styles.requirementMet]}>{req.text}</Text>
                        </View>
                      ))}
                    </Animated.View>

                    {/* Sign up button */}
                    <Animated.View
                      pointerEvents="box-none"
                      style={[styles.buttonWrapper, { opacity: fadeAnim, transform: [{ scale: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] }]}
                    >
                      <TouchableOpacity onPress={signUp} disabled={loading}>
                        <LinearGradient colors={['#7F7FD5', '#86A8E7', '#91EAE4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientButton}>
                          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account →</Text>}
                        </LinearGradient>
                      </TouchableOpacity>
                    </Animated.View>

                    {/* Login link */}
                    <Animated.View
                      pointerEvents="box-none"
                      style={[styles.toggleContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 50], outputRange: [0, 10] }) }] }]}
                    >
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
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Pronoun Modal */}
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
                  {pronouns === item.value && <Text style={styles.pronounSelected}>✓</Text>}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F0C29' },
  safeArea: { flex: 1 },
  container: { flex: 1 },
  gradientWrapper: { flex: 1 },
  content: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  formContainer: { flex: 1, paddingHorizontal: 24, paddingTop: 40 },

  // Orbs
  orb1: { position: 'absolute', top: -60, left: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: '#7F7FD5', opacity: 0.18 },
  orb2: { position: 'absolute', top: '35%', right: -80, width: 180, height: 180, borderRadius: 90, backgroundColor: '#86A8E7', opacity: 0.13 },
  orb3: { position: 'absolute', bottom: 100, left: '15%', width: 150, height: 150, borderRadius: 75, backgroundColor: '#91EAE4', opacity: 0.1 },

  // Header / title
  header: { marginBottom: 24 },
  titleRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'baseline', marginBottom: 6 },
  titleWhite: { fontSize: 44, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1.5 },
  titleAccent: { fontSize: 54, fontWeight: '900', color: '#FFE66D', letterSpacing: -2, marginHorizontal: 2, transform: [{ rotate: '-3deg' }], textShadowColor: 'rgba(255,230,109,0.4)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 12 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.5)', textAlign: 'center', letterSpacing: 0.3 },

  // Card
  card: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 28, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', overflow: 'hidden', marginBottom: 16 },
  cardGlow: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: '#7F7FD5', opacity: 0.08 },

  // Inputs
  inputWrapper: { marginBottom: 20 },
  inputLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 },
  requiredStar: { color: '#FF6B8A', fontSize: 13 },
  optionalText: { color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: '400', textTransform: 'none' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' },
  inputPrefix: { fontSize: 16, color: 'rgba(255,255,255,0.6)', paddingLeft: 16 },
  input: { flex: 1, padding: 14, fontSize: 16, color: '#FFF' },
  inputWithPrefix: { paddingLeft: 6 },
  placeholderText: { color: 'rgba(255,255,255,0.3)' },
  dropdownIcon: { fontSize: 20, color: 'rgba(255,255,255,0.4)', paddingRight: 14 },
  textArea: { minHeight: 80, paddingTop: 14 },
  passwordInput: { paddingRight: 50 },
  eyeButton: { position: 'absolute', right: 12, padding: 8 },
  eyeButtonText: { fontSize: 22 },

  // Password requirements
  requirementsContainer: { marginTop: 8, marginBottom: 24, padding: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  requirementsTitle: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.6)', marginBottom: 12 },
  requirementRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  requirementIcon: { width: 20, fontSize: 13, color: 'rgba(255,255,255,0.3)', marginRight: 8 },
  requirementText: { fontSize: 13, color: 'rgba(255,255,255,0.4)', flex: 1 },
  requirementMet: { color: '#91EAE4' },

  // Button
  buttonWrapper: { marginTop: 8, borderRadius: 16, overflow: 'hidden', shadowColor: '#86A8E7', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
  gradientButton: { padding: 17, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },

  // Toggle
  toggleContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  toggleText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  toggleButton: { color: '#FFE66D', fontSize: 14, fontWeight: '700' },

  // Footer
  termsText: { marginTop: 24, textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 11, lineHeight: 16 },
  requiredNote: { marginTop: 12, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 11 },

  // Profile image
  profileImageContainer: { alignItems: 'center', marginBottom: 8 },
  profileImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: 'rgba(145,234,228,0.4)' },
  profileImagePlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 2, borderColor: 'rgba(145,234,228,0.3)', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  profileImagePlaceholderText: { fontSize: 30, marginBottom: 4 },
  profileImagePlaceholderSubtext: { fontSize: 10, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContent: { backgroundColor: '#1a1a4e', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: '55%', borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#FFF', letterSpacing: -0.3 },
  modalClose: { fontSize: 18, color: 'rgba(255,255,255,0.5)' },
  pronounOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  pronounOptionText: { fontSize: 15, color: '#FFF', fontWeight: '500' },
  pronounSelected: { fontSize: 15, color: '#91EAE4', fontWeight: '700' },
  backButton: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: 'rgba(255,255,255,0.08)',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 16,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.12)',
},
backArrow: {
  fontSize: 20,
  color: '#FFFFFF',
},
})