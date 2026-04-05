const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('id-ID');

/** "Rp15.000" - full Intl currency format */
export function formatMoney(amount: number): string {
  return currencyFormatter.format(amount);
}

/** "15.000" - number only, no currency symbol */
export function formatNumber(amount: number): string {
  return numberFormatter.format(amount);
}

/** "Rp 15.000" - drop-in for the `Rp ${n.toLocaleString("id-ID")}` pattern */
export function formatRp(amount: number): string {
  return `Rp ${formatNumber(amount)}`;
}
