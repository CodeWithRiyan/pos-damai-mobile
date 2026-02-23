import { useAuthStore } from "@/stores/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { and, desc, eq, gte, isNull, lte } from "drizzle-orm";
import { db } from "../db";
import * as schema from "../db/schema";

export interface Shift {
  id: string;
  local_ref_id: string | null;
  cashDrawerId: string;
  cashDrawerName?: string;
  userId: string;
  userName?: string;
  startTime: Date;
  endTime: Date | null;
  initialBalance: number;
  finalBalance: number | null;
  expectedBalance: number | null;
  difference: number | null;
  status: string; // 'ACTIVE' | 'CLOSED'
  note: string | null;
  organizationId: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface ShiftTransactionHistory {
  id: string;
  transactionId: string | null;
  ref: string | null;
  transactionDate: Date;
  type:
    | "INITIAL"
    | "SALES"
    | "INCOME"
    | "PURCHASES"
    | "PAYABLE_REALIZATION"
    | "SUPPLIES"
    | "EQUIPMENT";
  nominal: number;
  note: string;
}

export interface StartShiftDTO {
  cashDrawerId: string;
  initialBalance: number;
  note?: string;
}

export interface EndShiftDTO {
  id: string;
  finalBalance: number;
  note?: string;
}

// Get all shifts from local SQLite
export function useShifts() {
  const orgId = useAuthStore((state) => state.getOrganizationId());
  return useQuery({
    queryKey: ["shifts", orgId],
    queryFn: async () => {
      const shiftsResult = await db
        .select()
        .from(schema.shifts)
        .where(
          and(
            eq(schema.shifts.organizationId, orgId),
            isNull(schema.shifts.deletedAt),
          ),
        )
        .orderBy(desc(schema.shifts.startTime));

      // Join with cashdrawer and user names
      const shiftsWithDetails = await Promise.all(
        shiftsResult.map(async (shift) => {
          console.log(
            `[useActiveShift] Shift loaded: ID=${shift.id}, userId=${shift.userId}`,
          );

          const cashDrawer = await db
            .select({ name: schema.cashDrawers.name })
            .from(schema.cashDrawers)
            .where(eq(schema.cashDrawers.id, shift.cashDrawerId))
            .limit(1);

          const user = await db
            .select({ id: schema.users.id, name: schema.users.name })
            .from(schema.users)
            .where(eq(schema.users.id, shift.userId))
            .limit(1);

          console.log(
            `[useActiveShift] Assigned Cashier User Query result:`,
            user,
          );

          // DEBUG: print all users in DB
          const allUsers = await db
            .select({ id: schema.users.id, name: schema.users.name })
            .from(schema.users);
          console.log(
            `[useActiveShift] Total users in DB: ${allUsers.length}. Sample:`,
            allUsers.map((u) => u.name),
          );

          return {
            ...shift,
            cashDrawerName: cashDrawer[0]?.name || "Unknown",
            userName: user[0]?.name || "Unknown",
          };
        }),
      );

      return shiftsWithDetails as Shift[];
    },
    enabled: !!orgId,
  });
}

// Get active shift for a cashdrawer
export function useActiveShift(cashDrawerId?: string) {
  const orgId = useAuthStore((state) => state.getOrganizationId());
  return useQuery({
    queryKey: ["shifts", "active", cashDrawerId, orgId],
    queryFn: async () => {
      if (!cashDrawerId || !orgId) return null;

      const result = await db
        .select()
        .from(schema.shifts)
        .where(
          and(
            eq(schema.shifts.cashDrawerId, cashDrawerId),
            eq(schema.shifts.status, "ACTIVE"),
            eq(schema.shifts.organizationId, orgId),
            isNull(schema.shifts.deletedAt),
          ),
        )
        .limit(1);

      if (result.length === 0) return null;

      const shift = result[0];

      // Get cashdrawer and user names
      const cashDrawer = await db
        .select({ name: schema.cashDrawers.name })
        .from(schema.cashDrawers)
        .where(eq(schema.cashDrawers.id, shift.cashDrawerId))
        .limit(1);

      const user = await db
        .select({ name: schema.users.name })
        .from(schema.users)
        .where(eq(schema.users.id, shift.userId))
        .limit(1);

      return {
        ...shift,
        cashDrawerName: cashDrawer[0]?.name || "Unknown",
        userName: user[0]?.name || "Unknown",
      } as Shift;
    },
    enabled: !!cashDrawerId && !!orgId,
  });
}

// Get current active shift (any cashdrawer) for the logged-in user's organization
export function useCurrentShift() {
  const orgId = useAuthStore((state) => state.getOrganizationId());
  return useQuery({
    queryKey: ["shifts", "current", orgId],
    queryFn: async () => {
      if (!orgId) return null;

      const result = await db
        .select()
        .from(schema.shifts)
        .where(
          and(
            eq(schema.shifts.status, "ACTIVE"),
            eq(schema.shifts.organizationId, orgId),
            isNull(schema.shifts.deletedAt),
          ),
        )
        .limit(1);

      if (result.length === 0) return null;

      const shift = result[0];

      // Get cashdrawer and user names
      const cashDrawer = await db
        .select({ name: schema.cashDrawers.name })
        .from(schema.cashDrawers)
        .where(eq(schema.cashDrawers.id, shift.cashDrawerId))
        .limit(1);

      const user = await db
        .select({ name: schema.users.name })
        .from(schema.users)
        .where(eq(schema.users.id, shift.userId))
        .limit(1);

      return {
        ...shift,
        cashDrawerName: cashDrawer[0]?.name || "Unknown",
        userName: user[0]?.name || "Unknown",
      } as Shift;
    },
    enabled: !!orgId,
  });
}

// Get last closed shift for a cashdrawer
export function useLastShift(cashDrawerId?: string) {
  const orgId = useAuthStore((state) => state.getOrganizationId());
  return useQuery({
    queryKey: ["shifts", "last", cashDrawerId, orgId],
    queryFn: async () => {
      if (!cashDrawerId || !orgId) return null;

      const result = await db
        .select()
        .from(schema.shifts)
        .where(
          and(
            eq(schema.shifts.cashDrawerId, cashDrawerId),
            eq(schema.shifts.status, "CLOSED"),
            eq(schema.shifts.organizationId, orgId),
            isNull(schema.shifts.deletedAt),
          ),
        )
        .orderBy(desc(schema.shifts.endTime))
        .limit(1);

      if (result.length === 0) return null;

      return result[0] as Shift;
    },
    enabled: !!cashDrawerId && !!orgId,
  });
}

// Start new shift
export function useStartShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: StartShiftDTO) => {
      const orgId = useAuthStore.getState().getOrganizationId();
      const userId = useAuthStore.getState().profile?.id;

      if (!orgId) {
        throw new Error("ID Organisasi tidak ditemukan");
      }

      if (!userId) {
        throw new Error("User tidak ditemukan");
      }

      // Check if there's already an active shift for this cashdrawer
      const activeShift = await db
        .select()
        .from(schema.shifts)
        .where(
          and(
            eq(schema.shifts.cashDrawerId, data.cashDrawerId),
            eq(schema.shifts.status, "ACTIVE"),
            eq(schema.shifts.organizationId, orgId),
          ),
        )
        .limit(1);

      if (activeShift.length > 0) {
        throw new Error(
          "Shift sudah aktif untuk cashdrawer ini. Silakan tutup shift yang aktif terlebih dahulu.",
        );
      }

      const shiftId = `shift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const localRefId = `ref_shift_${Date.now()}`;
      const now = new Date();

      const newShift = {
        id: shiftId,
        local_ref_id: localRefId,
        cashDrawerId: data.cashDrawerId,
        userId: userId,
        startTime: now,
        endTime: null,
        initialBalance: data.initialBalance,
        finalBalance: null,
        expectedBalance: null,
        difference: null,
        status: "ACTIVE",
        note: data.note || null,
        organizationId: orgId,
        createdBy: userId,
        updatedBy: userId,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        _dirty: true,
        _syncedAt: null,
      };

      await db.insert(schema.shifts).values(newShift);
      return { id: shiftId, ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
    },
  });
}

// End shift
export function useEndShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EndShiftDTO) => {
      const now = new Date();

      // Get the shift to calculate expected balance
      const shift = await db
        .select()
        .from(schema.shifts)
        .where(eq(schema.shifts.id, data.id))
        .limit(1);

      if (shift.length === 0) {
        throw new Error("Shift tidak ditemukan");
      }

      const expectedBalance = shift[0].initialBalance; // You may want to add logic to calculate expected based on transactions
      const difference = data.finalBalance - expectedBalance;

      await db
        .update(schema.shifts)
        .set({
          endTime: now,
          finalBalance: data.finalBalance,
          expectedBalance: expectedBalance,
          difference: difference,
          status: "CLOSED",
          note: data.note || shift[0].note,
          updatedBy: useAuthStore.getState().profile?.id,
          updatedAt: now,
          _dirty: true,
        })
        .where(eq(schema.shifts.id, data.id));

      return { ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
    },
  });
}

// Get shift detail with transaction history
export function useShiftDetail(id: string) {
  const orgId = useAuthStore((state) => state.getOrganizationId());

  return useQuery({
    queryKey: ["shifts", "detail", id, orgId],
    queryFn: async () => {
      if (!id || !orgId) return null;

      // 1. Get shift record
      const shiftResult = await db
        .select()
        .from(schema.shifts)
        .where(eq(schema.shifts.id, id))
        .limit(1);

      if (shiftResult.length === 0) return null;
      const shift = shiftResult[0];
      const start = shift.startTime;
      const end = shift.endTime || new Date();

      // 2. Fetch all related transactions in time range
      const [sales, purchases, finances] = await Promise.all([
        // Sales
        db
          .select()
          .from(schema.transactions)
          .where(
            and(
              eq(schema.transactions.organizationId, orgId),
              gte(schema.transactions.transactionDate, start),
              lte(schema.transactions.transactionDate, end),
              isNull(schema.transactions.deletedAt),
            ),
          ),
        // Purchases
        db
          .select()
          .from(schema.purchases)
          .where(
            and(
              eq(schema.purchases.organizationId, orgId),
              gte(schema.purchases.createdAt, start),
              lte(schema.purchases.createdAt, end),
              isNull(schema.purchases.deletedAt),
            ),
          ),
        // Finances (Income/Expenses)
        db
          .select()
          .from(schema.finances)
          .where(
            and(
              eq(schema.finances.organizationId, orgId),
              gte(schema.finances.transactionDate, start),
              lte(schema.finances.transactionDate, end),
              isNull(schema.finances.deletedAt),
            ),
          ),
      ]);

      // 3. Map to ShiftTransactionHistory
      const history: ShiftTransactionHistory[] = [];

      // Initial Balance
      history.push({
        id: `initial_${shift.id}`,
        transactionId: null,
        ref: null,
        transactionDate: shift.startTime,
        type: "INITIAL",
        nominal: shift.initialBalance,
        note: "Saldo Awal",
      });

      // Sales
      sales.forEach((s) => {
        history.push({
          id: s.id,
          transactionId: s.id,
          ref: s.local_ref_id,
          transactionDate: s.transactionDate,
          type: "SALES",
          nominal: s.totalPaid || s.totalAmount,
          note: `Transaksi Penjualan (${s.local_ref_id || s.id})`,
        });
      });

      // Purchases
      purchases.forEach((p) => {
        history.push({
          id: p.id,
          transactionId: p.id,
          ref: p.local_ref_id,
          transactionDate: p.createdAt!,
          type: "PURCHASES",
          nominal: p.totalAmount,
          note: `Transaksi Pembelian (${p.local_ref_id || p.id})`,
        });
      });

      // Finances
      finances.forEach((f) => {
        history.push({
          id: f.id,
          transactionId: f.id,
          ref: f.local_ref_id,
          transactionDate: f.transactionDate,
          type:
            f.type === "INCOME"
              ? "INCOME"
              : (f.expensesType as ShiftTransactionHistory["type"]),
          nominal: f.nominal,
          note: f.note || "",
        });
      });

      // Sort by date
      history.sort(
        (a, b) => a.transactionDate.getTime() - b.transactionDate.getTime(),
      );

      // Get Cashier Name
      const user = await db
        .select({ name: schema.users.name })
        .from(schema.users)
        .where(eq(schema.users.id, shift.userId))
        .limit(1);

      // Get Cashdrawer Name
      const cashDrawer = await db
        .select({ name: schema.cashDrawers.name })
        .from(schema.cashDrawers)
        .where(eq(schema.cashDrawers.id, shift.cashDrawerId))
        .limit(1);

      return {
        id: shift.id,
        note: shift.note || "Aman Terkendali",
        startShift: shift.startTime,
        endShift: shift.endTime,
        initialBalance: shift.initialBalance,
        finalBalance: shift.expectedBalance || 0, // system calculation
        actualBalance: shift.finalBalance || 0, // user input at shift end
        cashier: user[0]?.name || "Unknown",
        cashDrawer: cashDrawer[0]?.name || "Unknown",
        transactionHistory: history,
      };
    },
    enabled: !!id && !!orgId,
  });
}
