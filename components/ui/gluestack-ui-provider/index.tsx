import { useColorScheme } from '@/hooks/use-color-scheme';
import { OverlayProvider } from '@gluestack-ui/overlay';
import { ToastProvider } from '@gluestack-ui/toast';
import { colorScheme as s_colorScheme } from 'nativewind';
import React from 'react';
import { View, ViewProps } from 'react-native';

export function GluestackUIProvider({ children, ...props }: ViewProps) {
  const colorScheme = useColorScheme() ?? 'light';
  
  React.useEffect(() => {
    s_colorScheme.set(colorScheme);
  }, [colorScheme]);

  return (
    <View style={[{ flex: 1 }, props.style]} {...props} className={colorScheme}>
      <OverlayProvider>
        <ToastProvider>{children}</ToastProvider>
      </OverlayProvider>
    </View>
  );
}
