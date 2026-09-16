import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Lock, ShieldCheck, Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing } from '../theme';

export type NavTab = 'vault' | 'security' | 'settings';

export interface BottomNavBarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  securityIssuesCount?: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabChange,
  securityIssuesCount = 0,
}) => {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'web' ? 14 : 10);

  const tabs = [
    { id: 'vault' as NavTab, label: 'Vault', icon: Lock },
    {
      id: 'security' as NavTab,
      label: 'Security',
      icon: ShieldCheck,
      badge: securityIssuesCount > 0 ? securityIssuesCount : undefined,
    },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
  ];

  return (
    <View style={[styles.navBar, { paddingBottom: bottomPad }]}>
      <View style={styles.inner}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <Pressable
              key={tab.id}
              onPress={() => onTabChange(tab.id)}
              style={({ pressed }) => [
                styles.tabButton,
                isActive && styles.tabButtonActive,
                pressed && styles.tabPressed,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
            >
              <View style={styles.iconContainer}>
                <Icon
                  size={20}
                  color={isActive ? colors.accent : colors.textDim}
                  strokeWidth={isActive ? 2.4 : 1.9}
                />
                {tab.badge !== undefined ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  isActive ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navBar: {
    backgroundColor: colors.surfaceMuted,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: 10,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: radii.md,
  },
  tabButtonActive: {
    backgroundColor: colors.primarySoft,
  },
  tabPressed: {
    opacity: 0.85,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 24,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -12,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: colors.text,
    fontSize: 9,
    fontWeight: '700',
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 5,
  },
  tabLabelActive: {
    color: colors.accent,
    fontWeight: '700',
  },
  tabLabelInactive: {
    color: colors.textDim,
    fontWeight: '500',
  },
});
