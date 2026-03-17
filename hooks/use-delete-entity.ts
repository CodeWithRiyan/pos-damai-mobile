import { usePopUpConfirm } from "@/components/pop-up-confirm";
import { useToast } from "@/components/ui/toast";
import { showErrorToast, showSuccessToast } from "@/lib/utils/toast";
import { useRouter } from "expo-router";
import { ReactNode, useCallback } from "react";

interface UseDeleteEntityOptions {
  successMessage: string;
  deleteMutation: {
    mutate: (id: string, options: any) => void;
    isPending: boolean;
  };
  onSuccess?: () => void;
  goBack?: boolean;
}

interface TriggerDeleteParams {
  id: string;
  title: string;
  description: ReactNode;
}

export function useDeleteEntity({
  successMessage,
  deleteMutation,
  onSuccess,
  goBack = true,
}: UseDeleteEntityOptions) {
  const { showPopUpConfirm, hidePopUpConfirm } = usePopUpConfirm();
  const toast = useToast();
  const router = useRouter();

  const triggerDelete = useCallback(
    ({ id, title, description }: TriggerDeleteParams) => {
      showPopUpConfirm({
        title,
        icon: "warning" as const,
        description,
        showClose: true,
        okText: "HAPUS",
        closeText: "BATAL",
        okVariant: "destructive" as const,
        onOk: () => {
          deleteMutation.mutate(id, {
            onSuccess: () => {
              hidePopUpConfirm();
              onSuccess?.();
              if (goBack) router.back();
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
      goBack,
      router,
    ],
  );

  return { triggerDelete, isDeleting: deleteMutation.isPending };
}
