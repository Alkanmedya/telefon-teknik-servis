'use client';

import { useAppState } from '@/lib/store';
import {
    LayoutDashboard, Wrench, PlusCircle, Package, Smartphone, DollarSign,
    CalendarDays, Building2, TabletSmartphone, Heart, Settings, Globe,
    Eye, EyeOff, ChevronLeft, ChevronRight, Truck, RotateCcw, FileText,
    Users, Search, Menu, X
} from 'lucide-react';
import { useState } from 'react';
import type { PageType } from '@/app/page';

interface SidebarProps {
    currentPage: PageType;
    onNavigate: (page: PageType) => void;
    onSearchOpen?: () => void;
}

const menuItems: { id: PageType; label: string; icon: any; group: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Ana Menü' },
    { id: 'new-repair', label: 'Yeni Kayıt', icon: PlusCircle, group: 'Ana Menü' },
    { id: 'repairs', label: 'Tamirler', icon: Wrench, group: 'Ana Menü' },
    { id: 'customers', label: 'Müşteriler', icon: Users, group: 'Ana Menü' },
    { id: 'stock', label: 'Stok & Parça', icon: Package, group: 'İş Yönetimi' },
    { id: 'suppliers', label: 'Tedarikçiler', icon: Truck, group: 'İş Yönetimi' },
    { id: 'rma', label: 'RMA / İade', icon: RotateCcw, group: 'İş Yönetimi' },
    { id: 'second-hand', label: '2. El Alım/Satım', icon: Smartphone, group: 'İş Yönetimi' },
    { id: 'expenses', label: 'Kasa & Finans', icon: DollarSign, group: 'İş Yönetimi' },
    { id: 'wishlist', label: 'İstek Listesi', icon: Heart, group: 'İş Yönetimi' },
    { id: 'calendar', label: 'Randevular', icon: CalendarDays, group: 'Müşteri' },
    { id: 'corporate', label: 'Kurumsal', icon: Building2, group: 'Müşteri' },
    { id: 'quotes', label: 'Teklifler', icon: FileText, group: 'Müşteri' },
    { id: 'loaners', label: 'Emanet Cihaz', icon: TabletSmartphone, group: 'Müşteri' },
    { id: 'customer-portal', label: 'Müşteri Portalı', icon: Globe, group: 'Müşteri' },
    { id: 'settings', label: 'Ayarlar', icon: Settings, group: 'Sistem' },
];

export default function Sidebar({ currentPage, onNavigate, onSearchOpen }: SidebarProps) {
    const { state, togglePrivacy } = useAppState();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const groups = [...new Set(menuItems.map(i => i.group))];

    const pendingCount = state.repairs.filter(r => r.status === 'pending').length;
    const readyCount = state.repairs.filter(r => r.status === 'ready').length;
    const lowStockCount = state.stockItems.filter(s => s.quantity <= s.criticalLevel).length;

    const handleNavigate = (page: PageType) => {
        onNavigate(page);
        setMobileOpen(false);
    };

    const sidebarContent = (
        <>
            {/* Logo */}
            <div className="flex items-center gap-3 p-4 border-b border-[var(--border)]">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm"
                    style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}>
                    TS
                </div>
                {!collapsed && (
                    <div>
                        <h1 className="text-sm font-bold" style={{ color: 'var(--accent)' }}>Teknik Servis</h1>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Pro Panel</p>
                    </div>
                )}
            </div>

            {/* Quick Stats */}
            {!collapsed && (pendingCount > 0 || readyCount > 0 || lowStockCount > 0) && (
                <div className="flex gap-2 px-4 py-3 border-b border-[var(--border)] flex-wrap">
                    {pendingCount > 0 && (
                        <span className="text-[11px] px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 font-medium">
                            {pendingCount} Bekliyor
                        </span>
                    )}
                    {readyCount > 0 && (
                        <span className="text-[11px] px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">
                            {readyCount} Hazır
                        </span>
                    )}
                    {lowStockCount > 0 && (
                        <span className="text-[11px] px-2 py-1 rounded-full bg-red-500/20 text-red-400 font-medium animate-pulse">
                            {lowStockCount} Kritik Stok
                        </span>
                    )}
                </div>
            )}

            {/* Search Button */}
            {!collapsed && onSearchOpen && (
                <button onClick={onSearchOpen}
                    className="mx-3 mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-xs border transition-colors"
                    style={{ background: 'var(--bg-hover)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                    <Search size={14} /> Ara... <span className="ml-auto text-[9px] opacity-50">Ctrl+F</span>
                </button>
            )}

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-2">
                {groups.map(group => (
                    <div key={group}>
                        {!collapsed && (
                            <p className="px-4 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider"
                                style={{ color: 'var(--text-muted)' }}>
                                {group}
                            </p>
                        )}
                        {menuItems.filter(i => i.group === group).map(item => {
                            const Icon = item.icon;
                            const isActive = currentPage === item.id;
                            const badge = item.id === 'stock' && lowStockCount > 0 ? lowStockCount : null;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleNavigate(item.id)}
                                    className={`sidebar-item w-full flex items-center gap-3 px-4 py-2.5 text-sm ${isActive ? 'active' : ''}`}
                                    title={collapsed ? item.label : undefined}
                                >
                                    <Icon size={18} />
                                    {!collapsed && <span>{item.label}</span>}
                                    {!collapsed && badge && (
                                        <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold animate-pulse">
                                            {badge}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* Keyboard Shortcuts Hint */}
            {!collapsed && (
                <div className="px-4 py-2 border-t border-[var(--border)]">
                    <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                        Ctrl+N: Yeni Kayıt • Ctrl+F: Ara • Esc: Kapat
                    </p>
                </div>
            )}

            {/* Footer */}
            <div className="border-t border-[var(--border)] p-3 flex flex-col gap-2">
                <button
                    onClick={togglePrivacy}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                    style={{
                        background: state.privacyMode ? 'rgba(239,68,68,0.15)' : 'var(--bg-hover)',
                        color: state.privacyMode ? '#ef4444' : 'var(--text-secondary)',
                    }}
                    title="Tezgah Modu (Gizlilik)"
                >
                    {state.privacyMode ? <EyeOff size={16} /> : <Eye size={16} />}
                    {!collapsed && (state.privacyMode ? 'Gizli Mod Açık' : 'Tezgah Modu')}
                </button>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="hidden md:flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs"
                    style={{ color: 'var(--text-muted)' }}
                >
                    {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    {!collapsed && 'Küçült'}
                </button>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile toggle */}
            <button
                className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg"
                style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
                onClick={() => setMobileOpen(!mobileOpen)}
            >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)} />
            )}

            {/* Desktop sidebar */}
            <aside className={`hidden md:flex flex-col h-screen border-r border-[var(--border)] transition-all duration-300 ${collapsed ? 'w-[70px]' : 'w-[250px]'}`}
                style={{ background: 'var(--bg-secondary)' }}>
                {sidebarContent}
            </aside>

            {/* Mobile sidebar */}
            <aside className={`md:hidden fixed left-0 top-0 z-40 flex flex-col h-screen w-[280px] border-r border-[var(--border)] transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
                style={{ background: 'var(--bg-secondary)' }}>
                {sidebarContent}
            </aside>
        </>
    );
}
