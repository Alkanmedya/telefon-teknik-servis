'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useAppState } from '@/lib/store';
import { formatCurrency, statusLabels, formatDate } from '@/lib/utils';
import { Search, X, Wrench, Package, User, Building2, Smartphone, FileText } from 'lucide-react';
import type { PageType } from '@/app/page';

interface GlobalSearchProps {
    onClose: () => void;
    onNavigate: (page: PageType) => void;
}

interface SearchResult {
    type: 'repair' | 'stock' | 'customer' | 'company' | 'second-hand' | 'quote';
    title: string;
    subtitle: string;
    page: PageType;
    icon: any;
    color: string;
}

export default function GlobalSearch({ onClose, onNavigate }: GlobalSearchProps) {
    const { state } = useAppState();
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const results: SearchResult[] = useMemo(() => {
        if (query.length < 2) return [];
        const q = query.toLowerCase();
        const items: SearchResult[] = [];

        // Search repairs
        state.repairs.forEach(r => {
            if (r.ticketNo.toLowerCase().includes(q) || r.customer.fullName.toLowerCase().includes(q) ||
                r.customer.phone.includes(q) || r.device.brand.toLowerCase().includes(q) ||
                r.device.model.toLowerCase().includes(q) || r.issueDescription.toLowerCase().includes(q)) {
                items.push({
                    type: 'repair', title: `${r.ticketNo} — ${r.customer.fullName}`,
                    subtitle: `${r.device.brand} ${r.device.model} • ${statusLabels[r.status]}`,
                    page: 'repairs', icon: Wrench, color: '#3b82f6',
                });
            }
        });

        // Search stock
        state.stockItems.forEach(s => {
            if (s.name.toLowerCase().includes(q) || (s.barcode && s.barcode.includes(q)) ||
                s.compatibleModels.some(m => m.toLowerCase().includes(q))) {
                items.push({
                    type: 'stock', title: s.name,
                    subtitle: `Stok: ${s.quantity} • ${formatCurrency(s.sellPrice)}`,
                    page: 'stock', icon: Package, color: '#f59e0b',
                });
            }
        });

        // Search customers (from repairs)
        const seenPhones = new Set<string>();
        state.repairs.forEach(r => {
            if (seenPhones.has(r.customer.phone)) return;
            if (r.customer.fullName.toLowerCase().includes(q) || r.customer.phone.includes(q)) {
                seenPhones.add(r.customer.phone);
                items.push({
                    type: 'customer', title: r.customer.fullName,
                    subtitle: r.customer.phone,
                    page: 'customers', icon: User, color: '#10b981',
                });
            }
        });

        // Search companies
        state.companies.forEach(c => {
            if (c.name.toLowerCase().includes(q) || c.contactPerson.toLowerCase().includes(q)) {
                items.push({
                    type: 'company', title: c.name,
                    subtitle: c.contactPerson,
                    page: 'corporate', icon: Building2, color: '#6366f1',
                });
            }
        });

        // Search second-hand
        state.secondHandDevices.forEach(d => {
            if (d.brand.toLowerCase().includes(q) || d.model.toLowerCase().includes(q)) {
                items.push({
                    type: 'second-hand', title: `${d.brand} ${d.model}`,
                    subtitle: `${d.condition} • ${formatCurrency(d.sellPrice || d.buyPrice)}`,
                    page: 'second-hand', icon: Smartphone, color: '#ec4899',
                });
            }
        });

        // Search quotes
        state.quotes.forEach(qo => {
            if (qo.customerName.toLowerCase().includes(q)) {
                items.push({
                    type: 'quote', title: `Teklif — ${qo.customerName}`,
                    subtitle: `${formatCurrency(qo.total)} • ${qo.status}`,
                    page: 'quotes', icon: FileText, color: '#06b6d4',
                });
            }
        });

        return items.slice(0, 20);
    }, [query, state]);

    const handleSelect = (result: SearchResult) => {
        onNavigate(result.page);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative w-full max-w-lg mx-4 animate-fade-in" onClick={e => e.stopPropagation()}>
                {/* Search Input */}
                <div className="relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Tamir, müşteri, stok, cihaz ara..."
                        className="!pl-12 !pr-10 !py-4 !text-base rounded-t-xl border-b-0"
                        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
                    />
                    <button onClick={onClose} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10">
                        <X size={16} style={{ color: 'var(--text-muted)' }} />
                    </button>
                </div>

                {/* Results */}
                {query.length >= 2 && (
                    <div className="rounded-b-xl border border-t-0 max-h-[50vh] overflow-y-auto"
                        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                        {results.length === 0 ? (
                            <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
                                Sonuç bulunamadı.
                            </p>
                        ) : (
                            <div className="py-1">
                                {results.map((r, i) => {
                                    const Icon = r.icon;
                                    return (
                                        <button key={i} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left transition-colors"
                                            onClick={() => handleSelect(r)}>
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${r.color}20` }}>
                                                <Icon size={16} style={{ color: r.color }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{r.title}</p>
                                                <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{r.subtitle}</p>
                                            </div>
                                            <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: `${r.color}20`, color: r.color }}>
                                                {r.type === 'repair' ? 'Tamir' : r.type === 'stock' ? 'Stok' : r.type === 'customer' ? 'Müşteri' : r.type === 'company' ? 'Firma' : r.type === 'second-hand' ? '2.El' : 'Teklif'}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Shortcuts hint */}
                {query.length < 2 && (
                    <div className="rounded-b-xl border border-t-0 py-4 px-4"
                        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                        <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                            En az 2 karakter yazın • Esc ile kapatın
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
