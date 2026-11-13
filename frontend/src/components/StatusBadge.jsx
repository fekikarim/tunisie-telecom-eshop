import { STATUS_STYLES } from '../utils/format.js';

export default function StatusBadge({ status }) {
  return <span className={`badge ${STATUS_STYLES[status] || 'bg-slate-100 text-slate-700'}`}>{status}</span>;
}
