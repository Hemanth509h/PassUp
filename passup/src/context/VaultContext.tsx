import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';

import { vaultApi } from '../apis/apis';
import type {
  AutoLockTime,
  CreateVaultItemInput,
  SecurityIssue,
  VaultItem,
  VaultPreferences,
} from '../app/types';

const PREFS_STORAGE_KEY = 'passup_vault_preferences';

const DEFAULT_PREFERENCES: VaultPreferences = {
  autoLockMinutes: '5',
  biometricsEnabled: false,
  maskPasswordsByDefault: true,
  clipboardClearSeconds: 30,
};

type VaultContextValue = {
  items: VaultItem[];
  isUnlocked: boolean;
  isLoading: boolean;
  hasMasterKey: boolean | null;
  masterKey: string | null;
  autoLockSecondsLeft: number | null;
  preferences: VaultPreferences;
  securityIssues: SecurityIssue[];
  error: string | null;
  unlock: (key: string) => Promise<void>;
  lock: () => void;
  extendAutoLock: () => void;
  refreshEntries: () => Promise<void>;
  createItem: (input: CreateVaultItemInput) => Promise<VaultItem>;
  updateItem: (
    id: string,
    input: Partial<CreateVaultItemInput>,
  ) => Promise<VaultItem>;
  deleteItem: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  copyText: (text: string, label?: string) => Promise<void>;
  changeMasterKey: (currentKey: string, newKey: string) => Promise<boolean>;
  updatePreferences: (prefs: VaultPreferences) => Promise<void>;
  clearError: () => void;
};

const VaultContext = createContext<VaultContextValue | null>(null);

function autoLockToSeconds(value: AutoLockTime): number | null {
  if (value === 'never') return null;
  return Number(value) * 60;
}

function analyzeSecurity(items: VaultItem[]): SecurityIssue[] {
  const issues: SecurityIssue[] = [];
  const passwordMap = new Map<string, string[]>();

  for (const item of items) {
    if (!item.password) {
      if (item.category === 'login' || item.category === 'api_key') {
        issues.push({
          id: `${item.id}-empty`,
          entryId: item.id,
          title: item.title,
          type: 'no_password',
          severity: 'high',
          message: 'Missing password',
        });
      }
      continue;
    }

    const pwd = item.password;
    const list = passwordMap.get(pwd) || [];
    list.push(item.id);
    passwordMap.set(pwd, list);

    const weak =
      pwd.length < 8 ||
      !/[A-Z]/.test(pwd) ||
      !/[a-z]/.test(pwd) ||
      !/\d/.test(pwd);

    if (weak) {
      issues.push({
        id: `${item.id}-weak`,
        entryId: item.id,
        title: item.title,
        type: 'weak',
        severity: 'medium',
        message: 'Weak password detected',
      });
    }
  }

  for (const [, ids] of passwordMap) {
    if (ids.length < 2) continue;
    for (const id of ids) {
      const item = items.find((i) => i.id === id);
      if (!item) continue;
      issues.push({
        id: `${id}-reused`,
        entryId: id,
        title: item.title,
        type: 'reused',
        severity: 'high',
        message: `Password reused across ${ids.length} items`,
      });
    }
  }

  return issues;
}

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMasterKey, setHasMasterKey] = useState<boolean | null>(null);
  const [masterKey, setMasterKey] = useState<string | null>(null);
  const [autoLockSecondsLeft, setAutoLockSecondsLeft] = useState<number | null>(
    null,
  );
  const [preferences, setPreferences] =
    useState<VaultPreferences>(DEFAULT_PREFERENCES);
  const [error, setError] = useState<string | null>(null);
  const clipboardTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(PREFS_STORAGE_KEY)
      .then((stored) => {
        if (!stored) return;
        try {
          setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(stored) });
        } catch {
          // ignore
        }
      })
      .catch(() => {});

    vaultApi
      .getMasterKeyStatus()
      .then((data) => setHasMasterKey(Boolean(data.hasMasterKey)))
      .catch(() => setHasMasterKey(null));

    // Load encrypted metadata so dashboard shows the real list while locked
    setIsLoading(true);
    vaultApi
      .listEntries()
      .then((entries) => {
        setItems(entries);
        setError(null);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const loadLockedPreview = useCallback(async () => {
    try {
      const entries = await vaultApi.listEntries();
      setItems(entries);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to load vault entries');
    }
  }, []);

  const lock = useCallback(() => {
    setIsUnlocked(false);
    setMasterKey(null);
    setAutoLockSecondsLeft(null);
    void loadLockedPreview();
  }, [loadLockedPreview]);

  const extendAutoLock = useCallback(() => {
    const seconds = autoLockToSeconds(preferences.autoLockMinutes);
    setAutoLockSecondsLeft(seconds);
  }, [preferences.autoLockMinutes]);

  const refreshEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const entries = await vaultApi.listEntries(masterKey || undefined);
      setItems(entries);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to load vault entries');
    } finally {
      setIsLoading(false);
    }
  }, [masterKey]);

  const unlock = useCallback(
    async (key: string) => {
      const trimmed = key.trim();
      if (!trimmed) {
        throw new Error('Enter your Master Key.');
      }
      setIsLoading(true);
      setError(null);
      try {
        const result = await vaultApi.checkMasterKey(trimmed);
        setMasterKey(trimmed);
        setIsUnlocked(true);
        setHasMasterKey(true);
        const entries = await vaultApi.listEntries(trimmed);
        setItems(entries);
        const seconds = autoLockToSeconds(preferences.autoLockMinutes);
        setAutoLockSecondsLeft(seconds);
        if (result?.isNew) {
          setError(null);
        }
      } catch (err: any) {
        setIsUnlocked(false);
        setMasterKey(null);
        throw new Error(err?.message || 'Incorrect Master Key');
      } finally {
        setIsLoading(false);
      }
    },
    [preferences.autoLockMinutes],
  );

  useEffect(() => {
    if (!isUnlocked || autoLockSecondsLeft === null) return;
    if (autoLockSecondsLeft <= 0) {
      lock();
      return;
    }
    const timer = setInterval(() => {
      setAutoLockSecondsLeft((prev) =>
        prev === null ? null : Math.max(prev - 1, 0),
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [isUnlocked, autoLockSecondsLeft, lock]);

  const createItem = useCallback(
    async (input: CreateVaultItemInput) => {
      if (!masterKey) throw new Error('Unlock the vault first.');
      const created = await vaultApi.createEntry(input, masterKey);
      setItems((prev) => [created, ...prev]);
      extendAutoLock();
      return created;
    },
    [masterKey, extendAutoLock],
  );

  const updateItem = useCallback(
    async (id: string, input: Partial<CreateVaultItemInput>) => {
      if (!masterKey) throw new Error('Unlock the vault first.');
      const updated = await vaultApi.updateEntry(id, input, masterKey);
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
      extendAutoLock();
      return updated;
    },
    [masterKey, extendAutoLock],
  );

  const deleteItem = useCallback(
    async (id: string) => {
      await vaultApi.deleteEntry(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      extendAutoLock();
    },
    [extendAutoLock],
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      const item = items.find((i) => i.id === id);
      if (!item) return;
      await updateItem(id, { favorite: !item.favorite });
    },
    [items, updateItem],
  );

  const copyText = useCallback(
    async (text: string, _label?: string) => {
      await Clipboard.setStringAsync(text);
      if (clipboardTimer.current) clearTimeout(clipboardTimer.current);
      const clearAfter = preferences.clipboardClearSeconds;
      if (clearAfter > 0) {
        clipboardTimer.current = setTimeout(() => {
          Clipboard.setStringAsync('').catch(() => {});
        }, clearAfter * 1000);
      }
      extendAutoLock();
    },
    [preferences.clipboardClearSeconds, extendAutoLock],
  );

  const changeMasterKey = useCallback(
    async (currentKey: string, newKey: string) => {
      await vaultApi.updateMasterKey(currentKey, newKey);
      if (isUnlocked) {
        setMasterKey(newKey);
        const entries = await vaultApi.listEntries(newKey);
        setItems(entries);
      }
      return true;
    },
    [isUnlocked],
  );

  const updatePreferences = useCallback(async (prefs: VaultPreferences) => {
    setPreferences(prefs);
    await AsyncStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
    if (isUnlocked) {
      setAutoLockSecondsLeft(autoLockToSeconds(prefs.autoLockMinutes));
    }
  }, [isUnlocked]);

  const securityIssues = useMemo(
    () => (isUnlocked ? analyzeSecurity(items) : []),
    [items, isUnlocked],
  );

  const value = useMemo<VaultContextValue>(
    () => ({
      items,
      isUnlocked,
      isLoading,
      hasMasterKey,
      masterKey,
      autoLockSecondsLeft,
      preferences,
      securityIssues,
      error,
      unlock,
      lock,
      extendAutoLock,
      refreshEntries,
      createItem,
      updateItem,
      deleteItem,
      toggleFavorite,
      copyText,
      changeMasterKey,
      updatePreferences,
      clearError: () => setError(null),
    }),
    [
      items,
      isUnlocked,
      isLoading,
      hasMasterKey,
      masterKey,
      autoLockSecondsLeft,
      preferences,
      securityIssues,
      error,
      unlock,
      lock,
      extendAutoLock,
      refreshEntries,
      createItem,
      updateItem,
      deleteItem,
      toggleFavorite,
      copyText,
      changeMasterKey,
      updatePreferences,
    ],
  );

  return (
    <VaultContext.Provider value={value}>{children}</VaultContext.Provider>
  );
}

export function useVault() {
  const ctx = useContext(VaultContext);
  if (!ctx) {
    throw new Error('useVault must be used within VaultProvider');
  }
  return ctx;
}
