import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types';

export interface CartItem {
  product: Product;
  quantity: number;
  groupId: string;
  groupTitle?: string;
}

export interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, groupId: string, groupTitle?: string, quantity?: number) => void;
  addAllToCart: (products: Product[], groupId: string, groupTitle?: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalCount: number;
  subtotal: number;
  bundleDiscount: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'dp_cart';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (err) {
      console.warn('[CartContext] Failed to load cart from localStorage:', err);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.warn('[CartContext] Failed to save cart to localStorage:', err);
    }
  }, [items]);

  const addToCart = (product: Product, groupId: string, groupTitle?: string, quantity = 1) => {
    setItems((prev) => {
      const existingIdx = prev.findIndex((item) => item.product.id === product.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + quantity,
        };
        return updated;
      }
      return [...prev, { product, quantity, groupId, groupTitle }];
    });
  };

  const addAllToCart = (products: Product[], groupId: string, groupTitle?: string) => {
    setItems((prev) => {
      const copy = [...prev];
      products.forEach((product) => {
        const idx = copy.findIndex((item) => item.product.id === product.id);
        if (idx >= 0) {
          copy[idx] = {
            ...copy[idx],
            quantity: copy[idx].quantity + 1,
          };
        } else {
          copy.push({ product, quantity: 1, groupId, groupTitle });
        }
      });
      return copy;
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: Math.min(99, quantity) } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const subtotal = items.reduce((acc, item) => acc + (item.product.price || 0) * item.quantity, 0);

  // Bundle discount: 15% discount when cart has multiple items
  const bundleDiscount = totalCount > 1 ? Number((subtotal * 0.15).toFixed(2)) : 0;

  const totalPrice = Number((subtotal - bundleDiscount).toFixed(2));

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        addAllToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalCount,
        subtotal,
        bundleDiscount,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
