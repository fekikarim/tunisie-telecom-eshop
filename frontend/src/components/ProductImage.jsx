import { useState } from 'react';
import { imageOrFallback } from '../utils/api.js';

/** Product picture that falls back to the placeholder if the image fails to load. */
export default function ProductImage({ src, alt, className = '' }) {
  const [failed, setFailed] = useState(false);
  return (
    <img
      src={failed ? '/products/placeholder.svg' : imageOrFallback(src)}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`h-full w-full object-contain ${className}`}
    />
  );
}
