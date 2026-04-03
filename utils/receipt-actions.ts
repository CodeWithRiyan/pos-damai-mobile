export function getReceiptActions(hideActionDrawer: () => void) {
  return [
    {
      label: 'Cetak Struk',
      icon: 'Printer' as const,
      onPress: () => {
        hideActionDrawer();
      },
    },
    {
      label: 'Download',
      icon: 'Download' as const,
      onPress: () => {
        hideActionDrawer();
      },
    },
    {
      label: 'Share',
      icon: 'Share' as const,
      onPress: () => {
        hideActionDrawer();
      },
    },
  ];
}
