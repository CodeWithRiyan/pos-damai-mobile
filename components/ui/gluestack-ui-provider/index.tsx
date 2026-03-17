import { OverlayProvider } from "@gluestack-ui/core/overlay/creator";
import { colorScheme as s_colorScheme } from "nativewind";
import React from "react";
import { View, ViewProps } from "react-native";
import { ToastProvider } from "../toast";

export function GluestackUIProvider({ children, ...props }: ViewProps) {
  React.useEffect(() => {
    s_colorScheme.set("light");
  }, []);

  return (
    <View style={[{ flex: 1 }, props.style]} {...props} className="light">
      <OverlayProvider>
        <ToastProvider>{children}</ToastProvider>
      </OverlayProvider>
    </View>
  );
}
