'use client';

import { useState } from 'react';
import { useAppState } from '@/lib/store';
import { statusLabels, statusColors, formatDate } from '@/lib/utils';
import { Search, Smartphone } from 'lucide-react';

export default function CustomerPortal() {
    const { state } = useAppState();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<typeof state.repairs>([]);
    const [searched, setSearched] = useState(false);

    const handleSearch = () => {
        if (!query.trim()) return;
        const found = state.repairs.filter(r =>
            r.ticketNo.toLowerCase().includes(query.toLowerCase()) ||
            r.customer.phone.includes(query) ||
            (r.device.imei && r.device.imei.includes(query))
        );
        setResults(found);
        setSearched(true);
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-2">Müşteri Portalı (Cihaz Sorgulama)</h2>
            <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>
                Müşterilerinize bu sayfayı göstererek veya paylaşarak cihaz durumunu sorgulatabilirsiniz.
            </p>

            <div className="max-w-lg mx-auto">
                <div className="card">
                    <div className="flex items-center gap-2 mb-4">
                        <Smartphone size={20} style={{ color: 'var(--accent)' }} />
                        <h3 className="text-lg font-semibold">Cihaz Durumu Sorgula</h3>
                    </div>

                    <div className="flex gap-2 mb-4">
                        <input
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            placeholder="Fiş No, Telefon veya IMEI..."
                        />
                        <button onClick={handleSearch} className="btn-primary"><Search size={16} /> Sorgula</button>
                    </div>

                    {searched && results.length === 0 && (
                        <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>Kayıt bulunamadı.</p>
                    )}

                    {results.map(r => (
                        <div key={r.id} className="p-4 rounded-lg border border-[var(--border)] mb-3 animate-fade-in">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-mono text-sm" style={{ color: 'var(--accent)' }}>{r.ticketNo}</span>
                                <span className={`status-badge ${statusColors[r.status]}`}>
                                    {statusLabels[r.status]}
                                </span>
                            </div>
                            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                {r.device.brand} {r.device.model}
                            </div>
                            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                Arıza: {r.issueDescription}
                            </div>
                            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                Kayıt Tarihi: {formatDate(r.createdAt)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
