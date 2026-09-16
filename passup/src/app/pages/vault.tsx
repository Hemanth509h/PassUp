import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search,
  Plus,
  Lock,
  Globe,
  CreditCard,
  FileText,
  Key,
  Star,
  Copy,
  Check,
  Shield,
  Trash2,
  KeyRound,
  Clock,
  Pencil,
  X,
  ChevronRight,
} from 'lucide-react-native';

import { MasterKeyModal } from '../../components/MasterKeyModal';
import { VaultItemModal } from '../../components/VaultItemModal';
import { useVault } from '../../context/VaultContext';
import { colors, radii, spacing } from '../../theme';
import type { CreateVaultItemInput, ItemCategory, VaultItem } from '../types';

export const Vaultpage: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    items,
    isUnlocked,
    isLoading,
    hasMasterKey,
    autoLockSecondsLeft,
    unlock,
    lock,
    extendAutoLock,
    createItem,
    updateItem,
    deleteItem,
    toggleFavorite,
    copyText,
  } = useVault();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | ItemCategory | 'favorites'
  >('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<VaultItem | null>(null);
  const [itemModalMode, setItemModalMode] = useState<'view' | 'edit' | 'create'>(
    'create',
  );

  const needsSetup = hasMasterKey === false;
  const topPad = Math.max(insets.top, Platform.OS === 'web' ? 24 : 12) + 20;

  const categories: {
    id: 'all' | ItemCategory | 'favorites';
    label: string;
    icon: React.ComponentType<any>;
  }[] = [
    { id: 'all', label: 'All', icon: Shield },
    { id: 'login', label: 'Logins', icon: Globe },
    { id: 'card', label: 'Cards', icon: CreditCard },
    { id: 'api_key', label: 'API Keys', icon: Key },
    { id: 'note', label: 'Notes', icon: FileText },
    { id: 'favorites', label: 'Starred', icon: Star },
  ];

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedCategory === 'favorites') {
        if (!item.favorite) return false;
      } else if (selectedCategory !== 'all') {
        if (item.category !== selectedCategory) return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      if (item.title?.toLowerCase().includes(q)) return true;
      if (!isUnlocked) return false;
      return (
        item.username?.toLowerCase().includes(q) ||
        item.email?.toLowerCase().includes(q) ||
        item.url?.toLowerCase().includes(q) ||
        item.notes?.toLowerCase().includes(q)
      );
    });
  }, [items, selectedCategory, searchQuery, isUnlocked]);

  const requireUnlock = () => setShowUnlockModal(true);

  const handleCopy = async (text: string, label: string, copyKey: string) => {
    if (!text) return;
    try {
      await copyText(text, label);
      setCopiedId(copyKey);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      Alert.alert('Copy failed', `Could not copy ${label}.`);
    }
  };

  const handleSaveItem = async (input: CreateVaultItemInput) => {
    if (!isUnlocked) {
      requireUnlock();
      return;
    }
    if (editingItem) await updateItem(editingItem.id, input);
    else await createItem(input);
  };

  const handleAddPress = () => {
    if (!isUnlocked) {
      requireUnlock();
      return;
    }
    setEditingItem(null);
    setItemModalMode('create');
    setShowItemModal(true);
  };

  const openItemView = (item: VaultItem) => {
    setEditingItem(item);
    setItemModalMode('view');
    setShowItemModal(true);
  };

  const openItemEdit = (item: VaultItem) => {
    setEditingItem(item);
    setItemModalMode('edit');
    setShowItemModal(true);
  };

  const getCategoryIcon = (category: ItemCategory) => {
    switch (category) {
      case 'card':
        return <CreditCard size={18} color="#38bdf8" />;
      case 'api_key':
        return <Key size={18} color="#818cf8" />;
      case 'note':
        return <FileText size={18} color="#2dd4bf" />;
      default:
        return <Globe size={18} color={colors.accent} />;
    }
  };

  const getItemSubtitle = (item: VaultItem) => {
    if (item.category === 'card') {
      return item.cardDetails?.cardNumber || 'Card details saved';
    }
    if (item.category === 'note') {
      return item.notes || 'Encrypted secure note';
    }
    return item.username || item.email || item.url || 'No username';
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerCopy}>
            <View style={styles.titleRow}>
              <Text style={styles.mainTitle}>My Vault</Text>
              {isUnlocked ? (
                <View style={styles.itemsBadge}>
                  <View style={styles.greenDot} />
                  <Text style={styles.itemsBadgeText}>
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </Text>
                </View>
              ) : (
                <View style={styles.encryptedBadge}>
                  <Lock size={11} color={colors.accent} />
                  <Text style={styles.encryptedText}>Encrypted</Text>
                </View>
              )}
            </View>
            <Text style={styles.headerDescription}>
              {isUnlocked
                ? 'Decrypted in secure device memory'
                : 'Protected with AES-256-GCM Master Key'}
            </Text>
          </View>

          <View style={styles.headerButtons}>
            {isUnlocked && autoLockSecondsLeft !== null && (
              <Pressable
                style={[
                  styles.timerButton,
                  autoLockSecondsLeft <= 30 && styles.timerDanger,
                ]}
                onPress={extendAutoLock}
              >
                <Clock
                  size={13}
                  color={autoLockSecondsLeft <= 30 ? colors.danger : '#38bdf8'}
                />
                <Text
                  style={[
                    styles.timerText,
                    autoLockSecondsLeft <= 30 && styles.timerDangerText,
                  ]}
                >
                  {formatTimer(autoLockSecondsLeft)}
                </Text>
              </Pressable>
            )}
            {isUnlocked ? (
              <>
                <Pressable style={styles.iconBtn} onPress={lock}>
                  <Lock size={16} color={colors.textSecondary} />
                </Pressable>
                <Pressable style={styles.primaryBtn} onPress={handleAddPress}>
                  <Plus size={15} color={colors.text} />
                  <Text style={styles.primaryBtnText}>Add</Text>
                </Pressable>
              </>
            ) : (
              <Pressable style={styles.unlockVaultBtn} onPress={requireUnlock}>
                <KeyRound size={15} color={colors.text} />
                <Text style={styles.unlockVaultBtnText}>
                  {needsSetup ? 'Set Master Key' : 'Unlock Vault'}
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {!isUnlocked ? (
          <Pressable style={styles.lockedBanner} onPress={requireUnlock}>
            <View style={styles.lockedBannerIcon}>
              <KeyRound size={18} color={colors.accent} />
            </View>
            <View style={styles.lockedBannerCopy}>
              <Text style={styles.lockedBannerTitle}>
                {needsSetup ? 'Master Key required' : 'Vault is Locked'}
              </Text>
              <Text style={styles.lockedBannerText}>
                {needsSetup
                  ? 'Create a Master Key to encrypt and decrypt vault items'
                  : 'Click to enter Master Key popup & decrypt'}
              </Text>
            </View>
            <Text style={styles.lockedBannerAction}>Unlock →</Text>
          </Pressable>
        ) : null}

        <View style={styles.searchContainer}>
          <Search size={16} color={colors.textDim} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search logins, cards, notes…"
            placeholderTextColor={colors.textDim}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <X size={16} color={colors.textDim} />
            </Pressable>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map((category) => {
            const selected = selectedCategory === category.id;
            const Icon = category.icon;
            return (
              <Pressable
                key={category.id}
                style={[
                  styles.categoryButton,
                  selected && styles.categoryButtonActive,
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Icon
                  size={13}
                  color={selected ? colors.text : colors.textMuted}
                />
                <Text
                  style={[
                    styles.categoryText,
                    selected && styles.categoryTextActive,
                  ]}
                >
                  {category.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.loadingText}>
            {isUnlocked ? 'Decrypting vault…' : 'Loading vault…'}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.itemsScroll}
          contentContainerStyle={styles.itemsContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Shield size={28} color={colors.textDim} />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery
                  ? 'No credentials match your search'
                  : needsSetup
                    ? 'Set up your vault'
                    : 'No items yet'}
              </Text>
              <Text style={styles.emptyDescription}>
                {searchQuery
                  ? 'Try another search term.'
                  : needsSetup
                    ? 'Create a Master Key to start saving encrypted logins, cards, and notes.'
                    : isUnlocked
                      ? 'Add a login, card, API key, or secure note to get started.'
                      : 'Unlock and add items to populate your encrypted vault.'}
              </Text>
              {needsSetup ? (
                <Pressable style={styles.unlockCta} onPress={requireUnlock}>
                  <KeyRound size={16} color={colors.text} />
                  <Text style={styles.unlockCtaText}>Create Master Key</Text>
                </Pressable>
              ) : isUnlocked ? (
                <Pressable style={styles.emptySecondary} onPress={handleAddPress}>
                  <Text style={styles.emptySecondaryText}>+ Create New Item</Text>
                </Pressable>
              ) : (
                <Pressable style={styles.unlockCta} onPress={requireUnlock}>
                  <KeyRound size={16} color={colors.text} />
                  <Text style={styles.unlockCtaText}>Unlock Vault</Text>
                </Pressable>
              )}
            </View>
          ) : (
            filteredItems.map((item) =>
              isUnlocked ? (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [
                    styles.itemCard,
                    pressed && styles.itemCardPressed,
                  ]}
                  onPress={() => openItemView(item)}
                >
                  <View style={styles.itemLeft}>
                    <View style={styles.categoryIcon}>
                      {getCategoryIcon(item.category)}
                    </View>
                    <View style={styles.itemTextContainer}>
                      <View style={styles.itemTitleRow}>
                        <Text style={styles.itemTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        {item.favorite ? (
                          <Star
                            size={13}
                            color={colors.warning}
                            fill={colors.warning}
                          />
                        ) : null}
                      </View>
                      <Text style={styles.itemSubtitle} numberOfLines={1}>
                        {getItemSubtitle(item)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.itemActions}>
                    <Pressable
                      style={styles.actionBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleFavorite(item.id).catch((err) =>
                          Alert.alert('Error', err?.message || 'Failed'),
                        );
                      }}
                    >
                      <Star
                        size={14}
                        color={item.favorite ? colors.warning : colors.textDim}
                        fill={item.favorite ? colors.warning : 'transparent'}
                      />
                    </Pressable>

                    {(item.username || item.email) && (
                      <Pressable
                        style={styles.actionBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleCopy(
                            item.username || item.email || '',
                            'Username',
                            `user-${item.id}`,
                          );
                        }}
                      >
                        {copiedId === `user-${item.id}` ? (
                          <Check size={14} color={colors.success} />
                        ) : (
                          <Text style={styles.userBtnText}>User</Text>
                        )}
                      </Pressable>
                    )}

                    {(item.password || item.cardDetails?.cardNumber) && (
                      <Pressable
                        style={[styles.actionBtn, styles.copyBtn]}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleCopy(
                            item.password || item.cardDetails?.cardNumber || '',
                            item.category === 'card'
                              ? 'Card Number'
                              : 'Password',
                            `pwd-${item.id}`,
                          );
                        }}
                      >
                        {copiedId === `pwd-${item.id}` ? (
                          <Check size={14} color={colors.success} />
                        ) : (
                          <Copy size={14} color={colors.accent} />
                        )}
                      </Pressable>
                    )}

                    <Pressable
                      style={styles.actionBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        openItemEdit(item);
                      }}
                    >
                      <Pencil size={14} color={colors.textMuted} />
                    </Pressable>

                    <Pressable
                      style={[styles.actionBtn, styles.deleteBtn]}
                      onPress={(e) => {
                        e.stopPropagation();
                        Alert.alert(
                          'Delete Item',
                          `Delete "${item.title}" permanently?`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Delete',
                              style: 'destructive',
                              onPress: () =>
                                deleteItem(item.id).catch((err) =>
                                  Alert.alert(
                                    'Error',
                                    err?.message || 'Failed to delete',
                                  ),
                                ),
                            },
                          ],
                        );
                      }}
                    >
                      <Trash2 size={14} color={colors.danger} />
                    </Pressable>
                  </View>
                </Pressable>
              ) : (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [
                    styles.lockedItemCard,
                    pressed && styles.itemCardPressed,
                  ]}
                  onPress={requireUnlock}
                >
                  <View style={styles.itemLeft}>
                    <View style={styles.categoryIcon}>
                      {getCategoryIcon(item.category)}
                    </View>
                    <View style={styles.itemTextContainer}>
                      <View style={styles.itemTitleRow}>
                        <Text style={styles.itemTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        {item.favorite ? (
                          <Star
                            size={13}
                            color={colors.warning}
                            fill={colors.warning}
                          />
                        ) : null}
                      </View>
                      <Text style={styles.lockedSubtitle} numberOfLines={1}>
                        •••••••• (Encrypted)
                      </Text>
                    </View>
                  </View>

                  <View style={styles.lockedItemActions}>
                    <Pressable
                      style={styles.rowUnlockBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        requireUnlock();
                      }}
                    >
                      <Lock size={12} color={colors.accent} />
                      <Text style={styles.rowUnlockText}>Unlock</Text>
                    </Pressable>
                    <ChevronRight size={16} color={colors.textDim} />
                  </View>
                </Pressable>
              ),
            )
          )}
        </ScrollView>
      )}

      <VaultItemModal
        visible={showItemModal}
        mode={itemModalMode}
        initialItem={editingItem}
        onClose={() => {
          setShowItemModal(false);
          setEditingItem(null);
          setItemModalMode('create');
        }}
        onSubmit={handleSaveItem}
        onCopy={(text, label) => copyText(text, label)}
      />

      <MasterKeyModal
        visible={showUnlockModal}
        isSetup={needsSetup}
        isLoading={isLoading}
        onClose={() => setShowUnlockModal(false)}
        onSubmit={async (key) => {
          await unlock(key);
          setShowUnlockModal(false);
        }}
      />
    </View>
  );
};

export default Vaultpage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  unlockVaultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },
  unlockVaultBtnText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  lockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: radii.lg,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: 'rgba(125,211,252,0.28)',
  },
  lockedBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedBannerCopy: {
    flex: 1,
    minWidth: 0,
  },
  lockedBannerTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  lockedBannerText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  lockedBannerAction: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  unlockCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginTop: 12,
  },
  unlockCtaText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  mainTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.7,
  },
  itemsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.successSoft,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.28)',
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
    backgroundColor: colors.success,
  },
  itemsBadgeText: {
    color: colors.success,
    fontSize: 10,
    fontWeight: '700',
  },
  encryptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: 'rgba(125,211,252,0.25)',
  },
  encryptedText: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '700',
  },
  headerDescription: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },
  primaryBtnText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 9,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  timerDanger: {
    backgroundColor: colors.dangerSoft,
    borderColor: 'rgba(248,113,113,0.35)',
  },
  timerText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  timerDangerText: {
    color: colors.danger,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 14,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    paddingVertical: 0,
  },
  categoryScroll: {
    gap: 8,
    paddingRight: 4,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryButtonActive: {
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
    fontWeight: '700',
  },
  itemsScroll: {
    flex: 1,
  },
  itemsContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 32,
    gap: 10,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 76,
    padding: 14,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  lockedItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 76,
    padding: 14,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  lockedSubtitle: {
    color: colors.textDim,
    fontSize: 12,
    marginTop: 4,
    letterSpacing: 0.4,
  },
  lockedItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowUnlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: 'rgba(125,211,252,0.3)',
  },
  rowUnlockText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  itemCardPressed: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.borderStrong,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 12,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
    letterSpacing: -0.2,
  },
  itemSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  copyBtn: {
    backgroundColor: colors.primarySoft,
    borderColor: 'rgba(59,130,246,0.35)',
  },
  deleteBtn: {
    backgroundColor: colors.dangerSoft,
    borderColor: 'rgba(248,113,113,0.28)',
  },
  userBtnText: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 56,
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptyDescription: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 290,
  },
  emptySecondary: {
    marginTop: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptySecondaryText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
});
