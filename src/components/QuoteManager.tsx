'use client';

import { useState } from 'react';
import { useAppState } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import { Plus, FileText, Printer, Search, Trash2, Send, Check, X, Eye } from 'lucide-react';
import type { Quote } from '@/lib/types';

const quoteStatusLabels: Record<string, string> = {
    draft: 'Taslak', sent: 'Gönderildi', accepted: 'Onaylandı', rejected: 'Reddedildi',
};

const quoteStatusColors: Record<string, string> = {
    draft: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    sent: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    accepted: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function QuoteManager() {
    const { state, addQuote, updateState } = useAppState();
    const privacyBlur = state.privacyMode ? 'privacy-blur' : '';
    const [showForm, setShowForm] = useState(false);
    const [previewId, setPreviewId] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    // Form state
    const [companyId, setCompanyId] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [validDays, setValidDays] = useState('15');
    const [items, setItems] = useState<{ description: string; quantity: number; unitPrice: number }[]>([
        { description: '', quantity: 1, unitPrice: 0 },
    ]);

    const addRow = () => setItems(prev => [...prev, { description: '', quantity: 1, unitPrice: 0 }]);
    const removeRow = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
    const updateRow = (i: number, field: string, value: string | number) => {
        setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
    };

    const total = items.reduce((s, item) => s + item.quantity * item.unitPrice, 0);

    const handleCreate = () => {
        if (!customerName.trim() || items.length === 0 || items.every(i => !i.description)) return;
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + (parseInt(validDays) || 15));

        addQuote({
            id: crypto.randomUUID(),
            companyId: companyId || undefined,
            customerName,
            items: items.filter(i => i.description.trim()),
            total,
            validUntil: validUntil.toISOString(),
            status: 'draft',
            createdAt: new Date().toISOString(),
        });
        setCustomerName(''); setCompanyId(''); setValidDays('15');
        setItems([{ description: '', quantity: 1, unitPrice: 0 }]);
        setShowForm(false);
    };

    const updateQuoteStatus = (id: string, status: Quote['status']) => {
        updateState(s => ({
            ...s,
            quotes: s.quotes.map(q => q.id === id ? { ...q, status } : q),
        }));
    };

    const deleteQuote = (id: string) => {
        if (!confirm('Bu teklifi silmek istediğinize emin misiniz?')) return;
        updateState(s => ({
            ...s,
            quotes: s.quotes.filter(q => q.id !== id),
            deletedItems: [...s.deletedItems, {
                id: crypto.randomUUID(),
                originalData: s.quotes.find(q => q.id === id),
                type: 'quote' as const,
                deletedAt: new Date().toISOString(),
                description: s.quotes.find(q => q.id === id)?.customerName || '',
            }],
        }));
    };

    const handlePrint = (id: string) => {
        setPreviewId(id);
        setTimeout(() => window.print(), 100);
    };

    const filtered = state.quotes.filter(q =>
        search === '' || q.customerName.toLowerCase().includes(search.toLowerCase())
    );

    const previewQuote = previewId ? state.quotes.find(q => q.id === previewId) : null;

    return (
        <div>
            {/* Print preview */}
            {previewQuote && (
                <div data-print-only style={{ fontFamily: 'sans-serif', fontSize: '12px', color: '#000', background: '#fff', padding: '30px', maxWidth: '600px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
                        <h1 style={{ fontSize: '20px', margin: 0 }}>TEKLİF</h1>
                        <p style={{ fontSize: '11px', margin: '4px 0' }}>Teknik Servis</p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                        <div>
                            <p><strong>Müşteri:</strong> {previewQuote.customerName}</p>
                            <p><strong>Tarih:</strong> {new Date(previewQuote.createdAt).toLocaleDateString('tr-TR')}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p><strong>Geçerlilik:</strong> {new Date(previewQuote.validUntil).toLocaleDateString('tr-TR')}</p>
                        </div>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #000' }}>
                                <th style={{ textAlign: 'left', padding: '5px' }}>Açıklama</th>
                                <th style={{ textAlign: 'center', padding: '5px' }}>Adet</th>
                                <th style={{ textAlign: 'right', padding: '5px' }}>Birim</th>
                                <th style={{ textAlign: 'right', padding: '5px' }}>Toplam</th>
                            </tr>
                        </thead>
                        <tbody>
                            {previewQuote.items.map((item, i) => (
                                <tr key={i} style={{ borderBottom: '1px dashed #ccc' }}>
                                    <td style={{ padding: '5px' }}>{item.description}</td>
                                    <td style={{ textAlign: 'center', padding: '5px' }}>{item.quantity}</td>
                                    <td style={{ textAlign: 'right', padding: '5px' }}>{formatCurrency(item.unitPrice)}</td>
                                    <td style={{ textAlign: 'right', padding: '5px' }}>{formatCurrency(item.quantity * item.unitPrice)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div style={{ textAlign: 'right', borderTop: '2px solid #000', paddingTop: '10px' }}>
                        <p style={{ fontSize: '16px' }}><strong>TOPLAM: {formatCurrency(previewQuote.total)}</strong></p>
                    </div>
                </div>
            )}

            {/* Screen UI */}
            <div data-screen-only>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold">Teklif Yönetimi</h2>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Toplam {state.quotes.length} teklif</p>
                    </div>
                    <button onClick={() => setShowForm(!showForm)} className="btn-primary">
                        <Plus size={16} /> Yeni Teklif
                    </button>
                </div>

                <div className="relative mb-4">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Müşteri ara..." className="!pl-9" />
                </div>

                {/* Create Form */}
                {showForm && (
                    <div className="card mb-4 animate-fade-in">
                        <h3 className="text-sm font-semibold mb-3">Yeni Teklif Oluştur</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                            <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Müşteri / Firma Adı *" />
                            <select value={companyId} onChange={e => { setCompanyId(e.target.value); const c = state.companies.find(co => co.id === e.target.value); if (c) setCustomerName(c.name); }}>
                                <option value="">Firma seçin (opsiyonel)</option>
                                {state.companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <input type="number" value={validDays} onChange={e => setValidDays(e.target.value)} placeholder="Geçerlilik (gün)" />
                        </div>

                        {/* Items */}
                        <div className="mb-3">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Kalemler</label>
                                <button type="button" onClick={addRow} className="text-[10px] px-2 py-1 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 flex items-center gap-1">
                                    <Plus size={10} /> Satır Ekle
                                </button>
                            </div>
                            <div className="space-y-2">
                                {items.map((item, i) => (
                                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                                        <input className="col-span-6" value={item.description} onChange={e => updateRow(i, 'description', e.target.value)} placeholder="Açıklama" />
                                        <input className="col-span-2" type="number" min="1" value={item.quantity} onChange={e => updateRow(i, 'quantity', parseInt(e.target.value) || 0)} placeholder="Adet" />
                                        <input className="col-span-3" type="number" min="0" value={item.unitPrice} onChange={e => updateRow(i, 'unitPrice', parseFloat(e.target.value) || 0)} placeholder="Birim Fiyat" />
                                        <button onClick={() => removeRow(i)} className="col-span-1 text-red-400 hover:text-red-300 text-center"><X size={14} /></button>
                                    </div>
                                ))}
                            </div>
                            <div className="text-right mt-2 text-sm font-bold" style={{ color: 'var(--accent)' }}>
                                Toplam: {formatCurrency(total)}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleCreate} className="btn-primary">Oluştur</button>
                            <button onClick={() => setShowForm(false)} className="btn-secondary">İptal</button>
                        </div>
                    </div>
                )}

                {/* Quote List */}
                <div className="card !p-0 overflow-x-auto">
                    {filtered.length === 0 ? (
                        <p className="text-sm text-center py-12" style={{ color: 'var(--text-muted)' }}>
                            {state.quotes.length === 0 ? 'Henüz teklif yok.' : 'Arama kriterine uygun teklif bulunamadı.'}
                        </p>
                    ) : (
                        <table>
                            <thead><tr><th>Müşteri</th><th>Kalem</th><th>Toplam</th><th>Geçerlilik</th><th>Durum</th><th>İşlem</th></tr></thead>
                            <tbody>
                                {filtered.map(q => (
                                    <tr key={q.id}>
                                        <td className="text-sm font-medium">{q.customerName}</td>
                                        <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{q.items.length} kalem</td>
                                        <td className={`text-sm font-medium ${privacyBlur}`} style={{ color: 'var(--accent)' }}>{formatCurrency(q.total)}</td>
                                        <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(q.validUntil).toLocaleDateString('tr-TR')}</td>
                                        <td><span className={`status-badge ${quoteStatusColors[q.status]}`}>{quoteStatusLabels[q.status]}</span></td>
                                        <td>
                                            <div className="flex gap-1">
                                                {q.status === 'draft' && (
                                                    <button onClick={() => updateQuoteStatus(q.id, 'sent')} className="p-1.5 rounded hover:bg-blue-500/20 text-blue-400" title="Gönder">
                                                        <Send size={14} />
                                                    </button>
                                                )}
                                                {q.status === 'sent' && (
                                                    <>
                                                        <button onClick={() => updateQuoteStatus(q.id, 'accepted')} className="p-1.5 rounded hover:bg-emerald-500/20 text-emerald-400" title="Onaylandı">
                                                            <Check size={14} />
                                                        </button>
                                                        <button onClick={() => updateQuoteStatus(q.id, 'rejected')} className="p-1.5 rounded hover:bg-red-500/20 text-red-400" title="Reddedildi">
                                                            <X size={14} />
                                                        </button>
                                                    </>
                                                )}
                                                <button onClick={() => handlePrint(q.id)} className="p-1.5 rounded hover:bg-cyan-500/20 text-cyan-400" title="Yazdır">
                                                    <Printer size={14} />
                                                </button>
                                                <button onClick={() => deleteQuote(q.id)} className="p-1.5 rounded hover:bg-red-500/20 text-red-400" title="Sil">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
