import { Product } from "@/lib/api/products";
import { create } from "zustand";

interface CartItem {
  product: Product;
  newPurchasePrice: number;
  quantity: number;
  note?: string;
}

interface PurchasingState {
  openAddProduct: Product | null;
  cart: CartItem[];
  cartTotal?: number;
  setOpenAddProduct: (state: Product | null) => void;
  addCartItem: (item: CartItem) => void;
  removeCartItem: (productId: string) => void;
  resetCart: () => void;
}

export const usePurchasingStore = create<PurchasingState>((set) => ({
  openAddProduct: null,
  cart: [],
  cartTotal: 0,
  setOpenAddProduct: (state) => set({ openAddProduct: state }),
  addCartItem: (item) =>
    set((state) => {
      // Cek apakah produk sudah ada di cart
      const existingItemIndex = state.cart?.findIndex(
        (cartItem) => cartItem.product.id === item.product.id,
      );

      let updatedCart: CartItem[];

      if (
        existingItemIndex !== undefined &&
        existingItemIndex !== -1 &&
        state.cart
      ) {
        // Jika produk sudah ada, update item tersebut
        updatedCart = [...state.cart];
        updatedCart[existingItemIndex] = item;
      } else {
        // Jika produk belum ada, tambahkan ke cart
        updatedCart = state.cart ? [...state.cart, item] : [item];
      }

      // Update total cart
      const total = updatedCart.reduce(
        (sum, cartItem) => sum + cartItem.quantity * cartItem.newPurchasePrice,
        0,
      );

      return { cart: updatedCart, cartTotal: total };
    }),
  removeCartItem: (productId) =>
    set((state) => {
      const updatedCart = state.cart?.filter(
        (cartItem) => cartItem.product.id !== productId,
      );

      // Update total cart
      const total = updatedCart.reduce(
        (sum, cartItem) => sum + cartItem.quantity * cartItem.newPurchasePrice,
        0,
      );

      return { cart: updatedCart, cartTotal: total };
    }),
  resetCart: () => set({ cart: [], cartTotal: 0 }),
}));
