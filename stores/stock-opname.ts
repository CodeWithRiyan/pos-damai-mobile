import { Product } from "@/lib/api/products";
import { create } from "zustand";

interface CartItem {
  product: Product;
  physicalStock: number;
}

interface StockOpnameState {
  addProduct: Product | null;
  openConfirm: boolean;
  cart: CartItem[];
  setAddProduct: (state: Product | null) => void;
  setOpenConfirm: (state: boolean) => void;
  addCartItem: (item: CartItem) => void;
  removeCartItem: (productId: string) => void;
  resetCart: () => void;
}

export const useStockOpnameStore = create<StockOpnameState>((set) => ({
  addProduct: null,
  openConfirm: false,
  cart: [],
  setAddProduct: (state) => set({ addProduct: state }),
  addCartItem: (item) =>
    set((state) => {
      const existingItemIndex = state.cart?.findIndex(
        (cartItem) => cartItem.product.id === item.product.id,
      );

      let updatedCart: CartItem[];

      if (
        existingItemIndex !== undefined &&
        existingItemIndex !== -1 &&
        state.cart
      ) {
        updatedCart = [...state.cart];
        updatedCart[existingItemIndex] = item;
      } else {
        updatedCart = state.cart ? [...state.cart, item] : [item];
      }

      return { cart: updatedCart };
    }),
  setOpenConfirm: (state) => set({ openConfirm: state }),
  removeCartItem: (productId) =>
    set((state) => {
      const updatedCart = state.cart?.filter(
        (cartItem) => cartItem.product.id !== productId,
      );

      return { cart: updatedCart };
    }),
  resetCart: () => set({ cart: [] }),
}));
