export type ItemCategory = 'login' | 'card' | 'note' | 'api_key';

export interface CardDetails {
  cardNumber: string;
  cardholderName: string;
  expiryDate: string;
  cvv: string;
}

export interface VaultItem {
  id: string;
  entryID?: string;
  title: string;
  category: ItemCategory;
  username?: string;
  email?: string;
  password?: string;
  url?: string;
  notes?: string;
  favorite?: boolean;
  totpSecret?: string;
  tags?: string[];
  strength?: string;
  cardDetails?: CardDetails;
  createdAt: string;
  updatedAt?: string;
}

export interface EncryptedVaultPayload {
  version: number;
  ciphertext: string;
  iv: string;
  salt: string;
  checksum: string;
  lastUpdated: string;
}

export interface TwoFactorConfig {
  enabled: boolean;
  secret: string;
  backupCodes: string[];
  recoverySeedWords: string[];
  lastVerifiedAt?: string;
}

export interface ServerSyncConfig {
  autoSync: boolean;
  lastSyncTime?: string;
  lastSyncStatus?: 'idle' | 'success' | 'error' | 'syncing';
  errorMessage?: string;
}

export type AutoLockTime = '1' | '5' | '15' | '30' | 'never';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  hasVault?: boolean;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
  vault?: EncryptedVaultPayload;
}

export interface VaultPreferences {
  autoLockMinutes: AutoLockTime;
  biometricsEnabled: boolean;
  maskPasswordsByDefault: boolean;
  clipboardClearSeconds: number;
}

export interface CreateVaultItemInput {
  entryID?: string;
  title: string;
  category: ItemCategory;
  username?: string;
  email?: string;
  password?: string;
  url?: string;
  notes?: string;
  favorite?: boolean;
  tags?: string[];
  cardDetails?: Partial<CardDetails>;
}

export interface SecurityIssue {
  id: string;
  entryId: string;
  title: string;
  type: 'weak' | 'reused' | 'old' | 'no_password';
  message: string;
  severity: 'low' | 'medium' | 'high';
}
