import { Toast, ToastTitle } from '@/components/ui/toast';
import { getErrorMessage } from '@/lib/api/client';

type ToastInstance = { show: (config: any) => void };

export function showErrorToast(toast: ToastInstance, error: unknown) {
  toast.show({
    placement: 'top',
    render: ({ id }: { id: string }) => {
      const toastId = 'toast-' + id;
      return (
        <Toast nativeID={toastId} action="error" variant="solid">
          <ToastTitle>{getErrorMessage(error)}</ToastTitle>
        </Toast>
      );
    },
  });
}

export function showSuccessToast(toast: ToastInstance, message: string) {
  toast.show({
    placement: 'top',
    render: ({ id }: { id: string }) => {
      const toastId = 'toast-' + id;
      return (
        <Toast nativeID={toastId} action="success" variant="solid">
          <ToastTitle>{message}</ToastTitle>
        </Toast>
      );
    },
  });
}
