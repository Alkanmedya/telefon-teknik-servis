'use client';

import { useState, useMemo } from 'react';
import { useAppState } from '@/lib/store';
import { formatCurrency, statusLabels, statusColors, formatDate } from '@/lib/utils';
import { Search, User, Phone, Mail, Ban, Shield, MessageCircle, ArrowLeft } from 'lucide-react';
import { openWhatsApp } from '@/lib/utils';
import type { PageType } from '@/app/page';

interface CustomerDetailProps {
    onNavigate: (page: PageType) => void;
}

export default function CustomerDetail({ onNavigate }: CustomerDetailProps) {
    const { state, updateState } = useAppState();
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Extract unique customers from repairs
    const customers = useMemo(() => {
        const map = new Map<string, {
            id: string; name: string; phone: string; email?: string;
            isBlacklisted?: boolean; blacklistReason?: string;
            repairCount: number; totalSpent: number; firstVisit: string; lastVisit: string;
        }>();
        state.repairs.forEach(r => {
            const key = r.customer.phone;
            const existing = map.get(key);
            if (existing) {
                existing.repairCount++;
                existing.totalSpent += r.finalCost || r.estimatedCost;
                if (r.createdAt < existing.firstVisit) existing.firstVisit = r.createdAt;
                if (r.createdAt > existing.lastVisit) existing.lastVisit = r.createdAt;
            } else {
                map.set(key, {
                    id: r.customer.id || key,
                    name: r.customer.fullName,
                    phone: r.customer.phone,
                    email: r.customer.email,
                    isBlacklisted: r.customer.isBlacklisted,
                    blacklistReason: r.customer.blacklistReason,
                    repairCount: 1,
                    totalSpent: r.finalCost || r.estimatedCost,
                    firstVisit: r.createdAt,
                    lastVisit: r.createdAt,
                });
            }
        });
        return Array.from(map.values()).sort((a, b) => b.lastVisit.localeCompare(a.lastVisit));
    }, [state.repairs]);

    const filtered = customers.filter(c =>
        search === '' || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
    );

    const selected = selectedId ? customers.find(c => c.phone === selectedId) : null;
    const selectedRepairs = selected ? state.repairs.filter(r => r.customer.phone === selected.phone) : [];

    const toggleBlacklist = (phone: string) => {
        const customer = customers.find(c => c.phone === phone);
        if (!customer) return;
        const newBlacklist = !customer.isBlacklisted;
        const reason = newBlacklist ? prompt('Kara listeye ekleme sebebi:') || '' : '';
        updateState(s => ({
            ...s,
            repairs: s.repairs.map(r =>
                r.customer.phone === phone
                    ? { ...r, customer: { ...r.customer, isBlacklisted: newBlacklist, blacklistReason: newBlacklist ? reason : undefined } }
                    : r
            ),
        }));
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold">Müşteri Yönetimi</h2>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Toplam {customers.length} müşteri</p>
                </div>
            </div>

            {!selected ? (
                <>
                    {/* Search */}
                    <div className="relative mb-4">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Müşteri adı veya telefon..." className="!pl-9" />
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div className="card !p-3 text-center">
                            <p className="text-xl font-bold" style={{ color: 'var(--accent)' }}>{customers.length}</p>
                            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Toplam Müşteri</p>
                        </div>
                        <div className="card !p-3 text-center">
                            <p className="text-xl font-bold text-emerald-400">{customers.filter(c => c.repairCount > 1).length}</p>
                            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Tekrar Gelenler</p>
                        </div>
                        <div className="card !p-3 text-center">
                            <p className="text-xl font-bold text-purple-400">{formatCurrency(customers.reduce((s, c) => s + c.totalSpent, 0))}</p>
                            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Toplam Gelir</p>
                        </div>
                        <div className="card !p-3 text-center">
                            <p className="text-xl font-bold text-red-400">{customers.filter(c => c.isBlacklisted).length}</p>
                            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Kara Liste</p>
                        </div>
                    </div>

                    {/* Customer List */}
                    <div className="card !p-0 overflow-x-auto">
                        {filtered.length === 0 ? (
                            <p className="text-sm text-center py-12" style={{ color: 'var(--text-muted)' }}>
                                {customers.length === 0 ? 'Henüz müşteri yok. Tamir kaydı ekleyerek müşteri oluşturun.' : 'Arama kriterine uygun müşteri bulunamadı.'}
                            </p>
                        ) : (
                            <table>
                                <thead><tr><th>Müşteri</th><th>Telefon</th><th>Tamir Sayısı</th><th>Toplam Harcama</th><th>Son Ziyaret</th><th>Durum</th></tr></thead>
                                <tbody>
                                    {filtered.map(c => (
                                        <tr key={c.phone} className="cursor-pointer" onClick={() => setSelectedId(c.phone)}>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                                                        style={{ background: c.isBlacklisted ? 'rgba(239,68,68,0.2)' : 'var(--accent)', color: c.isBlacklisted ? '#ef4444' : 'var(--bg-primary)' }}>
                                                        {c.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-sm font-medium">{c.name}</span>
                                                </div>
                                            </td>
                                            <td className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>{c.phone}</td>
                                            <td className="text-center">
                                                <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>{c.repairCount}</span>
                                            </td>
                                            <td className={`text-sm font-medium ${state.privacyMode ? 'privacy-blur' : ''}`} style={{ color: 'var(--accent)' }}>
                                                {formatCurrency(c.totalSpent)}
                                            </td>
                                            <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(c.lastVisit)}</td>
                                            <td>
                                                {c.isBlacklisted ? (
                                                    <span className="status-badge bg-red-500/20 text-red-400 border-red-500/30">Kara Liste</span>
                                                ) : c.repairCount > 3 ? (
                                                    <span className="status-badge bg-purple-500/20 text-purple-400 border-purple-500/30">VIP</span>
                                                ) : (
                                                    <span className="status-badge bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Normal</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            ) : (
                /* Customer Detail View */
                <div className="animate-fade-in">
                    <button onClick={() => setSelectedId(null)} className="flex items-center gap-1 text-sm mb-4 hover:underline" style={{ color: 'var(--accent)' }}>
                        <ArrowLeft size={14} /> Listeye Dön
                    </button>

                    {/* Customer Header Card */}
                    <div className="card mb-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
                                    style={{ background: selected.isBlacklisted ? 'rgba(239,68,68,0.2)' : 'var(--accent)', color: selected.isBlacklisted ? '#ef4444' : 'var(--bg-primary)' }}>
                                    {selected.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">{selected.name}</h3>
                                    <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                        <span className="flex items-center gap-1"><Phone size={12} /> {selected.phone}</span>
                                        {selected.email && <span className="flex items-center gap-1"><Mail size={12} /> {selected.email}</span>}
                                    </div>
                                    {selected.isBlacklisted && (
                                        <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                                            <Ban size={12} /> Kara listede: {selected.blacklistReason || 'Sebep belirtilmedi'}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => openWhatsApp(selected.phone, `Sayın ${selected.name}, `)}
                                    className="text-[10px] px-2 py-1.5 rounded border flex items-center gap-1 bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30">
                                    <MessageCircle size={10} /> WhatsApp
                                </button>
                                <button onClick={() => toggleBlacklist(selected.phone)}
                                    className={`text-[10px] px-2 py-1.5 rounded border flex items-center gap-1 ${selected.isBlacklisted
                                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
                                        : 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'
                                        }`}>
                                    {selected.isBlacklisted ? <><Shield size={10} /> Listeden Çıkar</> : <><Ban size={10} /> Kara Listeye Ekle</>}
                                </button>
                            </div>
                        </div>

                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                            <div className="rounded-lg p-3 text-center" style={{ background: 'var(--bg-secondary)' }}>
                                <p className="text-xl font-bold" style={{ color: 'var(--accent)' }}>{selected.repairCount}</p>
                                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Toplam Tamir</p>
                            </div>
                            <div className="rounded-lg p-3 text-center" style={{ background: 'var(--bg-secondary)' }}>
                                <p className={`text-xl font-bold ${state.privacyMode ? 'privacy-blur' : ''}`} style={{ color: 'var(--accent)' }}>
                                    {formatCurrency(selected.totalSpent)}
                                </p>
                                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Toplam Harcama</p>
                            </div>
                            <div className="rounded-lg p-3 text-center" style={{ background: 'var(--bg-secondary)' }}>
                                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{formatDate(selected.firstVisit)}</p>
                                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>İlk Ziyaret</p>
                            </div>
                            <div className="rounded-lg p-3 text-center" style={{ background: 'var(--bg-secondary)' }}>
                                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{formatDate(selected.lastVisit)}</p>
                                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Son Ziyaret</p>
                            </div>
                        </div>
                    </div>

                    {/* Repair History */}
                    <div className="card !p-0 overflow-x-auto">
                        <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
                            <h4 className="text-sm font-semibold">Tamir Geçmişi</h4>
                        </div>
                        <table>
                            <thead><tr><th>Fiş No</th><th>Cihaz</th><th>Arıza</th><th>Durum</th><th>Ücret</th><th>Tarih</th></tr></thead>
                            <tbody>
                                {selectedRepairs.map(r => (
                                    <tr key={r.id}>
                                        <td className="font-mono text-xs" style={{ color: 'var(--accent)' }}>{r.ticketNo}</td>
                                        <td className="text-sm">{r.device.brand} {r.device.model}</td>
                                        <td className="text-xs max-w-[200px] truncate" style={{ color: 'var(--text-secondary)' }}>{r.issueDescription}</td>
                                        <td><span className={`status-badge ${statusColors[r.status]}`}>{statusLabels[r.status]}</span></td>
                                        <td className={`text-sm font-medium ${state.privacyMode ? 'privacy-blur' : ''}`} style={{ color: 'var(--accent)' }}>
                                            {r.finalCost > 0 ? formatCurrency(r.finalCost) : formatCurrency(r.estimatedCost)}
                                        </td>
                                        <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(r.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
