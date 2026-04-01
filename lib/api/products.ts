import { InventoryTxType, ProductType, Status } from '@/lib/constants';
import { useAuthStore } from '@/stores/auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { and, desc, eq, isNull, like, or } from 'drizzle-orm';
import { db } from '../db';
import * as schema from '../db/schema';

export type ProductListItem = Omit<Product, 'sellPrices' | 'variants'>;

export interface IProductLog {
  id: string;
  type: string;
  quantity: number;
  createdAt: Date | null;
  status: string | null;
  local_ref_id: string | null;
}

export interface ProductPrice {
  id: string;
  label: string;
  price: number;
  minimumPurchase: number;
  type: 'RETAIL' | 'WHOLESALE';
}

export interface ProductVariant {
  id: string;
  name: string;
  code: string;
  netto?: number | null;
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
  type: 'DEFAULT' | 'MULTIUNIT' | 'VARIANTS';
  unit: string | null;
  minimumStock: number;
  categoryId: string;
  brandId: string | null;
  organizationId: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  sellPrices: ProductPrice[]; // Renamed from prices to sellPrices
  variants: ProductVariant[];
  discountId: string | null; // Added
  supplierId: string | null; // Added
  category?: { id: string; name: string };
  brand?: { id: string; name: string };
  discount?: {
    id: string;
    name: string;
    nominal: number;
    type: 'FLAT' | 'PERCENTAGE';
    startDate: Date;
    endDate: Date;
  };
  isVariant?: boolean; // Added for flattened list UI support
  variantData?: ProductVariant; // Added for flattened list UI support
  originalId?: string; // Added to reference parent
  lastSellPrice?: number; // Last sell price from customer's transaction history (set by usePurchasedProducts)
}

export interface CreateProductDTO {
  name: string;
  code: string;
  purchasePrice: number;
  stock?: number;
  description?: string;
  isFavorite?: boolean;
  isActive?: boolean;
  type: 'DEFAULT' | 'MULTIUNIT' | 'VARIANTS';
  unit?: string | null;
  minimumStock?: number;
  categoryId: string;
  brandId?: string;
  prices: Omit<ProductPrice, 'id'>[];
  variants?: (Omit<ProductVariant, 'id'> & { id?: string })[];
  discountId?: string | null;
}

export interface UpdateProductDTO extends Partial<CreateProductDTO> {
  id: string;
}

export type ShowByStock = 'NO_STOCK' | 'LOW_STOCK' | 'ALL_STOCK';

export interface ProductParams {
  search?: string;
  showByStock?: ShowByStock;
  brandId?: string;
  categoryId?: string;
  supplierId?: string;
  forceParent?: boolean;
  forceParentMultiUnit?: boolean;
}

// Get all products from local SQLite (excluding soft-deleted)
export function useProducts(params: ProductParams | void) {
  const orgId = useAuthStore((state) => state.getOrganizationId());

  return useQuery({
    queryKey: [
      'products',
      orgId,
      params?.search,
      params?.showByStock,
      params?.brandId,
      params?.categoryId,
      params?.supplierId,
      params?.forceParent,
      params?.forceParentMultiUnit,
    ],
    queryFn: async () => {
      // Build conditions inside queryFn to avoid stale closure bug
      const conditions = [
        eq(schema.products.organizationId, orgId),
        isNull(schema.products.deletedAt),
      ];

      if (params?.search) {
        const searchTerm = `%${params.search}%`;
        conditions.push(
          or(like(schema.products.name, searchTerm), like(schema.products.barcode, searchTerm))!,
        );
      }

      if (params?.brandId) {
        conditions.push(eq(schema.products.brandId, params.brandId));
      }

      if (params?.categoryId) {
        conditions.push(eq(schema.products.categoryId, params.categoryId));
      }

      if (params?.supplierId) {
        conditions.push(eq(schema.products.supplierId, params.supplierId));
      }

      const productResult = await db
        .select({
          product: schema.products,
          discount: schema.discounts,
        })
        .from(schema.products)
        .leftJoin(schema.discounts, eq(schema.products.discountId, schema.discounts.id))
        .where(and(...conditions));

      const productsWithPrices = await Promise.all(
        productResult.map(async ({ product, discount }) => {
          const prices = await db
            .select()
            .from(schema.productPrices)
            .where(eq(schema.productPrices.productId, product.id));

          const variants = await db
            .select()
            .from(schema.productVariants)
            .where(
              and(
                eq(schema.productVariants.productId, product.id),
                isNull(schema.productVariants.deletedAt),
              ),
            );

          // Calculate stock from inventory transactions (only COMPLETED)
          const transactions = await db
            .select()
            .from(schema.inventoryTransactions)
            .where(
              and(
                eq(schema.inventoryTransactions.productId, product.id),
                eq(schema.inventoryTransactions.status, Status.COMPLETED),
              ),
            );

          const totalStock = transactions.reduce((sum, tx) => sum + tx.quantity, 0);

          return {
            ...product,
            code: product.barcode,
            sellPrices: prices,
            variants: variants,
            stock: totalStock,
            discountId: product.discountId,
            discount: discount
              ? {
                  id: discount.id,
                  name: discount.name,
                  nominal: discount.nominal,
                  type: discount.type as 'FLAT' | 'PERCENTAGE',
                  startDate: discount.startDate,
                  endDate: discount.endDate,
                }
              : undefined,
          };
        }),
      );

      const flattenedProducts = productsWithPrices.flatMap((product) => {
        if (product.type === ProductType.MULTIUNIT && params?.forceParentMultiUnit) {
          return [
            {
              ...product,
              isVariant: false,
              variantData: undefined,
              purchasePrice: product.purchasePrice ?? 0,
              minimumStock: product.minimumStock ?? 0,
              isActive: !!product.isActive,
              isFavorite: !!product.isFavorite,
            } as Product,
          ];
        }

        if (params?.forceParent) {
          return [
            {
              ...product,
              isVariant: false,
              variantData: undefined,
              purchasePrice: product.purchasePrice ?? 0,
              minimumStock: product.minimumStock ?? 0,
              isActive: !!product.isActive,
              isFavorite: !!product.isFavorite,
            } as Product,
          ];
        }

        const items: Product[] = [];
        const hasVariants = product.variants && product.variants.length > 0;

        if (product.type === ProductType.DEFAULT) {
          // Parent product is always added for DEFAULT
          items.push({
            ...product,
            sellPrices: product.sellPrices.map((p) => ({
              ...p,
              type: p.type as ProductPrice['type'],
              minimumPurchase: p.minimumPurchase || 0,
            })),
            minimumStock: product.minimumStock || 0,
            type: product.type as Product['type'],
            isActive: !!product.isActive,
            isFavorite: !!product.isFavorite,
            purchasePrice: product.purchasePrice || 0,
            isVariant: false,
            variantData: undefined,
          });
        }

        // Add variants/children for MULTIUNIT and VARIANTS if they exist
        if (
          (product.type === ProductType.MULTIUNIT || product.type === ProductType.VARIANTS) &&
          hasVariants
        ) {
          product.variants.forEach((variant) => {
            const compositeId = `${product.id}-${variant.id}`;
            const variantProduct: Product = {
              ...product,
              id: compositeId, // Unique ID for list rendering
              originalId: product.id, // Keep reference to original product ID
              name: `${variant.name}`, // Override name for display
              code: variant.code || product.code, // Use variant code if available
              isVariant: true,
              variantData: variant,
              type: product.type as Product['type'],
              isActive: !!product.isActive,
              isFavorite: !!product.isFavorite,
              minimumStock: product.minimumStock || 0,
              purchasePrice: product.purchasePrice || 0,
              sellPrices: product.sellPrices.map((p) => ({
                ...p,
                type: p.type as ProductPrice['type'],
                minimumPurchase: p.minimumPurchase || 0,
              })),
            };
            // Note: In an ideal world we'd also adjust stock per variant if tracked
            items.push(variantProduct);
          });
        }

        // Fallback: If type is VARIANTS or MULTIUNIT but it has no variants yet, still show the parent
        if (
          (product.type === ProductType.VARIANTS || product.type === ProductType.MULTIUNIT) &&
          !hasVariants
        ) {
          items.push({
            ...product,
            isVariant: false,
            variantData: undefined,
            type: product.type as Product['type'],
            isActive: !!product.isActive,
            isFavorite: !!product.isFavorite,
            minimumStock: product.minimumStock || 0,
            purchasePrice: product.purchasePrice || 0,
            sellPrices: product.sellPrices.map((p) => ({
              ...p,
              type: p.type as ProductPrice['type'],
              minimumPurchase: p.minimumPurchase || 0,
            })),
          });
        }

        return items;
      });

      if (params?.showByStock) {
        if (params.showByStock === 'NO_STOCK') {
          return flattenedProducts.filter((p) => p.stock === 0);
        } else if (params.showByStock === 'LOW_STOCK') {
          return flattenedProducts.filter((p) => p.stock < (p.minimumStock || 0));
        }
      }

      return flattenedProducts;
    },
    enabled: !!orgId,
  });
}

// Get products by category
export function useProductsByCategory(categoryId: string) {
  const orgId = useAuthStore((state) => state.getOrganizationId());
  return useQuery({
    queryKey: ['products', orgId, 'byCategory', categoryId],
    queryFn: async () => {
      const productResult = await db
        .select({
          product: schema.products,
          discount: schema.discounts,
        })
        .from(schema.products)
        .leftJoin(schema.discounts, eq(schema.products.discountId, schema.discounts.id))
        .where(
          and(
            eq(schema.products.organizationId, orgId),
            eq(schema.products.categoryId, categoryId),
            isNull(schema.products.deletedAt),
          ),
        );

      // Fetch prices for each product
      const productsWithPrices = await Promise.all(
        productResult.map(async ({ product, discount }) => {
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
                eq(schema.inventoryTransactions.status, Status.COMPLETED),
              ),
            );

          const totalStock = transactions.reduce((sum, tx) => sum + tx.quantity, 0);

          return {
            ...product,
            code: product.barcode,
            sellPrices: prices,
            variants: [],
            stock: totalStock,
            discountId: product.discountId,
            discount: discount
              ? {
                  id: discount.id,
                  name: discount.name,
                  nominal: discount.nominal,
                  type: discount.type as 'FLAT' | 'PERCENTAGE',
                  startDate: discount.startDate,
                  endDate: discount.endDate,
                }
              : undefined,
          };
        }),
      );

      return productsWithPrices as Product[];
    },
    enabled: !!categoryId,
  });
}

// Get products by brand
export function useProductsByBrand(brandId: string) {
  const orgId = useAuthStore((state) => state.getOrganizationId());
  return useQuery({
    queryKey: ['products', orgId, 'byBrand', brandId],
    queryFn: async () => {
      const productResult = await db
        .select({
          product: schema.products,
          discount: schema.discounts,
        })
        .from(schema.products)
        .leftJoin(schema.discounts, eq(schema.products.discountId, schema.discounts.id))
        .where(
          and(
            eq(schema.products.organizationId, orgId),
            eq(schema.products.brandId, brandId),
            isNull(schema.products.deletedAt),
          ),
        );

      // Fetch prices for each product
      const productsWithPrices = await Promise.all(
        productResult.map(async ({ product, discount }) => {
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
                eq(schema.inventoryTransactions.status, Status.COMPLETED),
              ),
            );

          const totalStock = transactions.reduce((sum, tx) => sum + tx.quantity, 0);

          return {
            ...product,
            code: product.barcode,
            sellPrices: prices,
            variants: [],
            stock: totalStock,
            discountId: product.discountId,
            discount: discount
              ? {
                  id: discount.id,
                  name: discount.name,
                  nominal: discount.nominal,
                  type: discount.type as 'FLAT' | 'PERCENTAGE',
                  startDate: discount.startDate,
                  endDate: discount.endDate,
                }
              : undefined,
          };
        }),
      );

      return productsWithPrices as Product[];
    },
    enabled: !!brandId,
  });
}

// Get products by supplier
export function useProductsBySupplier(supplierId: string) {
  const orgId = useAuthStore((state) => state.getOrganizationId());
  return useQuery({
    queryKey: ['products', orgId, 'bySupplier', supplierId],
    queryFn: async () => {
      const productResult = await db
        .select({
          product: schema.products,
          discount: schema.discounts,
        })
        .from(schema.products)
        .leftJoin(schema.discounts, eq(schema.products.discountId, schema.discounts.id))
        .where(
          and(
            eq(schema.products.organizationId, orgId),
            eq(schema.products.supplierId, supplierId),
            isNull(schema.products.deletedAt),
          ),
        );

      // Fetch prices for each product
      const productsWithPrices = await Promise.all(
        productResult.map(async ({ product, discount }) => {
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
                eq(schema.inventoryTransactions.status, Status.COMPLETED),
              ),
            );

          const totalStock = transactions.reduce((sum, tx) => sum + tx.quantity, 0);

          return {
            ...product,
            code: product.barcode,
            sellPrices: prices,
            variants: [],
            stock: totalStock,
            discountId: product.discountId,
            discount: discount
              ? {
                  id: discount.id,
                  name: discount.name,
                  nominal: discount.nominal,
                  type: discount.type as 'FLAT' | 'PERCENTAGE',
                  startDate: discount.startDate,
                  endDate: discount.endDate,
                }
              : undefined,
          };
        }),
      );

      return productsWithPrices as Product[];
    },
    enabled: !!supplierId,
  });
}

// Get single product with relative data
export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: async () => {
      // If the ID contains a dash, it's a flattened variant (e.g. prod_...-var_...)
      const baseProductId = id.includes('-var_') ? id.substring(0, id.indexOf('-var_')) : id;
      const productResult = await db
        .select({
          product: schema.products,
          category: schema.categories,
          brand: schema.brands,
          discount: schema.discounts,
        })
        .from(schema.products)
        .leftJoin(schema.categories, eq(schema.products.categoryId, schema.categories.id))
        .leftJoin(schema.brands, eq(schema.products.brandId, schema.brands.id))
        .leftJoin(schema.discounts, eq(schema.products.discountId, schema.discounts.id))
        .where(eq(schema.products.id, baseProductId))
        .limit(1);

      if (productResult.length === 0) return undefined;

      const { product, category, brand, discount } = productResult[0];
      const prices = await db
        .select()
        .from(schema.productPrices)
        .where(eq(schema.productPrices.productId, baseProductId));
      const variants = await db
        .select()
        .from(schema.productVariants)
        .where(
          and(
            eq(schema.productVariants.productId, baseProductId),
            isNull(schema.productVariants.deletedAt),
          ),
        );

      // Calculate stock from inventory transactions (only COMPLETED)
      const transactions = await db
        .select()
        .from(schema.inventoryTransactions)
        .where(
          and(
            eq(schema.inventoryTransactions.productId, baseProductId),
            eq(schema.inventoryTransactions.status, Status.COMPLETED),
          ),
        );

      const totalStock = transactions.reduce((sum, tx) => sum + tx.quantity, 0);

      // If looking at a specific variant wrapper, inject its data context onto the product obj
      let activeVariantData = undefined;
      if (id.includes('-var_')) {
        const variantIdStr = id.substring(id.indexOf('-') + 1);
        activeVariantData = variants.find((v) => v.id === variantIdStr);
      }

      return {
        ...product,
        // Optional override to mimic flattened product structure
        name: activeVariantData ? `${product.name} - ${activeVariantData.name}` : product.name,
        code: activeVariantData?.code || product.barcode,
        isVariant: !!activeVariantData,
        variantData: activeVariantData,
        stock: totalStock,
        sellPrices: prices,
        variants,
        discountId: product.discountId,
        category: category ? { id: category.id, name: category.name } : undefined,
        brand: brand ? { id: brand.id, name: brand.name } : undefined,
        discount: discount
          ? {
              id: discount.id,
              name: discount.name,
              nominal: discount.nominal,
              type: discount.type as 'FLAT' | 'PERCENTAGE',
              startDate: discount.startDate,
              endDate: discount.endDate,
            }
          : undefined,
      } as Product;
    },
    enabled: !!id,
  });
}

// Get product logs (inventory transactions)
export function useProductLog(productId: string) {
  const orgId = useAuthStore((state) => state.getOrganizationId());

  return useQuery({
    queryKey: ['productLogs', orgId, productId],
    queryFn: async () => {
      const logs = await db
        .select()
        .from(schema.inventoryTransactions)
        .where(
          and(
            eq(schema.inventoryTransactions.organizationId, orgId),
            eq(schema.inventoryTransactions.productId, productId),
            eq(schema.inventoryTransactions.status, Status.COMPLETED),
          ),
        )
        .orderBy(desc(schema.inventoryTransactions.createdAt));

      return logs as IProductLog[];
    },
    enabled: !!orgId && !!productId,
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

      const userId = useAuthStore.getState().profile?.id;

      await db.transaction(async (tx) => {
        await tx.insert(schema.products).values({
          id,
          ...productData,
          barcode: productData.code, // Map 'code' from UI to 'barcode' in DB
          organizationId: orgId,
          createdBy: userId,
          updatedBy: userId,
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
              createdBy: userId,
              updatedBy: userId,
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
              id: variant.id || `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              ...variant,
              productId: id,
              organizationId: orgId,
              createdBy: userId,
              updatedBy: userId,
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
            type: InventoryTxType.INITIAL_STOCK,
            quantity: productData.stock,
            organizationId: orgId,
            createdBy: userId,
            updatedBy: userId,
            createdAt: now,
            updatedAt: now,
            _dirty: true,
            _syncedAt: null,
          });
        }
      });

      return { id, ...data };
    },
    onSuccess: (data) => {
      const orgId = useAuthStore.getState().getOrganizationId();
      queryClient.invalidateQueries({ queryKey: ['products', orgId] });
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

      const userId = useAuthStore.getState().profile?.id;

      await db.transaction(async (tx) => {
        await tx
          .update(schema.products)
          .set({
            ...productData,
            barcode: productData.code,
            updatedBy: userId,
            updatedAt: now,
            _dirty: true,
          })
          .where(eq(schema.products.id, id));

        if (prices) {
          // Simplest reconciliation: delete existing and re-insert
          // Better: upsert based on ID if available, but DTO doesn't have it for new ones
          await tx.delete(schema.productPrices).where(eq(schema.productPrices.productId, id));
          for (const price of prices) {
            await tx.insert(schema.productPrices).values({
              id: `price_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              ...price,
              productId: id,
              organizationId: orgId,
              createdBy: userId,
              updatedBy: userId,
              createdAt: now,
              updatedAt: now,
              _dirty: true,
              _syncedAt: null,
            });
          }
        }

        if (variants) {
          await tx.delete(schema.productVariants).where(eq(schema.productVariants.productId, id));
          for (const variant of variants) {
            await tx.insert(schema.productVariants).values({
              id: variant.id || `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              ...variant,
              productId: id,
              organizationId: orgId,
              createdBy: userId,
              updatedBy: userId,
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
      queryClient.invalidateQueries({ queryKey: ['products', orgId] });
      queryClient.invalidateQueries({ queryKey: ['products', data.id] });
    },
  });
}

// Delete product
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const now = new Date();

      const userId = useAuthStore.getState().profile?.id;

      await db.transaction(async (tx) => {
        // If the ID contains '-var_', it's a flattened variant (e.g. prod_...-var_...)
        // Must use indexOf("-var_") specifically, NOT just indexOf("-"),
        // because the productId prefix itself also contains dashes.
        const varSeparatorIndex = id.indexOf('-var_');
        if (varSeparatorIndex !== -1) {
          // Extract only the variant portion (after the "-" separator)
          const variantIdStr = id.substring(varSeparatorIndex + 1); // e.g. "var_xxx"

          // Verify it exists first
          const result = await tx
            .update(schema.productVariants)
            .set({
              deletedAt: now,
              updatedBy: userId,
              updatedAt: now,
              _dirty: true,
            })
            .where(eq(schema.productVariants.id, variantIdStr));
        } else {
          // It's a parent product
          const result = await tx
            .update(schema.products)
            .set({
              deletedAt: now,
              updatedBy: userId,
              updatedAt: now,
              _dirty: true,
            })
            .where(eq(schema.products.id, id));
        }
      });

      return { id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['products'],
        refetchType: 'all',
      });
    },
  });
}

// Bulk delete products
export function useBulkDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { ids: string[] }) => {
      const now = new Date();

      const userId = useAuthStore.getState().profile?.id;

      for (const id of data.ids) {
        const varSeparatorIndex = id.indexOf('-var_');
        if (varSeparatorIndex !== -1) {
          // It's a composite variant ID (e.g. prod_xxx-var_yyy) — delete the variant row
          const variantIdStr = id.substring(varSeparatorIndex + 1);
          await db
            .update(schema.productVariants)
            .set({
              deletedAt: now,
              updatedBy: userId,
              updatedAt: now,
              _dirty: true,
            })
            .where(eq(schema.productVariants.id, variantIdStr));
        } else {
          // It's a parent product ID
          await db
            .update(schema.products)
            .set({
              deletedAt: now,
              updatedBy: userId,
              updatedAt: now,
              _dirty: true,
            })
            .where(eq(schema.products.id, id));
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['products'],
        refetchType: 'all',
      });
    },
  });
}

// Assign products to a category
export function useAssignProductsToCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { productIds: string[]; categoryId: string }) => {
      const now = new Date();

      const userId = useAuthStore.getState().profile?.id;

      for (const productId of data.productIds) {
        await db
          .update(schema.products)
          .set({
            categoryId: data.categoryId,
            updatedBy: userId,
            updatedAt: now,
            _dirty: true,
          })
          .where(eq(schema.products.id, productId));
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['productCountsByCategory'] });
    },
  });
}

// Assign products to a supplier
export function useAssignProductsToSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { productIds: string[]; supplierId: string }) => {
      const now = new Date();

      const userId = useAuthStore.getState().profile?.id;

      for (const productId of data.productIds) {
        await db
          .update(schema.products)
          .set({
            supplierId: data.supplierId,
            updatedBy: userId,
            updatedAt: now,
            _dirty: true,
          })
          .where(eq(schema.products.id, productId));
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

// Assign products to a brand
export function useAssignProductsToBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { productIds: string[]; brandId: string }) => {
      const now = new Date();

      const userId = useAuthStore.getState().profile?.id;

      for (const productId of data.productIds) {
        await db
          .update(schema.products)
          .set({
            brandId: data.brandId,
            updatedBy: userId,
            updatedAt: now,
            _dirty: true,
          })
          .where(eq(schema.products.id, productId));
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['productCountsByBrand'] });
    },
  });
}

// Unassign products from a category (sets categoryId to "" since it is NOT NULL)
export function useUnassignProductsFromCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { productIds: string[] }) => {
      const now = new Date();
      const userId = useAuthStore.getState().profile?.id;

      for (const productId of data.productIds) {
        await db
          .update(schema.products)
          .set({
            categoryId: '',
            updatedBy: userId,
            updatedAt: now,
            _dirty: true,
          })
          .where(eq(schema.products.id, productId));
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['productCountsByCategory'] });
    },
  });
}

// Unassign products from a supplier (sets supplierId to null)
export function useUnassignProductsFromSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { productIds: string[] }) => {
      const now = new Date();
      const userId = useAuthStore.getState().profile?.id;

      for (const productId of data.productIds) {
        await db
          .update(schema.products)
          .set({
            supplierId: null,
            updatedBy: userId,
            updatedAt: now,
            _dirty: true,
          })
          .where(eq(schema.products.id, productId));
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['productCountsBySupplier'] });
    },
  });
}

// Unassign products from a brand
export function useUnassignProductsFromBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { productIds: string[] }) => {
      const now = new Date();
      const userId = useAuthStore.getState().profile?.id;

      for (const productId of data.productIds) {
        await db
          .update(schema.products)
          .set({
            brandId: null,
            updatedBy: userId,
            updatedAt: now,
            _dirty: true,
          })
          .where(eq(schema.products.id, productId));
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['productCountsByBrand'] });
    },
  });
}
