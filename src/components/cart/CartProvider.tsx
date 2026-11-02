'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type CartOption = {
  groupName: string;
  groupLabel: string;
  valueId: string;
  valueLabel: string;
  priceDelta: number;
};

export type CartTier = {
  name: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
  label: string;
};

export type CartItem = {
  key: string;            // hash of productId + option valueIds
  productId: string;
  productSlug: string;
  productName: string;
  productImage?: string;
  basePrice: number;
  options: CartOption[];
  tier?: CartTier;        // optional tier snapshot
  unitPrice: number;      // basePrice + sum of priceDeltas (or tier override)
  quantity: number;
};

type Ctx = {
  items: CartItem[];
  add: (item: Omit<CartItem, 'key'>) => void;
  remove: (key: string) => void;
  updateQty: (key: string, qty: number) => void;
  clear: () => void;
  subtotal: number;
  itemCount: number;
};

const CartContext = createContext<Ctx | null>(null);
const STORAGE_KEY = 'serverfactory.cart.v1';

function hashItem(productId: string, options: CartOption[]): string {
  const safeOpts = Array.isArray(options) ? options : [];
  const opts = [...safeOpts].sort((a, b) => a.groupName.localeCompare(b.groupName)).map((o) => `${o.groupName}:${o.valueId}`).join('|');
  return `${productId}__${opts}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch {}
    }
  }, [items, hydrated]);

  const add = useCallback((item: Omit<CartItem, 'key'>) => {
    const key = hashItem(item.productId, item.options);
    setItems((prev) => {
      const current = Array.isArray(prev) ? prev : [];
      const existing = current.find((i) => i && i.key === key);
      if (existing) {
        return current.map((i) => (i && i.key === key ? { ...i, quantity: (i.quantity || 1) + (item.quantity || 1) } : i));
      }
      return [...current, { ...item, key }];
    });
  }, []);

  const remove = useCallback((key: string) => {
    setItems((prev) => (Array.isArray(prev) ? prev.filter((i) => i && i.key !== key) : []));
  }, []);

  const updateQty = useCallback((key: string, qty: number) => {
    if (qty <= 0) return remove(key);
    setItems((prev) => (Array.isArray(prev) ? prev.map((i) => (i && i.key === key ? { ...i, quantity: qty } : i)) : []));
  }, [remove]);

  const clear = useCallback(() => setItems([]), []);

  const safeItems = Array.isArray(items) ? items : [];
  const subtotal = safeItems.reduce((sum, i) => sum + (Number(i?.unitPrice) || 0) * (Number(i?.quantity) || 1), 0);
  const itemCount = safeItems.reduce((sum, i) => sum + (Number(i?.quantity) || 0), 0);

  return (
    <CartContext.Provider value={{ items: safeItems, add, remove, updateQty, clear, subtotal, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
