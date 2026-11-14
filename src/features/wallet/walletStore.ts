import { create } from 'zustand';

import { fetchBalance, fetchIncentives, fetchLedger, fetchSalary, LEDGER_PAGE_SIZE } from './walletApi';
import {
  canViewNextMonth,
  monthKey,
  shiftMonth,
  type IncentiveRecord,
  type LedgerEntry,
  type SalaryRecord,
} from './walletModel';

interface WalletState {
  balance: number | null;
  ledger: LedgerEntry[];
  ledgerPage: number;
  ledgerDone: boolean;
  ledgerLoading: boolean;
  salaryMonth: string;
  salary: SalaryRecord | null;
  salaryLoading: boolean;
  incentives: IncentiveRecord[];
  incentivesLoading: boolean;
  /** The last load of anything failed. What is on screen may be out of date. */
  failed: boolean;
  loadBalance: () => Promise<void>;
  /** Loads the first page (reset) or the next one. Does nothing while loading or when there are no more. */
  loadLedger: (reset?: boolean) => Promise<void>;
  loadSalary: () => Promise<void>;
  /** Moves the salary view a month earlier (-1) or later (+1). A future month is refused. */
  moveSalaryMonth: (delta: -1 | 1) => Promise<void>;
  loadIncentives: () => Promise<void>;
  refreshAll: () => Promise<void>;
  reset: () => void;
}

const INITIAL = {
  balance: null as number | null,
  ledger: [] as LedgerEntry[],
  ledgerPage: 1,
  ledgerDone: false,
  ledgerLoading: false,
  salaryMonth: monthKey(new Date()),
  salary: null as SalaryRecord | null,
  salaryLoading: false,
  incentives: [] as IncentiveRecord[],
  incentivesLoading: false,
  failed: false,
};

/** A response for a month the rider has since moved away from is discarded. */
let latestSalaryRequest = 0;

export const useWalletStore = create<WalletState>((set, get) => ({
  ...INITIAL,

  loadBalance: async () => {
    try {
      set({ balance: await fetchBalance(), failed: false });
    } catch {
      set({ failed: true });
    }
  },

  loadLedger: async (reset = false) => {
    const state = get();
    if (state.ledgerLoading || (!reset && state.ledgerDone)) return;
    const page = reset ? 1 : state.ledgerPage;
    set({ ledgerLoading: true });
    try {
      const entries = await fetchLedger(page);
      set((current) => ({
        ledger: reset ? entries : [...current.ledger, ...entries],
        ledgerPage: page + 1,
        ledgerDone: entries.length < LEDGER_PAGE_SIZE,
        ledgerLoading: false,
        failed: false,
      }));
    } catch {
      set({ ledgerLoading: false, failed: true });
    }
  },

  loadSalary: async () => {
    const month = get().salaryMonth;
    const request = ++latestSalaryRequest;
    set({ salaryLoading: true });
    try {
      const salary = await fetchSalary(month);
      if (request === latestSalaryRequest) set({ salary, salaryLoading: false, failed: false });
    } catch {
      if (request === latestSalaryRequest) set({ salary: null, salaryLoading: false, failed: true });
    }
  },

  moveSalaryMonth: async (delta) => {
    const { salaryMonth } = get();
    if (delta === 1 && !canViewNextMonth(salaryMonth, new Date())) return;
    set({ salaryMonth: shiftMonth(salaryMonth, delta), salary: null });
    await get().loadSalary();
  },

  loadIncentives: async () => {
    set({ incentivesLoading: true });
    try {
      set({ incentives: await fetchIncentives(), incentivesLoading: false, failed: false });
    } catch {
      set({ incentivesLoading: false, failed: true });
    }
  },

  refreshAll: async () => {
    await Promise.all([get().loadBalance(), get().loadLedger(true), get().loadSalary(), get().loadIncentives()]);
  },

  reset: () => set({ ...INITIAL, salaryMonth: monthKey(new Date()) }),
}));
