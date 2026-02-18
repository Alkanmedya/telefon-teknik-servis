'use client';

import { useAppState } from '@/lib/store';
import { formatCurrency, statusLabels } from '@/lib/utils';
import { Wrench, CheckCircle, Clock, AlertTriangle, TrendingUp, Package, CalendarDays, Plus, StickyNote, X, Pencil, Check, DollarSign, BarChart3, PieChart } from 'lucide-react';
import { useState, useMemo } from 'react';
import type { PageType } from '@/app/page';

interface DashboardProps {
    onNavigate: (page: PageType) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
    const { state, addStickyNote, updateStickyNote, deleteStickyNote, updateExchangeRate } = useAppState();
    const [noteText, setNoteText] = useState('');
    const [noteColor, setNoteColor] = useState<'yellow' | 'blue' | 'red' | 'green' | 'purple'>('yellow');
    const [editingRates, setEditingRates] = useState(false);
    const [editUsd, setEditUsd] = useState('');
    const [editEur, setEditEur] = useState('');

    const startEditRates = () => {
        const usd = state.exchangeRates.find(r => r.currency === 'USD');
        const eur = state.exchangeRates.find(r => r.currency === 'EUR');
        setEditUsd(usd?.rate.toFixed(2) || '32.50');
        setEditEur(eur?.rate.toFixed(2) || '35.00');
        setEditingRates(true);
    };

    const saveRates = () => {
        const usdVal = parseFloat(editUsd);
        const eurVal = parseFloat(editEur);
        if (!isNaN(usdVal) && usdVal > 0) updateExchangeRate('USD', usdVal, 'Manuel', 'manual');
        if (!isNaN(eurVal) && eurVal > 0) updateExchangeRate('EUR', eurVal, 'Manuel', 'manual');
        setEditingRates(false);
    };

    // ==================== STATS ====================
    const stats = useMemo(() => {
        const today = new Date().toISOString().slice(0, 10);
        const thisMonth = new Date().toISOString().slice(0, 7);
        const todayRepairs = state.repairs.filter(r => r.createdAt.slice(0, 10) === today);

        // Income (Revenue) based on actual cash flow (Incomes)
        const monthIncome = state.incomes.filter(i => i.date.slice(0, 7) === thisMonth).reduce((sum, i) => sum + i.amount, 0);

        // Expenses
        const monthExpenses = state.expenses.filter(e => e.date.slice(0, 7) === thisMonth).reduce((sum, e) => sum + e.amount, 0);

        const lowStock = state.stockItems.filter(s => s.quantity <= s.criticalLevel);
        const todayAppointments = state.appointments.filter(a => a.date === today && a.status === 'scheduled');

        return {
            pending: state.repairs.filter(r => r.status === 'pending').length,
            diagnosing: state.repairs.filter(r => r.status === 'diagnosing' || r.status === 'repairing').length,
            ready: state.repairs.filter(r => r.status === 'ready').length,
            todayCount: todayRepairs.length,
            monthRevenue: monthIncome,
            monthExpenses,
            netProfit: monthIncome - monthExpenses,
            lowStock,
            lowStockCount: lowStock.length,
            todayAppointments,
            todayAppointmentCount: todayAppointments.length,
            totalActive: state.repairs.filter(r => !['delivered', 'cancelled'].includes(r.status)).length,
        };
    }, [state]);

    // ==================== CHART DATA: Last 6 months revenue & repair count ====================
    const chartData = useMemo(() => {
        const months: { label: string; key: string }[] = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                label: d.toLocaleDateString('tr-TR', { month: 'short' }),
                key: d.toISOString().slice(0, 7),
            });
        }

        const monthlyRevenue = months.map(m => {
            const delivered = state.repairs.filter(r => r.status === 'delivered' && r.updatedAt.slice(0, 7) === m.key);
            return { ...m, revenue: delivered.reduce((s, r) => s + r.finalCost, 0) };
        });

        const monthlyRepairCount = months.map(m => {
            return { ...m, count: state.repairs.filter(r => r.createdAt.slice(0, 7) === m.key).length };
        });

        const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue), 1);
        const maxCount = Math.max(...monthlyRepairCount.map(m => m.count), 1);

        return { months, monthlyRevenue, monthlyRepairCount, maxRevenue, maxCount };
    }, [state.repairs]);

    // ==================== TOP MODELS & ISSUES ====================
    const topModels = useMemo(() => {
        const counts: Record<string, number> = {};
        state.repairs.forEach(r => {
            const key = `${r.device.brand} ${r.device.model}`;
            counts[key] = (counts[key] || 0) + 1;
        });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    }, [state.repairs]);

    // ==================== PARTS USAGE ====================
    const topParts = useMemo(() => {
        const counts: Record<string, { name: string; qty: number; revenue: number }> = {};
        state.repairs.forEach(r => {
            r.usedParts.forEach(p => {
                if (!counts[p.name]) counts[p.name] = { name: p.name, qty: 0, revenue: 0 };
                counts[p.name].qty += p.quantity;
                counts[p.name].revenue += p.cost * p.quantity;
            });
        });
        return Object.values(counts).sort((a, b) => b.qty - a.qty).slice(0, 5);
    }, [state.repairs]);

    // ==================== STATUS DISTRIBUTION ====================
    const statusDist = useMemo(() => {
        const counts: Record<string, number> = {};
        state.repairs.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
        const total = state.repairs.length || 1;
        const colors: Record<string, string> = {
            pending: '#eab308', diagnosing: '#3b82f6', waiting_parts: '#f97316',
            repairing: '#8b5cf6', ready: '#10b981', delivered: '#64748b', cancelled: '#ef4444',
        };
        return Object.entries(counts).map(([status, count]) => ({
            status, count, pct: Math.round((count / total) * 100),
            color: colors[status] || '#64748b',
            label: statusLabels[status as keyof typeof statusLabels] || status,
        }));
    }, [state.repairs]);

    const noteColors: Record<string, string> = {
        yellow: 'bg-yellow-500/20 border-yellow-500/30',
        blue: 'bg-blue-500/20 border-blue-500/30',
        red: 'bg-red-500/20 border-red-500/30',
        green: 'bg-emerald-500/20 border-emerald-500/30',
        purple: 'bg-purple-500/20 border-purple-500/30',
    };

    const handleAddNote = () => {
        if (!noteText.trim()) return;
        addStickyNote({
            id: crypto.randomUUID(),
            text: noteText,
            color: noteColor,
            isCompleted: false,
            createdAt: new Date().toISOString(),
        });
        setNoteText('');
    };

    // Bar colors for alternating
    const barColors = ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#3b82f6'];

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold">Dashboard</h2>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        Hoş geldiniz! Bugünün özeti aşağıda.
                    </p>
                </div>
                <button onClick={() => onNavigate('new-repair')} className="btn-primary">
                    <Plus size={18} /> Yeni Kayıt
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="card cursor-pointer" onClick={() => onNavigate('repairs')}>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Bekleyen</span>
                        <Clock size={20} className="text-yellow-400" />
                    </div>
                    <p className="text-3xl font-bold text-yellow-400">{stats.pending}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>cihaz sırada</p>
                </div>

                <div className="card cursor-pointer" onClick={() => onNavigate('repairs')}>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Tamirde</span>
                        <Wrench size={20} className="text-blue-400" />
                    </div>
                    <p className="text-3xl font-bold text-blue-400">{stats.diagnosing}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>aktif işlem</p>
                </div>

                <div className="card cursor-pointer animate-pulse-glow" onClick={() => onNavigate('repairs')}>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Hazır (Teslim Bekliyor)</span>
                        <CheckCircle size={20} className="text-emerald-400" />
                    </div>
                    <p className="text-3xl font-bold text-emerald-400">{stats.ready}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>teslim edilecek</p>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Bugün Gelen</span>
                        <CalendarDays size={20} style={{ color: 'var(--accent)' }} />
                    </div>
                    <p className="text-3xl font-bold" style={{ color: 'var(--accent)' }}>{stats.todayCount}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>yeni kayıt</p>
                </div>
            </div>

            {/* Financial + Alerts + Rates Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                {/* Revenue */}
                <div className="card">
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp size={18} style={{ color: 'var(--accent)' }} />
                        <span className="text-sm font-semibold">Bu Ay Finansal</span>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Gelir:</span>
                            <span className={`text-sm font-semibold text-emerald-400 ${state.privacyMode ? 'privacy-blur' : ''}`}>
                                {formatCurrency(stats.monthRevenue)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Gider:</span>
                            <span className={`text-sm font-semibold text-red-400 ${state.privacyMode ? 'privacy-blur' : ''}`}>
                                {formatCurrency(stats.monthExpenses)}
                            </span>
                        </div>
                        <hr style={{ borderColor: 'var(--border)' }} />
                        <div className="flex justify-between">
                            <span className="text-sm font-semibold">Net:</span>
                            <span className={`text-sm font-bold ${stats.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'} ${state.privacyMode ? 'privacy-blur' : ''}`}>
                                {formatCurrency(stats.netProfit)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Alerts — expanded with item names */}
                <div className="card">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle size={18} className="text-yellow-400" />
                        <span className="text-sm font-semibold">Uyarılar</span>
                    </div>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {stats.lowStock.length > 0 && (
                            <>
                                <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 cursor-pointer"
                                    onClick={() => onNavigate('stock')}>
                                    <Package size={14} className="text-orange-400 flex-shrink-0" />
                                    <span className="text-xs font-semibold text-orange-400">{stats.lowStockCount} parça kritik seviyede!</span>
                                </div>
                                {stats.lowStock.slice(0, 5).map(item => (
                                    <div key={item.id} className="flex items-center justify-between text-xs px-2 py-1 rounded" style={{ background: 'var(--bg-secondary)' }}>
                                        <span className="truncate mr-2">{item.name}</span>
                                        <span className="font-mono text-red-400 flex-shrink-0">
                                            {item.quantity}/{item.criticalLevel}
                                        </span>
                                    </div>
                                ))}
                            </>
                        )}
                        {stats.todayAppointments.length > 0 && (
                            <>
                                <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 cursor-pointer"
                                    onClick={() => onNavigate('calendar')}>
                                    <CalendarDays size={14} className="text-blue-400 flex-shrink-0" />
                                    <span className="text-xs font-semibold text-blue-400">{stats.todayAppointmentCount} randevu bugün</span>
                                </div>
                                {stats.todayAppointments.slice(0, 3).map(apt => (
                                    <div key={apt.id} className="flex items-center justify-between text-xs px-2 py-1 rounded" style={{ background: 'var(--bg-secondary)' }}>
                                        <span className="truncate mr-2">{apt.timeSlot} — {apt.customerName}</span>
                                        <span style={{ color: 'var(--text-muted)' }}>{apt.deviceModel}</span>
                                    </div>
                                ))}
                            </>
                        )}
                        {stats.lowStockCount === 0 && stats.todayAppointmentCount === 0 && (
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Şu an uyarı yok! 🎉</p>
                        )}
                    </div>
                </div>

                {/* Exchange Rates */}
                <div className="card">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <DollarSign size={16} style={{ color: 'var(--accent)' }} />
                            <span className="text-sm font-semibold">Kur Bilgisi</span>
                        </div>
                        {!editingRates ? (
                            <button onClick={startEditRates} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" title="Kur Düzenle">
                                <Pencil size={14} style={{ color: 'var(--text-muted)' }} />
                            </button>
                        ) : (
                            <button onClick={saveRates} className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors">
                                <Check size={12} /> Kaydet
                            </button>
                        )}
                    </div>
                    <div className="space-y-2">
                        {editingRates ? (
                            <>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium w-10">USD</span>
                                    <div className="relative flex-1">
                                        <input type="number" step="0.01" value={editUsd} onChange={e => setEditUsd(e.target.value)}
                                            className="w-full text-right text-sm pr-6 py-1.5" autoFocus onKeyDown={e => e.key === 'Enter' && saveRates()} />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-muted)' }}>₺</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium w-10">EUR</span>
                                    <div className="relative flex-1">
                                        <input type="number" step="0.01" value={editEur} onChange={e => setEditEur(e.target.value)}
                                            className="w-full text-right text-sm pr-6 py-1.5" onKeyDown={e => e.key === 'Enter' && saveRates()} />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-muted)' }}>₺</span>
                                    </div>
                                </div>
                                <button onClick={() => setEditingRates(false)} className="w-full text-[11px] py-1 text-center rounded" style={{ color: 'var(--text-muted)' }}>İptal</button>
                            </>
                        ) : (
                            state.exchangeRates.map(rate => (
                                <div key={rate.currency} className="flex justify-between items-center cursor-pointer hover:bg-white/5 -mx-2 px-2 py-1 rounded-lg transition-colors" onClick={startEditRates}>
                                    <span className="text-sm font-medium">{rate.currency}</span>
                                    <div className="text-right">
                                        <span className={`text-sm font-bold ${state.privacyMode ? 'privacy-blur' : ''}`} style={{ color: 'var(--accent)' }}>
                                            {rate.rate.toFixed(2)} ₺
                                        </span>
                                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{rate.bank}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* ==================== CHARTS SECTION ==================== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                {/* Revenue Chart — Bar */}
                <div className="card">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart3 size={18} style={{ color: 'var(--accent)' }} />
                        <span className="text-sm font-semibold">Aylık Gelir (Son 6 Ay)</span>
                    </div>
                    <div className="flex items-end gap-2 h-[160px]">
                        {chartData.monthlyRevenue.map((m, i) => (
                            <div key={m.key} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                                <span className={`text-[9px] font-medium ${state.privacyMode ? 'privacy-blur' : ''}`} style={{ color: 'var(--text-muted)' }}>
                                    {m.revenue > 0 ? formatCurrency(m.revenue).replace('₺', '').trim() : ''}
                                </span>
                                <div
                                    className="w-full rounded-t-md transition-all duration-500"
                                    style={{
                                        height: `${Math.max(4, (m.revenue / chartData.maxRevenue) * 130)}px`,
                                        background: `linear-gradient(180deg, ${barColors[i % barColors.length]}, ${barColors[i % barColors.length]}66)`,
                                        minWidth: '20px',
                                    }}
                                />
                                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{m.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Repair Count Chart — Bar */}
                <div className="card">
                    <div className="flex items-center gap-2 mb-4">
                        <Wrench size={18} style={{ color: 'var(--accent)' }} />
                        <span className="text-sm font-semibold">Aylık Tamir Sayısı (Son 6 Ay)</span>
                    </div>
                    <div className="flex items-end gap-2 h-[160px]">
                        {chartData.monthlyRepairCount.map((m, i) => (
                            <div key={m.key} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                                <span className="text-[9px] font-bold" style={{ color: barColors[(i + 2) % barColors.length] }}>
                                    {m.count > 0 ? m.count : ''}
                                </span>
                                <div
                                    className="w-full rounded-t-md transition-all duration-500"
                                    style={{
                                        height: `${Math.max(4, (m.count / chartData.maxCount) * 130)}px`,
                                        background: `linear-gradient(180deg, ${barColors[(i + 2) % barColors.length]}, ${barColors[(i + 2) % barColors.length]}66)`,
                                        minWidth: '20px',
                                    }}
                                />
                                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{m.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Status Distribution + Top Models + Top Parts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                {/* Status Pie (horizontal bar) */}
                <div className="card">
                    <div className="flex items-center gap-2 mb-3">
                        <PieChart size={16} style={{ color: 'var(--accent)' }} />
                        <span className="text-sm font-semibold">Durum Dağılımı</span>
                    </div>
                    {state.repairs.length === 0 ? (
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Henüz veri yok.</p>
                    ) : (
                        <div className="space-y-2">
                            {/* Stacked bar */}
                            <div className="flex h-5 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                                {statusDist.map(s => (
                                    <div key={s.status} style={{ width: `${s.pct}%`, background: s.color }} title={`${s.label}: ${s.count}`} />
                                ))}
                            </div>
                            {/* Legend */}
                            <div className="grid grid-cols-2 gap-1 mt-2">
                                {statusDist.map(s => (
                                    <div key={s.status} className="flex items-center gap-1.5 text-[10px]">
                                        <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: s.color }} />
                                        <span style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
                                        <span className="font-bold ml-auto" style={{ color: s.color }}>{s.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Top Models */}
                <div className="card">
                    <h3 className="text-sm font-semibold mb-3">📱 En Çok Gelen Modeller</h3>
                    {topModels.length === 0 ? (
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Henüz veri yok.</p>
                    ) : (
                        <div className="space-y-2">
                            {topModels.map(([model, count], i) => {
                                const maxCount = topModels[0][1] as number;
                                return (
                                    <div key={model} className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold w-4" style={{ color: barColors[i % barColors.length] }}>{i + 1}</span>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <span className="text-xs truncate mr-2">{model}</span>
                                                <span className="text-[10px] font-mono font-bold" style={{ color: 'var(--accent)' }}>{count}</span>
                                            </div>
                                            <div className="h-1.5 rounded-full" style={{ background: 'var(--bg-secondary)' }}>
                                                <div className="h-full rounded-full transition-all" style={{ width: `${((count as number) / maxCount) * 100}%`, background: barColors[i % barColors.length] }} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Top Parts */}
                <div className="card">
                    <h3 className="text-sm font-semibold mb-3">🔧 En Çok Kullanılan Parçalar</h3>
                    {topParts.length === 0 ? (
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Henüz parça kullanımı yok.</p>
                    ) : (
                        <div className="space-y-2">
                            {topParts.map((part, i) => (
                                <div key={part.name} className="flex items-center justify-between text-xs py-1.5 px-2 rounded" style={{ background: 'var(--bg-secondary)' }}>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold" style={{ color: barColors[i % barColors.length] }}>{i + 1}</span>
                                        <span className="truncate">{part.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono" style={{ color: 'var(--text-muted)' }}>x{part.qty}</span>
                                        <span className={`font-medium ${state.privacyMode ? 'privacy-blur' : ''}`} style={{ color: 'var(--accent)' }}>
                                            {formatCurrency(part.revenue)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Sticky Notes */}
            <div className="card mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <StickyNote size={18} style={{ color: 'var(--accent)' }} />
                    <span className="text-sm font-semibold">Yapılacaklar / Notlar</span>
                </div>
                <div className="flex gap-2 mb-4">
                    <input type="text" placeholder="Not ekle..." value={noteText} onChange={e => setNoteText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddNote()} className="flex-1" />
                    <div className="flex gap-1">
                        {(['yellow', 'blue', 'red', 'green', 'purple'] as const).map(c => (
                            <button key={c} onClick={() => setNoteColor(c)}
                                className={`w-6 h-6 rounded-full border-2 ${noteColor === c ? 'ring-2 ring-offset-1 ring-offset-[var(--bg-card)]' : ''}`}
                                style={{
                                    background: c === 'yellow' ? '#eab308' : c === 'blue' ? '#3b82f6' : c === 'red' ? '#ef4444' : c === 'green' ? '#10b981' : '#a855f7',
                                    borderColor: 'transparent',
                                    outline: noteColor === c ? '2px solid var(--accent)' : 'none',
                                    outlineOffset: '2px',
                                }} />
                        ))}
                    </div>
                    <button onClick={handleAddNote} className="btn-primary text-sm py-2 px-4">Ekle</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {state.stickyNotes.map(note => (
                        <div key={note.id} className={`p-3 rounded-lg border ${noteColors[note.color]} flex items-start gap-2`}>
                            <input type="checkbox" checked={note.isCompleted} onChange={() => updateStickyNote(note.id, { isCompleted: !note.isCompleted })} className="mt-1 accent-cyan-500" />
                            <span className={`flex-1 text-sm ${note.isCompleted ? 'line-through opacity-50' : ''}`}>{note.text}</span>
                            <button onClick={() => deleteStickyNote(note.id)} className="text-red-400 hover:text-red-300"><X size={14} /></button>
                        </div>
                    ))}
                </div>
                {state.stickyNotes.length === 0 && (
                    <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>Henüz not eklenmemiş.</p>
                )}
            </div>

            {/* Recent Repairs */}
            <div className="card">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold">Son Gelen Cihazlar</span>
                    <button onClick={() => onNavigate('repairs')} className="text-xs" style={{ color: 'var(--accent)' }}>Tümünü Gör →</button>
                </div>
                {state.repairs.length === 0 ? (
                    <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
                        Henüz tamir kaydı yok. &quot;Yeni Kayıt&quot; butonuna tıklayarak ilk cihazı ekleyin.
                    </p>
                ) : (
                    <table>
                        <thead><tr><th>Fiş No</th><th>Müşteri</th><th>Cihaz</th><th>Durum</th><th>Tarih</th></tr></thead>
                        <tbody>
                            {state.repairs.slice(0, 5).map(repair => (
                                <tr key={repair.id} className="cursor-pointer" onClick={() => onNavigate('repairs')}>
                                    <td className="font-mono text-xs" style={{ color: 'var(--accent)' }}>{repair.ticketNo}</td>
                                    <td>{repair.customer.fullName}</td>
                                    <td className="text-sm" style={{ color: 'var(--text-secondary)' }}>{repair.device.brand} {repair.device.model}</td>
                                    <td>
                                        <span className={`status-badge ${repair.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                            repair.status === 'ready' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                                repair.status === 'delivered' ? 'bg-slate-500/20 text-slate-400 border-slate-500/30' :
                                                    'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                            }`}>
                                            {statusLabels[repair.status]}
                                        </span>
                                    </td>
                                    <td className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                        {new Date(repair.createdAt).toLocaleDateString('tr-TR')}
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
