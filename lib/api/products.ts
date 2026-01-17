import { db } from '../db';
import * as schema from '../db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { storageAdapter } from '../storage';

export type ProductListItem = Omit<Product, 'sellPrices' | 'variants'>;

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
  type: 'DEFAULT' | 'MULTIUNIT' | 'VARIANTS';
  unit?: string | null;
  minimumStock?: number;
  categoryId: string;
  brandId?: string;
  prices: Omit<ProductPrice, 'id'>[];
  variants?: Omit<ProductVariant, 'id'>[];
  discountId?: string | null;
}

export interface UpdateProductDTO extends Partial<CreateProductDTO> {
  id: string;
}

// Get user's organization ID
function getOrganizationId(): string {
  const profile = storageAdapter.getItem('userProfile');
  if (profile) {
    try {
      const parsed = JSON.parse(profile);
      return parsed.selectedOrganizationId || '';
    } catch {
      return '';
    }
  }
  return '';
}

// Get all products from local SQLite (excluding soft-deleted)
export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const orgId = getOrganizationId();
      const productResult = await db
        .select()
        .from(schema.products)
        .where(and(
          eq(schema.products.organizationId, orgId),
          isNull(schema.products.deletedAt)
        ));
      
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
          
          return {
            ...product,
            code: product.barcode,
            sellPrices: prices,
            variants: variants,
            stock: (product as any).stock || 0,
            discountId: product.discountId,
          };
        })
      );

      return productsWithPrices as unknown as Product[];
    },
  });
}

// Get products by category
export function useProductsByCategory(categoryId: string) {
  return useQuery({
    queryKey: ['products', 'byCategory', categoryId],
    queryFn: async () => {
      const orgId = getOrganizationId();
      const productResult = await db
        .select()
        .from(schema.products)
        .where(and(
          eq(schema.products.organizationId, orgId),
          eq(schema.products.categoryId, categoryId),
          isNull(schema.products.deletedAt)
        ));
      
      // Fetch prices for each product
      const productsWithPrices = await Promise.all(
        productResult.map(async (product) => {
          const prices = await db
            .select()
            .from(schema.productPrices)
            .where(eq(schema.productPrices.productId, product.id));
          
          return {
            ...product,
            code: product.barcode,
            sellPrices: prices,
            variants: [],
            stock: (product as any).stock || 0,
            discountId: product.discountId,
          };
        })
      );
      
      return productsWithPrices as unknown as Product[];
    },
    enabled: !!categoryId,
  });
}

// Get products by brand
export function useProductsByBrand(brandId: string) {
  return useQuery({
    queryKey: ['products', 'byBrand', brandId],
    queryFn: async () => {
      const orgId = getOrganizationId();
      const productResult = await db
        .select()
        .from(schema.products)
        .where(and(
          eq(schema.products.organizationId, orgId),
          eq(schema.products.brandId, brandId),
          isNull(schema.products.deletedAt)
        ));
      
      // Fetch prices for each product
      const productsWithPrices = await Promise.all(
        productResult.map(async (product) => {
          const prices = await db
            .select()
            .from(schema.productPrices)
            .where(eq(schema.productPrices.productId, product.id));
          
          return {
            ...product,
            code: product.barcode,
            sellPrices: prices,
            variants: [],
            stock: (product as any).stock || 0,
            discountId: product.discountId,
          };
        })
      );
      
      return productsWithPrices as unknown as Product[];
    },
    enabled: !!brandId,
  });
}

// Get single product with relative data
export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: async () => {
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
        .where(eq(schema.products.id, id))
        .limit(1);
      
      if (productResult.length === 0) return undefined;
      
      const { product, category, brand, discount } = productResult[0];
      const prices = await db.select().from(schema.productPrices).where(eq(schema.productPrices.productId, id));
      const variants = await db.select().from(schema.productVariants).where(eq(schema.productVariants.productId, id));
      
      return {
        ...product,
        stock: (product as any).stock || 0,
        code: product.barcode,
        sellPrices: prices,
        variants,
        discountId: product.discountId,
        category: category ? { id: category.id, name: category.name } : undefined,
        brand: brand ? { id: brand.id, name: brand.name } : undefined,
        discount: discount ? { id: discount.id, name: discount.name } : undefined,
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
      const orgId = getOrganizationId();
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
      });

      return { id, ...data } as any;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
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
      const orgId = getOrganizationId();

      await db.transaction(async (tx) => {
        await tx
          .update(schema.products)
          .set({ 
            ...productData, 
            barcode: productData.code,
            updatedAt: now, 
            _dirty: true 
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
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
      queryClient.invalidateQueries({ queryKey: ['products'] });
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
      queryClient.invalidateQueries({ queryKey: ['products'] });
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
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['productCountsByCategory'] });
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
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['productCountsByBrand'] });
    },
  });
}
