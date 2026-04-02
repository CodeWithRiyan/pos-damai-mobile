import { useCallback, useEffect, useState } from 'react';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { useAuthStore } from '@/stores/auth';
import { and, eq, isNull, like, desc } from 'drizzle-orm';

export interface CashDrawer {
  id: string;
  name: string;
  organizationId: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export async function fetchCashDrawers(): Promise<CashDrawer[]> {
  const orgId = useAuthStore.getState().getOrganizationId();
  if (!orgId) return [];

  const result = await db
    .select()
    .from(schema.cashDrawers)
    .where(and(eq(schema.cashDrawers.organizationId, orgId), isNull(schema.cashDrawers.deletedAt)))
    .orderBy(desc(schema.cashDrawers.createdAt));

  return result as unknown as CashDrawer[];
}

export function useCashDrawers() {
  const [data, setData] = useState<CashDrawer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchCashDrawers();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading: loading, loading: loading, error, refetch: fetch };
}