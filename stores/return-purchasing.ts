import { Product } from '@/lib/api/products';
import { BaseCartItem as CartItem, ConfirmData } from '@/lib/types/cart';
import { create } from 'zustand';

interface ReturnPurchasingState {
  addProduct: Product | null;
  cart: CartItem[];
  cartTotal: number;
  openConfirm: boolean;
  confirmData: ConfirmData | null;
  setOpenConfirm: (state: boolean) => void;
  setConfirmData: (data: ConfirmData | null) => void;
  setAddProduct: (state: Product | null) => void;
  addCartItem: (item: CartItem) => void;
  removeCartItem: (productId: string) => void;
  resetCart: () => void;
}

export const useReturnPurchasingStore = create<ReturnPurchasingState>((set) => ({
  addProduct: null,
  cart: [],
  cartTotal: 0,
  openConfirm: false,
  confirmData: null,
  setOpenConfirm: (state) => set({ openConfirm: state }),
  setConfirmData: (data) => set({ confirmData: data }),
  setAddProduct: (state) => set({ addProduct: state }),
  addCartItem: (item) =>
    set((state) => {
      const existingItemIndex = state.cart?.findIndex(
        (cartItem) => cartItem.product.id === item.product.id,
      );

      let updatedCart: CartItem[];

      if (existingItemIndex !== undefined && existingItemIndex !== -1 && state.cart) {
        updatedCart = [...state.cart];
        updatedCart[existingItemIndex] = item;
      } else {
        updatedCart = state.cart ? [...state.cart, item] : [item];
      }

      return { cart: updatedCart };
    }),
  removeCartItem: (productId) =>
    set((state) => {
      const updatedCart = (state.cart ?? []).filter(
        (cartItem) => cartItem.product.id !== productId,
      );

      const cartTotal = updatedCart.reduce(
        (sum, item) => sum + item.product.purchasePrice * item.quantity,
        0,
      );

      return { cart: updatedCart, cartTotal };
    }),
  resetCart: () => set({ cart: [], cartTotal: 0 }),
}));
