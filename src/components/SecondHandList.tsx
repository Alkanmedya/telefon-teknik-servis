'use client';

import { useState } from 'react';
import { useAppState } from '@/lib/store';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Trash2, Search } from 'lucide-react';
import type { SecondHandDevice, DeviceCondition } from '@/lib/types';

const conditionLabels: Record<DeviceCondition, string> = {
    'like-new': 'Sıfır Gibi',
    good: 'İyi',
    fair: 'Orta',
    poor: 'Kötü',
    broken: 'Bozuk',
};

export default function SecondHandList() {
    const { state, addSecondHand, updateSecondHand, deleteSecondHand } = useAppState();
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState('');
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    const [condition, setCondition] = useState<DeviceCondition>('good');
    const [buyPrice, setBuyPrice] = useState('');
    const [sellPrice, setSellPrice] = useState('');
    const [boughtFrom, setBoughtFrom] = useState('');
    const [notes, setNotes] = useState('');

    const handleAdd = () => {
        if (!brand || !model) return;
        addSecondHand({
            id: crypto.randomUUID(),
            brand, model, condition,
            buyPrice: parseFloat(buyPrice) || 0,
            sellPrice: parseFloat(sellPrice) || undefined,
            status: 'in-stock',
            boughtFrom,
            notes,
            createdAt: new Date().toISOString(),
        });
        setShowForm(false);
        setBrand(''); setModel(''); setBuyPrice(''); setSellPrice(''); setBoughtFrom(''); setNotes('');
    };

    const handleSell = (id: string) => {
        const customer = prompt('Kime satıldı? (İsim)');
        if (!customer) return;
        const price = prompt('Satış fiyatı (₺)?');
        updateSecondHand(id, {
            status: 'sold',
            soldTo: customer,
            soldDate: new Date().toISOString(),
            sellPrice: parseFloat(price || '0'),
        });
    };

    const filtered = state.secondHandDevices.filter(d =>
        search === '' ||
        d.brand.toLowerCase().includes(search.toLowerCase()) ||
        d.model.toLowerCase().includes(search.toLowerCase()) ||
        (d.boughtFrom && d.boughtFrom.toLowerCase().includes(search.toLowerCase())) ||
        (d.soldTo && d.soldTo.toLowerCase().includes(search.toLowerCase()))
    );

    const totalInvestment = state.secondHandDevices.filter(d => d.status !== 'sold').reduce((s, d) => s + d.buyPrice, 0);
    const totalProfit = state.secondHandDevices.filter(d => d.status === 'sold').reduce((s, d) => s + ((d.sellPrice || 0) - d.buyPrice), 0);

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold">2. El Alım / Satım</h2>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{state.secondHandDevices.length} cihaz</p>
                </div>
                <button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={16} /> Cihaz Ekle</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="card">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Stoktaki Cihazlar</p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{state.secondHandDevices.filter(d => d.status === 'in-stock').length}</p>
                </div>
                <div className="card">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Toplam Yatırım</p>
                    <p className={`text-2xl font-bold text-orange-400 ${state.privacyMode ? 'privacy-blur' : ''}`}>{formatCurrency(totalInvestment)}</p>
                </div>
                <div className="card">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Toplam Kar</p>
                    <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'} ${state.privacyMode ? 'privacy-blur' : ''}`}>
                        {formatCurrency(totalProfit)}
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="relative mb-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Marka, model, kişi ara..." className="!pl-9" />
            </div>

            <div className="card !p-0 overflow-x-auto">
                {filtered.length === 0 ? (
                    <p className="text-sm text-center py-12" style={{ color: 'var(--text-muted)' }}>
                        {state.secondHandDevices.length === 0 ? 'Henüz 2. el cihaz eklenmemiş.' : 'Arama kriterine uygun cihaz bulunamadı.'}
                    </p>
                ) : (
                    <table>
                        <thead><tr><th>Cihaz</th><th>Durum</th><th>Alış</th><th>Satış</th><th>Kar</th><th>Aldığımız Kişi</th><th>İşlem</th></tr></thead>
                        <tbody>
                            {filtered.map(d => (
                                <tr key={d.id}>
                                    <td>
                                        <div className="text-sm font-medium">{d.brand} {d.model}</div>
                                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{conditionLabels[d.condition]}</div>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${d.status === 'in-stock' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                            d.status === 'sold' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                                'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                            }`}>
                                            {d.status === 'in-stock' ? 'Stokta' : d.status === 'sold' ? 'Satıldı' : 'İlanda'}
                                        </span>
                                    </td>
                                    <td className={`${state.privacyMode ? 'privacy-blur' : ''}`}>{formatCurrency(d.buyPrice)}</td>
                                    <td className={`${state.privacyMode ? 'privacy-blur' : ''}`}>{d.sellPrice ? formatCurrency(d.sellPrice) : '-'}</td>
                                    <td className={`font-medium ${(d.sellPrice || 0) - d.buyPrice >= 0 ? 'text-emerald-400' : 'text-red-400'} ${state.privacyMode ? 'privacy-blur' : ''}`}>
                                        {d.sellPrice ? formatCurrency((d.sellPrice) - d.buyPrice) : '-'}
                                    </td>
                                    <td className="text-sm">{d.boughtFrom}</td>
                                    <td>
                                        <div className="flex gap-1">
                                            {d.status === 'in-stock' && (
                                                <button onClick={() => handleSell(d.id)} className="btn-primary text-xs py-1 px-3">Sat</button>
                                            )}
                                            <button onClick={() => { if (confirm('Bu cihazı silmek istediğinize emin misiniz?')) deleteSecondHand(d.id); }}
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
                        <h3 className="text-lg font-semibold mb-4">2. El Cihaz Ekle</h3>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <input value={brand} onChange={e => setBrand(e.target.value)} placeholder="Marka *" />
                                <input value={model} onChange={e => setModel(e.target.value)} placeholder="Model *" />
                            </div>
                            <select value={condition} onChange={e => setCondition(e.target.value as DeviceCondition)}>
                                {Object.entries(conditionLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                            <div className="grid grid-cols-2 gap-3">
                                <input type="number" value={buyPrice} onChange={e => setBuyPrice(e.target.value)} placeholder="Alış Fiyatı (₺)" />
                                <input type="number" value={sellPrice} onChange={e => setSellPrice(e.target.value)} placeholder="Hedef Satış (₺)" />
                            </div>
                            <input value={boughtFrom} onChange={e => setBoughtFrom(e.target.value)} placeholder="Kimden alındı?" />
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Notlar" />
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
