import { Product } from '@/hooks/use-product';
import { Status } from '@/constants';
import { BaseCartItem } from '@/types/cart';
import { create } from 'zustand';

interface CartItem extends BaseCartItem {
  newPurchasePrice: number;
}

type PurchasingCheckoutResponse = {
  id: string;
  referenceNumber: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedById: string;
  updatedByName: string;
  updatedAt: string;
  items: CartItem[];
  totalPurchase: number;
  totalPaid: string;
  supplierId: string;
  isPayable: boolean;
  transactionDate: Date | null;
  dueDate: Date | null;
  isCashdrawer: boolean;
  status: string;
  note: string;
};

interface PurchasingState {
  addProduct: Product | null;
  cart: CartItem[];
  cartTotal: number;
  checkoutData: PurchasingCheckoutResponse | null;
  status: 'DRAFT' | 'COMPLETED';
  purchaseId: string | null;
  setPurchaseId: (id: string | null) => void;
  setStatus: (status: 'DRAFT' | 'COMPLETED') => void;
  setAddProduct: (state: Product | null) => void;
  setCheckoutData: (state: PurchasingCheckoutResponse | null) => void;
  addCartItem: (item: CartItem) => void;
  removeCartItem: (productId: string) => void;
  resetCart: () => void;
}

export const usePurchasingStore = create<PurchasingState>((set) => ({
  addProduct: null,
  cart: [],
  cartTotal: 0,
  checkoutData: null,
  status: Status.DRAFT,
  purchaseId: null,
  setPurchaseId: (id) => set({ purchaseId: id }),
  setStatus: (status) => set({ status }),
  setAddProduct: (state) => set({ addProduct: state }),
  setCheckoutData: (state) => set({ checkoutData: state }),
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

      const total = updatedCart.reduce(
        (sum, cartItem) => sum + cartItem.quantity * cartItem.newPurchasePrice,
        0,
      );

      return { cart: updatedCart, cartTotal: total };
    }),
  removeCartItem: (productId) =>
    set((state) => {
      const updatedCart = state.cart?.filter((cartItem) => cartItem.product.id !== productId);

      const total = updatedCart.reduce(
        (sum, cartItem) => sum + cartItem.quantity * cartItem.newPurchasePrice,
        0,
      );

      return { cart: updatedCart, cartTotal: total };
    }),
  resetCart: () => set({ cart: [], cartTotal: 0, purchaseId: null }),
}));
