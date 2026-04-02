export * from '@/hooks/use-shift';

export const useShiftDetail = (id: string) => {
  const { useShift } = require('@/hooks/use-shift');
  return useShift(id);
};