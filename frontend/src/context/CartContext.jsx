import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../utils/api.js';

const CartContext = createContext(null);
const STORAGE_KEY = 'tt_cart';
const MAX_QTY = 99;

function loadCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed)
      ? parsed.filter((i) => Number.isInteger(i?.productId) && i.quantity > 0)
      : [];
  } catch {
    return [];
  }
}

/**
 * The cart lives in localStorage. Prices and stock shown here are refreshed
 * from the API, and the server recalculates everything again at checkout.
 */
export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);
  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable (private mode): the cart still works for this page view */
    }
  }, [items]);

  /** Adds a product. Returns { ok, message } so the UI can show feedback. */
  const addItem = useCallback((product, quantity = 1) => {
    if (product.stock <= 0) return { ok: false, message: `"${product.name}" is out of stock` };
    const current = itemsRef.current.find((i) => i.productId === product.id)?.quantity ?? 0;
    const next = Math.min(current + quantity, product.stock, MAX_QTY);
    if (next <= current) {
      return { ok: false, message: `Only ${product.stock} unit(s) of "${product.name}" are available` };
    }
    const entry = {
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      stock: product.stock,
      quantity: next,
    };
    setItems((list) => (
      list.some((i) => i.productId === product.id)
        ? list.map((i) => (i.productId === product.id ? entry : i))
        : [...list, entry]
    ));
    const capped = next < current + quantity;
    return {
      ok: true,
      message: capped
        ? `Cart updated: only ${next} unit(s) of "${product.name}" can be added`
        : `"${product.name}" added to your cart`,
    };
  }, []);

  const setQuantity = useCallback((productId, quantity) => {
    setItems((list) => list.map((i) => {
      if (i.productId !== productId) return i;
      const max = Math.min(i.stock ?? MAX_QTY, MAX_QTY);
      return { ...i, quantity: Math.max(1, Math.min(quantity, max)) };
    }));
  }, []);

  const removeItem = useCallback((productId) => {
    setItems((list) => list.filter((i) => i.productId !== productId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  /** Syncs names, prices and stock from the live catalogue; drops products that no longer exist. */
  const refresh = useCallback(async () => {
    if (itemsRef.current.length === 0) return;
    const { data: products } = await api.get('/products');
    const byId = new Map(products.map((p) => [p.id, p]));
    setItems((list) => list.flatMap((i) => {
      const fresh = byId.get(i.productId);
      if (!fresh) return [];
      return [{
        ...i,
        name: fresh.name,
        price: fresh.price,
        imageUrl: fresh.imageUrl,
        stock: fresh.stock,
        quantity: Math.min(i.quantity, Math.max(fresh.stock, 0), MAX_QTY) || 0,
      }].filter((x) => x.quantity > 0);
    }));
  }, []);

  const value = useMemo(() => {
    const count = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = items.reduce((sum, i) => sum + Math.round(i.price * 1000) * i.quantity, 0) / 1000;
    return { items, count, subtotal, addItem, setQuantity, removeItem, clearCart, refresh };
  }, [items, addItem, setQuantity, removeItem, clearCart, refresh]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
