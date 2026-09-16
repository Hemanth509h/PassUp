import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';

import { BottomNavBar, NavTab } from '../../components/BottomNavBar';
import { VaultProvider, useVault } from '../../context/VaultContext';
import { colors } from '../../theme';
import SecurityAudit from './security';
import Setting from './setting';
import Vaultpage from './vault';

function DashboardInner() {
  const [activeTab, setActiveTab] = useState<NavTab>('vault');
  const { securityIssues } = useVault();

  return (
    <View style={styles.shell}>
      <View style={styles.glow} pointerEvents="none" />
      <View style={styles.page}>
        {activeTab === 'vault' ? <Vaultpage /> : null}
        {activeTab === 'security' ? <SecurityAudit /> : null}
        {activeTab === 'settings' ? <Setting /> : null}
      </View>

      <View style={styles.navWrap}>
        <BottomNavBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          securityIssuesCount={securityIssues.length}
        />
      </View>
    </View>
  );
}

export default function Dashboard() {
  return (
    <VaultProvider>
      <DashboardInner />
    </VaultProvider>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  glow: {
    position: 'absolute',
    top: -80,
    left: '20%',
    right: '20%',
    height: 220,
    borderRadius: 160,
    backgroundColor: 'rgba(59,130,246,0.10)',
  },
  page: {
    flex: 1,
    minHeight: 0,
  },
  navWrap: {
    flexShrink: 0,
  },
});
