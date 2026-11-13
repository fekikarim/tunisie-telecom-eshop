export const DELIVERY_FEE = 8; // TND, shown as an estimate; the server calculates the real value
export const FREE_DELIVERY_FROM = 150;

export const CATEGORY_ORDER = ['smartphones', 'routers', 'fiber', 'packages', 'audio', 'smart-home', 'accessories'];

/** Formats an amount in Tunisian dinars, e.g. 3499 -> "3 499,000 TND". */
export function formatTND(amount) {
  const value = Number(amount) || 0;
  const decimals = Number.isInteger(value) ? 0 : 3;
  return `${value.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} TND`;
}

export function formatDate(value) {
  if (!value) return '';
  const date = new Date(value.includes('T') ? value : `${value.replace(' ', 'T')}Z`);
  return date.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export const STATUS_STYLES = {
  Pending: 'bg-amber-100 text-amber-800',
  Confirmed: 'bg-tt-100 text-tt-800',
  Shipped: 'bg-violet-100 text-violet-800',
  Delivered: 'bg-emerald-100 text-emerald-800',
  Cancelled: 'bg-red-100 text-red-700',
};

export const ORDER_STATUSES = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

export const TUNISIAN_GOVERNORATES = [
  'Ariana', 'Béja', 'Ben Arous', 'Bizerte', 'Gabès', 'Gafsa', 'Jendouba', 'Kairouan', 'Kasserine',
  'Kébili', 'Kef', 'Mahdia', 'Manouba', 'Médenine', 'Monastir', 'Nabeul', 'Sfax', 'Sidi Bouzid',
  'Siliana', 'Sousse', 'Tataouine', 'Tozeur', 'Tunis', 'Zaghouan',
];
