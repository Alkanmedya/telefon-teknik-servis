'use client';

import { createContext, useContext, useCallback, useSyncExternalStore, useEffect } from 'react';
import { AppState, RepairRecord, Customer, StockItem, Supplier, RMARecord, WishlistItem, SecondHandDevice, Expense, Income, ExchangeRate, Quote, LoanerDevice, Appointment, QuickMessage, StickyNote, DeletedItem, Company, AccountTransaction, Product, Sale, StaffMember } from './types';

const STORAGE_KEY = 'telefon-teknik-servis-data';

const defaultQuickMessages: QuickMessage[] = [
    { id: '1', label: 'IBAN Gönder', text: 'IBAN: TR00 0000 0000 0000 0000 0000 00\nAlıcı: [İşletme Adı]' },
    { id: '2', label: 'Konum Gönder', text: 'Dükkan Konumu: https://maps.google.com/?q=...' },
    { id: '3', label: 'Mesai Saatleri', text: 'Mesai Saatlerimiz:\nHafta içi: 09:00 - 19:00\nCumartesi: 10:00 - 17:00\nPazar: Kapalı' },
    { id: '4', label: 'Cihaz Hazır', text: 'Sayın müşterimiz, cihazınızın tamiri tamamlanmıştır. Mesai saatlerimiz içinde teslim alabilirsiniz.' },
];

const defaultState: AppState = {
    repairs: [],
    customers: [],
    stockItems: [],
    suppliers: [],
    rmaRecords: [],
    wishlist: [],
    secondHandDevices: [],
    expenses: [],
    incomes: [],
    exchangeRates: [
        { currency: 'USD', rate: 32.50, bank: 'Manuel', lastUpdated: new Date().toISOString(), source: 'manual' },
        { currency: 'EUR', rate: 35.00, bank: 'Manuel', lastUpdated: new Date().toISOString(), source: 'manual' },
    ],
    companies: [],
    quotes: [],
    loanerDevices: [],
    appointments: [],
    quickMessages: defaultQuickMessages,
    stickyNotes: [],
    deletedItems: [],
    staff: [
        { id: '1', name: 'Patron', role: 'admin', pin: '1234', isActive: true },
    ],
    accountTransactions: [],
    privacyMode: false,
    currentUserId: null,
    products: [],
    sales: [],
};
// ...


// Simple external store for syncing React with localStorage
let currentState: AppState = defaultState;
let listeners: Set<() => void> = new Set();

function loadState(): AppState {
    if (typeof window === 'undefined') return defaultState;
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            return { ...defaultState, ...parsed };
        }
    } catch (e) {
        console.error('Failed to load state:', e);
    }
    return defaultState;
}

function saveState(state: AppState) {
    currentState = state;
    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            console.error('Failed to save state:', e);
        }
    }
    listeners.forEach(l => l());
}

// Initialize on first load - REMOVED to fix hydration mismatch
// if (typeof window !== 'undefined') {
//     currentState = loadState();
// }

let isInitialized = false;

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function getSnapshot() {
    return currentState;
}

function getServerSnapshot() {
    return defaultState;
}

export function useAppState() {
    const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    // Hydration fix: Load state only once on client side
    useEffect(() => {
        if (!isInitialized && typeof window !== 'undefined') {
            const loaded = loadState();
            if (loaded) {
                currentState = loaded;
                listeners.forEach(l => l());
            }
            isInitialized = true;
        }
    }, []);

    const updateState = useCallback((updater: (prev: AppState) => AppState) => {
        const newState = updater(currentState);
        saveState(newState);
    }, []);

    // Repairs
    const addRepair = useCallback((repair: RepairRecord) => {
        updateState(s => ({ ...s, repairs: [repair, ...s.repairs] }));
    }, [updateState]);

    const updateRepair = useCallback((id: string, updates: Partial<RepairRecord>) => {
        updateState(s => ({
            ...s,
            repairs: s.repairs.map(r => r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r),
        }));
    }, [updateState]);

    const deleteRepair = useCallback((id: string) => {
        const repair = currentState.repairs.find(r => r.id === id);
        if (repair) {
            updateState(s => ({
                ...s,
                repairs: s.repairs.filter(r => r.id !== id),
                deletedItems: [...s.deletedItems, { id: crypto.randomUUID(), originalData: repair, type: 'repair' as const, deletedAt: new Date().toISOString(), description: `${repair.ticketNo} - ${repair.customer.fullName}` }],
            }));
        }
    }, [updateState]);


    // Stock
    const addStockItem = useCallback((item: StockItem) => {
        updateState(s => ({ ...s, stockItems: [item, ...s.stockItems] }));
    }, [updateState]);

    const updateStockItem = useCallback((id: string, updates: Partial<StockItem>) => {
        updateState(s => ({
            ...s,
            stockItems: s.stockItems.map(i => i.id === id ? { ...i, ...updates } : i),
        }));
    }, [updateState]);

    const deleteStockItem = useCallback((id: string) => {
        const item = currentState.stockItems.find(i => i.id === id);
        if (item) {
            updateState(s => ({
                ...s,
                stockItems: s.stockItems.filter(i => i.id !== id),
                deletedItems: [...s.deletedItems, { id: crypto.randomUUID(), originalData: item, type: 'stock' as const, deletedAt: new Date().toISOString(), description: item.name }],
            }));
        }
    }, [updateState]);

    // Expenses
    const addExpense = useCallback((expense: Expense) => {
        updateState(s => ({ ...s, expenses: [expense, ...s.expenses] }));
    }, [updateState]);

    const deleteExpense = useCallback((id: string) => {
        const expense = currentState.expenses.find(e => e.id === id);
        if (expense) {
            updateState(s => ({
                ...s,
                expenses: s.expenses.filter(e => e.id !== id),
                deletedItems: [...s.deletedItems, { id: crypto.randomUUID(), originalData: expense, type: 'expense' as const, deletedAt: new Date().toISOString(), description: expense.description }],
            }));
        }
    }, [updateState]);

    // Incomes
    const addIncome = useCallback((income: Income) => {
        updateState(s => ({ ...s, incomes: [income, ...s.incomes] }));
    }, [updateState]);
    const deleteIncome = useCallback((id: string) => {
        updateState(s => ({ ...s, incomes: s.incomes.filter(i => i.id !== id) }));
    }, [updateState]);

    // Privacy
    const togglePrivacy = useCallback(() => {
        updateState(s => ({ ...s, privacyMode: !s.privacyMode }));
    }, [updateState]);

    // Recycle Bin
    const restoreItem = useCallback((deletedItemId: string) => {
        const item = currentState.deletedItems.find(d => d.id === deletedItemId);
        if (!item) return;
        updateState(s => {
            const newState = { ...s, deletedItems: s.deletedItems.filter(d => d.id !== deletedItemId) };
            switch (item.type) {
                case 'repair': newState.repairs = [item.originalData, ...newState.repairs]; break;
                case 'stock': newState.stockItems = [item.originalData, ...newState.stockItems]; break;
                case 'expense': newState.expenses = [item.originalData, ...newState.expenses]; break;
                case 'quote': newState.quotes = [item.originalData, ...newState.quotes]; break;
                case 'supplier': newState.suppliers = [item.originalData, ...newState.suppliers]; break;
                case 'company': newState.companies = [item.originalData, ...newState.companies]; break;
                case 'secondhand': newState.secondHandDevices = [item.originalData, ...newState.secondHandDevices]; break;
                case 'loaner': newState.loanerDevices = [item.originalData, ...newState.loanerDevices]; break;
            }
            return newState;
        });
    }, [updateState]);

    const permanentDelete = useCallback((deletedItemId: string) => {
        updateState(s => ({ ...s, deletedItems: s.deletedItems.filter(d => d.id !== deletedItemId) }));
    }, [updateState]);

    // Generic adders
    const addSupplier = useCallback((s: Supplier) => updateState(st => ({ ...st, suppliers: [s, ...st.suppliers] })), [updateState]);
    const updateSupplier = useCallback((id: string, updates: Partial<Supplier>) => updateState(s => ({ ...s, suppliers: s.suppliers.map(sup => sup.id === id ? { ...sup, ...updates } : sup) })), [updateState]);
    const deleteSupplier = useCallback((id: string) => {
        const item = currentState.suppliers.find(s => s.id === id);
        if (item) {
            updateState(s => ({
                ...s,
                suppliers: s.suppliers.filter(sup => sup.id !== id),
                deletedItems: [...s.deletedItems, { id: crypto.randomUUID(), originalData: item, type: 'supplier' as const, deletedAt: new Date().toISOString(), description: item.name }],
            }));
        }
    }, [updateState]);

    const addRMA = useCallback((r: RMARecord) => updateState(s => ({ ...s, rmaRecords: [r, ...s.rmaRecords] })), [updateState]);
    const updateRMA = useCallback((id: string, updates: Partial<RMARecord>) => updateState(s => ({ ...s, rmaRecords: s.rmaRecords.map(r => r.id === id ? { ...r, ...updates } : r) })), [updateState]);
    const deleteRMA = useCallback((id: string) => {
        updateState(s => ({ ...s, rmaRecords: s.rmaRecords.filter(r => r.id !== id) }));
    }, [updateState]);

    const addWishlistItem = useCallback((w: WishlistItem) => updateState(s => ({ ...s, wishlist: [w, ...s.wishlist] })), [updateState]);
    const updateWishlistItem = useCallback((id: string, updates: Partial<WishlistItem>) => updateState(s => ({ ...s, wishlist: s.wishlist.map(w => w.id === id ? { ...w, ...updates } : w) })), [updateState]);
    const deleteWishlistItem = useCallback((id: string) => {
        updateState(s => ({ ...s, wishlist: s.wishlist.filter(w => w.id !== id) }));
    }, [updateState]);

    const addSecondHand = useCallback((d: SecondHandDevice) => updateState(s => ({ ...s, secondHandDevices: [d, ...s.secondHandDevices] })), [updateState]);
    const updateSecondHand = useCallback((id: string, updates: Partial<SecondHandDevice>) => updateState(s => ({ ...s, secondHandDevices: s.secondHandDevices.map(d => d.id === id ? { ...d, ...updates } : d) })), [updateState]);
    const deleteSecondHand = useCallback((id: string) => {
        const item = currentState.secondHandDevices.find(d => d.id === id);
        if (item) {
            updateState(s => ({
                ...s,
                secondHandDevices: s.secondHandDevices.filter(d => d.id !== id),
                deletedItems: [...s.deletedItems, { id: crypto.randomUUID(), originalData: item, type: 'secondhand' as const, deletedAt: new Date().toISOString(), description: `${item.brand} ${item.model}` }],
            }));
        }
    }, [updateState]);

    const addCompany = useCallback((c: Company) => updateState(s => ({ ...s, companies: [c, ...s.companies] })), [updateState]);
    const updateCompany = useCallback((id: string, updates: Partial<Company>) => updateState(s => ({ ...s, companies: s.companies.map(c => c.id === id ? { ...c, ...updates } : c) })), [updateState]);
    const deleteCompany = useCallback((id: string) => {
        const item = currentState.companies.find(c => c.id === id);
        if (item) {
            updateState(s => ({
                ...s,
                companies: s.companies.filter(c => c.id !== id),
                deletedItems: [...s.deletedItems, { id: crypto.randomUUID(), originalData: item, type: 'company' as const, deletedAt: new Date().toISOString(), description: item.name }],
            }));
        }
    }, [updateState]);

    const addQuote = useCallback((q: Quote) => updateState(s => ({ ...s, quotes: [q, ...s.quotes] })), [updateState]);
    const updateQuote = useCallback((id: string, updates: Partial<Quote>) => updateState(s => ({ ...s, quotes: s.quotes.map(q => q.id === id ? { ...q, ...updates } : q) })), [updateState]);
    const deleteQuote = useCallback((id: string) => {
        const item = currentState.quotes.find(q => q.id === id);
        if (item) {
            updateState(s => ({
                ...s,
                quotes: s.quotes.filter(q => q.id !== id),
                deletedItems: [...s.deletedItems, { id: crypto.randomUUID(), originalData: item, type: 'quote' as const, deletedAt: new Date().toISOString(), description: `Teklif - ${item.customerName}` }],
            }));
        }
    }, [updateState]);

    const addLoanerDevice = useCallback((l: LoanerDevice) => updateState(s => ({ ...s, loanerDevices: [l, ...s.loanerDevices] })), [updateState]);
    const updateLoanerDevice = useCallback((id: string, updates: Partial<LoanerDevice>) => updateState(s => ({ ...s, loanerDevices: s.loanerDevices.map(l => l.id === id ? { ...l, ...updates } : l) })), [updateState]);
    const deleteLoanerDevice = useCallback((id: string) => {
        updateState(s => ({ ...s, loanerDevices: s.loanerDevices.filter(l => l.id !== id) }));
    }, [updateState]);

    const addAppointment = useCallback((a: Appointment) => updateState(s => ({ ...s, appointments: [a, ...s.appointments] })), [updateState]);
    const updateAppointment = useCallback((id: string, updates: Partial<Appointment>) => updateState(s => ({ ...s, appointments: s.appointments.map(a => a.id === id ? { ...a, ...updates } : a) })), [updateState]);
    const deleteAppointment = useCallback((id: string) => {
        updateState(s => ({ ...s, appointments: s.appointments.filter(a => a.id !== id) }));
    }, [updateState]);

    const addStickyNote = useCallback((n: StickyNote) => updateState(s => ({ ...s, stickyNotes: [n, ...s.stickyNotes] })), [updateState]);
    const updateStickyNote = useCallback((id: string, updates: Partial<StickyNote>) => updateState(s => ({ ...s, stickyNotes: s.stickyNotes.map(n => n.id === id ? { ...n, ...updates } : n) })), [updateState]);
    const deleteStickyNote = useCallback((id: string) => updateState(s => ({ ...s, stickyNotes: s.stickyNotes.filter(n => n.id !== id) })), [updateState]);

    // Shop Actions
    const addProduct = useCallback((product: Product) => updateState(s => ({ ...s, products: [...s.products, product] })), [updateState]);
    const updateProduct = useCallback((id: string, updates: Partial<Product>) => updateState(s => ({ ...s, products: s.products.map(p => p.id === id ? { ...p, ...updates } : p) })), [updateState]);
    const deleteProduct = useCallback((id: string) => updateState(s => ({ ...s, products: s.products.filter(p => p.id !== id) })), [updateState]);
    const addSale = useCallback((sale: Sale) => {
        updateState(prev => {
            // Reduce stock
            const newProducts = prev.products.map(p => {
                const soldItem = sale.items.find(i => i.productId === p.id);
                if (soldItem) return { ...p, stock: p.stock - soldItem.quantity };
                return p;
            });

            // Add income automatically
            const newIncome = {
                id: crypto.randomUUID(),
                amount: sale.total,
                description: `Mağaza Satışı - ${new Date(sale.date).toLocaleTimeString('tr-TR')}`,
                category: 'Aksesuar Satışı',
                date: sale.date,
                paymentMethod: sale.paymentMethod
            };

            return {
                ...prev,
                products: newProducts,
                sales: [sale, ...prev.sales],
                incomes: [...prev.incomes, newIncome as any] // Cast to any if Income type mismatch, but should be fine
            };
        });
    }, [updateState]);

    const updateExchangeRate = useCallback((currency: 'USD' | 'EUR', rate: number, bank: string, source: 'manual' | 'api') => {
        updateState(s => ({
            ...s,
            exchangeRates: s.exchangeRates.map(r => r.currency === currency ? { ...r, rate, bank, source, lastUpdated: new Date().toISOString() } : r),
        }));
    }, [updateState]);
    const updateQuickMessage = useCallback((id: string, updates: Partial<QuickMessage>) => updateState(s => ({ ...s, quickMessages: s.quickMessages.map(m => m.id === id ? { ...m, ...updates } : m) })), [updateState]);
    const addStaff = useCallback((st: StaffMember) => updateState(s => ({ ...s, staff: [st, ...s.staff] })), [updateState]);

    // Transactions
    const addTransaction = useCallback((t: AccountTransaction) => updateState(s => ({ ...s, accountTransactions: [t, ...s.accountTransactions] })), [updateState]);
    const deleteTransaction = useCallback((id: string) => updateState(s => ({ ...s, accountTransactions: s.accountTransactions.filter(t => t.id !== id) })), [updateState]);

    const login = useCallback((pin: string) => {
        const user = currentState.staff.find(s => s.pin === pin && s.isActive);
        if (user) {
            updateState(s => ({ ...s, currentUserId: user.id }));
            return true;
        }
        return false;
    }, [updateState]);

    const logout = useCallback(() => {
        updateState(s => ({ ...s, currentUserId: null }));
    }, [updateState]);

    return {
        state,
        updateState,
        addRepair, updateRepair, deleteRepair,
        addStockItem, updateStockItem, deleteStockItem,
        addExpense, deleteExpense,
        addIncome, deleteIncome,
        togglePrivacy,
        restoreItem, permanentDelete,
        addSupplier, updateSupplier, deleteSupplier,
        addRMA, updateRMA, deleteRMA,
        addWishlistItem, updateWishlistItem, deleteWishlistItem,
        addSecondHand, updateSecondHand, deleteSecondHand,
        addCompany, updateCompany, deleteCompany,
        addQuote, updateQuote, deleteQuote,
        addLoanerDevice, updateLoanerDevice, deleteLoanerDevice,
        addAppointment, updateAppointment, deleteAppointment,
        addStickyNote, updateStickyNote, deleteStickyNote,
        addProduct, updateProduct, deleteProduct, addSale,
        updateExchangeRate, updateQuickMessage,
        addStaff,
        login, logout,
        addTransaction, deleteTransaction,
    };
}
