import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Lock,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  AlertCircle,
} from 'lucide-react-native';

import { authApi } from '../../apis/apis';
import { colors, radii } from '../../theme';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setErrorMessage('Email and password are required.');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await authApi.login({
        email: trimmedEmail,
        password: trimmedPassword,
      });
      router.replace('/pages/mainpage');
    } catch (error: any) {
      setErrorMessage(error?.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = isLoading || !email.trim() || !password.trim();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 16) + 8,
            paddingBottom: Math.max(insets.bottom, 16) + 12,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <View style={styles.brandChip}>
            <Shield size={13} color={colors.accent} strokeWidth={2.2} />
            <Text style={styles.brandChipText}>PASSUP VAULT</Text>
          </View>
        </View>

        <View style={styles.centerContent}>
          <View style={styles.logoBadge}>
            <Lock size={30} color={colors.accent} strokeWidth={2} />
          </View>

          <Text style={styles.brand}>PassUp</Text>
          <Text style={styles.title}>Sign in to your vault</Text>
          <Text style={styles.description}>
            Authenticate your account, then unlock encrypted passwords with your
            Master Key.
          </Text>

          {errorMessage ? (
            <View style={styles.errorContainer}>
              <AlertCircle size={16} color={colors.danger} strokeWidth={2} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputContainer}>
                <Mail
                  size={16}
                  color={colors.textDim}
                  style={styles.inputIcon}
                />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.textDim}
                  editable={!isLoading}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  returnKeyType="next"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Account Password</Text>
              <View style={styles.inputContainer}>
                <KeyRound
                  size={16}
                  color={colors.textDim}
                  style={styles.inputIcon}
                />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter password"
                  placeholderTextColor={colors.textDim}
                  editable={!isLoading}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  style={[styles.input, styles.passwordInput]}
                />
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowPassword((v) => !v)}
                  disabled={isLoading}
                  style={styles.eyeButton}
                >
                  {showPassword ? (
                    <EyeOff size={16} color={colors.textMuted} />
                  ) : (
                    <Eye size={16} color={colors.textMuted} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={isDisabled}
              onPress={handleSubmit}
              style={[styles.loginButton, isDisabled && styles.loginButtonDisabled]}
            >
              {isLoading ? (
                <>
                  <ActivityIndicator size="small" color={colors.text} />
                  <Text style={styles.loginButtonText}>Signing in…</Text>
                </>
              ) : (
                <>
                  <Text style={styles.loginButtonText}>Sign in to vault</Text>
                  <ArrowRight size={16} color={colors.text} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.footerText}>
          End-to-end encrypted · Master Key never stored as plaintext
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  glowTop: {
    position: 'absolute',
    top: -80,
    left: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(37,99,235,0.16)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -60,
    right: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(56,189,248,0.08)',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  topBar: {
    marginBottom: 12,
  },
  brandChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  brandChipText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  centerContent: {
    flex: 1,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  logoBadge: {
    width: 68,
    height: 68,
    marginBottom: 14,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  brand: {
    color: colors.accent,
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.8,
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  errorContainer: {
    width: '100%',
    marginBottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radii.md,
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#fecaca',
    fontSize: 12,
    lineHeight: 17,
  },
  form: {
    width: '100%',
  },
  field: {
    marginBottom: 14,
  },
  label: {
    marginBottom: 6,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  inputContainer: {
    width: '100%',
    height: 52,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    marginLeft: 14,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 10,
    color: colors.text,
    fontSize: 14,
  },
  passwordInput: {
    paddingRight: 4,
  },
  eyeButton: {
    width: 44,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButton: {
    width: '100%',
    minHeight: 50,
    marginTop: 4,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loginButtonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  footerText: {
    color: colors.textDim,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
  },
});
