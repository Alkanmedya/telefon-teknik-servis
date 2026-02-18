'use client';

import { useState } from 'react';
import { useAppState } from '@/lib/store';
import { openWhatsApp } from '@/lib/utils';
import { Plus, Search, Trash2, MessageCircle } from 'lucide-react';
import type { WishlistItem } from '@/lib/types';

const statusLabelsW: Record<string, string> = {
    pending: 'Bekliyor',
    ordered: 'Sipariş Verildi',
    arrived: 'Geldi',
    fulfilled: 'Teslim Edildi',
};

const statusColorsW: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    ordered: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    arrived: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    fulfilled: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

export default function WishlistView() {
    const { state, addWishlistItem, updateWishlistItem, deleteWishlistItem } = useAppState();
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [productName, setProductName] = useState('');
    const [notes, setNotes] = useState('');

    const handleAdd = () => {
        if (!customerName.trim() || !productName.trim()) return;
        addWishlistItem({
            id: crypto.randomUUID(),
            customerName,
            customerPhone,
            productName,
            notes,
            status: 'pending',
            createdAt: new Date().toISOString(),
        });
        setShowForm(false);
        setCustomerName(''); setCustomerPhone(''); setProductName(''); setNotes('');
    };

    const filtered = state.wishlist.filter(w =>
        search === '' ||
        w.customerName.toLowerCase().includes(search.toLowerCase()) ||
        w.productName.toLowerCase().includes(search.toLowerCase()) ||
        w.customerPhone.includes(search)
    );

    const handleNotify = (item: WishlistItem) => {
        const msg = item.status === 'arrived'
            ? `Sayın ${item.customerName}, istediğiniz "${item.productName}" ürünü elimize ulaşmıştır. Teslim almak için bekliyoruz.`
            : `Sayın ${item.customerName}, istediğiniz "${item.productName}" ile ilgili bilgilendirmek istiyoruz.`;
        openWhatsApp(item.customerPhone, msg);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold">İstek Listesi</h2>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{state.wishlist.length} istek</p>
                </div>
                <button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={16} /> İstek Ekle</button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="card !p-3 text-center">
                    <p className="text-xl font-bold text-yellow-400">{state.wishlist.filter(w => w.status === 'pending').length}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Bekliyor</p>
                </div>
                <div className="card !p-3 text-center">
                    <p className="text-xl font-bold text-blue-400">{state.wishlist.filter(w => w.status === 'ordered').length}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Sipariş Verildi</p>
                </div>
                <div className="card !p-3 text-center">
                    <p className="text-xl font-bold text-emerald-400">{state.wishlist.filter(w => w.status === 'arrived').length}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Geldi</p>
                </div>
                <div className="card !p-3 text-center">
                    <p className="text-xl font-bold text-slate-400">{state.wishlist.filter(w => w.status === 'fulfilled').length}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Teslim Edildi</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative mb-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Müşteri, ürün, telefon ara..." className="!pl-9" />
            </div>

            <div className="card !p-0 overflow-x-auto">
                {filtered.length === 0 ? (
                    <p className="text-sm text-center py-12" style={{ color: 'var(--text-muted)' }}>
                        {state.wishlist.length === 0 ? 'Henüz istek eklenmemiş.' : 'Arama kriterine uygun istek bulunamadı.'}
                    </p>
                ) : (
                    <table>
                        <thead><tr><th>Müşteri</th><th>Ürün</th><th>Not</th><th>Durum</th><th>İşlem</th></tr></thead>
                        <tbody>
                            {filtered.map(w => (
                                <tr key={w.id}>
                                    <td>
                                        <div className="text-sm font-medium">{w.customerName}</div>
                                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{w.customerPhone}</div>
                                    </td>
                                    <td className="text-sm">{w.productName}</td>
                                    <td className="text-xs max-w-[200px] truncate" style={{ color: 'var(--text-secondary)' }}>{w.notes || '-'}</td>
                                    <td>
                                        <select
                                            value={w.status}
                                            onChange={e => updateWishlistItem(w.id, { status: e.target.value as any })}
                                            className="!py-1 !px-2 !text-xs !w-auto"
                                        >
                                            {Object.entries(statusLabelsW).map(([k, v]) => (
                                                <option key={k} value={k}>{v}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>
                                        <div className="flex gap-1">
                                            {w.customerPhone && (
                                                <button onClick={() => handleNotify(w)}
                                                    className="p-1.5 rounded hover:bg-green-500/20 text-green-400" title="WhatsApp Bildir">
                                                    <MessageCircle size={14} />
                                                </button>
                                            )}
                                            <button onClick={() => { if (confirm('Bu isteği silmek istediğinize emin misiniz?')) deleteWishlistItem(w.id); }}
                                                className="p-1.5 rounded hover:bg-red-500/20 text-red-400" title="Sil">
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

            {showForm && (
                <div className="modal-backdrop" onClick={() => setShowForm(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-4">Yeni İstek Ekle</h3>
                        <div className="space-y-3">
                            <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Müşteri Adı *" />
                            <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Telefon" />
                            <input value={productName} onChange={e => setProductName(e.target.value)} placeholder="İstenen Ürün *" />
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Notlar (opsiyonel)" />
                            <div className="flex gap-2">
                                <button onClick={handleAdd} className="btn-primary flex-1 justify-center">Ekle</button>
                                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center">İptal</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
