'use client';

import { useState, useMemo } from 'react';
import { useAppState } from '@/lib/store';
import { Plus, Phone, Mail, MessageCircle, Search, Edit2, Trash2, X, Wallet, ArrowUpRight, ArrowDownLeft, History } from 'lucide-react';
import { openWhatsApp, formatCurrency } from '@/lib/utils';
import type { Supplier, AccountTransaction } from '@/lib/types';

export default function SupplierView() {
    const { state, addSupplier, updateSupplier, deleteSupplier, addTransaction, deleteTransaction, addExpense } = useAppState();
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form States
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [notes, setNotes] = useState('');

    // Transaction Modal States
    const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
    const [transAmount, setTransAmount] = useState('');
    const [transDesc, setTransDesc] = useState('');
    const [transType, setTransType] = useState<'debt' | 'payment'>('payment'); // debt: Mal aldık (Borçlandık), payment: Ödeme yaptık
    const [transDate, setTransDate] = useState(new Date().toISOString().slice(0, 10));
    const [addToExpenses, setAddToExpenses] = useState(true);

    const resetForm = () => { setName(''); setPhone(''); setEmail(''); setNotes(''); };
    const resetTransForm = () => { setTransAmount(''); setTransDesc(''); setTransType('payment'); setTransDate(new Date().toISOString().slice(0, 10)); };

    const handleAdd = () => {
        if (!name.trim() || !phone.trim()) return;
        addSupplier({ id: crypto.randomUUID(), name, phone, email: email || undefined, notes: notes || undefined });
        resetForm();
        setShowForm(false);
    };

    const handleStartEdit = (s: Supplier) => {
        setEditingId(s.id);
        setName(s.name);
        setPhone(s.phone);
        setEmail(s.email || '');
        setNotes(s.notes || '');
    };

    const handleSaveEdit = () => {
        if (!editingId || !name.trim()) return;
        updateSupplier(editingId, { name, phone, email: email || undefined, notes: notes || undefined });
        setEditingId(null);
        resetForm();
    };

    const handleDelete = (id: string) => {
        if (!confirm('Bu tedarikçiyi silmek istediğinize emin misiniz?')) return;
        deleteSupplier(id);
    };

    const handleAddTransaction = () => {
        if (!selectedSupplierId || !transAmount || !transDesc) return;
        addTransaction({
            id: crypto.randomUUID(),
            entityId: selectedSupplierId,
            entityType: 'supplier',
            type: transType,
            amount: parseFloat(transAmount),
            description: transDesc,
            date: transDate,
            createdAt: new Date().toISOString(),
        });

        if (transType === 'payment' && addToExpenses) {
            addExpense({
                id: crypto.randomUUID(),
                category: 'supplies',
                amount: parseFloat(transAmount),
                description: `Tedarikçi Ödemesi: ${state.suppliers.find(s => s.id === selectedSupplierId)?.name} - ${transDesc}`,
                date: transDate
            });
        }

        resetTransForm();
    };

    const filtered = state.suppliers.filter(s =>
        search === '' || s.name.toLowerCase().includes(search.toLowerCase()) || s.phone.includes(search)
    );

    // Calculate Balance
    const getBalance = (supplierId: string) => {
        const transactions = state.accountTransactions.filter(t => t.entityId === supplierId);
        // Tedarikçi için: debt (Mal aldık, borç) - payment (Ödedik)
        const totalDebt = transactions.filter(t => t.type === 'debt').reduce((acc, t) => acc + t.amount, 0);
        const totalPaid = transactions.filter(t => t.type === 'payment').reduce((acc, t) => acc + t.amount, 0);
        return { balance: totalDebt - totalPaid, totalDebt, totalPaid };
    };

    const selectedSupplier = state.suppliers.find(s => s.id === selectedSupplierId);
    const selectedTransactions = state.accountTransactions
        .filter(t => t.entityId === selectedSupplierId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold">Tedarikçi Yönetimi</h2>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Toplam {state.suppliers.length} tedarikçi</p>
                </div>
                <button onClick={() => { setShowForm(!showForm); resetForm(); }} className="btn-primary">
                    <Plus size={16} /> Tedarikçi Ekle
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tedarikçi ara..." className="!pl-9" />
            </div>

            {/* Add Form */}
            {showForm && (
                <div className="card mb-4 animate-fade-in">
                    <h3 className="text-sm font-semibold mb-3">Yeni Tedarikçi</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input value={name} onChange={e => setName(e.target.value)} placeholder="Firma / Kişi Adı *" />
                        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Telefon *" />
                        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="E-posta" type="email" />
                        <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notlar (opsiyonel)" />
                    </div>
                    <div className="flex gap-2 mt-3">
                        <button onClick={handleAdd} className="btn-primary">Kaydet</button>
                        <button onClick={() => setShowForm(false)} className="btn-secondary">İptal</button>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(supplier => {
                    const balanceInfo = getBalance(supplier.id);
                    const itemCount = state.stockItems.filter(si => si.supplierId === supplier.id).length;

                    return (
                        <div key={supplier.id} className="card group">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm" style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}>
                                        {supplier.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold">{supplier.name}</h4>
                                        <div className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                            <span>{itemCount} ürün</span>
                                            {balanceInfo.balance !== 0 && (
                                                <span className={`font-medium ${balanceInfo.balance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                                    • {balanceInfo.balance > 0 ? 'Borçlu:' : 'Alacaklı:'} {formatCurrency(Math.abs(balanceInfo.balance))}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleStartEdit(supplier)} className="p-1.5 rounded hover:bg-blue-500/20 text-blue-400"><Edit2 size={14} /></button>
                                    <button onClick={() => handleDelete(supplier.id)} className="p-1.5 rounded hover:bg-red-500/20 text-red-400"><Trash2 size={14} /></button>
                                </div>
                            </div>

                            <div className="space-y-2 text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                                <div className="flex items-center gap-2"><Phone size={12} className="opacity-70" /> {supplier.phone}</div>
                                {supplier.email && <div className="flex items-center gap-2"><Mail size={12} className="opacity-70" /> {supplier.email}</div>}
                            </div>

                            <button
                                onClick={() => { setSelectedSupplierId(supplier.id); resetTransForm(); }}
                                className="w-full mb-2 btn-secondary text-xs justify-center py-2"
                                style={balanceInfo.balance > 0 ? { borderColor: 'rgba(248, 113, 113, 0.3)', color: '#f87171' } : {}}
                            >
                                <Wallet size={14} className="mr-1.5" />
                                {balanceInfo.balance === 0 ? 'Hesap Hareketleri' : `Bakiye: ${formatCurrency(balanceInfo.balance)} (Öde)`}
                            </button>

                            <div className="flex gap-1">
                                <button onClick={() => openWhatsApp(supplier.phone, 'Merhaba, stok durumu hakkında bilgi almak istiyorum.')}
                                    className="flex-1 text-[10px] py-1.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 flex items-center justify-center gap-1 transition-colors">
                                    <MessageCircle size={10} /> WhatsApp
                                </button>
                                <a href={`tel:${supplier.phone}`}
                                    className="flex-1 text-[10px] py-1.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 flex items-center justify-center gap-1 transition-colors">
                                    <Phone size={10} /> Ara
                                </a>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Transaction Modal */}
            {selectedSupplier && (
                <div className="modal-backdrop" onClick={() => setSelectedSupplierId(null)}>
                    <div className="modal-content w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4 flex-shrink-0">
                            <div>
                                <h3 className="text-lg font-bold">{selectedSupplier.name}</h3>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Hesap Hareketleri</p>
                            </div>
                            <button onClick={() => setSelectedSupplierId(null)} className="p-1 rounded hover:bg-white/10"><X size={18} /></button>
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-3 gap-3 mb-4 flex-shrink-0">
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                <span className="text-[10px] text-red-300 block mb-1">Toplam Borç (Mal Alımı)</span>
                                <span className="text-lg font-bold text-red-400">{formatCurrency(getBalance(selectedSupplier.id).totalDebt)}</span>
                            </div>
                            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                <span className="text-[10px] text-emerald-300 block mb-1">Toplam Ödenen</span>
                                <span className="text-lg font-bold text-emerald-400">{formatCurrency(getBalance(selectedSupplier.id).totalPaid)}</span>
                            </div>
                            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                <span className="text-[10px] text-blue-300 block mb-1">Güncel Bakiye (Kalan)</span>
                                <span className={`text-lg font-bold ${getBalance(selectedSupplier.id).balance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {formatCurrency(getBalance(selectedSupplier.id).balance)}
                                </span>
                            </div>
                        </div>

                        {/* Add Transaction Form */}
                        <div className="p-3 rounded-lg border mb-4 flex-shrink-0" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
                            <h4 className="text-xs font-semibold mb-2 flex items-center gap-1"><Plus size={12} /> Yeni İşlem Ekle</h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                <input type="date" value={transDate} onChange={e => setTransDate(e.target.value)} className="text-xs" />
                                <select value={transType} onChange={e => setTransType(e.target.value as any)} className="text-xs">
                                    <option value="payment">Ödeme Yapıldı (Alacak)</option>
                                    <option value="debt">Mal Alındı (Borç)</option>
                                </select>
                                <input type="number" value={transAmount} onChange={e => setTransAmount(e.target.value)} placeholder="Tutar" className="text-xs" />
                                <input value={transDesc} onChange={e => setTransDesc(e.target.value)} placeholder="Açıklama" className="text-xs" />
                            </div>
                            {transType === 'payment' && (
                                <div className="mt-2 flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="addToExpenses"
                                        checked={addToExpenses}
                                        onChange={e => setAddToExpenses(e.target.checked)}
                                        className="w-3 h-3 rounded border-[var(--border)]"
                                    />
                                    <label htmlFor="addToExpenses" className="text-xs cursor-pointer select-none" style={{ color: 'var(--text-muted)' }}>
                                        Bu ödemeyi kasadan (Gider) olarak da düş
                                    </label>
                                </div>
                            )}
                            <button onClick={handleAddTransaction} disabled={!transAmount || !transDesc} className="btn-primary w-full mt-2 text-xs justify-center py-2">
                                İŞLEMİ KAYDET
                            </button>
                        </div>

                        {/* Transactions List */}
                        <div className="overflow-y-auto flex-1 border rounded-lg" style={{ borderColor: 'var(--border)' }}>
                            {selectedTransactions.length === 0 ? (
                                <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                                    <History size={32} className="mx-auto mb-2 opacity-20" />
                                    Henüz hesap hareketi yok.
                                </div>
                            ) : (
                                <table className="w-full text-xs">
                                    <thead className="sticky top-0 z-10" style={{ background: 'var(--bg-secondary)' }}>
                                        <tr>
                                            <th className="p-2 text-left">Tarih</th>
                                            <th className="p-2 text-left">İşlem</th>
                                            <th className="p-2 text-left">Açıklama</th>
                                            <th className="p-2 text-right">Tutar</th>
                                            <th className="p-2 w-8"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedTransactions.map(t => (
                                            <tr key={t.id} className="border-b last:border-0 hover:bg-white/5" style={{ borderColor: 'var(--border)' }}>
                                                <td className="p-2 opacity-70">{t.date}</td>
                                                <td className="p-2 font-medium">
                                                    {t.type === 'debt' ?
                                                        <span className="flex items-center gap-1 text-red-400"><ArrowDownLeft size={12} /> Mal Alımı</span> :
                                                        <span className="flex items-center gap-1 text-emerald-400"><ArrowUpRight size={12} /> Ödeme</span>
                                                    }
                                                </td>
                                                <td className="p-2">{t.description}</td>
                                                <td className={`p-2 text-right font-medium ${t.type === 'debt' ? 'text-red-400' : 'text-emerald-400'}`}>
                                                    {t.type === 'debt' ? '-' : '+'}{formatCurrency(t.amount)}
                                                </td>
                                                <td className="p-2 text-center">
                                                    <button onClick={() => { if (confirm('Silmek istediğinize emin misiniz?')) deleteTransaction(t.id); }} className="text-red-400 hover:text-red-300">
                                                        <Trash2 size={12} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
