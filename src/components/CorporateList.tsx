'use client';

import { useState } from 'react';
import { useAppState } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import { Plus, Building2, Trash2, MessageCircle, Edit2, Wallet, ArrowUpRight, ArrowDownLeft, FileText, CheckCircle, Smartphone, X } from 'lucide-react';
import { openWhatsApp } from '@/lib/utils';
import type { Company, AccountTransaction } from '@/lib/types';

export default function CorporateList() {
    const { state, addCompany, deleteCompany, addQuote, updateQuote, deleteQuote, addTransaction, deleteTransaction, addIncome } = useAppState();
    const [showCompanyForm, setShowCompanyForm] = useState(false);
    const [showQuoteForm, setShowQuoteForm] = useState(false);
    const [tab, setTab] = useState<'companies' | 'quotes'>('companies');

    // Company Form
    const [companyName, setCompanyName] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [taxId, setTaxId] = useState('');

    // Quote Form
    const [quoteCustomer, setQuoteCustomer] = useState('');
    const [quoteCompanyId, setQuoteCompanyId] = useState('');
    const [quoteItems, setQuoteItems] = useState([{ description: '', quantity: 1, unitPrice: 0 }]);

    // Transaction Modal
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    const [transAmount, setTransAmount] = useState('');
    const [transDesc, setTransDesc] = useState('');
    const [transType, setTransType] = useState<'debt' | 'payment'>('debt'); // debt: Hizmet verdik (Borçlandı), payment: Tahsilat
    const [transDate, setTransDate] = useState(new Date().toISOString().slice(0, 10));
    const [addToCash, setAddToCash] = useState(true);

    const selectedCompany = state.companies.find(c => c.id === selectedCompanyId);

    const handleAddCompany = () => {
        if (!companyName.trim()) return;
        addCompany({
            id: crypto.randomUUID(), name: companyName, contactPerson, contactPhone, taxId, balance: 0, createdAt: new Date().toISOString(),
        });
        setShowCompanyForm(false);
        setCompanyName(''); setContactPerson(''); setContactPhone(''); setTaxId('');
    };

    const handleAddQuote = () => {
        if (!quoteCustomer.trim()) return;
        const total = quoteItems.reduce((s, i) => s + (i.quantity * i.unitPrice), 0);
        addQuote({
            id: crypto.randomUUID(), companyId: quoteCompanyId || undefined, customerName: quoteCustomer,
            items: quoteItems.filter(i => i.description), total,
            validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), status: 'draft', createdAt: new Date().toISOString(),
        });
        setShowQuoteForm(false);
        setQuoteCustomer(''); setQuoteItems([{ description: '', quantity: 1, unitPrice: 0 }]);
    };

    const addQuoteRow = () => setQuoteItems(prev => [...prev, { description: '', quantity: 1, unitPrice: 0 }]);

    const handleAddTransaction = () => {
        if (!selectedCompanyId || !transAmount || !transDesc) return;

        // Cari Hesaba Ekle
        addTransaction({
            id: crypto.randomUUID(),
            entityId: selectedCompanyId,
            entityType: 'company',
            type: transType,
            amount: parseFloat(transAmount),
            description: transDesc,
            date: transDate,
            createdAt: new Date().toISOString(),
        });

        // Kasaya Ekle (Opsiyonel)
        if (transType === 'payment' && addToCash) {
            addIncome({
                id: crypto.randomUUID(),
                category: 'collection',
                amount: parseFloat(transAmount),
                description: `Tahsilat: ${selectedCompany?.name} - ${transDesc}`,
                date: transDate
            });
        }

        setTransAmount(''); setTransDesc(''); setTransType('debt');
    };

    const getBalance = (companyId: string) => {
        const transactions = state.accountTransactions.filter(t => t.entityId === companyId);
        // Firma için: debt (Hizmet verdik, alacağımız) - payment (Ödediler)
        const totalDebt = transactions.filter(t => t.type === 'debt').reduce((acc, t) => acc + t.amount, 0);
        const totalPaid = transactions.filter(t => t.type === 'payment').reduce((acc, t) => acc + t.amount, 0);
        return { balance: totalDebt - totalPaid, totalDebt, totalPaid };
    };

    const selectedTransactions = state.accountTransactions
        .filter(t => t.entityId === selectedCompanyId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold">Kurumsal Yönetim</h2>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Cari Hesaplar & Teklifler</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowQuoteForm(true)} className="btn-secondary text-xs"><FileText size={14} /> Teklif Oluştur</button>
                    <button onClick={() => setShowCompanyForm(true)} className="btn-primary text-xs"><Plus size={14} /> Firma Ekle</button>
                </div>
            </div>

            <div className="flex gap-1 mb-4 border-b border-[var(--border)]">
                <button onClick={() => setTab('companies')} className={`tab ${tab === 'companies' ? 'active' : ''}`}>Firmalar ({state.companies.length})</button>
                <button onClick={() => setTab('quotes')} className={`tab ${tab === 'quotes' ? 'active' : ''}`}>Teklifler ({state.quotes.length})</button>
            </div>

            {tab === 'companies' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {state.companies.length === 0 ? (
                        <p className="text-sm col-span-full text-center py-12" style={{ color: 'var(--text-muted)' }}>Henüz firma eklenmemiş.</p>
                    ) : (
                        state.companies.map(c => {
                            const balanceInfo = getBalance(c.id);
                            const repairCount = state.repairs.filter(r => r.companyId === c.id).length;

                            return (
                                <div key={c.id} className="card group">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-500/10 text-blue-400">
                                                <Building2 size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-sm">{c.name}</h4>
                                                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{c.contactPerson}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {c.contactPhone && (
                                                <button onClick={() => openWhatsApp(c.contactPhone, `Sayın ${c.contactPerson || c.name}, `)}
                                                    className="p-1.5 rounded hover:bg-green-500/20 text-green-400" title="WhatsApp"><MessageCircle size={14} /></button>
                                            )}
                                            <button onClick={() => { if (confirm(`"${c.name}" firmasını silmek istediğinize emin misiniz?`)) deleteCompany(c.id); }}
                                                className="p-1.5 rounded hover:bg-red-500/20 text-red-400" title="Sil"><Trash2 size={14} /></button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs mb-3 p-2 rounded bg-opacity-50" style={{ background: 'var(--bg-secondary)' }}>
                                        <div>
                                            <span className="block opacity-50 text-[10px]">Toplam İş</span>
                                            <span className="font-medium flex items-center gap-1"><Smartphone size={10} /> {repairCount} Adet</span>
                                        </div>
                                        <div>
                                            <span className="block opacity-50 text-[10px]">Güncel Bakiye</span>
                                            <span className={`font-bold ${balanceInfo.balance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                                {formatCurrency(balanceInfo.balance)}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setSelectedCompanyId(c.id)}
                                        className={`w-full btn-secondary py-2 justify-center text-xs ${balanceInfo.balance > 0 ? 'border-red-500/30 text-red-400' : ''}`}
                                    >
                                        <Wallet size={14} className="mr-1.5" />
                                        {balanceInfo.balance > 0 ? 'Ödeme Girişi / Detay' : 'Hesap Hareketleri'}
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {tab === 'quotes' && (
                <div className="card !p-0 overflow-x-auto">
                    {state.quotes.length === 0 ? (
                        <p className="text-sm text-center py-12" style={{ color: 'var(--text-muted)' }}>Henüz teklif oluşturulmamış.</p>
                    ) : (
                        <table>
                            <thead><tr><th>Müşteri</th><th>Kalem</th><th>Toplam</th><th>Durum</th><th>İşlem</th></tr></thead>
                            <tbody>
                                {state.quotes.map(q => (
                                    <tr key={q.id}>
                                        <td>
                                            <span className="block font-medium">{q.customerName}</span>
                                            <span className="text-[10px] opacity-50">{new Date(q.createdAt).toLocaleDateString('tr-TR')}</span>
                                        </td>
                                        <td className="text-xs">{q.items.length} kalem</td>
                                        <td className={`font-medium ${state.privacyMode ? 'privacy-blur' : ''}`}>{formatCurrency(q.total)}</td>
                                        <td>
                                            <select
                                                value={q.status}
                                                onChange={e => updateQuote(q.id, { status: e.target.value as any })}
                                                className={`!py-1 !px-2 !text-[10px] !w-auto font-medium rounded-full border-none
                                                    ${q.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-400' :
                                                        q.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                                            q.status === 'sent' ? 'bg-blue-500/20 text-blue-400' :
                                                                'bg-gray-500/20 text-gray-400'}`}
                                            >
                                                <option value="draft">Taslak</option>
                                                <option value="sent">Gönderildi</option>
                                                <option value="accepted">Onaylandı</option>
                                                <option value="rejected">Reddedildi</option>
                                            </select>
                                        </td>
                                        <td>
                                            <button onClick={() => { if (confirm('Bu teklifi silmek istediğinize emin misiniz?')) deleteQuote(q.id); }}
                                                className="p-1.5 rounded hover:bg-red-500/20 text-red-400" title="Sil"><Trash2 size={14} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Transaction Modal (Same logic as SupplierView but adapted for Company) */}
            {selectedCompany && (
                <div className="modal-backdrop" onClick={() => setSelectedCompanyId(null)}>
                    <div className="modal-content w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4 flex-shrink-0">
                            <div>
                                <h3 className="text-lg font-bold">{selectedCompany.name}</h3>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Cari Hesap Özeti</p>
                            </div>
                            <button onClick={() => setSelectedCompanyId(null)} className="p-1 rounded hover:bg-white/10"><X size={18} /></button>
                        </div>

                        {/* Summary */}
                        <div className="grid grid-cols-3 gap-3 mb-4 flex-shrink-0">
                            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                <span className="text-[10px] text-blue-300 block mb-1">Toplam Hizmet (Borç)</span>
                                <span className="text-lg font-bold text-blue-400">{formatCurrency(getBalance(selectedCompany.id).totalDebt)}</span>
                            </div>
                            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                <span className="text-[10px] text-emerald-300 block mb-1">Toplam Tahsilat</span>
                                <span className="text-lg font-bold text-emerald-400">{formatCurrency(getBalance(selectedCompany.id).totalPaid)}</span>
                            </div>
                            <div className="p-3 rounded-lg bg-gray-500/10 border border-gray-500/20">
                                <span className="text-[10px] text-gray-300 block mb-1">Güncel Bakiye</span>
                                <span className={`text-lg font-bold ${getBalance(selectedCompany.id).balance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {formatCurrency(getBalance(selectedCompany.id).balance)}
                                </span>
                            </div>
                        </div>

                        {/* Form */}
                        <div className="p-3 rounded-lg border mb-4 flex-shrink-0" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
                            <h4 className="text-xs font-semibold mb-2 flex items-center gap-1"><Plus size={12} /> Yeni Hareket Ekle</h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                <input type="date" value={transDate} onChange={e => setTransDate(e.target.value)} className="text-xs" />
                                <select value={transType} onChange={e => setTransType(e.target.value as any)} className="text-xs">
                                    <option value="debt">Hizmet Verildi (Borçlandır)</option>
                                    <option value="payment">Tahsilat Yapıldı (Ödeme Al)</option>
                                </select>
                                <input type="number" value={transAmount} onChange={e => setTransAmount(e.target.value)} placeholder="Tutar" className="text-xs" />
                                <input value={transDesc} onChange={e => setTransDesc(e.target.value)} placeholder="Açıklama" className="text-xs" />
                            </div>
                            {transType === 'payment' && (
                                <div className="mt-2 flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="addToCash"
                                        checked={addToCash}
                                        onChange={e => setAddToCash(e.target.checked)}
                                        className="w-3 h-3 rounded border-[var(--border)]"
                                    />
                                    <label htmlFor="addToCash" className="text-xs cursor-pointer select-none" style={{ color: 'var(--text-muted)' }}>
                                        Bu tahsilatı kasaya (Gelir) olarak da işle
                                    </label>
                                </div>
                            )}
                            <button onClick={handleAddTransaction} disabled={!transAmount || !transDesc} className="btn-primary w-full mt-2 text-xs justify-center py-2">
                                KAYDET
                            </button>
                        </div>

                        {/* List */}
                        <div className="overflow-y-auto flex-1 border rounded-lg" style={{ borderColor: 'var(--border)' }}>
                            {selectedTransactions.length === 0 ? (
                                <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                                    <CheckCircle size={32} className="mx-auto mb-2 opacity-20" />
                                    Hesap hareketi bulunmuyor.
                                </div>
                            ) : (
                                <table className="w-full text-xs">
                                    <thead className="sticky top-0 z-10" style={{ background: 'var(--bg-secondary)' }}>
                                        <tr>
                                            <th className="p-2 text-left">Tarih</th>
                                            <th className="p-2 text-left">İşlem Tipi</th>
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
                                                        <span className="text-blue-400">Hizmet/Fatura</span> :
                                                        <span className="text-emerald-400">Tahsilat</span>
                                                    }
                                                </td>
                                                <td className="p-2">{t.description}</td>
                                                <td className={`p-2 text-right font-medium ${t.type === 'debt' ? 'text-blue-400' : 'text-emerald-400'}`}>
                                                    {t.type === 'debt' ? '+' : '-'}{formatCurrency(t.amount)}
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

            {showCompanyForm && (
                <div className="modal-backdrop" onClick={() => setShowCompanyForm(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-4">Yeni Firma Ekle</h3>
                        <div className="space-y-3">
                            <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Firma Adı *" />
                            <input value={contactPerson} onChange={e => setContactPerson(e.target.value)} placeholder="İlgili Kişi" />
                            <input value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="Telefon" />
                            <input value={taxId} onChange={e => setTaxId(e.target.value)} placeholder="Vergi No / VKN" />
                            <div className="flex gap-2"><button onClick={handleAddCompany} className="btn-primary flex-1 justify-center">Ekle</button><button onClick={() => setShowCompanyForm(false)} className="btn-secondary flex-1 justify-center">İptal</button></div>
                        </div>
                    </div>
                </div>
            )}

            {showQuoteForm && (
                <div className="modal-backdrop" onClick={() => setShowQuoteForm(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-4">Fiyat Teklifi Oluştur</h3>
                        <div className="space-y-3">
                            <input value={quoteCustomer} onChange={e => setQuoteCustomer(e.target.value)} placeholder="Müşteri / Firma Adı *" />
                            <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
                                {quoteItems.map((item, i) => (
                                    <div key={i} className="grid grid-cols-6 gap-2 items-center">
                                        <input className="col-span-3 text-xs" value={item.description} onChange={e => { const n = [...quoteItems]; n[i].description = e.target.value; setQuoteItems(n); }} placeholder="Açıklama" />
                                        <input type="number" className="text-xs" value={item.quantity} onChange={e => { const n = [...quoteItems]; n[i].quantity = parseInt(e.target.value) || 1; setQuoteItems(n); }} placeholder="Adet" />
                                        <input type="number" className="col-span-1 text-xs" value={item.unitPrice || ''} onChange={e => { const n = [...quoteItems]; n[i].unitPrice = parseFloat(e.target.value) || 0; setQuoteItems(n); }} placeholder="Birim ₺" />
                                        <span className="text-xs text-right font-medium truncate">{formatCurrency(item.quantity * item.unitPrice)}</span>
                                    </div>
                                ))}
                            </div>
                            <button onClick={addQuoteRow} className="btn-secondary text-xs w-full justify-center py-2">+ Satır Ekle</button>
                            <div className="flex justify-between items-center bg-white/5 p-3 rounded">
                                <span className="font-semibold">Toplam Tutar:</span>
                                <span className="font-bold text-lg text-emerald-400">{formatCurrency(quoteItems.reduce((s, i) => s + (i.quantity * i.unitPrice), 0))}</span>
                            </div>
                            <div className="flex gap-2"><button onClick={handleAddQuote} className="btn-primary flex-1 justify-center">TEKLİF OLUŞTUR</button><button onClick={() => setShowQuoteForm(false)} className="btn-secondary flex-1 justify-center">İPTAL</button></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
