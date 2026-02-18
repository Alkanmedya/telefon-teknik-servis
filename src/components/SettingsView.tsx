'use client';

import { useState, useRef } from 'react';
import { useAppState } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import { Download, Upload, Trash2, RotateCcw, UserPlus, MessageSquare, Shield, FileJson, FileSpreadsheet, AlertTriangle } from 'lucide-react';

export default function SettingsView() {
    const { state, updateState, addStaff, updateQuickMessage, restoreItem, permanentDelete } = useAppState();
    const [tab, setTab] = useState<'general' | 'staff' | 'messages' | 'recycle' | 'backup'>('general');
    const [staffName, setStaffName] = useState('');
    const [staffRole, setStaffRole] = useState<'admin' | 'technician' | 'receptionist'>('technician');
    const [importStatus, setImportStatus] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAddStaff = () => {
        if (!staffName.trim()) return;
        addStaff({ id: crypto.randomUUID(), name: staffName, role: staffRole, pin: '0000', isActive: true });
        setStaffName('');
    };

    // ==================== CSV EXPORT (NO DEPENDENCY) ====================
    const escCsv = (val: string | number | boolean | undefined) => {
        const s = String(val ?? '');
        if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
        return s;
    };

    const downloadCsv = (filename: string, headers: string[], rows: (string | number | boolean | undefined)[][]) => {
        const bom = '\uFEFF'; // UTF-8 BOM for Turkish chars in Excel
        const csv = bom + [headers.join(','), ...rows.map(r => r.map(escCsv).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename; a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportExcel = () => {
        const date = new Date().toISOString().slice(0, 10);

        // Repairs CSV
        if (state.repairs.length > 0) {
            downloadCsv(`tamirler-${date}.csv`,
                ['Fiş No', 'Müşteri', 'Telefon', 'Marka', 'Model', 'IMEI', 'Arıza', 'Durum', 'Tahmini', 'Nihai', 'Garanti Gün', 'Teknisyen', 'Notlar', 'Tarih'],
                state.repairs.map(r => [
                    r.ticketNo, r.customer.fullName, r.customer.phone,
                    r.device.brand, r.device.model, r.device.imei || '',
                    r.issueDescription, r.status,
                    r.estimatedCost, r.finalCost, r.warrantyDays,
                    r.assignedTo || '', r.technicianNotes,
                    new Date(r.createdAt).toLocaleDateString('tr-TR'),
                ])
            );
        }

        // Stock CSV
        if (state.stockItems.length > 0) {
            downloadCsv(`stok-${date}.csv`,
                ['Parça', 'Kategori', 'Marka', 'Adet', 'Kritik', 'Alış', 'Döviz', 'Satış', 'Barkod'],
                state.stockItems.map(s => [
                    s.name, s.category, s.brand || '', s.quantity, s.criticalLevel,
                    s.buyPrice, s.buyCurrency, s.sellPrice, s.barcode || '',
                ])
            );
        }

        // Expenses CSV
        if (state.expenses.length > 0) {
            downloadCsv(`giderler-${date}.csv`,
                ['Tarih', 'Kategori', 'Açıklama', 'Tutar', 'Ödeyen'],
                state.expenses.map(e => [
                    e.date, e.category, e.description, e.amount, e.paidBy || '',
                ])
            );
        }
    };

    // ==================== JSON BACKUP / RESTORE ====================
    const handleJsonExport = () => {
        const data = JSON.stringify(state, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `teknik-servis-yedek-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target?.result as string);
                // Basic validation
                if (!data.repairs && !data.stockItems && !data.expenses) {
                    setImportStatus('❌ Geçersiz yedek dosyası! repairs, stockItems veya expenses bulunamadı.');
                    return;
                }
                if (!confirm(`Bu işlem mevcut tüm verilerin üzerine yazacak!\n\n📊 Yedek içeriği:\n- ${data.repairs?.length || 0} tamir\n- ${data.stockItems?.length || 0} stok\n- ${data.expenses?.length || 0} gider\n- ${data.companies?.length || 0} firma\n- ${data.appointments?.length || 0} randevu\n\nDevam etmek istiyor musunuz?`)) return;

                updateState(() => data);
                setImportStatus('✅ Veriler başarıyla geri yüklendi!');
                setTimeout(() => setImportStatus(null), 3000);
            } catch {
                setImportStatus('❌ Dosya okunamadı! Geçerli bir JSON dosyası değil.');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    // Stats
    const totalRecords = state.repairs.length + state.stockItems.length + state.expenses.length + state.companies.length + state.appointments.length + state.secondHandDevices.length;
    const estimatedSize = new Blob([JSON.stringify(state)]).size;
    const sizeStr = estimatedSize > 1024 * 1024
        ? `${(estimatedSize / 1024 / 1024).toFixed(1)} MB`
        : `${(estimatedSize / 1024).toFixed(1)} KB`;

    return (
        <div>
            <h2 className="text-xl font-bold mb-6">Ayarlar</h2>

            <div className="flex gap-1 mb-4 border-b border-[var(--border)] flex-wrap">
                <button onClick={() => setTab('general')} className={`tab ${tab === 'general' ? 'active' : ''}`}>Genel</button>
                <button onClick={() => setTab('staff')} className={`tab ${tab === 'staff' ? 'active' : ''}`}>Personel ({state.staff.length})</button>
                <button onClick={() => setTab('messages')} className={`tab ${tab === 'messages' ? 'active' : ''}`}>Hızlı Mesajlar</button>
                <button onClick={() => setTab('recycle')} className={`tab ${tab === 'recycle' ? 'active' : ''}`}>Çöp Kutusu ({state.deletedItems.length})</button>
                <button onClick={() => setTab('backup')} className={`tab ${tab === 'backup' ? 'active' : ''}`}>Yedekleme</button>
            </div>

            {tab === 'general' && (
                <div className="space-y-4">
                    <div className="card">
                        <h3 className="text-sm font-semibold mb-3"><Shield size={16} className="inline mr-1" /> Gizlilik ve Güvenlik</h3>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm">Tezgah Modu (Privacy Mode)</p>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Aktif olduğında fiyat ve telefon bilgileri bulanık gösterilir</p>
                            </div>
                            <span className={`status-badge ${state.privacyMode ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}`}>
                                {state.privacyMode ? 'Aktif' : 'Kapalı'}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {tab === 'staff' && (
                <div className="space-y-4">
                    <div className="card">
                        <h3 className="text-sm font-semibold mb-3">Personel Ekle</h3>
                        <div className="flex gap-2">
                            <input value={staffName} onChange={e => setStaffName(e.target.value)} placeholder="Personel Adı" className="flex-1" />
                            <select value={staffRole} onChange={e => setStaffRole(e.target.value as any)} className="w-auto">
                                <option value="technician">Teknisyen</option>
                                <option value="receptionist">Resepsiyon</option>
                                <option value="admin">Yönetici</option>
                            </select>
                            <button onClick={handleAddStaff} className="btn-primary"><UserPlus size={16} /></button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {state.staff.map(s => (
                            <div key={s.id} className="card flex items-center justify-between">
                                <div>
                                    <p className="font-medium">{s.name}</p>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.role === 'admin' ? 'Yönetici' : s.role === 'technician' ? 'Teknisyen' : 'Resepsiyon'}</p>
                                </div>
                                <span className={`status-badge ${s.isActive ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                                    {s.isActive ? 'Aktif' : 'Pasif'}
                                </span>
                            </div>
                        ))}
                    </div>
                    {/* Staff Performance */}
                    <div className="card">
                        <h3 className="text-sm font-semibold mb-3">📊 Personel Performansı (Bu Ay)</h3>
                        {state.staff.filter(s => s.role === 'technician' && s.isActive).length === 0 ? (
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Henüz aktif teknisyen yok.</p>
                        ) : (
                            <div className="space-y-2">
                                {state.staff.filter(s => s.isActive).map(s => {
                                    const thisMonth = new Date().toISOString().slice(0, 7);
                                    const monthRepairs = state.repairs.filter(r => r.assignedTo === s.name && r.updatedAt.slice(0, 7) === thisMonth);
                                    const completed = monthRepairs.filter(r => r.status === 'delivered');
                                    return (
                                        <div key={s.id} className="flex items-center gap-3">
                                            <span className="text-sm w-28 truncate">{s.name}</span>
                                            <div className="flex-1 h-3 rounded-full" style={{ background: 'var(--bg-secondary)' }}>
                                                <div className="h-full rounded-full" style={{ width: `${Math.min(100, completed.length * 10)}%`, background: 'var(--accent)' }} />
                                            </div>
                                            <span className="text-xs font-medium w-16 text-right">{completed.length} tamir</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {tab === 'messages' && (
                <div className="space-y-3">
                    {state.quickMessages.map(m => (
                        <div key={m.id} className="card">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-semibold"><MessageSquare size={14} className="inline mr-1" />{m.label}</h4>
                            </div>
                            <textarea
                                value={m.text}
                                onChange={e => updateQuickMessage(m.id, { text: e.target.value })}
                                rows={2}
                                className="text-xs"
                            />
                        </div>
                    ))}
                </div>
            )}

            {tab === 'recycle' && (
                <div className="card !p-0 overflow-x-auto">
                    {state.deletedItems.length === 0 ? (
                        <p className="text-sm text-center py-12" style={{ color: 'var(--text-muted)' }}>Çöp kutusu boş.</p>
                    ) : (
                        <table>
                            <thead><tr><th>Tür</th><th>Açıklama</th><th>Silinen Tarih</th><th>İşlem</th></tr></thead>
                            <tbody>
                                {state.deletedItems.map(d => {
                                    const typeLabels: Record<string, string> = {
                                        repair: 'Tamir', customer: 'Müşteri', stock: 'Stok', expense: 'Gider',
                                        quote: 'Teklif', supplier: 'Tedarikçi', company: 'Firma', secondhand: '2. El', loaner: 'Emanet',
                                    };
                                    return (
                                        <tr key={d.id}>
                                            <td className="text-xs">{typeLabels[d.type] || d.type}</td>
                                            <td>{d.description}</td>
                                            <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(d.deletedAt).toLocaleString('tr-TR')}</td>
                                            <td>
                                                <div className="flex gap-1">
                                                    <button onClick={() => restoreItem(d.id)} className="p-1.5 rounded hover:bg-emerald-500/20 text-emerald-400" title="Geri Yükle"><RotateCcw size={14} /></button>
                                                    <button onClick={() => { if (confirm('Kalıcı olarak silinecek!')) permanentDelete(d.id); }} className="p-1.5 rounded hover:bg-red-500/20 text-red-400" title="Kalıcı Sil"><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {tab === 'backup' && (
                <div className="space-y-4">
                    {/* Data overview */}
                    <div className="card">
                        <h3 className="text-sm font-semibold mb-3">📊 Veri Özeti</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="rounded-lg p-3 text-center" style={{ background: 'var(--bg-secondary)' }}>
                                <p className="text-lg font-bold" style={{ color: 'var(--accent)' }}>{state.repairs.length}</p>
                                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Tamir Kaydı</p>
                            </div>
                            <div className="rounded-lg p-3 text-center" style={{ background: 'var(--bg-secondary)' }}>
                                <p className="text-lg font-bold" style={{ color: 'var(--accent)' }}>{state.stockItems.length}</p>
                                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Stok Ürünü</p>
                            </div>
                            <div className="rounded-lg p-3 text-center" style={{ background: 'var(--bg-secondary)' }}>
                                <p className="text-lg font-bold" style={{ color: 'var(--accent)' }}>{state.expenses.length}</p>
                                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Gider</p>
                            </div>
                            <div className="rounded-lg p-3 text-center" style={{ background: 'var(--bg-secondary)' }}>
                                <p className="text-lg font-bold" style={{ color: 'var(--accent)' }}>{sizeStr}</p>
                                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Toplam Boyut</p>
                            </div>
                        </div>
                    </div>

                    {/* JSON Backup */}
                    <div className="card">
                        <h3 className="text-sm font-semibold mb-3"><FileJson size={16} className="inline mr-1" /> JSON Tam Yedekleme</h3>
                        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                            Tüm verilerinizi (tamirler, stok, giderler, ayarlar, fotoğraflar, imzalar dahil) tek bir JSON dosyasına yedekleyin.
                            Geri yükleme ile aynı verileri tamamen kurtarabilirsiniz.
                        </p>
                        <div className="flex gap-3 flex-wrap">
                            <button onClick={handleJsonExport} className="btn-primary">
                                <Download size={16} /> JSON Yedek İndir
                            </button>
                            <button onClick={() => fileInputRef.current?.click()} className="btn-secondary">
                                <Upload size={16} /> JSON Geri Yükle
                            </button>
                            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleJsonImport} />
                        </div>
                        {importStatus && (
                            <div className={`mt-3 text-sm p-2 rounded ${importStatus.startsWith('✅') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                {importStatus}
                            </div>
                        )}
                        <div className="mt-3 p-3 rounded-lg flex items-start gap-2" style={{ background: 'rgba(255,165,0,0.1)', border: '1px solid rgba(255,165,0,0.3)' }}>
                            <AlertTriangle size={14} className="mt-0.5 text-orange-400 flex-shrink-0" />
                            <p className="text-[11px] text-orange-300">
                                Geri yükleme mevcut tüm verilerin üzerine yazar. İşlem öncesi mevcut verilerinizi yedeklemeniz önerilir.
                            </p>
                        </div>
                    </div>

                    {/* CSV Export */}
                    <div className="card">
                        <h3 className="text-sm font-semibold mb-3"><FileSpreadsheet size={16} className="inline mr-1" /> CSV Dışa Aktarım (Excel Uyumlu)</h3>
                        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                            Tamir, stok ve gider verilerinizi Excel&apos;de açılabilir CSV dosyaları olarak indirin.
                            Her kategori ayrı bir dosya olarak indirilecektir.
                        </p>
                        <button onClick={handleExportExcel} className="btn-secondary">
                            <FileSpreadsheet size={16} /> CSV Dosyaları İndir
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
