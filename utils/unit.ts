export const unitSuffixHelper = (unit?: string | null) => {
  switch (unit) {
    case 'KILOGRAM':
      return 'kg';
    case 'LITER':
      return 'liter';
    default:
      return '';
  }
};
