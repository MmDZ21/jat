"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItem {
  id: string;
  name: string;
  price: string;
  image?: string | null;
  quantity: number;
  sellerId: string;
}

interface CartState {
  items: CartItem[];
  sellerId: string | null;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalAmount: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      sellerId: null,

      addItem: (item) =>
        set((state) => {
          const quantity = item.quantity ?? 1;

          // Prevent mixing items from different sellers at the store level.
          // UI should ask user to clear cart before switching sellers.
          if (state.sellerId && state.sellerId !== item.sellerId) {
            return state;
          }

          const existingIndex = state.items.findIndex((i) => i.id === item.id);

          if (existingIndex !== -1) {
            const items = [...state.items];
            items[existingIndex] = {
              ...items[existingIndex],
              quantity: items[existingIndex].quantity + quantity,
            };
            return { ...state, items, sellerId: item.sellerId };
          }

          return {
            ...state,
            sellerId: item.sellerId,
            items: [
              ...state.items,
              {
                id: item.id,
                name: item.name,
                price: item.price,
                image: item.image,
                quantity,
                sellerId: item.sellerId,
              },
            ],
          };
        }),

      removeItem: (id) =>
        set((state) => {
          const items = state.items.filter((item) => item.id !== id);
          return {
            items,
            sellerId: items.length > 0 ? state.sellerId : null,
          };
        }),

      updateQuantity: (id, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            const items = state.items.filter((item) => item.id !== id);
            return {
              items,
              sellerId: items.length > 0 ? state.sellerId : null,
            };
          }

          const items = state.items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          );

          return { ...state, items };
        }),

      clearCart: () => set({ items: [], sellerId: null }),

      totalAmount: () =>
        get().items.reduce(
          (sum, item) => sum + parseFloat(item.price) * item.quantity,
          0
        ),
    }),
    {
      name: "jat-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        sellerId: state.sellerId,
      }),
    }
  )
);

