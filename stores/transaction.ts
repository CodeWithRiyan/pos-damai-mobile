import { Customer } from '@/hooks/use-customer';
import { Product, ProductVariant } from '@/hooks/use-product';
import { PriceType, Status } from '@/constants';
import { calculateLineItemTotal, findSellPrice } from '@/utils/price';
import { BaseCartItem } from '@/types/cart';
import { create } from 'zustand';

interface CartItem extends BaseCartItem {
  variant?: ProductVariant;
  tempSellPrice?: number;
}

export interface Employee {
  id: string;
  name: string;
  username: string;
}

interface CheckoutData {
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
  totalAmount?: number;
  totalPaid: string;
  customerId: string;
  employeeId?: string;
  transactionDate: Date;
  status: string;
  note: string;
}

interface TransactionState {
  customer: Customer | null;
  employee: Employee | null;
  cart: CartItem[];
  cartTotal: number;
  status: 'DRAFT' | 'COMPLETED';
  checkoutData: CheckoutData | null;
  transactionId: string | null;
  addProduct: Product | null;
  addProductVariantId: string | null;
  setCustomer: (customer: Customer | null) => void;
  setEmployee: (employee: Employee | null) => void;
  setTransactionId: (id: string | null) => void;
  addCartItem: (item: CartItem) => void;
  removeCartItem: (productId: string, variantId?: string) => void;
  resetCart: () => void;
  setStatus: (status: 'DRAFT' | 'COMPLETED') => void;
  setCheckoutData: (data: CheckoutData | null) => void;
  setAddProduct: (product: Product | null, variantId?: string) => void;
}

export const useTransactionStore = create<TransactionState>((set) => ({
  customer: null,
  employee: null,
  cart: [],
  cartTotal: 0,
  status: Status.DRAFT,
  checkoutData: null,
  transactionId: null,
  addProduct: null,
  addProductVariantId: null,
  setCustomer: (customer) =>
    set((state) => {
      const prevCategory = state.customer?.category;
      const nextCategory = customer?.category;
      const categoryChanged = prevCategory !== nextCategory;

      if (!categoryChanged) return { customer, employee: null };

      const updatedCart = state.cart.map((cartItem) => {
        const updateTempSellPrice = () => {
          if (nextCategory === PriceType.RETAIL && cartItem.variant?.netto) {
            return undefined;
          } else if (nextCategory === PriceType.WHOLESALE && cartItem.variant?.netto) {
            return (
              findSellPrice({
                sellPrices: cartItem.product.sellPrices,
                type: PriceType.WHOLESALE,
                quantity: cartItem.quantity,
              }) * cartItem.variant.netto
            );
          }

          return cartItem.tempSellPrice;
        };

        return {
          ...cartItem,
          tempSellPrice: updateTempSellPrice(),
        };
      });

      const updatedTotal = updatedCart.reduce((sum, cartItem) => {
        const unitPrice =
          cartItem.tempSellPrice ??
          findSellPrice({
            sellPrices: cartItem.product.sellPrices,
            type: nextCategory ?? PriceType.RETAIL,
            quantity: cartItem.quantity,
            unitVariant: cartItem.variant,
          });

        return (
          sum +
          calculateLineItemTotal({
            quantity: cartItem.quantity,
            unitPrice: unitPrice,
            discount: cartItem.product.discount,
            isManualPrice: !!cartItem.tempSellPrice,
          })
        );
      }, 0);

      return {
        customer,
        employee: null,
        cartTotal: updatedTotal,
        cart: updatedCart,
      };
    }),
  setEmployee: (employee) =>
    set((state) => {
      if (!employee) return { employee: null };

      const prevCategory = state.customer?.category;

      // If already RETAIL or no customer, no cart recalculation needed
      if (!prevCategory || prevCategory === PriceType.RETAIL) {
        return { employee, customer: null };
      }

      // Switching from WHOLESALE customer to employee — recalculate to RETAIL
      const updatedCart = state.cart.map((cartItem) => ({
        ...cartItem,
        tempSellPrice: cartItem.variant?.netto ? undefined : cartItem.tempSellPrice,
      }));

      const updatedTotal = updatedCart.reduce((sum, cartItem) => {
        const unitPrice =
          cartItem.tempSellPrice ??
          findSellPrice({
            sellPrices: cartItem.product.sellPrices,
            type: PriceType.RETAIL,
            quantity: cartItem.quantity,
            unitVariant: cartItem.variant,
          });

        return (
          sum +
          calculateLineItemTotal({
            quantity: cartItem.quantity,
            unitPrice: unitPrice,
            discount: cartItem.product.discount,
            isManualPrice: !!cartItem.tempSellPrice,
          })
        );
      }, 0);

      return {
        employee,
        customer: null,
        cartTotal: updatedTotal,
        cart: updatedCart,
      };
    }),
  setTransactionId: (id) => set({ transactionId: id }),
  setStatus: (status) => set({ status }),
  setCheckoutData: (data) => set({ checkoutData: data }),
  setAddProduct: (product, variantId) =>
    set({ addProduct: product, addProductVariantId: variantId || null }),
  addCartItem: (item) =>
    set((state) => {
      const existingItemIndex = state.cart.findIndex(
        (i) => i.product.id === item.product.id && i.variant?.id === item.variant?.id,
      );

      let updatedCart: CartItem[];

      if (existingItemIndex !== undefined && existingItemIndex !== -1 && state.cart) {
        updatedCart = [...state.cart];
        updatedCart[existingItemIndex] = item;
      } else {
        updatedCart = state.cart ? [...state.cart, item] : [item];
      }

      const total = updatedCart.reduce((sum, cartItem) => {
        const unitPrice =
          cartItem.tempSellPrice ||
          findSellPrice({
            sellPrices: cartItem.product.sellPrices,
            type: state.customer?.category,
            quantity: cartItem.quantity,
            unitVariant: cartItem.variant,
          });

        return (
          sum +
          calculateLineItemTotal({
            quantity: cartItem.quantity,
            unitPrice: unitPrice,
            discount: cartItem.product.discount,
            isManualPrice: !!cartItem.tempSellPrice,
          })
        );
      }, 0);

      return { cart: updatedCart, cartTotal: total };
    }),
  removeCartItem: (productId, variantId) =>
    set((state) => {
      const updatedCart = state.cart?.filter(
        (cartItem) => !(cartItem.product.id === productId && cartItem.variant?.id === variantId),
      );

      const total = updatedCart.reduce((sum, cartItem) => {
        const unitPrice =
          cartItem.tempSellPrice ||
          findSellPrice({
            sellPrices: cartItem.product.sellPrices,
            type: state.customer?.category,
            quantity: cartItem.quantity,
            unitVariant: cartItem.variant,
          });

        return (
          sum +
          calculateLineItemTotal({
            quantity: cartItem.quantity,
            unitPrice: unitPrice,
            discount: cartItem.product.discount,
            isManualPrice: !!cartItem.tempSellPrice,
          })
        );
      }, 0);

      return { cart: updatedCart, cartTotal: total };
    }),
  resetCart: () => set({ cart: [], cartTotal: 0, transactionId: null }),
}));
