import { usePopUpConfirm } from '@/components/pop-up-confirm';
import { useToast } from '@/components/ui/toast';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { ReactNode, useCallback } from 'react';

interface UseBulkDeleteEntityOptions {
  successMessage: string;
  deleteMutation: {
    mutate: (payload: any, options: any) => void;
    isPending: boolean;
  };
  onSuccess?: () => void;
  clearSelection?: () => void;
}

interface TriggerBulkDeleteParams {
  ids: string[];
  title: string;
  description: ReactNode;
}

export function useBulkDeleteEntity({
  successMessage,
  deleteMutation,
  onSuccess,
  clearSelection,
}: UseBulkDeleteEntityOptions) {
  const { showPopUpConfirm, hidePopUpConfirm } = usePopUpConfirm();
  const toast = useToast();

  const triggerBulkDelete = useCallback(
    ({ ids, title, description }: TriggerBulkDeleteParams) => {
      if (!ids.length) return;

      showPopUpConfirm({
        title,
        icon: 'warning' as const,
        description,
        showClose: true,
        okText: 'HAPUS',
        closeText: 'BATAL',
        okVariant: 'destructive' as const,
        onOk: () => {
          deleteMutation.mutate(ids, {
            onSuccess: () => {
              clearSelection?.();
              hidePopUpConfirm();
              onSuccess?.();
              showSuccessToast(toast, successMessage);
            },
            onError: (error: unknown) => {
              showErrorToast(toast, error);
              hidePopUpConfirm();
            },
          });
        },
        loading: deleteMutation.isPending,
      });
    },
    [
      deleteMutation,
      hidePopUpConfirm,
      showPopUpConfirm,
      toast,
      successMessage,
      onSuccess,
      clearSelection,
    ],
  );

  return { triggerBulkDelete, isBulkDeleting: deleteMutation.isPending };
}
