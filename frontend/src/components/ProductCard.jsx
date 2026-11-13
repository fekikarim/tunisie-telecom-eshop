import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import ProductImage from './ProductImage.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatTND } from '../utils/format.js';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const outOfStock = product.stock <= 0;
  const lowStock = !outOfStock && product.stock <= 5;

  const handleAdd = () => {
    setAdding(true);
    const result = addItem(product, 1);
    if (result.ok) toast.success(result.message);
    else toast.error(result.message);
    setTimeout(() => setAdding(false), 300);
  };

  return (
    <article className="card group flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-lift">
      <Link to={`/products/${product.id}`} className="relative block aspect-[4/3] overflow-hidden bg-gradient-to-b from-tt-50 to-white p-5">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          className="transition duration-500 group-hover:scale-105"
        />
        {outOfStock && <span className="badge absolute left-3 top-3 bg-slate-800 text-white">Out of stock</span>}
        {lowStock && <span className="badge absolute left-3 top-3 bg-sun-50 text-amber-800 ring-1 ring-sun/60">Only {product.stock} left</span>}
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-tt-600">{product.categoryName}</p>
        <h3 className="mt-1.5 line-clamp-2 text-base font-semibold leading-snug text-ink">
          <Link to={`/products/${product.id}`} className="hover:text-tt-700">{product.name}</Link>
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">{product.description}</p>

        <div className="mt-auto flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-base font-bold text-tt-800 sm:text-lg">{formatTND(product.price)}</p>
          <button
            type="button"
            onClick={handleAdd}
            disabled={outOfStock}
            className={`btn-primary btn-sm w-full px-3.5 py-2 sm:w-auto ${adding ? 'scale-95' : ''}`}
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart className="size-4" />
            {outOfStock ? 'Sold out' : 'Add to cart'}
          </button>
        </div>
      </div>
    </article>
  );
}
