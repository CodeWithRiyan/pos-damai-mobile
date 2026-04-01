import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { CloseIcon, Icon } from '@/components/ui/icon';
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@/components/ui/modal';
import { Text } from '@/components/ui/text';
import { apiClient } from '@/lib/api/client';
import { useSyncQueueStore } from '@/stores/sync-queue';
import { useState } from 'react';

interface SyncConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SyncConfirmationModal({ isOpen, onClose }: SyncConfirmationModalProps) {
  const queue = useSyncQueueStore((state) => state.queue);
  const isSyncing = useSyncQueueStore((state) => state.isSyncing);
  const setIsSyncing = useSyncQueueStore((state) => state.setIsSyncing);
  const removeFromQueue = useSyncQueueStore((state) => state.removeFromQueue);
  const setLastSyncAt = useSyncQueueStore((state) => state.setLastSyncAt);

  const [error, setError] = useState<string | null>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    setError(null);

    try {
      // Process each queued operation
      for (const operation of queue) {
        const { endpoint, data, type } = operation;

        switch (type) {
          case 'create':
            await apiClient.post(endpoint, data);
            break;
          case 'update':
            await apiClient.put(endpoint, data);
            break;
          case 'delete':
            await apiClient.delete(endpoint);
            break;
        }

        // Remove from queue on success
        removeFromQueue(operation.id);
      }

      setLastSyncAt(Date.now());
      onClose();
    } catch (err) {
      setError('Failed to sync some operations. Please try again.');
      console.error('Sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalBackdrop />
      <ModalContent>
        <ModalHeader>
          <Heading size="md">Sync Pending Changes</Heading>
          <ModalCloseButton>
            <Icon as={CloseIcon} />
          </ModalCloseButton>
        </ModalHeader>
        <ModalBody>
          <Text>
            You have {queue.length} pending {queue.length === 1 ? 'change' : 'changes'} to sync with
            the server.
          </Text>
          {error ? <Text className="mt-2 text-error-500">{error}</Text> : null}
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            action="secondary"
            onPress={onClose}
            className="mr-3"
            disabled={isSyncing}
          >
            <ButtonText>Sync Later</ButtonText>
          </Button>
          <Button
            action="primary"
            className="bg-brand-primary active:bg-brand-primary/90"
            onPress={handleSync}
            disabled={isSyncing || queue.length === 0}
          >
            <ButtonText>{isSyncing ? 'Syncing...' : 'Sync Now'}</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
