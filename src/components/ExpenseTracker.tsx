'use client';

import { useState, useMemo } from 'react';
import { useAppState } from '@/lib/store';
import { formatCurrency, categoryLabels } from '@/lib/utils';
import { Plus, Trash2, TrendingUp, TrendingDown, DollarSign, Wallet, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import type { Expense, ExpenseCategory, Income } from '@/lib/types';

export default function ExpenseTracker() {
    const { state, addExpense, deleteExpense, addIncome, deleteIncome, updateExchangeRate } = useAppState();
    const [showExpenseForm, setShowExpenseForm] = useState(false);
    const [showIncomeForm, setShowIncomeForm] = useState(false);
    const [showCurrencyForm, setShowCurrencyForm] = useState(false);

    // Expense Form
    const [category, setCategory] = useState<ExpenseCategory>('rent');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

    // Income Form
    const [incCategory, setIncCategory] = useState<'service' | 'sales' | 'collection' | 'other'>('other');
    const [incAmount, setIncAmount] = useState('');
    const [incDesc, setIncDesc] = useState('');
    const [incDate, setIncDate] = useState(new Date().toISOString().slice(0, 10));

    const [usdRate, setUsdRate] = useState(state.exchangeRates.find(r => r.currency === 'USD')?.rate.toString() || '32');
    const [eurRate, setEurRate] = useState(state.exchangeRates.find(r => r.currency === 'EUR')?.rate.toString() || '35');
    const [selectedBank, setSelectedBank] = useState('Manuel');

    const thisMonth = new Date().toISOString().slice(0, 7);

    const stats = useMemo(() => {
        // Incomes
        const monthIncomes = state.incomes.filter(i => i.date.slice(0, 7) === thisMonth);
        const totalIncome = monthIncomes.reduce((s, i) => s + i.amount, 0);

        // Expenses
        const monthExpenses = state.expenses.filter(e => e.date.slice(0, 7) === thisMonth);
        const totalExpenses = monthExpenses.reduce((s, e) => s + e.amount, 0);

        const byCategory: Record<string, number> = {};
        monthExpenses.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });

        return { totalIncome, totalExpenses, netProfit: totalIncome - totalExpenses, byCategory };
    }, [state.expenses, state.incomes, thisMonth]);

    const handleAddExpense = () => {
        if (!amount || !description.trim()) return;
        addExpense({
            id: crypto.randomUUID(),
            category, amount: parseFloat(amount), description, date,
        });
        setShowExpenseForm(false);
        setAmount(''); setDescription('');
    };

    const handleAddIncome = () => {
        if (!incAmount || !incDesc.trim()) return;
        addIncome({
            id: crypto.randomUUID(),
            category: incCategory, amount: parseFloat(incAmount), description: incDesc, date: incDate,
        });
        setShowIncomeForm(false);
        setIncAmount(''); setIncDesc('');
    };

    const handleSaveCurrency = () => {
        updateExchangeRate('USD', parseFloat(usdRate) || 32, selectedBank, 'manual');
        updateExchangeRate('EUR', parseFloat(eurRate) || 35, selectedBank, 'manual');
        setShowCurrencyForm(false);
    };

    // Merge and sort all transactions for display
    const allTransactions = useMemo(() => {
        const list = [
            ...state.expenses.map(e => ({ ...e, type: 'expense' as const })),
            ...state.incomes.map(i => ({ ...i, type: 'income' as const })),
        ];
        return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [state.expenses, state.incomes]);

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Kasa & Finans</h2>
                <div className="flex gap-2">
                    <button onClick={() => setShowCurrencyForm(true)} className="btn-secondary text-xs"><DollarSign size={14} /> Kurlar</button>
                    <button onClick={() => setShowIncomeForm(true)} className="btn-secondary text-xs text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"><Plus size={14} /> Gelir Ekle</button>
                    <button onClick={() => setShowExpenseForm(true)} className="btn-secondary text-xs text-red-400 border-red-500/30 hover:bg-red-500/10"><Plus size={14} /> Gider Ekle</button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="card bg-emerald-500/5 border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-2"><TrendingUp size={16} className="text-emerald-400" /><span className="text-xs" style={{ color: 'var(--text-muted)' }}>Bu Ay Gelir</span></div>
                    <p className={`text-2xl font-bold text-emerald-400 ${state.privacyMode ? 'privacy-blur' : ''}`}>{formatCurrency(stats.totalIncome)}</p>
                </div>
                <div className="card bg-red-500/5 border-red-500/20">
                    <div className="flex items-center gap-2 mb-2"><TrendingDown size={16} className="text-red-400" /><span className="text-xs" style={{ color: 'var(--text-muted)' }}>Bu Ay Gider</span></div>
                    <p className={`text-2xl font-bold text-red-400 ${state.privacyMode ? 'privacy-blur' : ''}`}>{formatCurrency(stats.totalExpenses)}</p>
                </div>
                <div className="card bg-blue-500/5 border-blue-500/20">
                    <div className="flex items-center gap-2 mb-2"><Wallet size={16} className="text-blue-400" /><span className="text-xs" style={{ color: 'var(--text-muted)' }}>Net Kar (Bu Ay)</span></div>
                    <p className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-blue-400' : 'text-red-400'} ${state.privacyMode ? 'privacy-blur' : ''}`}>{formatCurrency(stats.netProfit)}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Transaction History */}
                <div className="lg:col-span-2">
                    <div className="card !p-0 overflow-hidden">
                        <div className="p-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                            <h3 className="font-semibold text-sm">Son Hareketler</h3>
                        </div>
                        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                            {allTransactions.length === 0 ? (
                                <p className="text-sm text-center py-12" style={{ color: 'var(--text-muted)' }}>Henüz işlem yok.</p>
                            ) : (
                                <table className="w-full text-xs">
                                    <thead className="sticky top-0 bg-[var(--bg-card)] shadow-sm">
                                        <tr>
                                            <th className="p-3 text-left">Tarih</th>
                                            <th className="p-3 text-left">Tür</th>
                                            <th className="p-3 text-left">Açıklama</th>
                                            <th className="p-3 text-right">Tutar</th>
                                            <th className="p-3 w-8"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allTransactions.slice(0, 50).map((t, i) => (
                                            <tr key={i} className="border-b last:border-0 hover:bg-white/5 border-[var(--border)]">
                                                <td className="p-3 opacity-70 whitespace-nowrap">{t.date}</td>
                                                <td className="p-3">
                                                    {t.type === 'expense' ?
                                                        <span className="text-red-400 flex items-center gap-1"><ArrowDownLeft size={12} /> Gider</span> :
                                                        <span className="text-emerald-400 flex items-center gap-1"><ArrowUpRight size={12} /> Gelir</span>
                                                    }
                                                </td>
                                                <td className="p-3">{t.description}</td>
                                                <td className={`p-3 text-right font-medium ${t.type === 'expense' ? 'text-red-400' : 'text-emerald-400'} ${state.privacyMode ? 'privacy-blur' : ''}`}>
                                                    {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
                                                </td>
                                                <td className="p-3 text-center">
                                                    {t.type === 'expense' && (
                                                        <button onClick={() => { if (confirm('Silmek istediğinize emin misiniz?')) deleteExpense(t.id); }} className="text-red-400 hover:text-red-300">
                                                            <Trash2 size={12} />
                                                        </button>
                                                    )}
                                                    {t.type === 'income' && (
                                                        <button onClick={() => { if (confirm('Silmek istediğinize emin misiniz?')) deleteIncome(t.id); }} className="text-red-400 hover:text-red-300">
                                                            <Trash2 size={12} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Charts/Stats */}
                <div className="space-y-4">
                    {/* Category breakdown */}
                    {Object.keys(stats.byCategory).length > 0 && (
                        <div className="card">
                            <h3 className="text-sm font-semibold mb-3">Gider Dağılımı</h3>
                            <div className="space-y-2">
                                {Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1]).map(([cat, val]) => (
                                    <div key={cat} className="flex items-center gap-3">
                                        <span className="text-xs w-24 truncate" style={{ color: 'var(--text-muted)' }}>{categoryLabels[cat] || cat}</span>
                                        <div className="flex-1 h-2 rounded-full bg-[var(--bg-secondary)]">
                                            <div className="h-full rounded-full bg-red-400/50" style={{ width: `${Math.min(100, (val / stats.totalExpenses) * 100)}%` }} />
                                        </div>
                                        <span className={`text-xs font-medium w-16 text-right ${state.privacyMode ? 'privacy-blur' : ''}`}>{formatCurrency(val)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="card bg-blue-500/5 border-blue-500/20">
                        <h3 className="text-sm font-semibold mb-2">Döviz Kurları</h3>
                        <div className="space-y-2">
                            {state.exchangeRates.map(rate => (
                                <div key={rate.currency} className="flex justify-between items-center p-2 rounded bg-[var(--bg-card)] border border-[var(--border)]">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold">{rate.currency}</span>
                                        <span className="text-[10px] opacity-60">({rate.bank})</span>
                                    </div>
                                    <span className="font-mono font-medium">{rate.rate.toFixed(2)} ₺</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showExpenseForm && (
                <div className="modal-backdrop" onClick={() => setShowExpenseForm(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-4 text-red-400">Gider Ekle</h3>
                        <div className="space-y-3">
                            <select value={category} onChange={e => setCategory(e.target.value as ExpenseCategory)}>
                                {Object.entries(categoryLabels).filter(([k]) => ['rent', 'bills', 'salary', 'marketing', 'supplies', 'food', 'transport', 'tax', 'other'].includes(k)).map(([k, v]) => (
                                    <option key={k} value={k}>{v}</option>
                                ))}
                            </select>
                            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Tutar (₺)" />
                            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Açıklama *" />
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
                            <div className="flex gap-2"><button onClick={handleAddExpense} className="btn-primary flex-1 justify-center bg-red-500 hover:bg-red-600 border-red-600">Ekle</button><button onClick={() => setShowExpenseForm(false)} className="btn-secondary flex-1 justify-center">İptal</button></div>
                        </div>
                    </div>
                </div>
            )}

            {showIncomeForm && (
                <div className="modal-backdrop" onClick={() => setShowIncomeForm(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-4 text-emerald-400">Ek Gelir Ekle</h3>
                        <div className="space-y-3">
                            <select value={incCategory} onChange={e => setIncCategory(e.target.value as any)}>
                                <option value="sales">Ürün Satışı</option>
                                <option value="service">Servis</option>
                                <option value="collection">Tahsilat</option>
                                <option value="other">Diğer</option>
                            </select>
                            <input type="number" value={incAmount} onChange={e => setIncAmount(e.target.value)} placeholder="Tutar (₺)" />
                            <input value={incDesc} onChange={e => setIncDesc(e.target.value)} placeholder="Açıklama *" />
                            <input type="date" value={incDate} onChange={e => setIncDate(e.target.value)} />
                            <div className="flex gap-2"><button onClick={handleAddIncome} className="btn-primary flex-1 justify-center bg-emerald-500 hover:bg-emerald-600 border-emerald-600">Ekle</button><button onClick={() => setShowIncomeForm(false)} className="btn-secondary flex-1 justify-center">İptal</button></div>
                        </div>
                    </div>
                </div>
            )}

            {showCurrencyForm && (
                <div className="modal-backdrop" onClick={() => setShowCurrencyForm(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-4">💱 Döviz Kuru Ayarla</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Kaynak</label>
                                <select value={selectedBank} onChange={e => setSelectedBank(e.target.value)}>
                                    <option value="Manuel">Manuel Giriş</option>
                                    <option value="Ziraat">Ziraat Bankası</option>
                                    <option value="Vakıfbank">Vakıfbank</option>
                                    <option value="İş Bankası">İş Bankası</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>USD / TL</label>
                                    <input type="number" step="0.01" value={usdRate} onChange={e => setUsdRate(e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>EUR / TL</label>
                                    <input type="number" step="0.01" value={eurRate} onChange={e => setEurRate(e.target.value)} />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleSaveCurrency} className="btn-primary flex-1 justify-center">Kaydet</button>
                                <button onClick={() => setShowCurrencyForm(false)} className="btn-secondary flex-1 justify-center">İptal</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
