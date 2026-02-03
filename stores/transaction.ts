import { Customer } from "@/lib/api/customers";
import { Product } from "@/lib/api/products";
import { findSellPrice } from "@/lib/price";
import { create } from "zustand";

interface CartItem {
  product: Product;
  quantity: number;
  unitWeight?: number;
  tempSellPrice?: number;
  note?: string;
}

type TransactionCheckoutResponse = {
  id: string;
  referenceNumber: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedById: string;
  updatedByName: string;
  updatedAt: string;
  items: CartItem[];
  totalItems: number;
  totalPaid: string;
  customerId: string;
  transactionDate: Date | null;
  isCashdrawer: boolean;
  status: string;
  note: string;
};

interface TransactionState {
  addProduct: Product | null;
  cart: CartItem[];
  cartTotal: number;
  checkoutData: TransactionCheckoutResponse | null;
  customer: Customer | null;
  status: "DRAFT" | "COMPLETED";
  purchaseId: string | null;
  setCustomer: (customer: Customer | null) => void;
  setPurchaseId: (id: string | null) => void;
  setStatus: (status: "DRAFT" | "COMPLETED") => void;
  setAddProduct: (state: Product | null) => void;
  setCheckoutData: (state: TransactionCheckoutResponse | null) => void;
  addCartItem: (item: CartItem) => void;
  removeCartItem: (productId: string) => void;
  resetCart: () => void;
}

export const useTransactionStore = create<TransactionState>((set) => ({
  addProduct: null,
  cart: [],
  cartTotal: 0,
  checkoutData: null,
  customer: null,
  status: "DRAFT",
  purchaseId: null,
  setCustomer: (customer) => set({ customer }),
  setPurchaseId: (id) => set({ purchaseId: id }),
  setStatus: (status) => {
    set({ status });
  },
  setAddProduct: (state) => set({ addProduct: state }),
  setCheckoutData: (state) => set({ checkoutData: state }),
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

      const total = updatedCart.reduce(
        (sum, cartItem) =>
          sum +
          cartItem.quantity *
            (cartItem.tempSellPrice ||
              findSellPrice({
                sellPrices: cartItem.product.sellPrices,
                type: state.customer?.category,
                quantity: cartItem.quantity,
              })),
        0,
      );

      return { cart: updatedCart, cartTotal: total };
    }),
  removeCartItem: (productId) =>
    set((state) => {
      const updatedCart = state.cart?.filter(
        (cartItem) => cartItem.product.id !== productId,
      );

      const total = updatedCart.reduce(
        (sum, cartItem) =>
          sum +
          cartItem.quantity *
            (cartItem.tempSellPrice ||
              findSellPrice({
                sellPrices: cartItem.product.sellPrices,
                type: state.customer?.category,
                quantity: cartItem.quantity,
              })),
        0,
      );

      return { cart: updatedCart, cartTotal: total };
    }),
  resetCart: () => set({ cart: [], cartTotal: 0, purchaseId: null }),
}));
