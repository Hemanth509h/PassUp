import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { KeyRound, AlertTriangle, X, Shield } from 'lucide-react-native';
import { colors, radii, spacing } from '../theme';

type Props = {
  visible: boolean;
  isLoading?: boolean;
  isSetup?: boolean;
  /** When true, user cannot dismiss without setting a key */
  required?: boolean;
  onClose: () => void;
  onSubmit: (key: string) => Promise<void>;
};

export function MasterKeyModal({
  visible,
  isLoading,
  isSetup,
  required,
  onClose,
  onSubmit,
}: Props) {
  const [key, setKey] = useState('');
  const [confirmKey, setConfirmKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) {
      setKey('');
      setConfirmKey('');
      setError(null);
      setSubmitting(false);
    }
  }, [visible]);

  const handleClose = () => {
    if (required && isSetup) return;
    setKey('');
    setConfirmKey('');
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    setError(null);
    if (!key.trim()) {
      setError('Enter your Master Key.');
      return;
    }
    if (isSetup && key.trim().length < 8) {
      setError('Master Key must be at least 8 characters.');
      return;
    }
    if (isSetup && key !== confirmKey) {
      setError('Keys do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(key.trim());
      setKey('');
      setConfirmKey('');
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Unable to unlock vault.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modal}>
          <View style={styles.header}>
            <View style={styles.iconBadge}>
              {isSetup ? (
                <Shield size={22} color={colors.accent} />
              ) : (
                <KeyRound size={22} color={colors.accent} />
              )}
            </View>
            {!(required && isSetup) ? (
              <Pressable onPress={handleClose} style={styles.closeBtn} hitSlop={8}>
                <X size={18} color={colors.textMuted} />
              </Pressable>
            ) : (
              <View style={styles.requiredPill}>
                <Text style={styles.requiredPillText}>Required</Text>
              </View>
            )}
          </View>

          <Text style={styles.title}>
            {isSetup ? 'Set Your Master Key' : 'Unlock Vault'}
          </Text>
          <Text style={styles.description}>
            {isSetup
              ? 'No Master Key is set yet. Create one now to encrypt every password with AES-256-GCM. You will need this key each time you unlock the vault.'
              : 'Enter your Master Key to decrypt vault items in memory.'}
          </Text>

          {isSetup ? (
            <View style={styles.tipsBox}>
              <Text style={styles.tipsTitle}>Choose a strong key</Text>
              <Text style={styles.tipsText}>
                At least 8 characters · Store it safely · Not the same as your
                account password
              </Text>
            </View>
          ) : null}

          {error ? (
            <View style={styles.errorBox}>
              <AlertTriangle size={14} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>
            {isSetup ? 'New Master Key' : 'Master Key'}
          </Text>
          <TextInput
            value={key}
            onChangeText={setKey}
            placeholder={isSetup ? 'Create a strong Master Key' : 'Enter Master Key'}
            placeholderTextColor={colors.textDim}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            style={styles.input}
            editable={!submitting && !isLoading}
            onSubmitEditing={isSetup ? undefined : handleSubmit}
          />

          {isSetup ? (
            <>
              <Text style={styles.label}>Confirm Master Key</Text>
              <TextInput
                value={confirmKey}
                onChangeText={setConfirmKey}
                placeholder="Re-enter Master Key"
                placeholderTextColor={colors.textDim}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
                editable={!submitting && !isLoading}
                onSubmitEditing={handleSubmit}
              />
            </>
          ) : null}

          <Pressable
            style={[
              styles.submit,
              (submitting || isLoading) && styles.submitDisabled,
            ]}
            onPress={handleSubmit}
            disabled={submitting || isLoading}
          >
            {submitting || isLoading ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={styles.submitText}>
                {isSetup ? 'Save Master Key & Unlock' : 'Unlock Vault'}
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modal: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    padding: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: radii.lg,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: 'rgba(125,211,252,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requiredPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.35)',
  },
  requiredPillText: {
    color: colors.warning,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  description: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  tipsBox: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  tipsTitle: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  tipsText: {
    color: colors.textDim,
    fontSize: 11,
    lineHeight: 16,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    borderRadius: radii.sm,
    padding: 10,
    marginBottom: spacing.md,
  },
  errorText: {
    flex: 1,
    color: colors.danger,
    fontSize: 12,
    lineHeight: 16,
  },
  input: {
    height: 50,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    color: colors.text,
    paddingHorizontal: spacing.md,
    fontSize: 14,
    marginBottom: spacing.md,
  },
  submit: {
    height: 50,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
});
