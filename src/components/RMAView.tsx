'use client';

import { useState } from 'react';
import { useAppState } from '@/lib/store';
import { Plus, RotateCcw, Search, Truck, Package, Check, X, AlertTriangle } from 'lucide-react';
import type { RMARecord } from '@/lib/types';

const rmaReasonLabels: Record<string, string> = {
    'defective': 'Arızalı',
    'wrong-item': 'Yanlış Ürün',
    'damaged-shipping': 'Kargoda Hasar',
};

const rmaStatusLabels: Record<string, string> = {
    'pending': 'Bekliyor',
    'shipped': 'Gönderildi',
    'refunded': 'İade Edildi',
    'rejected': 'Reddedildi',
};

const rmaStatusColors: Record<string, string> = {
    'pending': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'shipped': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'refunded': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'rejected': 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function RMAView() {
    const { state, addRMA, updateState } = useAppState();
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const [supplierId, setSupplierId] = useState('');
    const [partName, setPartName] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [reason, setReason] = useState<'defective' | 'wrong-item' | 'damaged-shipping'>('defective');
    const [notes, setNotes] = useState('');

    const handleAdd = () => {
        if (!supplierId || !partName.trim()) return;
        const supplier = state.suppliers.find(s => s.id === supplierId);
        addRMA({
            id: crypto.randomUUID(),
            supplierId,
            supplierName: supplier?.name || 'Bilinmiyor',
            partName,
            quantity: parseInt(quantity) || 1,
            reason,
            status: 'pending',
            notes: notes || undefined,
            createdAt: new Date().toISOString(),
        });
        setPartName(''); setQuantity('1'); setNotes(''); setShowForm(false);
    };

    const updateRMAStatus = (id: string, status: RMARecord['status']) => {
        updateState(s => ({
            ...s,
            rmaRecords: s.rmaRecords.map(r => r.id === id ? { ...r, status } : r),
        }));
    };

    const deleteRMA = (id: string) => {
        if (!confirm('Bu RMA kaydını silmek istediğinize emin misiniz?')) return;
        updateState(s => ({ ...s, rmaRecords: s.rmaRecords.filter(r => r.id !== id) }));
    };

    const filtered = state.rmaRecords.filter(r => {
        const matchSearch = search === '' || r.partName.toLowerCase().includes(search.toLowerCase()) || r.supplierName.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || r.status === statusFilter;
        return matchSearch && matchStatus;
    });

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold">RMA / İade Yönetimi</h2>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Toplam {state.rmaRecords.length} RMA kaydı</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="btn-primary">
                    <Plus size={16} /> Yeni RMA
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-4 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Parça veya tedarikçi ara..." className="!pl-9" />
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-auto min-w-[140px]">
                    <option value="all">Tüm Durumlar</option>
                    {Object.entries(rmaStatusLabels).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                    ))}
                </select>
            </div>

            {/* Create Form */}
            {showForm && (
                <div className="card mb-4 animate-fade-in">
                    <h3 className="text-sm font-semibold mb-3">Yeni RMA Kaydı</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <select value={supplierId} onChange={e => setSupplierId(e.target.value)}>
                            <option value="">Tedarikçi Seçin *</option>
                            {state.suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                        <input value={partName} onChange={e => setPartName(e.target.value)} placeholder="Parça Adı *" />
                        <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Adet" />
                        <select value={reason} onChange={e => setReason(e.target.value as any)}>
                            {Object.entries(rmaReasonLabels).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                            ))}
                        </select>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notlar (opsiyonel)" rows={2} className="md:col-span-2" />
                    </div>
                    {state.suppliers.length === 0 && (
                        <p className="text-xs text-orange-400 mt-2">⚠️ Önce tedarikçi eklemeniz gerekiyor.</p>
                    )}
                    <div className="flex gap-2 mt-3">
                        <button onClick={handleAdd} className="btn-primary" disabled={state.suppliers.length === 0}>Oluştur</button>
                        <button onClick={() => setShowForm(false)} className="btn-secondary">İptal</button>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {['pending', 'shipped', 'refunded', 'rejected'].map(status => {
                    const count = state.rmaRecords.filter(r => r.status === status).length;
                    return (
                        <div key={status} className="card !p-3 text-center cursor-pointer" onClick={() => setStatusFilter(status)}>
                            <p className="text-xl font-bold" style={{ color: status === 'pending' ? '#eab308' : status === 'shipped' ? '#3b82f6' : status === 'refunded' ? '#10b981' : '#ef4444' }}>
                                {count}
                            </p>
                            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{rmaStatusLabels[status]}</p>
                        </div>
                    );
                })}
            </div>

            {/* Table */}
            <div className="card !p-0 overflow-x-auto">
                {filtered.length === 0 ? (
                    <p className="text-sm text-center py-12" style={{ color: 'var(--text-muted)' }}>
                        {state.rmaRecords.length === 0 ? 'Henüz RMA kaydı yok.' : 'Arama kriterine uygun kayıt bulunamadı.'}
                    </p>
                ) : (
                    <table>
                        <thead>
                            <tr><th>Tedarikçi</th><th>Parça</th><th>Adet</th><th>Sebep</th><th>Durum</th><th>Tarih</th><th>İşlem</th></tr>
                        </thead>
                        <tbody>
                            {filtered.map(rma => (
                                <tr key={rma.id}>
                                    <td className="text-sm font-medium">{rma.supplierName}</td>
                                    <td className="text-sm">{rma.partName}</td>
                                    <td className="text-sm text-center">{rma.quantity}</td>
                                    <td><span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{rmaReasonLabels[rma.reason]}</span></td>
                                    <td><span className={`status-badge ${rmaStatusColors[rma.status]}`}>{rmaStatusLabels[rma.status]}</span></td>
                                    <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(rma.createdAt).toLocaleDateString('tr-TR')}</td>
                                    <td>
                                        <div className="flex gap-1">
                                            {rma.status === 'pending' && (
                                                <button onClick={() => updateRMAStatus(rma.id, 'shipped')}
                                                    className="p-1.5 rounded hover:bg-blue-500/20 text-blue-400" title="Gönderildi">
                                                    <Truck size={14} />
                                                </button>
                                            )}
                                            {rma.status === 'shipped' && (
                                                <>
                                                    <button onClick={() => updateRMAStatus(rma.id, 'refunded')}
                                                        className="p-1.5 rounded hover:bg-emerald-500/20 text-emerald-400" title="İade Edildi">
                                                        <Check size={14} />
                                                    </button>
                                                    <button onClick={() => updateRMAStatus(rma.id, 'rejected')}
                                                        className="p-1.5 rounded hover:bg-red-500/20 text-red-400" title="Reddedildi">
                                                        <X size={14} />
                                                    </button>
                                                </>
                                            )}
                                            <button onClick={() => deleteRMA(rma.id)}
                                                className="p-1.5 rounded hover:bg-red-500/20 text-red-400" title="Sil">
                                                <X size={14} />
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
    );
}
