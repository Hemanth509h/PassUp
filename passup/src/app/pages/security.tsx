import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ShieldAlert,
  AlertTriangle,
  RefreshCcw,
  ShieldCheck,
} from 'lucide-react-native';

import { useVault } from '../../context/VaultContext';
import { colors, radii, spacing } from '../../theme';
import type { SecurityIssue } from '../types';

export default function SecurityAudit() {
  const insets = useSafeAreaInsets();
  const { isUnlocked, securityIssues, items, refreshEntries, isLoading, hasMasterKey } =
    useVault();

  const weak = securityIssues.filter((i) => i.type === 'weak').length;
  const reused = securityIssues.filter((i) => i.type === 'reused').length;
  const missing = securityIssues.filter((i) => i.type === 'no_password').length;

  if (!isUnlocked) {
    return (
      <View
        style={[
          styles.center,
          { paddingTop: Math.max(insets.top, 16) },
        ]}
      >
        <View style={styles.iconBadge}>
          <ShieldAlert size={28} color={colors.warning} />
        </View>
        <Text style={styles.heading}>Security Audit Locked</Text>
        <Text style={styles.subheading}>
          {hasMasterKey === false
            ? 'Set your Master Key on the Vault tab first, then unlock to scan passwords.'
            : 'Unlock your vault with the Master Key to analyze weak, reused, and missing passwords.'}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: Math.max(insets.top, 12) + 4 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <ShieldCheck size={20} color={colors.accent} />
          <Text style={styles.title}>Security Audit</Text>
        </View>
        <Text style={styles.subtitle}>
          Live scan of {items.length} decrypted vault item
          {items.length === 1 ? '' : 's'}.
        </Text>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Weak" value={weak} tone="warn" />
        <StatCard label="Reused" value={reused} tone="danger" />
        <StatCard label="Missing" value={missing} tone="danger" />
      </View>

      <Pressable style={styles.refreshBtn} onPress={() => refreshEntries()}>
        <RefreshCcw size={14} color={colors.accent} />
        <Text style={styles.refreshText}>
          {isLoading ? 'Scanning…' : 'Rescan Vault'}
        </Text>
      </Pressable>

      {securityIssues.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <ShieldCheck size={24} color={colors.success} />
          </View>
          <Text style={styles.emptyTitle}>No issues found</Text>
          <Text style={styles.emptyText}>
            Your unlocked vault looks healthy right now.
          </Text>
        </View>
      ) : (
        securityIssues.map((issue) => <IssueRow key={issue.id} issue={issue} />)
      )}
    </ScrollView>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'warn' | 'danger';
}) {
  return (
    <View style={styles.statCard}>
      <Text
        style={[
          styles.statValue,
          tone === 'warn' ? styles.warnText : styles.dangerText,
        ]}
      >
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function IssueRow({ issue }: { issue: SecurityIssue }) {
  return (
    <View style={styles.issueCard}>
      <View style={styles.issueIcon}>
        <AlertTriangle
          size={16}
          color={issue.severity === 'high' ? colors.danger : colors.warning}
        />
      </View>
      <View style={styles.issueBody}>
        <Text style={styles.issueTitle}>{issue.title}</Text>
        <Text style={styles.issueMessage}>{issue.message}</Text>
      </View>
      <View
        style={[
          styles.severityPill,
          issue.severity === 'high'
            ? styles.severityHigh
            : styles.severityMed,
        ]}
      >
        <Text style={styles.severity}>{issue.severity}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: 'transparent',
  },
  iconBadge: {
    width: 76,
    height: 76,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  heading: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subheading: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 300,
  },
  header: {
    marginBottom: 18,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  warnText: {
    color: colors.warning,
  },
  dangerText: {
    color: colors.danger,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 5,
    fontWeight: '600',
  },
  refreshBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  refreshText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 52,
    gap: 8,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: radii.lg,
    backgroundColor: colors.successSoft,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  issueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: 14,
    marginBottom: 10,
  },
  issueIcon: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  issueBody: {
    flex: 1,
  },
  issueTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  issueMessage: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 3,
  },
  severityPill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },
  severityHigh: {
    backgroundColor: colors.dangerSoft,
  },
  severityMed: {
    backgroundColor: colors.warningSoft,
  },
  severity: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
