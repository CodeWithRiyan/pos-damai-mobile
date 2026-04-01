import { Product, ProductVariant } from '@/lib/api/products';
import { BaseCartItem, ConfirmData } from '@/lib/types/cart';
import { create } from 'zustand';

interface CartItem extends BaseCartItem {
  sellPrice: number;
  variant?: ProductVariant;
}

interface ReturnTransactionState {
  addProduct: Product | null;
  addProductVariantId: string | null;
  cart: CartItem[];
  cartTotal: number;
  openConfirm: boolean;
  confirmData: ConfirmData | null;
  setOpenConfirm: (state: boolean) => void;
  setConfirmData: (data: ConfirmData | null) => void;
  setAddProduct: (state: Product | null, variantId?: string) => void;
  addCartItem: (item: CartItem) => void;
  removeCartItem: (productId: string, variantId?: string) => void;
  resetCart: () => void;
}

export const useReturnTransactionStore = create<ReturnTransactionState>((set) => ({
  addProduct: null,
  addProductVariantId: null,
  cart: [],
  cartTotal: 0,
  openConfirm: false,
  confirmData: null,
  setOpenConfirm: (state) => set({ openConfirm: state }),
  setConfirmData: (data) => set({ confirmData: data }),
  setAddProduct: (state, variantId) =>
    set({ addProduct: state, addProductVariantId: variantId || null }),
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
  removeCartItem: (productId, variantId) =>
    set((state) => {
      const updatedCart = (state.cart ?? []).filter(
        (cartItem) => !(cartItem.product.id === productId && cartItem.variant?.id === variantId),
      );

      const cartTotal = updatedCart.reduce((sum, item) => sum + item.sellPrice * item.quantity, 0);

      return { cart: updatedCart, cartTotal };
    }),
  resetCart: () => set({ cart: [], cartTotal: 0 }),
}));
