import { Box, VStack } from '@/components/ui';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { createContext, useCallback, useContext, useState } from 'react';
import { GestureResponderEvent } from 'react-native';
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetItem,
  ActionsheetItemText,
  HStack,
} from './ui';
import { SolarIconBold, SolarIconBoldProps } from './ui/solar-icon-wrapper';

type TTheme = 'default' | 'primary' | 'red' | 'green' | 'yellow' | 'blue';

const actionContentStyle = tva({
  base: 'px-0',
});

const actionLabelStyle = tva({
  base: 'font-bold',
  variants: {
    theme: {
      default: 'text-gray-800',
      primary: 'text-primary-500',
      red: 'text-rose-500',
      green: 'text-emerald-500',
      yellow: 'text-yellow-500',
      blue: 'text-blue-500',
    },
  },
});

const actionBgStyle = tva({
  base: 'w-full justify-between items-center px-4 py-2',
  variants: {
    theme: {
      default: 'bg-background-0 active:bg-background-200',
      primary: 'bg-background-0 active:bg-primary-200',
      red: 'bg-background-0 active:bg-rose-200',
      green: 'bg-background-0 active:bg-emerald-200',
      yellow: 'bg-background-0 active:bg-yellow-200',
      blue: 'bg-background-0 active:bg-blue-200',
    },
  },
});

export interface ActionDrawerProps {
  open: boolean;
  onClose?: () => void;
  actions?: {
    label: string;
    onPress: (e: GestureResponderEvent) => void;
    icon?: SolarIconBoldProps['name'];
    theme?: TTheme;
  }[];
  className?: string;
}

export function ActionDrawer({ open, onClose, actions, className }: ActionDrawerProps) {
  const iconColor = (theme: TTheme) => {
    if (theme === 'primary') return '#3D2117';
    if (theme === 'red') return '#ef4444';
    if (theme === 'green') return '#22c55e';
    if (theme === 'yellow') return '#f59e0b';
    if (theme === 'blue') return '#4f46e5';
    return '#1f2937';
  };
  return (
    <Actionsheet isOpen={open} onClose={() => onClose?.()}>
      <ActionsheetBackdrop />
      <ActionsheetContent className={actionContentStyle({ className })}>
        <ActionsheetDragIndicatorWrapper className="relative">
          <ActionsheetDragIndicator className="w-full h-4 opacity-0 z-[100]" />
          <Box className="flex-1 flex items-center justify-center absolute top-2">
            <Box className="h-1 w-32 rounded-md bg-gray-300" />
          </Box>
        </ActionsheetDragIndicatorWrapper>
        <VStack className="pt-2 pb-6">
          {actions?.map((action, index) => (
            <ActionsheetItem
              key={index}
              onPress={action.onPress}
              className={actionBgStyle({ theme: action.theme || 'default' })}
            >
              <HStack className="w-full justify-between items-center px-4 py-2">
                <ActionsheetItemText
                  className={actionLabelStyle({
                    theme: action.theme || 'default',
                  })}
                >
                  {action.label}
                </ActionsheetItemText>
                {action.icon && (
                  <SolarIconBold
                    name={action.icon}
                    size={20}
                    color={iconColor(action.theme || 'default')}
                  />
                )}
              </HStack>
            </ActionsheetItem>
          ))}
        </VStack>
      </ActionsheetContent>
    </Actionsheet>
  );
}

type ActionDrawerConfig = Omit<ActionDrawerProps, 'open'>;

interface ActionDrawerContextType {
  showActionDrawer: (config: ActionDrawerConfig) => void;
  hideActionDrawer: () => void;
}

const ActionDrawerContext = createContext<ActionDrawerContextType | null>(null);

export function useActionDrawer() {
  const context = useContext(ActionDrawerContext);
  if (!context) {
    throw new Error('ActionDrawer must be used within a ActionDrawerProvider.');
  }

  return context;
}

export function ActionDrawerProvider({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState<boolean>(false);
  const [config, setConfig] = useState<ActionDrawerConfig>({});

  const showActionDrawer = useCallback((newConfig: ActionDrawerConfig) => {
    setConfig(newConfig);
    setOpen(true);
  }, []);

  const hideActionDrawer = useCallback(() => {
    setOpen(false);
  }, []);

  const handleClose = useCallback(() => {
    if (config.onClose) {
      config.onClose();
    }
    hideActionDrawer();
  }, [config, hideActionDrawer]);

  return (
    <ActionDrawerContext.Provider
      value={{
        showActionDrawer,
        hideActionDrawer,
      }}
    >
      {children}
      <ActionDrawer {...config} open={open} onClose={handleClose} />
    </ActionDrawerContext.Provider>
  );
}
