import { useCallback, useEffect, useState } from 'react';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { useAuthStore } from '@/stores/auth';
import { and, eq, isNull, like, or, desc } from 'drizzle-orm';
import { InventoryTxType, ProductType, Status } from '@/constants';

export interface Product {
  id: string;
  name: string;
  barcode: string | null;
  code: string | null;
  purchasePrice: number;
  stock: number;
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
  sellPrices: ProductPrice[];
  variants: ProductVariant[];
  discountId: string | null;
  supplierId: string | null;
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
  isVariant?: boolean;
  variantData?: ProductVariant;
  originalId?: string;
  lastSellPrice?: number;
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

export interface ProductParams {
  search?: string;
  showByStock?: 'NO_STOCK' | 'LOW_STOCK' | 'ALL_STOCK';
  brandId?: string;
  categoryId?: string;
  supplierId?: string;
  forceParent?: boolean;
  forceParentMultiUnit?: boolean;
}

export type ProductListItem = Omit<Product, 'sellPrices' | 'variants'>;

export interface IProductLog {
  id: string;
  type: string;
  quantity: number;
  createdAt: Date | null;
  status: string | null;
  local_ref_id: string | null;
}

export type ShowByStock = 'NO_STOCK' | 'LOW_STOCK' | 'ALL_STOCK';

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

export async function fetchProducts(params?: ProductParams): Promise<Product[]> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) return [];

  const conditions = [eq(schema.products.organizationId, orgId), isNull(schema.products.deletedAt)];

  if (params?.search) {
    const searchTerm = `%${params.search}%`;
    conditions.push(
      or(like(schema.products.name, searchTerm), like(schema.products.barcode, searchTerm)) as any,
    );
  }

  if (params?.brandId) {
    conditions.push(eq(schema.products.brandId, params.brandId) as any);
  }

  if (params?.categoryId) {
    conditions.push(eq(schema.products.categoryId, params.categoryId) as any);
  }

  if (params?.supplierId) {
    conditions.push(eq(schema.products.supplierId, params.supplierId) as any);
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

    if (
      (product.type === ProductType.MULTIUNIT || product.type === ProductType.VARIANTS) &&
      hasVariants
    ) {
      product.variants.forEach((variant) => {
        const compositeId = `${product.id}-${variant.id}`;
        const variantProduct: Product = {
          ...product,
          id: compositeId,
          originalId: product.id,
          name: `${variant.name}`,
          code: variant.code || product.code,
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
        items.push(variantProduct);
      });
    }

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
}

export async function fetchProduct(id: string): Promise<Product | null> {
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

  if (productResult.length === 0) return null;

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

  let activeVariantData = undefined;
  if (id.includes('-var_')) {
    const variantIdStr = id.substring(id.indexOf('-') + 1);
    activeVariantData = variants.find((v) => v.id === variantIdStr);
  }

  return {
    ...product,
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
}

export async function refetchProductById(id: string): Promise<Product | null> {
  return fetchProduct(id);
}

export async function createProduct(data: CreateProductDTO): Promise<Product> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) throw new Error('Organization not found');

  const id = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  const { prices, variants, ...productData } = data;

  await db.transaction(async (tx) => {
    await tx.insert(schema.products).values({
      id,
      ...productData,
      barcode: productData.code,
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

  return {
    id,
    ...data,
    barcode: data.code,
    organizationId: orgId ?? '',
    createdBy: userId ?? null,
    updatedBy: userId ?? null,
    createdAt: now,
    updatedAt: now,
    sellPrices: data.prices ?? [],
    variants: data.variants ?? [],
  } as unknown as Product;
}

export async function updateProduct(data: UpdateProductDTO): Promise<void> {
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
}

export async function deleteProduct(id: string): Promise<void> {
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  await db.transaction(async (tx) => {
    const varSeparatorIndex = id.indexOf('-var_');
    if (varSeparatorIndex !== -1) {
      const variantIdStr = id.substring(varSeparatorIndex + 1);
      await tx
        .update(schema.productVariants)
        .set({
          deletedAt: now,
          updatedBy: userId,
          updatedAt: now,
          _dirty: true,
        })
        .where(eq(schema.productVariants.id, variantIdStr));
    } else {
      await tx
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
}

export async function bulkDeleteProducts(ids: string[]): Promise<void> {
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  for (const id of ids) {
    const varSeparatorIndex = id.indexOf('-var_');
    if (varSeparatorIndex !== -1) {
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
}

export async function assignProductsToCategory(
  productIds: string[],
  categoryId: string,
): Promise<void> {
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  for (const productId of productIds) {
    await db
      .update(schema.products)
      .set({
        categoryId,
        updatedBy: userId,
        updatedAt: now,
        _dirty: true,
      })
      .where(eq(schema.products.id, productId));
  }
}

export async function assignProductsToSupplier(
  productIds: string[],
  supplierId: string,
): Promise<void> {
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  for (const productId of productIds) {
    await db
      .update(schema.products)
      .set({
        supplierId,
        updatedBy: userId,
        updatedAt: now,
        _dirty: true,
      })
      .where(eq(schema.products.id, productId));
  }
}

export async function assignProductsToBrand(productIds: string[], brandId: string): Promise<void> {
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  for (const productId of productIds) {
    await db
      .update(schema.products)
      .set({
        brandId,
        updatedBy: userId,
        updatedAt: now,
        _dirty: true,
      })
      .where(eq(schema.products.id, productId));
  }
}

export async function unassignProductsFromCategory(productIds: string[]): Promise<void> {
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  for (const productId of productIds) {
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
}

export async function unassignProductsFromSupplier(productIds: string[]): Promise<void> {
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  for (const productId of productIds) {
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
}

export async function unassignProductsFromBrand(productIds: string[]): Promise<void> {
  const now = new Date();
  const userId = useAuthStore.getState().profile?.id;

  for (const productId of productIds) {
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
}

export async function fetchProductLog(productId: string): Promise<IProductLog[]> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) return [];

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
}

export function useProducts(params?: ProductParams) {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchProducts(params);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [
    params?.search,
    params?.showByStock,
    params?.brandId,
    params?.categoryId,
    params?.supplierId,
    params?.forceParent,
    params?.forceParentMultiUnit,
  ]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, isLoading: loading, error, refetch: fetch };
}

export function useProduct(id: string) {
  const [data, setData] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await fetchProduct(id);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, isLoading: loading, error, refetch: fetch };
}

export function useProductLog(productId: string) {
  const [data, setData] = useState<IProductLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    if (!productId) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await fetchProductLog(productId);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, isLoading: loading, error, refetch: fetch };
}

export function useProductsByCategory(categoryId: string) {
  return useProducts({ categoryId });
}

export function useProductsByBrand(brandId: string) {
  return useProducts({ brandId });
}

export function useProductsBySupplier(supplierId: string) {
  return useProducts({ supplierId });
}

export function useCreateProduct() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      data: CreateProductDTO,
      options?: { onSuccess?: (data: Product) => void; onError?: (error: Error) => void },
    ) => {
      setLoading(true);
      setError(null);
      try {
        const result = await createProduct(data);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);
        options?.onError?.(error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { mutate, mutateAsync: mutate, loading, isPending: loading, error };
}

export function useUpdateProduct() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      data: UpdateProductDTO,
      options?: { onSuccess?: () => void; onError?: (error: Error) => void },
    ) => {
      setLoading(true);
      setError(null);
      try {
        await updateProduct(data);
        options?.onSuccess?.();
      } catch (err) {
        const error = err as Error;
        setError(error);
        options?.onError?.(error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { mutate, mutateAsync: mutate, loading, isPending: loading, error };
}

export function useDeleteProduct() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (id: string, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => {
      setLoading(true);
      setError(null);
      try {
        await deleteProduct(id);
        options?.onSuccess?.();
      } catch (err) {
        const error = err as Error;
        setError(error);
        options?.onError?.(error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { mutate, mutateAsync: mutate, loading, isPending: loading, error };
}

export function useBulkDeleteProduct() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      ids: string[],
      options?: { onSuccess?: () => void; onError?: (error: Error) => void },
    ) => {
      setLoading(true);
      setError(null);
      try {
        await bulkDeleteProducts(ids);
        options?.onSuccess?.();
      } catch (err) {
        const error = err as Error;
        setError(error);
        options?.onError?.(error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { mutate, mutateAsync: mutate, loading, isPending: loading, error };
}

export function useAssignProductsToCategory() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      productIds: string[],
      categoryId: string,
      options?: { onSuccess?: () => void; onError?: (error: Error) => void },
    ) => {
      setLoading(true);
      setError(null);
      try {
        await assignProductsToCategory(productIds, categoryId);
        options?.onSuccess?.();
      } catch (err) {
        const error = err as Error;
        setError(error);
        options?.onError?.(error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { mutate, mutateAsync: mutate, loading, isPending: loading, error };
}

export function useAssignProductsToSupplier() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      productIds: string[],
      supplierId: string,
      options?: { onSuccess?: () => void; onError?: (error: Error) => void },
    ) => {
      setLoading(true);
      setError(null);
      try {
        await assignProductsToSupplier(productIds, supplierId);
        options?.onSuccess?.();
      } catch (err) {
        const error = err as Error;
        setError(error);
        options?.onError?.(error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { mutate, mutateAsync: mutate, loading, isPending: loading, error };
}

export function useAssignProductsToBrand() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      productIds: string[],
      brandId: string,
      options?: { onSuccess?: () => void; onError?: (error: Error) => void },
    ) => {
      setLoading(true);
      setError(null);
      try {
        await assignProductsToBrand(productIds, brandId);
        options?.onSuccess?.();
      } catch (err) {
        const error = err as Error;
        setError(error);
        options?.onError?.(error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { mutate, mutateAsync: mutate, loading, isPending: loading, error };
}

export function useUnassignProductsFromCategory() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      productIds: string[],
      options?: { onSuccess?: () => void; onError?: (error: Error) => void },
    ) => {
      setLoading(true);
      setError(null);
      try {
        await unassignProductsFromCategory(productIds);
        options?.onSuccess?.();
      } catch (err) {
        const error = err as Error;
        setError(error);
        options?.onError?.(error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { mutate, mutateAsync: mutate, loading, isPending: loading, error };
}

export function useUnassignProductsFromSupplier() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      productIds: string[],
      options?: { onSuccess?: () => void; onError?: (error: Error) => void },
    ) => {
      setLoading(true);
      setError(null);
      try {
        await unassignProductsFromSupplier(productIds);
        options?.onSuccess?.();
      } catch (err) {
        const error = err as Error;
        setError(error);
        options?.onError?.(error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { mutate, mutateAsync: mutate, loading, isPending: loading, error };
}

export function useUnassignProductsFromBrand() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (
      productIds: string[],
      options?: { onSuccess?: () => void; onError?: (error: Error) => void },
    ) => {
      setLoading(true);
      setError(null);
      try {
        await unassignProductsFromBrand(productIds);
        options?.onSuccess?.();
      } catch (err) {
        const error = err as Error;
        setError(error);
        options?.onError?.(error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { mutate, mutateAsync: mutate, loading, isPending: loading, error };
}
