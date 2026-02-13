import { PurchaseItem } from "@/lib/api/purchasing";
import { create } from "zustand";

interface CartItem {
  product: PurchaseItem;
  quantity: number;
  note?: string;
}

interface ConfirmData {
  reason: string;
  returnType: string;
}

interface ReturnPurchasingState {
  addProduct: PurchaseItem | null;
  cart: CartItem[];
  cartTotal: number;
  openConfirm: boolean;
  confirmData: ConfirmData | null;
  setOpenConfirm: (state: boolean) => void;
  setConfirmData: (data: ConfirmData | null) => void;
  setAddProduct: (state: PurchaseItem | null) => void;
  addCartItem: (item: CartItem) => void;
  removeCartItem: (productId: string) => void;
  resetCart: () => void;
}

export const useReturnPurchasingStore = create<ReturnPurchasingState>(
  (set) => ({
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
    removeCartItem: (productId) =>
      set((state) => {
        const updatedCart = state.cart?.filter(
          (cartItem) => cartItem.product.id !== productId,
        );

        return { cart: updatedCart };
      }),
    resetCart: () => set({ cart: [], cartTotal: 0 }),
  }),
);
