import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { AlertTriangle, Check, Copy, Eye, EyeOff, X } from 'lucide-react-native';

import type { CreateVaultItemInput, ItemCategory, VaultItem } from '../app/types';
import { colors, radii, spacing } from '../theme';

export type VaultItemModalMode = 'view' | 'edit' | 'create';

type Props = {
  visible: boolean;
  mode?: VaultItemModalMode;
  initialItem?: VaultItem | null;
  onClose: () => void;
  onSubmit: (input: CreateVaultItemInput) => Promise<void>;
  onCopy?: (text: string, label: string) => Promise<void> | void;
};

const CATEGORIES: { id: ItemCategory; label: string }[] = [
  { id: 'login', label: 'Login' },
  { id: 'card', label: 'Card' },
  { id: 'api_key', label: 'API Key' },
  { id: 'note', label: 'Note' },
];

const emptyForm = {
  title: '',
  category: 'login' as ItemCategory,
  username: '',
  email: '',
  password: '',
  url: '',
  notes: '',
  cardNumber: '',
  cardholderName: '',
  expiryDate: '',
  cvv: '',
};

export function VaultItemModal({
  visible,
  mode = 'create',
  initialItem,
  onClose,
  onSubmit,
  onCopy,
}: Props) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeMode, setActiveMode] = useState<VaultItemModalMode>(mode);
  const [showSecrets, setShowSecrets] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setActiveMode(initialItem ? mode : 'create');
    setShowSecrets(false);
    setCopiedKey(null);
    if (initialItem) {
      setForm({
        title: initialItem.title || '',
        category: initialItem.category || 'login',
        username: initialItem.username || '',
        email: initialItem.email || '',
        password: initialItem.password || '',
        url: initialItem.url || '',
        notes: initialItem.notes || '',
        cardNumber: initialItem.cardDetails?.cardNumber || '',
        cardholderName: initialItem.cardDetails?.cardholderName || '',
        expiryDate: initialItem.cardDetails?.expiryDate || '',
        cvv: initialItem.cardDetails?.cvv || '',
      });
    } else {
      setForm(emptyForm);
    }
    setError(null);
  }, [visible, initialItem, mode]);

  const update = (key: keyof typeof emptyForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCopy = async (text: string, label: string, key: string) => {
    if (!text || !onCopy) return;
    try {
      await onCopy(text, label);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Parent surfaces copy errors when needed.
    }
  };

  const handleSubmit = async () => {
    setError(null);
    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }

    const input: CreateVaultItemInput = {
      title: form.title.trim(),
      category: form.category,
      username: form.username.trim() || undefined,
      email: form.email.trim() || undefined,
      password: form.password || undefined,
      url: form.url.trim() || undefined,
      notes: form.notes.trim() || undefined,
      favorite: initialItem?.favorite,
    };

    if (form.category === 'card') {
      input.cardDetails = {
        cardNumber: form.cardNumber.trim(),
        cardholderName: form.cardholderName.trim(),
        expiryDate: form.expiryDate.trim(),
        cvv: form.cvv.trim(),
      };
    }

    setSubmitting(true);
    try {
      await onSubmit(input);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save item.');
    } finally {
      setSubmitting(false);
    }
  };

  const isView = activeMode === 'view' && !!initialItem;
  const title =
    activeMode === 'view'
      ? form.title || 'Vault Item'
      : initialItem
        ? 'Edit Vault Item'
        : 'Add Vault Item';

  const renderViewField = (
    label: string,
    value: string,
    opts?: { secret?: boolean; copyKey?: string; copyLabel?: string },
  ) => {
    if (!value) return null;
    const display =
      opts?.secret && !showSecrets ? '•'.repeat(Math.min(value.length, 12)) : value;
    return (
      <View style={styles.viewField} key={label}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.viewValueRow}>
          <Text style={styles.viewValue} selectable>
            {display}
          </Text>
          {opts?.secret ? (
            <Pressable
              style={styles.iconAction}
              onPress={() => setShowSecrets((v) => !v)}
              hitSlop={6}
            >
              {showSecrets ? (
                <EyeOff size={14} color={colors.textMuted} />
              ) : (
                <Eye size={14} color={colors.textMuted} />
              )}
            </Pressable>
          ) : null}
          {opts?.copyKey && onCopy ? (
            <Pressable
              style={styles.iconAction}
              onPress={() =>
                handleCopy(value, opts.copyLabel || label, opts.copyKey!)
              }
              hitSlop={6}
            >
              {copiedKey === opts.copyKey ? (
                <Check size={14} color={colors.success} />
              ) : (
                <Copy size={14} color={colors.accent} />
              )}
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <X size={18} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {error ? (
              <View style={styles.errorBox}>
                <AlertTriangle size={14} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {isView ? (
              <>
                <View style={styles.viewBadge}>
                  <Text style={styles.viewBadgeText}>
                    {CATEGORIES.find((c) => c.id === form.category)?.label ||
                      form.category}
                  </Text>
                </View>

                {renderViewField('Username', form.username, {
                  copyKey: 'username',
                  copyLabel: 'Username',
                })}
                {renderViewField('Email', form.email, {
                  copyKey: 'email',
                  copyLabel: 'Email',
                })}
                {renderViewField(
                  form.category === 'api_key' ? 'API Key / Secret' : 'Password',
                  form.password,
                  {
                    secret: true,
                    copyKey: 'password',
                    copyLabel:
                      form.category === 'api_key' ? 'API Key' : 'Password',
                  },
                )}
                {renderViewField('URL', form.url, {
                  copyKey: 'url',
                  copyLabel: 'URL',
                })}
                {renderViewField('Card number', form.cardNumber, {
                  secret: true,
                  copyKey: 'cardNumber',
                  copyLabel: 'Card Number',
                })}
                {renderViewField('Cardholder name', form.cardholderName)}
                {renderViewField('Expiry', form.expiryDate)}
                {renderViewField('CVV', form.cvv, { secret: true })}
                {renderViewField(
                  form.category === 'note' ? 'Secure note' : 'Notes',
                  form.notes,
                )}
              </>
            ) : (
              <>
                <View style={styles.categoryRow}>
                  {CATEGORIES.map((cat) => {
                    const active = form.category === cat.id;
                    return (
                      <Pressable
                        key={cat.id}
                        style={[
                          styles.categoryChip,
                          active && styles.categoryChipActive,
                        ]}
                        onPress={() => update('category', cat.id)}
                      >
                        <Text
                          style={[
                            styles.categoryText,
                            active && styles.categoryTextActive,
                          ]}
                        >
                          {cat.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.label}>Title</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. GitHub"
                  placeholderTextColor={colors.textDim}
                  value={form.title}
                  onChangeText={(v) => update('title', v)}
                />

                {(form.category === 'login' || form.category === 'api_key') && (
                  <>
                    <Text style={styles.label}>Username</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Username"
                      placeholderTextColor={colors.textDim}
                      autoCapitalize="none"
                      value={form.username}
                      onChangeText={(v) => update('username', v)}
                    />
                    <Text style={styles.label}>Email (optional)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="email@example.com"
                      placeholderTextColor={colors.textDim}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      value={form.email}
                      onChangeText={(v) => update('email', v)}
                    />
                    <Text style={styles.label}>
                      {form.category === 'api_key'
                        ? 'API Key / Secret'
                        : 'Password'}
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholder={
                        form.category === 'api_key'
                          ? 'Secret value'
                          : 'Password'
                      }
                      placeholderTextColor={colors.textDim}
                      secureTextEntry
                      autoCapitalize="none"
                      value={form.password}
                      onChangeText={(v) => update('password', v)}
                    />
                    <Text style={styles.label}>URL (optional)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="https://"
                      placeholderTextColor={colors.textDim}
                      autoCapitalize="none"
                      value={form.url}
                      onChangeText={(v) => update('url', v)}
                    />
                  </>
                )}

                {form.category === 'card' && (
                  <>
                    <Text style={styles.label}>Card number</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="•••• •••• •••• ••••"
                      placeholderTextColor={colors.textDim}
                      keyboardType="number-pad"
                      value={form.cardNumber}
                      onChangeText={(v) => update('cardNumber', v)}
                    />
                    <Text style={styles.label}>Cardholder name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Name on card"
                      placeholderTextColor={colors.textDim}
                      value={form.cardholderName}
                      onChangeText={(v) => update('cardholderName', v)}
                    />
                    <Text style={styles.label}>Expiry</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="MM/YY"
                      placeholderTextColor={colors.textDim}
                      value={form.expiryDate}
                      onChangeText={(v) => update('expiryDate', v)}
                    />
                    <Text style={styles.label}>CVV</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="•••"
                      placeholderTextColor={colors.textDim}
                      secureTextEntry
                      keyboardType="number-pad"
                      value={form.cvv}
                      onChangeText={(v) => update('cvv', v)}
                    />
                  </>
                )}

                <Text style={styles.label}>
                  {form.category === 'note'
                    ? 'Secure note'
                    : 'Notes (optional)'}
                </Text>
                <TextInput
                  style={[styles.input, styles.notesInput]}
                  placeholder={
                    form.category === 'note'
                      ? 'Write your secure note…'
                      : 'Extra notes…'
                  }
                  placeholderTextColor={colors.textDim}
                  multiline
                  textAlignVertical="top"
                  value={form.notes}
                  onChangeText={(v) => update('notes', v)}
                />
              </>
            )}
          </ScrollView>

          <View style={styles.actions}>
            {isView ? (
              <>
                <Pressable style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelText}>Close</Text>
                </Pressable>
                <Pressable
                  style={styles.saveBtn}
                  onPress={() => setActiveMode('edit')}
                >
                  <Text style={styles.saveText}>Edit</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.saveBtn, submitting && styles.saveDisabled]}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color={colors.text} />
                  ) : (
                    <Text style={styles.saveText}>
                      {initialItem ? 'Save Changes' : 'Create Item'}
                    </Text>
                  )}
                </Pressable>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modal: {
    maxHeight: '90%',
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
    gap: 12,
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
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
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    borderRadius: radii.sm,
    padding: 10,
    marginBottom: 10,
  },
  errorText: {
    flex: 1,
    color: colors.danger,
    fontSize: 12,
  },
  viewBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 14,
  },
  viewBadgeText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  viewField: {
    marginBottom: 14,
  },
  viewValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 48,
  },
  viewValue: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
  },
  iconAction: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  categoryChip: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: colors.text,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    height: 48,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    color: colors.text,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  notesInput: {
    height: 100,
    paddingTop: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveDisabled: {
    opacity: 0.6,
  },
  saveText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
});
