import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  Box,
  Heading,
  HStack,
  Pressable,
  Text,
  VStack,
} from "./ui";
import { SolarIconBold } from "./ui/solar-icon-wrapper";

export type TIcon = "default" | "success" | "info" | "warning" | "error";
export type TVariant = "outline" | "link" | "solid" | "destructive";
export interface PopUpConfirmProps {
  open: boolean;
  onOk?: () => void;
  onClose?: () => void;
  okText?: string | ReactNode;
  closeText?: string | ReactNode;
  okVariant?: TVariant;
  closeVariant?: TVariant;
  title?: string | ReactNode;
  icon?: TIcon;
  description?: string | ReactNode;
  children?: ReactNode;
  showClose?: boolean;
  loading?: boolean;
  className?: string;
  centered?: boolean;
}

export function PopUpConfirm({
  open,
  onOk,
  onClose,
  okText,
  closeText,
  okVariant = "solid",
  closeVariant = "outline",
  title,
  icon,
  description,
  showClose,
  loading,
  className,
}: PopUpConfirmProps) {
  function ModalIcon() {
    if (icon === "success") {
      return <SolarIconBold name="CheckCircle" color="#22c55e" />;
    } else if (icon === "info") {
      return <SolarIconBold name="InfoCircle" color="#3b82f6" />;
    } else if (icon === "warning") {
      return <SolarIconBold name="InfoCircle" color="#eab308" />;
    } else if (icon === "error") {
      return <SolarIconBold name="CloseCircle" color="#ef4444" />;
    }
    return null;
  }

  const getButtonStyles = (variant: TVariant) => {
    const baseStyles = "px-4 py-2 rounded-lg transition-colors w-full";

    if (variant === "solid") {
      return `${baseStyles} bg-blue-600 hover:bg-blue-700 active:bg-blue-800`;
    } else if (variant === "outline") {
      return `${baseStyles} border border-gray-300 hover:bg-gray-100 active:bg-gray-200`;
    } else if (variant === "link") {
      return `${baseStyles} hover:bg-gray-100 active:bg-gray-200`;
    } else if (variant === "destructive") {
      return `${baseStyles} bg-rose-600 hover:bg-rose-700 active:bg-rose-800`;
    }
    return baseStyles;
  };

  const getTextStyles = (variant: TVariant): string => {
    if (variant === "solid") {
      return "text-white font-bold text-center";
    } else if (variant === "outline") {
      return "text-gray-700 font-bold text-center";
    } else if (variant === "link") {
      return "text-blue-600 font-bold text-center";
    } else if (variant === "destructive") {
      return "text-white font-bold text-center";
    }
    return "text-gray-700 font-bold text-center";
  };

  return (
    <Actionsheet isOpen={open} onClose={() => onClose?.()}>
      <ActionsheetBackdrop />
      <ActionsheetContent className={`${className || ""}`}>
        <ActionsheetDragIndicatorWrapper className="relative">
          <ActionsheetDragIndicator className="w-full h-4 opacity-0 z-[100]" />
          <Box className="flex-1 flex items-center justify-center absolute top-2">
            <Box className="h-1 w-32 rounded-md bg-gray-300" />
          </Box>
        </ActionsheetDragIndicatorWrapper>

        <VStack space="lg" className="w-full p-4">
          {/* Header with Icon and Title */}
          <HStack space="md" className="items-center justify-between w-full">
            <HStack space="md" className="items-center flex-1">
              <ModalIcon />
              <Heading size="lg">{title}</Heading>
            </HStack>
          </HStack>

          {/* Description */}
          {description ? <Text className="text-gray-600">{description}</Text> : null}

          {/* Action Buttons */}
          <VStack space="md" className="w-full mt-4">
            <Pressable
              onPress={() => onOk?.()}
              className={getButtonStyles(okVariant)}
              disabled={loading}
            >
              <Text className={getTextStyles(okVariant)}>{okText || "OK"}</Text>
            </Pressable>

            {showClose && (
              <Pressable
                onPress={() => onClose?.()}
                className={getButtonStyles(closeVariant)}
                disabled={loading}
              >
                <Text className={getTextStyles(closeVariant)}>
                  {closeText || "CANCEL"}
                </Text>
              </Pressable>
            )}
          </VStack>
        </VStack>
      </ActionsheetContent>
    </Actionsheet>
  );
}

type PopUpConfirmConfig = Omit<PopUpConfirmProps, "open">;

interface PopUpConfirmContextType {
  showPopUpConfirm: (config: PopUpConfirmConfig) => void;
  hidePopUpConfirm: () => void;
}

const PopUpConfirmContext = createContext<PopUpConfirmContextType | null>(null);

export function usePopUpConfirm() {
  const context = useContext(PopUpConfirmContext);
  if (!context) {
    throw new Error("PopUpConfirm must be used within a PopUpConfirmProvider.");
  }

  return context;
}

export function PopUpConfirmProvider({
  children,
}: {
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState<boolean>(false);
  const [config, setConfig] = useState<PopUpConfirmConfig>({});

  const showPopUpConfirm = useCallback((newConfig: PopUpConfirmConfig) => {
    setConfig(newConfig);
    setOpen(true);
  }, []);

  const hidePopUpConfirm = useCallback(() => {
    setOpen(false);
  }, []);

  const handleClose = useCallback(() => {
    if (config.onClose) {
      config.onClose();
    }
    hidePopUpConfirm();
  }, [config, hidePopUpConfirm]);

  const handleOk = useCallback(() => {
    if (config.onOk) {
      config.onOk();
    }
    if (!config.loading) {
      hidePopUpConfirm();
    }
  }, [config, hidePopUpConfirm]);

  return (
    <PopUpConfirmContext.Provider
      value={{
        showPopUpConfirm,
        hidePopUpConfirm,
      }}
    >
      {children}
      <PopUpConfirm
        {...config}
        open={open}
        onClose={handleClose}
        onOk={handleOk}
      />
    </PopUpConfirmContext.Provider>
  );
}
