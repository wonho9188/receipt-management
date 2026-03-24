import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { type Receipt } from '../types/receipt';

interface ReceiptContextType {
  receipts: Receipt[];
  addReceipt: (receipt: Receipt) => void;
  updateReceipt: (receipt: Receipt) => void;
  deleteReceipt: (id: string) => void;
  getReceiptsByDate: (date: string) => Receipt[];
  getReceiptsByMonth: (year: number, month: number) => Receipt[];
  getTotalByMonth: (year: number, month: number) => number;
}

const ReceiptContext = createContext<ReceiptContextType | null>(null);

const STORAGE_KEY = 'receipt-management-data';

function loadReceipts(): Receipt[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveReceipts(receipts: Receipt[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(receipts));
}

export function ReceiptProvider({ children }: { children: ReactNode }) {
  const [receipts, setReceipts] = useState<Receipt[]>(loadReceipts);

  useEffect(() => {
    saveReceipts(receipts);
  }, [receipts]);

  const addReceipt = useCallback((receipt: Receipt) => {
    setReceipts(prev => [receipt, ...prev]);
  }, []);

  const updateReceipt = useCallback((updated: Receipt) => {
    setReceipts(prev => prev.map(r => (r.id === updated.id ? updated : r)));
  }, []);

  const deleteReceipt = useCallback((id: string) => {
    setReceipts(prev => prev.filter(r => r.id !== id));
  }, []);

  const getReceiptsByDate = useCallback(
    (date: string) => receipts.filter(r => r.date === date),
    [receipts]
  );

  const getReceiptsByMonth = useCallback(
    (year: number, month: number) =>
      receipts.filter(r => {
        const d = new Date(r.date);
        return d.getFullYear() === year && d.getMonth() === month;
      }),
    [receipts]
  );

  const getTotalByMonth = useCallback(
    (year: number, month: number) =>
      getReceiptsByMonth(year, month).reduce((sum, r) => sum + r.totalAmount, 0),
    [getReceiptsByMonth]
  );

  return (
    <ReceiptContext.Provider
      value={{
        receipts,
        addReceipt,
        updateReceipt,
        deleteReceipt,
        getReceiptsByDate,
        getReceiptsByMonth,
        getTotalByMonth,
      }}
    >
      {children}
    </ReceiptContext.Provider>
  );
}

export function useReceipts() {
  const ctx = useContext(ReceiptContext);
  if (!ctx) throw new Error('useReceipts must be used within ReceiptProvider');
  return ctx;
}
