import { useAuthStore } from "@/stores/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { and, eq, isNull, like, or } from "drizzle-orm";
import { db } from "../db";
import * as schema from "../db/schema";

export type ProductListItem = Omit<Product, "sellPrices" | "variants">;

export interface ProductPrice {
  id: string;
  label: string;
  price: number;
  minimumPurchase: number;
  type: "RETAIL" | "WHOLESALE";
}

export interface ProductVariant {
  id: string;
  name: string;
  code: string;
}

export interface Product {
  id: string;
  name: string;
  barcode: string | null;
  code: string | null; // Added for UI compatibility
  purchasePrice: number;
  stock: number; // Added
  description: string | null;
  isFavorite: boolean;
  isActive: boolean;
  type: "DEFAULT" | "MULTIUNIT" | "VARIANTS";
  unit: string | null;
  minimumStock: number;
  categoryId: string;
  brandId: string | null;
  organizationId: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  sellPrices: ProductPrice[]; // Renamed from prices to sellPrices
  variants: ProductVariant[];
  discountId: string | null; // Added
  supplierId: string | null; // Added
  category?: { id: string; name: string };
  brand?: { id: string; name: string };
  discount?: { id: string; name: string };
}

export interface CreateProductDTO {
  name: string;
  code: string;
  purchasePrice: number;
  stock?: number;
  description?: string;
  isFavorite?: boolean;
  isActive?: boolean;
  type: "DEFAULT" | "MULTIUNIT" | "VARIANTS";
  unit?: string | null;
  minimumStock?: number;
  categoryId: string;
  brandId?: string;
  prices: Omit<ProductPrice, "id">[];
  variants?: Omit<ProductVariant, "id">[];
  discountId?: string | null;
}

export interface UpdateProductDTO extends Partial<CreateProductDTO> {
  id: string;
}

export type ShowByStock = "NO_STOCK" | "LOW_STOCK" | "ALL_STOCK";

export interface ProductParams {
  search?: string;
  showByStock?: ShowByStock;
  brandId?: string;
  categoryId?: string;
}

// Get all products from local SQLite (excluding soft-deleted)
export function useProducts(params: ProductParams | void) {
  const orgId = useAuthStore((state) => state.getOrganizationId());
  const conditions = [
    eq(schema.products.organizationId, orgId),
    isNull(schema.products.deletedAt),
  ];

  if (params?.search) {
    const searchTerm = `%${params.search}%`;
    conditions.push(
      or(
        like(schema.products.name, searchTerm),
        like(schema.products.barcode, searchTerm),
      )!,
    );
  }

  if (params?.brandId) {
    conditions.push(eq(schema.products.brandId, params.brandId));
  }

  if (params?.categoryId) {
    conditions.push(eq(schema.products.categoryId, params.categoryId));
  }

  return useQuery({
    queryKey: [
      "products",
      orgId,
      params?.search,
      params?.showByStock,
      params?.brandId,
      params?.categoryId,
    ],
    queryFn: async () => {
      const productResult = await db
        .select()
        .from(schema.products)
        .where(and(...conditions));

      const productsWithPrices = await Promise.all(
        productResult.map(async (product) => {
          const prices = await db
            .select()
            .from(schema.productPrices)
            .where(eq(schema.productPrices.productId, product.id));

          const variants = await db
            .select()
            .from(schema.productVariants)
            .where(eq(schema.productVariants.productId, product.id));

          // Calculate stock from inventory transactions (only COMPLETED)
          const transactions = await db
            .select()
            .from(schema.inventoryTransactions)
            .where(
              and(
                eq(schema.inventoryTransactions.productId, product.id),
                eq(schema.inventoryTransactions.status, "COMPLETED"),
              ),
            );

          const totalStock = transactions.reduce(
            (sum, tx) => sum + tx.quantity,
            0,
          );

          if (
            transactions.length > 0 &&
            product.name === "DEBUG_PRODUCT_NAME"
          ) {
            // Optional filter
            console.log(
              `📊 [STOCK DEBUG] ${product.name} transactions:`,
              transactions.map((t) => ({ type: t.type, qty: t.quantity })),
            );
          }

          return {
            ...product,
            code: product.barcode,
            sellPrices: prices,
            variants: variants,
            stock: totalStock,
            discountId: product.discountId,
          };
        }),
      );

      // TODO: olah data dengan drizzle-orm jika diperlukan
      if (params?.showByStock) {
        if (params.showByStock === "NO_STOCK") {
          return productsWithPrices.filter(
            (p) => p.stock === 0,
          ) as unknown as Product[];
        } else if (params.showByStock === "LOW_STOCK") {
          return productsWithPrices.filter(
            (p) => p.stock < (p.minimumStock || 0),
          ) as unknown as Product[];
        }
      }

      return productsWithPrices as unknown as Product[];
    },
    enabled: !!orgId,
  });
}

// Get products by category
export function useProductsByCategory(categoryId: string) {
  const orgId = useAuthStore((state) => state.getOrganizationId());
  return useQuery({
    queryKey: ["products", orgId, "byCategory", categoryId],
    queryFn: async () => {
      const productResult = await db
        .select()
        .from(schema.products)
        .where(
          and(
            eq(schema.products.organizationId, orgId),
            eq(schema.products.categoryId, categoryId),
            isNull(schema.products.deletedAt),
          ),
        );

      // Fetch prices for each product
      const productsWithPrices = await Promise.all(
        productResult.map(async (product) => {
          const prices = await db
            .select()
            .from(schema.productPrices)
            .where(eq(schema.productPrices.productId, product.id));

          // Calculate stock from inventory transactions (only COMPLETED)
          const transactions = await db
            .select()
            .from(schema.inventoryTransactions)
            .where(
              and(
                eq(schema.inventoryTransactions.productId, product.id),
                eq(schema.inventoryTransactions.status, "COMPLETED"),
              ),
            );

          const totalStock = transactions.reduce(
            (sum, tx) => sum + tx.quantity,
            0,
          );

          return {
            ...product,
            code: product.barcode,
            sellPrices: prices,
            variants: [],
            stock: totalStock,
            discountId: product.discountId,
          };
        }),
      );

      return productsWithPrices as unknown as Product[];
    },
    enabled: !!categoryId,
  });
}

// Get products by brand
export function useProductsByBrand(brandId: string) {
  const orgId = useAuthStore((state) => state.getOrganizationId());
  return useQuery({
    queryKey: ["products", orgId, "byBrand", brandId],
    queryFn: async () => {
      const productResult = await db
        .select()
        .from(schema.products)
        .where(
          and(
            eq(schema.products.organizationId, orgId),
            eq(schema.products.brandId, brandId),
            isNull(schema.products.deletedAt),
          ),
        );

      // Fetch prices for each product
      const productsWithPrices = await Promise.all(
        productResult.map(async (product) => {
          const prices = await db
            .select()
            .from(schema.productPrices)
            .where(eq(schema.productPrices.productId, product.id));

          // Calculate stock from inventory transactions (only COMPLETED)
          const transactions = await db
            .select()
            .from(schema.inventoryTransactions)
            .where(
              and(
                eq(schema.inventoryTransactions.productId, product.id),
                eq(schema.inventoryTransactions.status, "COMPLETED"),
              ),
            );

          const totalStock = transactions.reduce(
            (sum, tx) => sum + tx.quantity,
            0,
          );

          return {
            ...product,
            code: product.barcode,
            sellPrices: prices,
            variants: [],
            stock: totalStock,
            discountId: product.discountId,
          };
        }),
      );

      return productsWithPrices as unknown as Product[];
    },
    enabled: !!brandId,
  });
}

// Get single product with relative data
export function useProduct(id: string) {
  return useQuery({
    queryKey: ["products", id],
    queryFn: async () => {
      const productResult = await db
        .select({
          product: schema.products,
          category: schema.categories,
          brand: schema.brands,
          discount: schema.discounts,
        })
        .from(schema.products)
        .leftJoin(
          schema.categories,
          eq(schema.products.categoryId, schema.categories.id),
        )
        .leftJoin(schema.brands, eq(schema.products.brandId, schema.brands.id))
        .leftJoin(
          schema.discounts,
          eq(schema.products.discountId, schema.discounts.id),
        )
        .where(eq(schema.products.id, id))
        .limit(1);

      if (productResult.length === 0) return undefined;

      const { product, category, brand, discount } = productResult[0];
      const prices = await db
        .select()
        .from(schema.productPrices)
        .where(eq(schema.productPrices.productId, id));
      const variants = await db
        .select()
        .from(schema.productVariants)
        .where(eq(schema.productVariants.productId, id));

      // Calculate stock from inventory transactions (only COMPLETED)
      const transactions = await db
        .select()
        .from(schema.inventoryTransactions)
        .where(
          and(
            eq(schema.inventoryTransactions.productId, id),
            eq(schema.inventoryTransactions.status, "COMPLETED"),
          ),
        );

      const totalStock = transactions.reduce((sum, tx) => sum + tx.quantity, 0);

      console.log(`📊 [STOCK DEBUG] Product ${id} details:`, {
        transactionCount: transactions.length,
        types: transactions.map((t) => t.type),
        totalStock: totalStock,
        transactions: transactions.map((t) => ({
          type: t.type,
          quantity: t.quantity,
          id: t.id,
        })),
      });

      return {
        ...product,
        stock: totalStock,
        code: product.barcode,
        sellPrices: prices,
        variants,
        discountId: product.discountId,
        category: category
          ? { id: category.id, name: category.name }
          : undefined,
        brand: brand ? { id: brand.id, name: brand.name } : undefined,
        discount: discount
          ? { id: discount.id, name: discount.name }
          : undefined,
      } as unknown as Product;
    },
    enabled: !!id,
  });
}

// Create product (saved to local SQLite, synced via SyncEngine)
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProductDTO) => {
      const orgId = useAuthStore.getState().getOrganizationId();
      const id = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      const { prices, variants, ...productData } = data;

      await db.transaction(async (tx) => {
        await tx.insert(schema.products).values({
          id,
          ...productData,
          barcode: productData.code, // Map 'code' from UI to 'barcode' in DB
          organizationId: orgId,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
          isActive: productData.isActive ?? true,
          _dirty: true,
          _syncedAt: null,
        });

        if (prices && prices.length > 0) {
          for (const price of prices) {
            await tx.insert(schema.productPrices).values({
              id: `price_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              ...price,
              productId: id,
              organizationId: orgId,
              createdAt: now,
              updatedAt: now,
              _dirty: true,
              _syncedAt: null,
            });
          }
        }

        if (variants && variants.length > 0) {
          for (const variant of variants) {
            await tx.insert(schema.productVariants).values({
              id: `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              ...variant,
              productId: id,
              organizationId: orgId,
              createdAt: now,
              updatedAt: now,
              _dirty: true,
              _syncedAt: null,
            });
          }
        }

        // Create initial stock transaction if stock > 0
        if (productData.stock && productData.stock > 0) {
          await tx.insert(schema.inventoryTransactions).values({
            id: `invtx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            local_ref_id: `initial_${id}`,
            productId: id,
            type: "INITIAL_STOCK",
            quantity: productData.stock,
            organizationId: orgId,
            createdAt: now,
            updatedAt: now,
            _dirty: true,
            _syncedAt: null,
          });
        }
      });

      return { id, ...data } as any;
    },
    onSuccess: (data) => {
      const orgId = useAuthStore.getState().getOrganizationId();
      queryClient.invalidateQueries({ queryKey: ["products", orgId] });
    },
  });
}

// Update product
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProductDTO) => {
      const { id, prices, variants, ...productData } = data;
      const now = new Date();
      const orgId = useAuthStore.getState().getOrganizationId();

      await db.transaction(async (tx) => {
        await tx
          .update(schema.products)
          .set({
            ...productData,
            barcode: productData.code,
            updatedAt: now,
            _dirty: true,
          })
          .where(eq(schema.products.id, id));

        if (prices) {
          // Simplest reconciliation: delete existing and re-insert
          // Better: upsert based on ID if available, but DTO doesn't have it for new ones
          await tx
            .delete(schema.productPrices)
            .where(eq(schema.productPrices.productId, id));
          for (const price of prices) {
            await tx.insert(schema.productPrices).values({
              id: `price_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              ...price,
              productId: id,
              organizationId: orgId,
              createdAt: now,
              updatedAt: now,
              _dirty: true,
              _syncedAt: null,
            });
          }
        }

        if (variants) {
          await tx
            .delete(schema.productVariants)
            .where(eq(schema.productVariants.productId, id));
          for (const variant of variants) {
            await tx.insert(schema.productVariants).values({
              id: `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              ...variant,
              productId: id,
              organizationId: orgId,
              createdAt: now,
              updatedAt: now,
              _dirty: true,
              _syncedAt: null,
            });
          }
        }
      });

      return data;
    },
    onSuccess: (data) => {
      const orgId = useAuthStore.getState().getOrganizationId();
      queryClient.invalidateQueries({ queryKey: ["products", orgId] });
      queryClient.invalidateQueries({ queryKey: ["products", data.id] });
    },
  });
}

// Delete product
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const now = new Date();

      await db
        .update(schema.products)
        .set({ deletedAt: now, _dirty: true })
        .where(eq(schema.products.id, id));

      return { id };
    },
    onSuccess: () => {
      const orgId = useAuthStore.getState().getOrganizationId();
      queryClient.invalidateQueries({ queryKey: ["products", orgId] });
    },
  });
}

// Bulk delete products
export function useBulkDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { ids: string[] }) => {
      const now = new Date();

      for (const id of data.ids) {
        await db
          .update(schema.products)
          .set({ deletedAt: now, _dirty: true })
          .where(eq(schema.products.id, id));
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

// Assign products to a category
export function useAssignProductsToCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { productIds: string[]; categoryId: string }) => {
      const now = new Date();

      for (const productId of data.productIds) {
        await db
          .update(schema.products)
          .set({ categoryId: data.categoryId, updatedAt: now, _dirty: true })
          .where(eq(schema.products.id, productId));
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["productCountsByCategory"] });
    },
  });
}

// Assign products to a brand
export function useAssignProductsToBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { productIds: string[]; brandId: string }) => {
      const now = new Date();

      for (const productId of data.productIds) {
        await db
          .update(schema.products)
          .set({ brandId: data.brandId, updatedAt: now, _dirty: true })
          .where(eq(schema.products.id, productId));
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["productCountsByBrand"] });
    },
  });
}
