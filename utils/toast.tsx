import { HStack, Pressable } from '@/components/ui';
import { Toast, ToastTitle } from '@/components/ui/toast';
import { SolarIconBold } from '@/components/ui/solar-icon-wrapper';
import { getErrorMessage } from '@/db/client';

type ToastAction = 'error' | 'success' | 'warning' | 'info' | 'muted';

interface ToastInstance {
  show: (config: any) => void;
  close: (id: string) => void;
}

interface ShowToastOptions {
  action?: ToastAction;
  message: string;
  placement?: 'top' | 'top-right' | 'top-left' | 'bottom' | 'bottom-right' | 'bottom-left';
}

export function showToast(toast: ToastInstance, options: ShowToastOptions) {
  const { action = 'muted', message, placement = 'top' } = options;
  toast.show({
    placement,
    render: ({ id }: { id: string }) => {
      return (
        <Toast nativeID={`toast-${id}`} action={action} variant="solid">
          <HStack className="items-center justify-between flex-1">
            <ToastTitle className="flex-1">{message}</ToastTitle>
            <Pressable onPress={() => toast.close(id)} className="ml-2 p-1" hitSlop={8}>
              <SolarIconBold name="CloseCircle" color="#FDFBF9" size={20} />
            </Pressable>
          </HStack>
        </Toast>
      );
    },
  });
}

export function showErrorToast(toast: ToastInstance, error: unknown) {
  showToast(toast, { action: 'error', message: getErrorMessage(error) });
}

export function showSuccessToast(toast: ToastInstance, message: string) {
  showToast(toast, { action: 'success', message });
}

export function showWarningToast(toast: ToastInstance, message: string) {
  showToast(toast, { action: 'warning', message });
}

export function showInfoToast(toast: ToastInstance, message: string) {
  showToast(toast, { action: 'info', message });
}
