import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  CreateVaultItemInput,
  ItemCategory,
  TwoFactorConfig,
  VaultItem,
} from '../app/types';

const TOKEN_KEY = 'passup_auth_token';
const USER_KEY = 'passup_auth_user';
const SERVER_STORAGE_KEY = 'passup_server_config';

export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL || ''
).replace(/\/$/, '');

export async function getBaseUrl(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(SERVER_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.serverUrl) {
        return String(parsed.serverUrl).replace(/\/$/, '');
      }
    }
  } catch {
    // ignore
  }
  return API_BASE_URL;
}

export async function saveToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function saveUser(user: any): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function getUser(): Promise<any | null> {
  const userStr = await AsyncStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export async function clearUser(): Promise<void> {
  await AsyncStorage.removeItem(USER_KEY);
}

export async function clearToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(USER_KEY);
}

export async function getAuthHeader(): Promise<Record<string, string>> {
  const token = await getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(
  path: string,
  options: RequestInit & { masterKey?: string } = {},
) {
  const baseUrl = await getBaseUrl();
  const authHeader = await getAuthHeader();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...authHeader,
    ...(options.headers as Record<string, string> | undefined),
  };

  if (options.masterKey) {
    headers['x-master-key'] = options.masterKey;
  }

  const { masterKey: _mk, ...fetchOptions } = options;
  const response = await fetch(`${baseUrl}${path}`, {
    ...fetchOptions,
    headers,
  });

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.message || data?.error || `Request failed (${response.status})`,
    );
  }

  return data;
}

function mapEntryToVaultItem(entry: any): VaultItem {
  const category = (entry.category || 'login') as ItemCategory;
  let cardDetails = entry.cardDetails;
  if (typeof cardDetails === 'string') {
    try {
      cardDetails = JSON.parse(cardDetails);
    } catch {
      cardDetails = undefined;
    }
  }

  return {
    id: String(entry._id || entry.id),
    entryID: entry.entryID,
    title: entry.title,
    category,
    username: entry.locked ? undefined : entry.username,
    email: entry.locked ? undefined : entry.email,
    password: entry.locked ? undefined : entry.password,
    url: entry.locked ? undefined : entry.url,
    notes: entry.locked ? undefined : entry.notes,
    favorite: Boolean(entry.favorite),
    tags: entry.tags || [],
    strength: entry.locked ? undefined : entry.strength,
    cardDetails: entry.locked ? undefined : cardDetails,
    createdAt: entry.createdAt
      ? new Date(entry.createdAt).toISOString()
      : new Date().toISOString(),
    updatedAt: entry.updatedAt
      ? new Date(entry.updatedAt).toISOString()
      : undefined,
  };
}

export const authApi = {
  async login(credentials: { email: string; password: string }) {
    const data = await apiFetch('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (data.token) await saveToken(data.token);
    if (data.user) await saveUser(data.user);
    return data;
  },

  async register(credentials: {
    email: string;
    password: string;
    name?: string;
  }) {
    const data = await apiFetch('/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (data.token) await saveToken(data.token);
    if (data.user) await saveUser(data.user);
    return data;
  },

  async me() {
    return apiFetch('/me');
  },

  async logout(): Promise<void> {
    try {
      await apiFetch('/logout', { method: 'POST' });
    } catch {
      // local logout still proceeds
    }
    await clearToken();
    await clearUser();
  },
};

export const vaultApi = {
  async getMasterKeyStatus() {
    return apiFetch('/master-key-status');
  },

  async checkMasterKey(masterKey: string) {
    return apiFetch('/check-master-key', { masterKey });
  },

  async updateMasterKey(oldMasterKey: string, newMasterKey: string) {
    return apiFetch('/update-master-key', {
      method: 'POST',
      body: JSON.stringify({ oldMasterKey, newMasterKey }),
    });
  },

  async listEntries(masterKey?: string): Promise<VaultItem[]> {
    const data = await apiFetch('/entries', { masterKey });
    return (data.entries || []).map(mapEntryToVaultItem);
  },

  async createEntry(
    input: CreateVaultItemInput,
    masterKey: string,
  ): Promise<VaultItem> {
    const payload = {
      ...input,
      entryID:
        input.entryID ||
        `entry_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    };
    const data = await apiFetch('/entries', {
      method: 'POST',
      masterKey,
      body: JSON.stringify(payload),
    });
    return mapEntryToVaultItem(data.entry);
  },

  async updateEntry(
    id: string,
    input: Partial<CreateVaultItemInput>,
    masterKey?: string,
  ): Promise<VaultItem> {
    const data = await apiFetch(`/entries/${id}`, {
      method: 'PUT',
      masterKey,
      body: JSON.stringify(input),
    });
    return mapEntryToVaultItem(data.entry);
  },

  async deleteEntry(id: string): Promise<void> {
    await apiFetch(`/entries/${id}`, { method: 'DELETE' });
  },

  async getPassword(id: string, masterKey: string): Promise<string> {
    const data = await apiFetch(`/password/${id}`, { masterKey });
    return data.data;
  },
};

export const recoveryApi = {
  async getKit(): Promise<TwoFactorConfig> {
    const data = await apiFetch('/recovery-kit');
    return data.recovery;
  },

  async regenerate(): Promise<TwoFactorConfig> {
    const data = await apiFetch('/recovery-kit/regenerate', { method: 'POST' });
    return data.recovery;
  },

  async verifySeed(seedWords: string[]) {
    return apiFetch('/recovery/verify-seed', {
      method: 'POST',
      body: JSON.stringify({ seedWords }),
    });
  },

  async resetMasterKey(seedWords: string[], newMasterKey: string) {
    return apiFetch('/recovery/reset-master-key', {
      method: 'POST',
      body: JSON.stringify({ seedWords, newMasterKey }),
    });
  },
};
