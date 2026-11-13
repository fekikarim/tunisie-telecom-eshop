import { Loader2 } from 'lucide-react';

export default function Spinner({ label = 'Loading…', className = '' }) {
  return (
    <div role="status" className={`flex items-center justify-center gap-2 text-sm text-muted ${className}`}>
      <Loader2 className="size-5 animate-spin text-tt-600" />
      <span>{label}</span>
    </div>
  );
}
