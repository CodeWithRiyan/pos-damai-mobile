'use client';
import { tva, type VariantProps } from '@gluestack-ui/utils/nativewind-utils';
import React from 'react';
import { TextInput, View } from 'react-native';

const textareaStyle = tva({
  base: 'border-background-300 rounded border overflow-hidden data-[hover=true]:border-outline-400 data-[focus=true]:border-primary-700 data-[disabled=true]:opacity-40',
  variants: {
    size: {
      xl: 'min-h-32',
      lg: 'min-h-28',
      md: 'min-h-24',
      sm: 'min-h-20',
    },
  },
});

const textareaInputStyle = tva({
  base: 'flex-1 text-typography-900 py-3 px-3 placeholder:text-typography-500 web:cursor-text web:data-[disabled=true]:cursor-not-allowed text-base',
});

type ITextareaProps = React.ComponentProps<typeof View> &
  VariantProps<typeof textareaStyle> & { className?: string };

const Textarea = React.forwardRef<React.ComponentRef<typeof View>, ITextareaProps>(
  function Textarea({ className, size = 'md', ...props }, ref) {
    return <View ref={ref} {...props} className={textareaStyle({ size, class: className })} />;
  },
);

type ITextareaInputProps = React.ComponentProps<typeof TextInput> & {
  className?: string;
};

const TextareaInput = React.forwardRef<React.ComponentRef<typeof TextInput>, ITextareaInputProps>(
  function TextareaInput({ className, ...props }, ref) {
    return (
      <TextInput
        ref={ref}
        multiline
        textAlignVertical="top"
        {...props}
        className={textareaInputStyle({ class: className })}
        style={{ minHeight: 80 }}
      />
    );
  },
);

Textarea.displayName = 'Textarea';
TextareaInput.displayName = 'TextareaInput';

export { Textarea, TextareaInput };
