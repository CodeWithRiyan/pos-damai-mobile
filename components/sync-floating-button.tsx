import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from './ui/text';
import { Button, ButtonText } from './ui/button';
import { Icon, CloseIcon, RepeatIcon, ArrowUpIcon, DownloadIcon } from './ui/icon';
import { useDirtyCount } from '@/hooks/use-dirty-count';
import { useSyncQueueStore } from '@/stores/sync-queue-store';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';

export function SyncFloatingButton() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);
  const { dirtyCount } = useDirtyCount();
  const isSyncing = useSyncQueueStore((state) => state.isSyncing);
  const lastSyncAt = useSyncQueueStore((state) => state.lastSyncAt);

  if (!isVisible) return null;

  const handleGoToSync = () => {
    router.push('/sync');
  };

  const pullLabel = lastSyncAt
    ? dayjs(lastSyncAt).format('HH:mm')
    : '—';

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Data Sync</Text>
          <TouchableOpacity
            onPress={() => setIsVisible(false)}
            style={styles.closeButton}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Icon as={CloseIcon} size="sm" color="$textDark950" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleGoToSync} activeOpacity={0.7}>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Icon as={ArrowUpIcon} size="xs" color="$primary500" />
              <Text style={styles.statLabel}>Push:</Text>
              <Text style={[styles.statValue, dirtyCount > 0 && styles.dirtyText]}>
                {dirtyCount}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.stat}>
              <Icon as={DownloadIcon} size="xs" color="$success500" />
              <Text style={styles.statLabel}>Pull:</Text>
              <Text style={styles.statValue}>{pullLabel}</Text>
            </View>
          </View>

          <Button
            size="sm"
            action="primary"
            onPress={handleGoToSync}
            disabled={isSyncing}
            className="h-8 mt-2 bg-brand-primary"
          >
            <Icon as={RepeatIcon} size="xs" color="$white" className="mr-1" />
            <ButtonText size="xs">
              {isSyncing ? 'Syncing...' : 'Manage Sync'}
            </ButtonText>
          </Button>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    zIndex: 999,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    width: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  closeButton: {
    width: 24,
    height: 24,
    backgroundColor: '#e5e7eb', // Slightly darker gray for better contrast
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  title: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666',
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    marginLeft: 4,
    color: '#444',
  },
  statValue: {
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 3,
  },
  dirtyText: {
    color: '#ef4444',
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: '#eee',
    marginHorizontal: 4,
  },
});
