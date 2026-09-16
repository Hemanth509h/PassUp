import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Switch,
  Modal,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Settings,
  ShieldCheck,
  Server,
  Download,
  Upload,
  Lock,
  Trash2,
  Check,
  AlertTriangle,
  QrCode,
  Eye,
  EyeOff,
  Clock,
  Fingerprint,
  KeyRound,
} from "lucide-react-native";

import {
  TwoFactorConfig,
  ServerSyncConfig,
  VaultPreferences,
  AutoLockTime,
  AuthUser,
} from "../types";
import {
  API_BASE_URL,
  authApi,
  clearToken,
  clearUser,
  getToken,
  getUser,
  recoveryApi,
  vaultApi,
} from "../../apis/apis";
import { useVault } from "../../context/VaultContext";
import { colors, radii, spacing } from "../../theme";

export interface SettingsViewProps {
  authUser?: AuthUser | null;
  onLogout?: () => void;

  twoFactorConfig?: TwoFactorConfig | null;

  serverConfig?: ServerSyncConfig;
  preferences?: VaultPreferences;

  onUpdatePreferences?: (prefs: VaultPreferences) => void;
  onUpdateServerConfig?: (config: ServerSyncConfig) => void;

  onTestServerConnection?: () => Promise<void>;
  onSyncServerNow?: () => Promise<void>;

  onChangeMasterKey?: (currentKey: string, newKey: string) => Promise<boolean>;

  onExportBackup?: () => void;
  onImportBackup?: (fileUri: string) => Promise<void>;

  onResetVault?: () => void;
  onLockVault?: () => void;
}

const DEFAULT_SERVER_CONFIG: ServerSyncConfig = {
  serverUrl: API_BASE_URL,
  authToken: "",
  autoSync: false,
  lastSyncStatus: "idle",
};

const SERVER_STORAGE_KEY = "passup_server_config";

export const SettingsView: React.FC<SettingsViewProps> = ({
  authUser: initialAuthUser,
  onLogout: propOnLogout,
  twoFactorConfig: prop2FAConfig,

  serverConfig: propServerConfig,
  preferences: propPreferences,

  onUpdatePreferences: propOnUpdatePreferences,
  onUpdateServerConfig: propOnUpdateServerConfig,

  onTestServerConnection: propOnTestServerConnection,
  onSyncServerNow: propOnSyncServerNow,

  onChangeMasterKey: propOnChangeMasterKey,

  onExportBackup: propOnExportBackup,
  onImportBackup: propOnImportBackup,

  onResetVault: propOnResetVault,
  onLockVault: propOnLockVault,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const vault = useVault();

  // -----------------------------
  // User
  // -----------------------------
  const [authUser, setAuthUser] = useState<AuthUser | null>(initialAuthUser ?? null);

  useEffect(() => {
    if (initialAuthUser !== undefined) {
      setAuthUser(initialAuthUser);
    } else {
      getUser()
        .then((u) => {
          if (u) {
            setAuthUser({
              id: u.id || u._id,
              email: u.email,
              name: u.name,
              hasVault: true,
            });
          }
        })
        .catch(() => {});
    }
  }, [initialAuthUser]);

  // -----------------------------
  // Preferences
  // -----------------------------
  const preferences = propPreferences ?? vault.preferences;

  const handleUpdatePreferences = async (newPrefs: VaultPreferences) => {
    propOnUpdatePreferences?.(newPrefs);
    await vault.updatePreferences(newPrefs);
  };

  // -----------------------------
  // Server Config
  // -----------------------------
  const [serverConfig, setServerConfig] = useState<ServerSyncConfig>(
    propServerConfig ?? DEFAULT_SERVER_CONFIG
  );

  const [serverUrl, setServerUrl] = useState(
    (propServerConfig ?? DEFAULT_SERVER_CONFIG).serverUrl
  );
  const [authToken, setAuthToken] = useState(
    (propServerConfig ?? DEFAULT_SERVER_CONFIG).authToken
  );
  const [autoSync, setAutoSync] = useState(
    (propServerConfig ?? DEFAULT_SERVER_CONFIG).autoSync
  );

  useEffect(() => {
    if (propServerConfig) {
      setServerConfig(propServerConfig);
      setServerUrl(propServerConfig.serverUrl);
      setAuthToken(propServerConfig.authToken);
      setAutoSync(propServerConfig.autoSync);
    } else {
      AsyncStorage.getItem(SERVER_STORAGE_KEY)
        .then((stored) => {
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              setServerConfig(parsed);
              if (parsed.serverUrl) setServerUrl(parsed.serverUrl);
              if (parsed.authToken !== undefined) setAuthToken(parsed.authToken);
              if (parsed.autoSync !== undefined) setAutoSync(parsed.autoSync);
            } catch {}
          }
        })
        .catch(() => {});
    }
  }, [propServerConfig]);

  const [showToken, setShowToken] = useState(false);
  const [isTestingServer, setIsTestingServer] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [serverStatusMessage, setServerStatusMessage] = useState<string | null>(null);

  const handleSaveServerSettings = async () => {
    const updated: ServerSyncConfig = {
      ...serverConfig,
      serverUrl: serverUrl.trim(),
      authToken: authToken.trim(),
      autoSync,
    };

    setServerConfig(updated);
    propOnUpdateServerConfig?.(updated);

    try {
      await AsyncStorage.setItem(SERVER_STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    setServerStatusMessage("Server settings saved");
    setTimeout(() => {
      setServerStatusMessage(null);
    }, 2500);
  };

  const handleTestConnectionClick = async () => {
    setIsTestingServer(true);
    setServerStatusMessage(null);

    try {
      if (propOnTestServerConnection) {
        await propOnTestServerConnection();
      } else {
        const targetUrl = (serverUrl.trim() || API_BASE_URL).replace(/\/$/, "");
        const token = authToken.trim() || (await getToken()) || "";
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(`${targetUrl}/me`, {
          method: "GET",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`Server returned status ${res.status}`);
        }
      }

      setServerStatusMessage("Server connection successful");
      setServerConfig((prev) => ({
        ...prev,
        lastSyncStatus: "success",
        errorMessage: undefined,
      }));
    } catch (error: any) {
      const message =
        error?.name === "AbortError"
          ? "Connection timed out"
          : error?.message || "Connection failed";
      setServerStatusMessage(message);
      setServerConfig((prev) => ({
        ...prev,
        lastSyncStatus: "error",
        errorMessage: message,
      }));
    } finally {
      setIsTestingServer(false);
    }
  };

  const handleSyncNowClick = async () => {
    setIsSyncing(true);
    setServerStatusMessage(null);

    try {
      if (propOnSyncServerNow) {
        await propOnSyncServerNow();
      } else if (vault.isUnlocked) {
        await vault.refreshEntries();
      } else {
        await vaultApi.getMasterKeyStatus();
      }

      setServerStatusMessage("Vault synced successfully");
      setServerConfig((prev) => ({
        ...prev,
        lastSyncStatus: "success",
        lastSyncTime: new Date().toISOString(),
        errorMessage: undefined,
      }));
    } catch (error: any) {
      const message = error?.message || "Sync failed";
      setServerStatusMessage(message);
      setServerConfig((prev) => ({
        ...prev,
        lastSyncStatus: "error",
        errorMessage: message,
      }));
    } finally {
      setIsSyncing(false);
    }
  };

  // -----------------------------
  // Master Key
  // -----------------------------
  const [showKeyChangeModal, setShowKeyChangeModal] = useState(false);
  const [currentKeyInput, setCurrentKeyInput] = useState("");
  const [newKeyInput, setNewKeyInput] = useState("");
  const [confirmNewKeyInput, setConfirmNewKeyInput] = useState("");
  const [keyChangeError, setKeyChangeError] = useState<string | null>(null);
  const [keyChangeSuccess, setKeyChangeSuccess] = useState(false);
  const [isChangingKey, setIsChangingKey] = useState(false);

  const handleSubmitKeyChange = async () => {
    setKeyChangeError(null);

    if (!currentKeyInput) {
      setKeyChangeError("Enter your current Master Key.");
      return;
    }

    if (newKeyInput.length < 8) {
      setKeyChangeError("New Master Key must be at least 8 characters long.");
      return;
    }

    if (newKeyInput !== confirmNewKeyInput) {
      setKeyChangeError("New keys do not match.");
      return;
    }

    setIsChangingKey(true);

    try {
      let ok = true;
      if (propOnChangeMasterKey) {
        ok = await propOnChangeMasterKey(currentKeyInput, newKeyInput);
      } else {
        ok = await vault.changeMasterKey(currentKeyInput, newKeyInput);
      }

      if (ok) {
        setKeyChangeSuccess(true);
        setTimeout(() => {
          closeKeyModal();
        }, 1500);
      } else {
        setKeyChangeError("Current Master Key is incorrect.");
      }
    } catch (error: any) {
      setKeyChangeError(error?.message || "Failed to re-encrypt vault.");
    } finally {
      setIsChangingKey(false);
    }
  };

  const closeKeyModal = () => {
    setShowKeyChangeModal(false);
    setKeyChangeSuccess(false);
    setKeyChangeError(null);
    setCurrentKeyInput("");
    setNewKeyInput("");
    setConfirmNewKeyInput("");
  };

  // -----------------------------
  // 2FA
  // -----------------------------
  const [twoFactorConfig, setTwoFactorConfig] = useState<TwoFactorConfig | null>(
    prop2FAConfig ?? null
  );
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [show2FASecret, setShow2FASecret] = useState(false);
  const [isLoading2FA, setIsLoading2FA] = useState(false);
  const [showRecoveryReset, setShowRecoveryReset] = useState(false);
  const [recoverySeedInput, setRecoverySeedInput] = useState("");
  const [recoveryNewKey, setRecoveryNewKey] = useState("");
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);

  const open2FAModal = async () => {
    setShow2FAModal(true);
    if (prop2FAConfig || twoFactorConfig) return;
    setIsLoading2FA(true);
    try {
      const kit = await recoveryApi.getKit();
      setTwoFactorConfig(kit);
    } catch (error: any) {
      Alert.alert("2FA Error", error?.message || "Could not load recovery kit.");
      setShow2FAModal(false);
    } finally {
      setIsLoading2FA(false);
    }
  };

  const handleRegenerate2FA = async () => {
    setIsLoading2FA(true);
    try {
      const kit = await recoveryApi.regenerate();
      setTwoFactorConfig(kit);
      Alert.alert("Regenerated", "Save your new recovery phrase immediately.");
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Could not regenerate recovery kit.");
    } finally {
      setIsLoading2FA(false);
    }
  };

  const handleRecoveryReset = async () => {
    setRecoveryError(null);
    const words = recoverySeedInput
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (words.length < 12) {
      setRecoveryError("Enter all 12 recovery words.");
      return;
    }
    if (recoveryNewKey.length < 8) {
      setRecoveryError("New Master Key must be at least 8 characters.");
      return;
    }
    setIsRecovering(true);
    try {
      await recoveryApi.resetMasterKey(words, recoveryNewKey);
      vault.lock();
      setShowRecoveryReset(false);
      setRecoverySeedInput("");
      setRecoveryNewKey("");
      Alert.alert(
        "Master Key Reset",
        "Previous vault items were wiped. Unlock with your new Master Key."
      );
    } catch (error: any) {
      setRecoveryError(error?.message || "Recovery failed.");
    } finally {
      setIsRecovering(false);
    }
  };

  // -----------------------------
  // Auto Lock
  // -----------------------------
  const autoLockOptions: {
    label: string;
    value: AutoLockTime;
  }[] = [
    { label: "1 min", value: "1" },
    { label: "5 min", value: "5" },
    { label: "15 min", value: "15" },
    { label: "30 min", value: "30" },
    { label: "Never", value: "never" },
  ];

  // -----------------------------
  // Logout & Lock
  // -----------------------------
  const handleLogout = async () => {
    if (propOnLogout) {
      propOnLogout();
    } else {
      vault.lock();
      await authApi.logout();
      await clearToken();
      await clearUser();
      router.replace("/pages/login");
    }
  };

  const handleLockVault = () => {
    if (propOnLockVault) {
      propOnLockVault();
    } else {
      vault.lock();
      Alert.alert("Vault Locked", "Enter your Master Key to unlock again.");
    }
  };

  // -----------------------------
  // Backup & Reset
  // -----------------------------
  const handleExportBackup = async () => {
    if (propOnExportBackup) {
      propOnExportBackup();
      return;
    }
    if (!vault.isUnlocked) {
      Alert.alert("Vault Locked", "Unlock the vault before exporting a backup.");
      return;
    }
    try {
      const payload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        items: vault.items,
      };
      await AsyncStorage.setItem(
        "passup_last_backup",
        JSON.stringify(payload)
      );
      Alert.alert(
        "Export Backup",
        `Saved encrypted backup snapshot of ${vault.items.length} items on this device.`,
        [{ text: "OK" }]
      );
    } catch (error: any) {
      Alert.alert("Export failed", error?.message || "Could not export backup.");
    }
  };

  const handleImportBackup = () => {
    if (propOnImportBackup) {
      Alert.alert(
        "Import Backup",
        "Select your backup file to restore credentials.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Select",
            onPress: () => propOnImportBackup(""),
          },
        ]
      );
    } else {
      Alert.alert(
        "Import Backup",
        "Backup file import is ready. Select an encrypted JSON backup to restore.",
        [{ text: "OK" }]
      );
    }
  };

  const handleResetVault = () => {
    Alert.alert(
      "Reset Vault",
      "This will permanently delete your vault data from device storage.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            if (propOnResetVault) {
              propOnResetVault();
            } else {
              try {
                await AsyncStorage.clear();
              } catch {}
              router.replace("/pages/login");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.max(insets.top, 12) + 4 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* -------------------------------- */}
        {/* HEADER */}
        {/* -------------------------------- */}
        <View style={styles.header}>
          <View style={styles.headerTitle}>
            <Settings size={20} color={colors.accent} />
            <Text style={styles.title}>Vault Settings</Text>
          </View>
          <Text style={styles.subtitle}>
            Security policies, 2FA recovery, and custom server backend.
          </Text>
        </View>

        {/* -------------------------------- */}
        {/* ACCOUNT */}
        {/* -------------------------------- */}
        {authUser && (
          <View style={styles.card}>
            <View style={styles.accountRow}>
              <View style={styles.accountLeft}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {authUser.email ? authUser.email.slice(0, 2).toUpperCase() : "US"}
                  </Text>
                </View>

                <View style={styles.accountInfo}>
                  <Text style={styles.accountName} numberOfLines={1}>
                    {authUser.name || "Account Owner"}
                  </Text>
                  <Text style={styles.accountEmail} numberOfLines={1}>
                    {authUser.email}
                  </Text>
                </View>
              </View>

              <Pressable onPress={handleLogout} style={styles.logoutButton}>
                <Text style={styles.logoutText}>Sign Out</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* -------------------------------- */}
        {/* SECURITY */}
        {/* -------------------------------- */}
        <View style={styles.card}>
          <View style={styles.sectionTitle}>
            <ShieldCheck size={16} color="#60a5fa" />
            <Text style={styles.sectionTitleText}>SECURITY & MASTER KEY</Text>
          </View>

          {/* Master Key */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>
                {vault.hasMasterKey === false ? "Set Master Key" : "Master Key"}
              </Text>
              <Text style={styles.settingDescription}>
                {vault.hasMasterKey === false
                  ? "Required — create your encryption key on the Vault tab"
                  : "Re-encrypts all items with a new key"}
              </Text>
            </View>

            <Pressable
              onPress={() => {
                if (vault.hasMasterKey === false) {
                  Alert.alert(
                    "Master Key required",
                    "Open the Vault tab to create your Master Key. You’ll be prompted automatically."
                  );
                  return;
                }
                setShowKeyChangeModal(true);
              }}
              style={styles.secondaryButton}
            >
              <KeyRound size={14} color={colors.accent} />
              <Text style={styles.secondaryButtonText}>
                {vault.hasMasterKey === false ? "Required" : "Change"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.divider} />

          {/* 2FA */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>2FA Recovery Credentials</Text>
              <Text style={styles.settingDescription}>
                View TOTP secret & 12-word seed
              </Text>
            </View>

            <Pressable
              onPress={open2FAModal}
              style={styles.secondaryButton}
            >
              <QrCode size={14} color="#cbd5e1" />
              <Text style={styles.secondaryButtonText}>View 2FA</Text>
            </Pressable>
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Recover Lost Master Key</Text>
              <Text style={styles.settingDescription}>
                Use your 12-word seed (wipes old ciphertext)
              </Text>
            </View>

            <Pressable
              onPress={() => setShowRecoveryReset(true)}
              style={styles.secondaryButton}
            >
              <KeyRound size={14} color="#f87171" />
              <Text style={[styles.secondaryButtonText, { color: "#f87171" }]}>
                Recover
              </Text>
            </Pressable>
          </View>

          <View style={styles.divider} />

          {/* Biometrics */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={styles.inlineTitle}>
                <Fingerprint size={15} color="#60a5fa" />
                <Text style={styles.settingTitle}>Biometric Quick Unlock</Text>
              </View>
              <Text style={styles.settingDescription}>Touch ID / Face ID</Text>
            </View>

            <Switch
              value={preferences.biometricsEnabled}
              onValueChange={(value) =>
                handleUpdatePreferences({
                  ...preferences,
                  biometricsEnabled: value,
                })
              }
              trackColor={{
                false: "#17264a",
                true: "#2563eb",
              }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.divider} />

          {/* Auto Lock */}
          <View style={styles.autoLockContainer}>
            <View style={styles.inlineTitle}>
              <Clock size={15} color="#94a3b8" />
              <Text style={styles.settingTitle}>Auto-Lock Timeout</Text>
            </View>

            <View style={styles.autoLockGrid}>
              {autoLockOptions.map((option) => {
                const active = preferences.autoLockMinutes === option.value;

                return (
                  <Pressable
                    key={option.value}
                    onPress={() =>
                      handleUpdatePreferences({
                        ...preferences,
                        autoLockMinutes: option.value,
                      })
                    }
                    style={[
                      styles.autoLockButton,
                      active && styles.autoLockButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.autoLockText,
                        active && styles.autoLockTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* -------------------------------- */}
        {/* SERVER */}
        {/* -------------------------------- */}
        <View style={styles.card}>
          <View style={styles.serverHeader}>
            <View style={styles.sectionTitle}>
              <Server size={16} color="#60a5fa" />
              <Text style={styles.sectionTitleText}>CUSTOM BACKEND SERVER</Text>
            </View>

            {serverConfig.lastSyncStatus && (
              <View
                style={[
                  styles.statusBadge,
                  serverConfig.lastSyncStatus === "success" && styles.successBadge,
                  serverConfig.lastSyncStatus === "error" && styles.errorBadge,
                ]}
              >
                <Text style={styles.statusText}>{serverConfig.lastSyncStatus}</Text>
              </View>
            )}
          </View>

          <Text style={styles.description}>
            Connect your remote server. The client transmits strictly AES-256
            encrypted ciphertext, preserving zero-knowledge privacy.
          </Text>

          {/* Server URL */}
          <Text style={styles.inputLabel}>Server API Base URL</Text>
          <TextInput
            value={serverUrl}
            onChangeText={setServerUrl}
            placeholder={API_BASE_URL || "API server URL"}
            placeholderTextColor="#64748b"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />

          {/* Token */}
          <Text style={styles.inputLabel}>Authorization Token (Bearer)</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              value={authToken}
              onChangeText={setAuthToken}
              placeholder="your-jwt-or-api-key"
              placeholderTextColor="#64748b"
              secureTextEntry={!showToken}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.passwordInput}
            />

            <Pressable
              onPress={() => setShowToken(!showToken)}
              style={styles.eyeButton}
            >
              {showToken ? (
                <EyeOff size={17} color="#94a3b8" />
              ) : (
                <Eye size={17} color="#94a3b8" />
              )}
            </Pressable>
          </View>

          {/* Auto Sync */}
          <View style={styles.settingRow}>
            <Text style={styles.smallSettingText}>
              Auto-sync changes to server
            </Text>

            <Switch
              value={autoSync}
              onValueChange={setAutoSync}
              trackColor={{
                false: "#17264a",
                true: "#2563eb",
              }}
              thumbColor="#ffffff"
            />
          </View>

          {serverStatusMessage && (
            <Text style={styles.successMessage}>{serverStatusMessage}</Text>
          )}

          {serverConfig.errorMessage && (
            <View style={styles.errorBox}>
              <AlertTriangle size={14} color="#f87171" />
              <Text style={styles.errorText}>{serverConfig.errorMessage}</Text>
            </View>
          )}

          {/* Server Buttons */}
          <View style={styles.buttonRow}>
            <Pressable
              onPress={handleSaveServerSettings}
              style={styles.serverButton}
            >
              <Text style={styles.serverButtonText}>Save URL</Text>
            </Pressable>

            <Pressable
              onPress={handleTestConnectionClick}
              disabled={isTestingServer}
              style={styles.serverButton}
            >
              {isTestingServer ? (
                <ActivityIndicator size="small" color="#60a5fa" />
              ) : (
                <Text style={[styles.serverButtonText, styles.blueText]}>
                  Test Connection
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={handleSyncNowClick}
              disabled={isSyncing}
              style={[styles.serverButton, styles.syncButton]}
            >
              {isSyncing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={[styles.serverButtonText, styles.whiteText]}>
                  Sync Vault
                </Text>
              )}
            </Pressable>
          </View>
        </View>

        {/* -------------------------------- */}
        {/* BACKUP */}
        {/* -------------------------------- */}
        <View style={styles.card}>
          <View style={styles.sectionTitle}>
            <Download size={16} color="#60a5fa" />
            <Text style={styles.sectionTitleText}>LOCAL BACKUP & RESTORE</Text>
          </View>

          <View style={styles.buttonRow}>
            <Pressable onPress={handleExportBackup} style={styles.backupButton}>
              <Download size={15} color="#60a5fa" />
              <Text style={styles.backupText}>Export Backup</Text>
            </Pressable>

            <Pressable onPress={handleImportBackup} style={styles.backupButton}>
              <Upload size={15} color="#60a5fa" />
              <Text style={styles.backupText}>Import Backup</Text>
            </Pressable>
          </View>

          <Pressable onPress={handleResetVault} style={styles.resetButton}>
            <Trash2 size={15} color="#f87171" />
            <Text style={styles.resetText}>
              Reset Vault & Wipe Device Storage
            </Text>
          </Pressable>
        </View>

        {/* -------------------------------- */}
        {/* LOCK */}
        {/* -------------------------------- */}
        <Pressable onPress={handleLockVault} style={styles.lockButton}>
          <Lock size={18} color="#60a5fa" />
          <Text style={styles.lockText}>Lock Vault Immediately</Text>
        </Pressable>
      </ScrollView>

      {/* ================================== */}
      {/* CHANGE MASTER KEY MODAL */}
      {/* ================================== */}
      <Modal
        visible={showKeyChangeModal}
        transparent
        animationType="fade"
        onRequestClose={closeKeyModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Change Master Key</Text>
            <Text style={styles.modalDescription}>
              All credentials will be decrypted and re-encrypted with your new
              Master Key.
            </Text>

            {keyChangeError && (
              <View style={styles.errorBox}>
                <AlertTriangle size={14} color="#f87171" />
                <Text style={styles.errorText}>{keyChangeError}</Text>
              </View>
            )}

            {keyChangeSuccess ? (
              <View style={styles.successContainer}>
                <Check size={25} color="#34d399" />
                <Text style={styles.successModalText}>
                  Master Key successfully updated!
                </Text>
              </View>
            ) : (
              <>
                <TextInput
                  value={currentKeyInput}
                  onChangeText={setCurrentKeyInput}
                  placeholder="Current Master Key"
                  placeholderTextColor="#64748b"
                  secureTextEntry
                  style={styles.input}
                />

                <TextInput
                  value={newKeyInput}
                  onChangeText={setNewKeyInput}
                  placeholder="New Master Key (min 8 chars)"
                  placeholderTextColor="#64748b"
                  secureTextEntry
                  style={styles.input}
                />

                <TextInput
                  value={confirmNewKeyInput}
                  onChangeText={setConfirmNewKeyInput}
                  placeholder="Confirm New Master Key"
                  placeholderTextColor="#64748b"
                  secureTextEntry
                  style={styles.input}
                />

                <View style={styles.modalButtons}>
                  <Pressable
                    onPress={closeKeyModal}
                    style={styles.cancelButton}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </Pressable>

                  <Pressable
                    onPress={handleSubmitKeyChange}
                    disabled={isChangingKey}
                    style={styles.updateButton}
                  >
                    {isChangingKey ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={styles.updateText}>Update Key</Text>
                    )}
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ================================== */}
      {/* 2FA MODAL */}
      {/* ================================== */}
      <Modal
        visible={show2FAModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShow2FAModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Your 2FA Recovery Kit</Text>
            <Text style={styles.modalDescription}>
              Keep these secret. They allow resetting vault access if you lose
              your Master Key.
            </Text>

            {isLoading2FA ? (
              <ActivityIndicator color="#60a5fa" style={{ marginVertical: 20 }} />
            ) : (
              <>
                <View style={styles.secretBox}>
                  <View style={styles.secretHeader}>
                    <Text style={styles.secretLabel}>TOTP SECRET</Text>
                    <Pressable onPress={() => setShow2FASecret(!show2FASecret)}>
                      {show2FASecret ? (
                        <EyeOff size={16} color="#94a3b8" />
                      ) : (
                        <Eye size={16} color="#94a3b8" />
                      )}
                    </Pressable>
                  </View>

                  <Text style={styles.secretText}>
                    {show2FASecret
                      ? twoFactorConfig?.secret
                      : "••••••••••••••••"}
                  </Text>
                </View>

                <View style={styles.secretBox}>
                  <Text style={styles.secretLabel}>BACKUP CODES</Text>
                  <Text style={styles.recoveryText}>
                    {(twoFactorConfig?.backupCodes || []).join("  ")}
                  </Text>
                </View>

                <View style={styles.secretBox}>
                  <Text style={styles.secretLabel}>12-WORD RECOVERY PHRASE</Text>
                  <Text style={styles.recoveryText}>
                    {twoFactorConfig?.recoverySeedWords?.join(" ")}
                  </Text>
                </View>
              </>
            )}

            <View style={styles.modalButtons}>
              <Pressable
                onPress={handleRegenerate2FA}
                style={styles.cancelButton}
                disabled={isLoading2FA}
              >
                <Text style={styles.cancelText}>Regenerate</Text>
              </Pressable>
              <Pressable
                onPress={() => setShow2FAModal(false)}
                style={styles.updateButton}
              >
                <Text style={styles.closeText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showRecoveryReset}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRecoveryReset(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Recover Master Key</Text>
            <Text style={styles.modalDescription}>
              Enter your 12-word recovery phrase and a new Master Key. Existing
              vault items will be wiped because they cannot be decrypted without
              the old key.
            </Text>

            {recoveryError ? (
              <View style={styles.errorBox}>
                <AlertTriangle size={14} color="#f87171" />
                <Text style={styles.errorText}>{recoveryError}</Text>
              </View>
            ) : null}

            <TextInput
              value={recoverySeedInput}
              onChangeText={setRecoverySeedInput}
              placeholder="twelve word recovery phrase"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              autoCorrect={false}
              multiline
              style={[styles.input, { height: 80, textAlignVertical: "top" }]}
            />

            <TextInput
              value={recoveryNewKey}
              onChangeText={setRecoveryNewKey}
              placeholder="New Master Key (min 8 chars)"
              placeholderTextColor="#64748b"
              secureTextEntry
              style={styles.input}
            />

            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setShowRecoveryReset(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleRecoveryReset}
                disabled={isRecovering}
                style={styles.updateButton}
              >
                {isRecovering ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.updateText}>Reset Key</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default SettingsView;

const styles = StyleSheet.create({
  // ----------------------------------
  // Main
  // ----------------------------------
  container: {
    flex: 1,
    backgroundColor: "transparent",
    width: "100%",
  },

  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
  },

  header: {
    marginBottom: 18,
  },

  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },

  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.6,
  },

  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },

  // ----------------------------------
  // Cards
  // ----------------------------------
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: 14,
  },

  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 14,
  },

  sectionTitleText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
  },

  // ----------------------------------
  // Account
  // ----------------------------------
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  accountLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: "rgba(125,211,252,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "700",
  },

  accountInfo: {
    flex: 1,
  },

  accountName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.2,
  },

  accountEmail: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 3,
  },

  logoutButton: {
    paddingVertical: 10,
    paddingHorizontal: 13,
    backgroundColor: colors.bgElevated,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },

  logoutText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },

  // ----------------------------------
  // Settings
  // ----------------------------------
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  settingInfo: {
    flex: 1,
  },

  settingTitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },

  settingDescription: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },

  inlineTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  secondaryButtonText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "600",
  },

  autoLockContainer: {
    marginTop: 2,
  },

  autoLockGrid: {
    flexDirection: "row",
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 4,
    marginTop: 10,
  },

  autoLockButton: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    borderRadius: 8,
  },

  autoLockButtonActive: {
    backgroundColor: colors.primary,
  },

  autoLockText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "600",
  },

  autoLockTextActive: {
    color: colors.text,
    fontWeight: "700",
  },

  // ----------------------------------
  // Server
  // ----------------------------------
  serverHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: colors.bgElevated,
  },

  successBadge: {
    backgroundColor: "#064e3b",
  },

  errorBadge: {
    backgroundColor: colors.dangerBg,
  },

  statusText: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: "600",
  },

  description: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 14,
  },

  inputLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 6,
  },

  input: {
    height: 44,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    color: colors.text,
    paddingHorizontal: 12,
    fontSize: 13,
    marginBottom: 12,
  },

  passwordContainer: {
    height: 44,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  passwordInput: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    paddingHorizontal: 12,
  },

  eyeButton: {
    padding: 10,
  },

  smallSettingText: {
    color: colors.textSecondary,
    fontSize: 12,
  },

  successMessage: {
    color: colors.accent,
    fontSize: 11,
    marginTop: 10,
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    borderRadius: radii.sm,
    padding: 9,
    marginTop: 8,
  },

  errorText: {
    flex: 1,
    color: colors.danger,
    fontSize: 11,
    lineHeight: 15,
  },

  buttonRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },

  serverButton: {
    flex: 1,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bgElevated,
    borderRadius: radii.md,
    paddingHorizontal: 7,
  },

  syncButton: {
    backgroundColor: colors.primary,
  },

  serverButtonText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },

  blueText: {
    color: colors.accent,
  },

  whiteText: {
    color: colors.text,
  },

  // ----------------------------------
  // Backup
  // ----------------------------------
  backupButton: {
    flex: 1,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
  },

  backupText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },

  resetButton: {
    height: 44,
    marginTop: 10,
    borderRadius: radii.md,
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  resetText: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: "600",
  },

  // ----------------------------------
  // Lock
  // ----------------------------------
  lockButton: {
    height: 52,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
  },

  lockText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },

  // ----------------------------------
  // Modal
  // ----------------------------------
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(2,6,18,0.88)",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },

  modal: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    padding: 20,
  },

  modalTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 8,
  },

  modalDescription: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 14,
  },

  modalButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },

  cancelButton: {
    flex: 1,
    height: 44,
    backgroundColor: colors.bgElevated,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },

  cancelText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },

  updateButton: {
    flex: 1,
    height: 44,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },

  updateText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
  },

  successContainer: {
    minHeight: 100,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  successModalText: {
    color: colors.success,
    fontSize: 13,
    fontWeight: "600",
  },

  // ----------------------------------
  // 2FA
  // ----------------------------------
  secretBox: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 12,
    marginBottom: 10,
  },

  secretHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 7,
  },

  secretLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  secretText: {
    color: colors.accent,
    fontSize: 13,
    fontFamily: "monospace",
  },

  recoveryText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "monospace",
    marginTop: 8,
  },

  closeButton: {
    height: 44,
    backgroundColor: colors.bgElevated,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  closeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "600",
  },
});
