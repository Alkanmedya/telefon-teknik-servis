'use client';

import { useState } from 'react';
import { useAppState } from '@/lib/store';
import { Plus, TabletSmartphone, Trash2, AlertTriangle } from 'lucide-react';
import type { LoanerDevice } from '@/lib/types';

export default function LoanerList() {
    const { state, addLoanerDevice, updateLoanerDevice, deleteLoanerDevice } = useAppState();
    const [showForm, setShowForm] = useState(false);
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    const [imei, setImei] = useState('');

    const handleAdd = () => {
        if (!brand || !model) return;
        addLoanerDevice({ id: crypto.randomUUID(), brand, model, imei: imei || undefined, status: 'available' });
        setShowForm(false);
        setBrand(''); setModel(''); setImei('');
    };

    const handleLoan = (id: string) => {
        const name = prompt('Kime veriliyor?');
        if (!name) return;
        const days = prompt('Kaç gün emanet? (varsayılan: 7)', '7');
        updateLoanerDevice(id, {
            status: 'on-loan',
            currentCustomerName: name,
            dueDate: new Date(Date.now() + (parseInt(days || '7')) * 24 * 60 * 60 * 1000).toISOString(),
        });
    };

    const handleReturn = (id: string) => {
        updateLoanerDevice(id, { status: 'available', currentCustomerName: undefined, currentCustomerId: undefined, dueDate: undefined });
    };

    const overdue = state.loanerDevices.filter(d => d.status === 'on-loan' && d.dueDate && new Date(d.dueDate) < new Date());
    const available = state.loanerDevices.filter(d => d.status === 'available');
    const onLoan = state.loanerDevices.filter(d => d.status === 'on-loan');

    const getDaysRemaining = (dueDate?: string) => {
        if (!dueDate) return null;
        const diff = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold">Emanet Cihaz Takibi</h2>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{state.loanerDevices.length} cihaz</p>
                </div>
                <button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={16} /> Emanet Cihaz Ekle</button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="card !p-3 text-center">
                    <p className="text-xl font-bold" style={{ color: 'var(--accent)' }}>{state.loanerDevices.length}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Toplam</p>
                </div>
                <div className="card !p-3 text-center">
                    <p className="text-xl font-bold text-emerald-400">{available.length}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Müsait</p>
                </div>
                <div className="card !p-3 text-center">
                    <p className="text-xl font-bold text-orange-400">{onLoan.length}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Verildi</p>
                </div>
                <div className="card !p-3 text-center">
                    <p className="text-xl font-bold text-red-400">{overdue.length}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Süresi Geçen</p>
                </div>
            </div>

            {/* Overdue Alert */}
            {overdue.length > 0 && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-4 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-red-400" />
                    <span className="text-xs text-red-400 font-medium">
                        {overdue.length} cihazın iade süresi geçti! ({overdue.map(d => d.currentCustomerName).join(', ')})
                    </span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {state.loanerDevices.length === 0 ? (
                    <p className="text-sm col-span-full text-center py-12" style={{ color: 'var(--text-muted)' }}>Henüz emanet cihaz eklenmemiş.</p>
                ) : (
                    state.loanerDevices.map(d => {
                        const daysLeft = getDaysRemaining(d.dueDate);
                        const isOverdue = daysLeft !== null && daysLeft < 0;
                        return (
                            <div key={d.id} className={`card ${isOverdue ? 'border-red-500/40' : d.status === 'on-loan' ? 'border-orange-500/30' : 'border-emerald-500/30'}`}>
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <TabletSmartphone size={18} style={{ color: d.status === 'available' ? 'var(--success)' : isOverdue ? '#ef4444' : 'var(--warning)' }} />
                                        <div>
                                            <h4 className="font-semibold text-sm">{d.brand} {d.model}</h4>
                                            {d.imei && <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>IMEI: {d.imei}</p>}
                                        </div>
                                    </div>
                                    <button onClick={() => { if (confirm('Bu emanet cihazı silmek istediğinize emin misiniz?')) deleteLoanerDevice(d.id); }}
                                        className="p-1 rounded hover:bg-red-500/20 text-red-400" title="Sil">
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                                <span className={`status-badge ${d.status === 'available' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : isOverdue ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-orange-500/20 text-orange-400 border-orange-500/30'}`}>
                                    {d.status === 'available' ? 'Müsait' : isOverdue ? 'Süresi Geçti!' : 'Verildi'}
                                </span>
                                {d.currentCustomerName && (
                                    <div className="mt-2">
                                        <p className="text-sm">📱 {d.currentCustomerName}</p>
                                        {daysLeft !== null && (
                                            <p className={`text-[10px] mt-0.5 ${isOverdue ? 'text-red-400 font-bold' : ''}`} style={!isOverdue ? { color: 'var(--text-muted)' } : undefined}>
                                                {isOverdue ? `⚠️ ${Math.abs(daysLeft)} gün gecikmiş!` : `${daysLeft} gün kaldı`}
                                            </p>
                                        )}
                                    </div>
                                )}
                                <div className="mt-3">
                                    {d.status === 'available' ? (
                                        <button onClick={() => handleLoan(d.id)} className="btn-primary text-xs w-full justify-center">Ver</button>
                                    ) : (
                                        <button onClick={() => handleReturn(d.id)} className="btn-secondary text-xs w-full justify-center">Geri Al</button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {showForm && (
                <div className="modal-backdrop" onClick={() => setShowForm(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-4">Emanet Cihaz Ekle</h3>
                        <div className="space-y-3">
                            <input value={brand} onChange={e => setBrand(e.target.value)} placeholder="Marka *" />
                            <input value={model} onChange={e => setModel(e.target.value)} placeholder="Model *" />
                            <input value={imei} onChange={e => setImei(e.target.value)} placeholder="IMEI (opsiyonel)" />
                            <div className="flex gap-2"><button onClick={handleAdd} className="btn-primary flex-1 justify-center">Ekle</button><button onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center">İptal</button></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
