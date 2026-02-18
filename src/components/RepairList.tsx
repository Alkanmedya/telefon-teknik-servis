'use client';

import { useState, useMemo } from 'react';
import { useAppState } from '@/lib/store';
import { statusLabels, statusColors, formatCurrency, formatDate, openWhatsApp } from '@/lib/utils';
import { Search, MessageCircle, Edit2, Trash2, Printer, Package, Shield, ShieldAlert, ShieldCheck, Plus, X, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import type { PageType } from '@/app/page';
import type { RepairStatus } from '@/lib/types';

interface RepairListProps {
    onNavigate: (page: PageType) => void;
}

export default function RepairList({ onNavigate }: RepairListProps) {
    const { state, updateRepair, deleteRepair, updateStockItem, addIncome } = useAppState();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<RepairStatus | 'all'>('all');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Edit states
    const [editNotes, setEditNotes] = useState('');
    const [editCost, setEditCost] = useState('');
    const [editStatus, setEditStatus] = useState<RepairStatus>('pending');
    const [editAssignedTo, setEditAssignedTo] = useState('');
    const [editIssueDescription, setEditIssueDescription] = useState('');
    const [editCustomerName, setEditCustomerName] = useState('');
    const [editCustomerPhone, setEditCustomerPhone] = useState('');
    const [editPaymentStatus, setEditPaymentStatus] = useState<'pending' | 'paid'>('pending');
    const [editPaymentMethod, setEditPaymentMethod] = useState<'cash' | 'credit_card' | 'bank_transfer'>('cash');
    const [addToCash, setAddToCash] = useState(true);

    // Part selection state
    const [showPartSelector, setShowPartSelector] = useState(false);
    const [selectedStockId, setSelectedStockId] = useState('');
    const [partQty, setPartQty] = useState('1');
    const [editUsedParts, setEditUsedParts] = useState<{ stockItemId: string; name: string; quantity: number; cost: number }[]>([]);

    // Print state
    const [printingId, setPrintingId] = useState<string | null>(null);

    // WhatsApp auto-prompt
    const [whatsappPrompt, setWhatsappPrompt] = useState<{ phone: string; name: string; ticketNo: string; status: RepairStatus } | null>(null);

    const filtered = useMemo(() => {
        return state.repairs.filter(r => {
            const matchSearch = search === '' ||
                r.customer.fullName.toLowerCase().includes(search.toLowerCase()) ||
                r.ticketNo.toLowerCase().includes(search.toLowerCase()) ||
                r.device.brand.toLowerCase().includes(search.toLowerCase()) ||
                r.device.model.toLowerCase().includes(search.toLowerCase()) ||
                (r.device.imei && r.device.imei.includes(search));
            const matchStatus = statusFilter === 'all' || r.status === statusFilter;
            return matchSearch && matchStatus;
        });
    }, [state.repairs, search, statusFilter]);

    // ==================== WARRANTY ====================
    const getWarrantyInfo = (repair: typeof state.repairs[0]) => {
        if (repair.status !== 'delivered' || repair.warrantyDays <= 0) return null;
        const delivered = new Date(repair.updatedAt);
        if (isNaN(delivered.getTime())) return null;
        const expiresAt = new Date(delivered.getTime() + repair.warrantyDays * 86400000);
        const now = new Date();
        const remainingDays = Math.ceil((expiresAt.getTime() - now.getTime()) / 86400000);
        return {
            expiresAt,
            remainingDays,
            isExpired: remainingDays <= 0,
            isExpiringSoon: remainingDays > 0 && remainingDays <= 14,
        };
    };

    // ==================== EDIT ====================
    const handleStartEdit = (id: string) => {
        const repair = state.repairs.find(r => r.id === id);
        if (repair) {
            setEditingId(id);
            setEditNotes(repair.technicianNotes || '');
            setEditCost(repair.finalCost.toString());
            setEditStatus(repair.status);
            setEditAssignedTo(repair.assignedTo || '');
            setEditIssueDescription(repair.issueDescription);
            setEditCustomerName(repair.customer.fullName);
            setEditCustomerPhone(repair.customer.phone);
            setEditUsedParts([...repair.usedParts]);
            setEditPaymentStatus(repair.paymentStatus || 'pending');
            setEditPaymentMethod(repair.paymentMethod || 'cash');
            setShowPartSelector(false);
        }
    };

    const handleSaveEdit = () => {
        if (!editingId) return;
        const repair = state.repairs.find(r => r.id === editingId);
        if (!repair) return;

        const statusChanged = repair.status !== editStatus;

        // Calculate stock changes: find newly added parts
        const oldPartIds = new Set(repair.usedParts.map(p => `${p.stockItemId}-${p.quantity}`));
        const newParts = editUsedParts.filter(p => !oldPartIds.has(`${p.stockItemId}-${p.quantity}`));

        // Deduct stock for newly added parts
        newParts.forEach(part => {
            const stockItem = state.stockItems.find(s => s.id === part.stockItemId);
            if (stockItem) {
                updateStockItem(stockItem.id, {
                    quantity: Math.max(0, stockItem.quantity - part.quantity),
                });
            }
        });

        // Calculate total parts cost
        const partsCost = editUsedParts.reduce((sum, p) => sum + p.cost * p.quantity, 0);

        updateRepair(editingId, {
            technicianNotes: editNotes,
            finalCost: parseFloat(editCost) || partsCost,
            status: editStatus,
            assignedTo: editAssignedTo || undefined,
            issueDescription: editIssueDescription,
            customer: { ...repair.customer, fullName: editCustomerName, phone: editCustomerPhone },
            usedParts: editUsedParts,
            paymentStatus: editPaymentStatus,
            paymentMethod: editPaymentMethod,
        });

        // Add to Cash Flow if paid and selected
        if (editStatus === 'delivered' && editPaymentStatus === 'paid' && addToCash && repair.paymentStatus !== 'paid') {
            const amount = parseFloat(editCost) || repair.estimatedCost;
            if (amount > 0) {
                addIncome({
                    id: crypto.randomUUID(),
                    category: 'service',
                    amount: amount,
                    description: `Tamir Ödemesi: ${repair.ticketNo} - ${repair.device.brand} ${repair.device.model} (${editCustomerName})`,
                    date: new Date().toISOString().slice(0, 10)
                });
            }
        }

        // Show WhatsApp prompt if status changed
        if (statusChanged) {
            setWhatsappPrompt({
                phone: editCustomerPhone || repair.customer.phone,
                name: editCustomerName || repair.customer.fullName,
                ticketNo: repair.ticketNo,
                status: editStatus,
            });
        }

        setEditingId(null);
    };

    // ==================== STOCK PARTS ====================
    const addPartFromStock = () => {
        if (!selectedStockId) return;
        const stockItem = state.stockItems.find(s => s.id === selectedStockId);
        if (!stockItem) return;
        const qty = parseInt(partQty) || 1;

        // Check available stock
        if (stockItem.quantity < qty) {
            alert(`Stokta yeterli miktar yok! Mevcut: ${stockItem.quantity}`);
            return;
        }

        setEditUsedParts(prev => [
            ...prev,
            { stockItemId: stockItem.id, name: stockItem.name, quantity: qty, cost: stockItem.sellPrice },
        ]);
        setSelectedStockId('');
        setPartQty('1');
        setShowPartSelector(false);
    };

    const removeUsedPart = (index: number) => {
        setEditUsedParts(prev => prev.filter((_, i) => i !== index));
    };

    // ==================== WHATSAPP ====================
    const handleWhatsApp = (phone: string, name: string, ticketNo: string, status: RepairStatus) => {
        const messages: Record<string, string> = {
            pending: `Sayın ${name}, ${ticketNo} numaralı cihazınız teslim alınmıştır. Sizi bilgilendireceğiz.`,
            diagnosing: `Sayın ${name}, ${ticketNo} numaralı cihazınız incelenmektedir.`,
            waiting_parts: `Sayın ${name}, ${ticketNo} numaralı cihazınız için parça beklenmektedir.`,
            repairing: `Sayın ${name}, ${ticketNo} numaralı cihazınızın tamiri devam etmektedir.`,
            ready: `Sayın ${name}, ${ticketNo} numaralı cihazınızın tamiri tamamlanmıştır. Mesai saatlerimiz içinde teslim alabilirsiniz. bakiye: ${state.repairs.find(r => r.ticketNo === ticketNo)?.finalCost} TL`,
            delivered: `Sayın ${name}, ${ticketNo} numaralı cihazınız teslim edilmiştir. İyi günlerde kullanın!`,
            cancelled: `Sayın ${name}, ${ticketNo} numaralı cihazınızla ilgili tamir işlemi iptal edilmiştir.`,
        };
        openWhatsApp(phone, messages[status] || messages.pending);
    };

    // ==================== PRINT RECEIPT ====================
    const handlePrint = (repairId: string) => {
        setPrintingId(repairId);
        setTimeout(() => {
            window.print();
            setPrintingId(null);
        }, 100);
    };

    const printRepair = printingId ? state.repairs.find(r => r.id === printingId) : null;

    return (
        <div>
            {/* Print-only receipt */}
            {printRepair && (
                <div className="hidden" data-print-only style={{ fontFamily: 'monospace', fontSize: '12px', color: '#000', background: '#fff', padding: '20px', maxWidth: '300px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', borderBottom: '2px dashed #000', paddingBottom: '10px', marginBottom: '10px' }}>
                        <h1 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0' }}>TEKNİK SERVİS</h1>
                        <p style={{ fontSize: '10px', margin: '4px 0' }}>Telefon Tamir & Onarım</p>
                        <p style={{ fontSize: '10px', margin: '0' }}>{new Date().toLocaleDateString('tr-TR')}</p>
                    </div>

                    <div style={{ borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
                        <p><strong>Fiş No:</strong> {printRepair.ticketNo}</p>
                        <p><strong>Tarih:</strong> {formatDate(printRepair.createdAt)}</p>
                        <p><strong>Durum:</strong> {statusLabels[printRepair.status]}</p>
                    </div>

                    <div style={{ borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
                        <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>MÜŞTERİ:</p>
                        <p>{printRepair.customer.fullName}</p>
                        <p>Tel: {printRepair.customer.phone}</p>
                    </div>

                    <div style={{ borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
                        <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>CİHAZ:</p>
                        <p>{printRepair.device.brand} {printRepair.device.model}</p>
                        {printRepair.device.imei && <p>IMEI: {printRepair.device.imei}</p>}
                        {printRepair.device.serialNumber && <p>Seri No: {printRepair.device.serialNumber}</p>}
                    </div>

                    <div style={{ borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
                        <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>ARIZA:</p>
                        <p>{printRepair.issueDescription}</p>
                    </div>

                    {printRepair.usedParts.length > 0 && (
                        <div style={{ borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
                            <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>KULLANILAN PARÇALAR:</p>
                            {printRepair.usedParts.map((p, i) => (
                                <p key={i}>{p.name} x{p.quantity} — {formatCurrency(p.cost * p.quantity)}</p>
                            ))}
                        </div>
                    )}

                    <div style={{ borderBottom: '2px dashed #000', paddingBottom: '10px', marginBottom: '10px' }}>
                        <p><strong>Tahmini Ücret:</strong> {formatCurrency(printRepair.estimatedCost)}</p>
                        {printRepair.finalCost > 0 && <p><strong>Nihai Ücret:</strong> {formatCurrency(printRepair.finalCost)}</p>}
                        <p><strong>Garanti:</strong> {printRepair.warrantyDays > 0 ? `${printRepair.warrantyDays} gün` : 'Garanti Yok'}</p>
                        <p><strong>Ödeme:</strong> {printRepair.paymentStatus === 'paid' ? 'ÖDENDİ' : 'BEKLİYOR'}</p>
                    </div>

                    {printRepair.signatureDataUrl && (
                        <div style={{ borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
                            <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>İMZA:</p>
                            <img src={printRepair.signatureDataUrl} alt="İmza" style={{ maxWidth: '200px', height: '60px', objectFit: 'contain' }} />
                        </div>
                    )}

                    <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '10px' }}>
                        <p>Cihazınızı sorgulama No: <strong>{printRepair.ticketNo}</strong></p>
                        <p style={{ marginTop: '8px' }}>Teşekkür ederiz! 🙏</p>
                    </div>
                </div>
            )}

            {/* Normal UI (hidden during print) */}
            <div data-screen-only>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold">Tamir Listesi</h2>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Toplam {state.repairs.length} kayıt</p>
                    </div>
                    <button onClick={() => onNavigate('new-repair')} className="btn-primary">
                        + Yeni Kayıt
                    </button>
                </div>

                {/* Filters */}
                <div className="flex gap-3 mb-4 flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="İsim, fiş no, marka, IMEI..."
                            className="!pl-9"
                        />
                    </div>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="w-auto min-w-[160px]">
                        <option value="all">Tüm Durumlar</option>
                        {Object.entries(statusLabels).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                </div>

                {/* Table */}
                <div className="card !p-0 overflow-x-auto">
                    {filtered.length === 0 ? (
                        <p className="text-sm text-center py-12" style={{ color: 'var(--text-muted)' }}>
                            {state.repairs.length === 0 ? 'Henüz tamir kaydı yok.' : 'Arama kriterlerine uygun kayıt bulunamadı.'}
                        </p>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Fiş No</th>
                                    <th>Müşteri</th>
                                    <th>Cihaz</th>
                                    <th>Arıza</th>
                                    <th>Durum</th>
                                    <th>Garanti</th>
                                    <th>Ücret</th>
                                    <th>Tarih</th>
                                    <th>İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(repair => {
                                    const warranty = getWarrantyInfo(repair);
                                    return (
                                        <tr key={repair.id}>
                                            <td className="font-mono text-xs" style={{ color: 'var(--accent)' }}>{repair.ticketNo}</td>
                                            <td>
                                                <div>
                                                    <div className="text-sm font-medium">{repair.customer.fullName}</div>
                                                    <div className={`text-xs ${state.privacyMode ? 'privacy-blur' : ''}`} style={{ color: 'var(--text-muted)' }}>
                                                        {repair.customer.phone}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-sm">{repair.device.brand} {repair.device.model}</td>
                                            <td className="text-xs max-w-[200px] truncate" style={{ color: 'var(--text-secondary)' }}>
                                                {repair.issueDescription}
                                            </td>
                                            <td>
                                                <span className={`status-badge ${statusColors[repair.status]}`}>
                                                    {statusLabels[repair.status]}
                                                </span>
                                            </td>
                                            <td>
                                                {warranty ? (
                                                    <div className="flex items-center gap-1">
                                                        {warranty.isExpired ? (
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-0.5">
                                                                <ShieldAlert size={10} /> Bitti
                                                            </span>
                                                        ) : warranty.isExpiringSoon ? (
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex items-center gap-0.5">
                                                                <Shield size={10} /> {warranty.remainingDays}g
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-0.5">
                                                                <ShieldCheck size={10} /> {warranty.remainingDays}g
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : repair.warrantyDays > 0 && repair.status !== 'delivered' ? (
                                                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{repair.warrantyDays}g</span>
                                                ) : (
                                                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>—</span>
                                                )}
                                            </td>
                                            <td className={`text-sm font-medium ${state.privacyMode ? 'privacy-blur' : ''}`}>
                                                {repair.finalCost > 0 ? formatCurrency(repair.finalCost) : formatCurrency(repair.estimatedCost)}
                                            </td>
                                            <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(repair.createdAt)}</td>
                                            <td>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => setExpandedId(expandedId === repair.id ? null : repair.id)}
                                                        className="p-1.5 rounded hover:bg-purple-500/20 text-purple-400"
                                                        title="Detay"
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStartEdit(repair.id)}
                                                        className="p-1.5 rounded hover:bg-blue-500/20 text-blue-400"
                                                        title="Düzenle"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handlePrint(repair.id)}
                                                        className="p-1.5 rounded hover:bg-cyan-500/20 text-cyan-400"
                                                        title="Fiş Yazdır"
                                                    >
                                                        <Printer size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleWhatsApp(repair.customer.phone, repair.customer.fullName, repair.ticketNo, repair.status)}
                                                        className="p-1.5 rounded hover:bg-green-500/20 text-green-400"
                                                        title="WhatsApp"
                                                    >
                                                        <MessageCircle size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => { if (confirm('Bu kaydı silmek istediğinize emin misiniz?')) deleteRepair(repair.id); }}
                                                        className="p-1.5 rounded hover:bg-red-500/20 text-red-400"
                                                        title="Sil"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Detail expand panel */}
                {expandedId && (() => {
                    const repair = state.repairs.find(r => r.id === expandedId);
                    if (!repair) return null;
                    const warranty = getWarrantyInfo(repair);
                    return (
                        <div className="card mt-4 animate-fade-in">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>📋 Detay — {repair.ticketNo}</h3>
                                <button onClick={() => setExpandedId(null)} className="p-1 rounded hover:bg-white/10"><X size={14} /></button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div className="space-y-2">
                                    <p style={{ color: 'var(--text-muted)' }}>Müşteri: <strong style={{ color: 'var(--text-primary)' }}>{repair.customer.fullName}</strong></p>
                                    <p style={{ color: 'var(--text-muted)' }}>Tel: <strong style={{ color: 'var(--text-primary)' }}>{repair.customer.phone}</strong></p>
                                    <p style={{ color: 'var(--text-muted)' }}>Cihaz: <strong style={{ color: 'var(--text-primary)' }}>{repair.device.brand} {repair.device.model}</strong></p>
                                    {repair.device.imei && <p style={{ color: 'var(--text-muted)' }}>IMEI: <span className="font-mono text-xs">{repair.device.imei}</span></p>}
                                    {repair.device.passwordType !== 'none' && (
                                        <p style={{ color: 'var(--text-muted)' }}>Şifre: <span className={state.privacyMode ? 'privacy-blur' : ''}>{repair.device.passwordType === 'pattern' ? 'Desen' : repair.device.passwordValue}</span></p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <p style={{ color: 'var(--text-muted)' }}>Arıza: <strong style={{ color: 'var(--text-primary)' }}>{repair.issueDescription}</strong></p>
                                    {repair.technicianNotes && <p style={{ color: 'var(--text-muted)' }}>Teknisyen: <span>{repair.technicianNotes}</span></p>}
                                    {repair.assignedTo && <p style={{ color: 'var(--text-muted)' }}>Atanan: <span>{repair.assignedTo}</span></p>}
                                </div>
                                <div className="space-y-2">
                                    <p style={{ color: 'var(--text-muted)' }}>Tahmini: <strong className={state.privacyMode ? 'privacy-blur' : ''}>{formatCurrency(repair.estimatedCost)}</strong></p>
                                    <p style={{ color: 'var(--text-muted)' }}>Nihai: <strong className={`${state.privacyMode ? 'privacy-blur' : ''}`} style={{ color: 'var(--accent)' }}>{formatCurrency(repair.finalCost)}</strong></p>
                                    {warranty && (
                                        <p style={{ color: 'var(--text-muted)' }}>Garanti: <strong className={warranty.isExpired ? 'text-red-400' : warranty.isExpiringSoon ? 'text-yellow-400' : 'text-emerald-400'}>
                                            {warranty.isExpired ? 'Süresi doldu' : `${warranty.remainingDays} gün kaldı`}
                                        </strong></p>
                                    )}
                                    <p style={{ color: 'var(--text-muted)' }}>Ödeme: <strong className={repair.paymentStatus === 'paid' ? 'text-emerald-400' : 'text-yellow-400'}>{repair.paymentStatus === 'paid' ? 'Ödendi' : 'Bekliyor'}</strong></p>
                                    {repair.usedParts.length > 0 && (
                                        <div>
                                            <p className="font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Parçalar:</p>
                                            {repair.usedParts.map((p, i) => (
                                                <p key={i} className="text-xs ml-2">{p.name} x{p.quantity} — {formatCurrency(p.cost * p.quantity)}</p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Photos */}
                            {repair.photos.length > 0 && (
                                <div className="mt-4">
                                    <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>📷 Fotoğraflar:</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {repair.photos.map(p => (
                                            <div key={p.id} className="relative rounded overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
                                                <img src={p.dataUrl} alt="Cihaz" className="w-24 h-16 object-cover" />
                                                <span className={`absolute top-0.5 left-0.5 text-[7px] px-1 rounded ${p.type === 'before' ? 'bg-yellow-500/80 text-yellow-950' : 'bg-emerald-500/80 text-emerald-950'}`}>
                                                    {p.type === 'before' ? 'ÖNCE' : 'SONRA'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })()}

                {/* Edit Modal (Full) */}
                {editingId && (() => {
                    const repair = state.repairs.find(r => r.id === editingId);
                    if (!repair) return null;
                    return (
                        <div className="modal-backdrop" onClick={() => setEditingId(null)}>
                            <div className="modal-content !max-w-2xl" onClick={e => e.stopPropagation()}>
                                <h3 className="text-lg font-semibold mb-4">✏️ Tamir Düzenle — {repair.ticketNo}</h3>
                                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                                    {/* Customer */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Müşteri Adı</label>
                                            <input value={editCustomerName} onChange={e => setEditCustomerName(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Telefon</label>
                                            <input value={editCustomerPhone} onChange={e => setEditCustomerPhone(e.target.value)} />
                                        </div>
                                    </div>

                                    {/* Status & Assigned */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Durum</label>
                                            <select value={editStatus} onChange={e => setEditStatus(e.target.value as RepairStatus)}>
                                                {Object.entries(statusLabels).map(([key, label]) => (
                                                    <option key={key} value={key}>{label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Atanan Teknisyen</label>
                                            <select value={editAssignedTo} onChange={e => setEditAssignedTo(e.target.value)}>
                                                <option value="">Atanmadı</option>
                                                {state.staff.filter(s => s.isActive).map(s => (
                                                    <option key={s.id} value={s.name}>{s.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {editStatus === 'delivered' && (
                                        <div className="card bg-emerald-500/5 border-emerald-500/20 p-3">
                                            <h4 className="text-xs font-semibold mb-2 text-emerald-400">💰 Ödeme Bilgileri (Teslimat)</h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Ödeme Durumu</label>
                                                    <select value={editPaymentStatus} onChange={e => setEditPaymentStatus(e.target.value as any)}>
                                                        <option value="pending">Bekliyor (Borçlu)</option>
                                                        <option value="paid">Ödendi (Tahsil Edildi)</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Ödeme Yöntemi</label>
                                                    <select value={editPaymentMethod} onChange={e => setEditPaymentMethod(e.target.value as any)}>
                                                        <option value="cash">Nakit</option>
                                                        <option value="credit_card">Kredi Kartı</option>
                                                        <option value="bank_transfer">Havale / EFT</option>
                                                    </select>
                                                </div>
                                            </div>
                                            {editPaymentStatus === 'paid' && (
                                                <div className="mt-2 flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        id="addToCashRepair"
                                                        checked={addToCash}
                                                        onChange={e => setAddToCash(e.target.checked)}
                                                        className="w-3 h-3 rounded border-[var(--border)]"
                                                    />
                                                    <label htmlFor="addToCashRepair" className="text-xs cursor-pointer select-none" style={{ color: 'var(--text-muted)' }}>
                                                        Bu tutarı kasaya (Gelir) olarak işle
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Issue */}
                                    <div>
                                        <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Arıza Açıklaması</label>
                                        <textarea value={editIssueDescription} onChange={e => setEditIssueDescription(e.target.value)} rows={2} />
                                    </div>

                                    {/* Technician Notes */}
                                    <div>
                                        <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Teknisyen Notu</label>
                                        <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={3} placeholder="Yapılan işlemler, değişen parçalar..." />
                                    </div>

                                    {/* Used Parts from Stock */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                                                <Package size={12} className="inline mr-1" />Kullanılan Parçalar
                                            </label>
                                            <button type="button" onClick={() => setShowPartSelector(!showPartSelector)}
                                                className="text-[10px] px-2 py-1 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 flex items-center gap-1">
                                                <Plus size={10} /> Stoktan Ekle
                                            </button>
                                        </div>

                                        {showPartSelector && (
                                            <div className="p-3 rounded-lg mb-2" style={{ background: 'var(--bg-secondary)' }}>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <select value={selectedStockId} onChange={e => setSelectedStockId(e.target.value)} className="col-span-2 text-sm">
                                                        <option value="">Parça seçin...</option>
                                                        {state.stockItems.filter(s => s.quantity > 0).map(s => (
                                                            <option key={s.id} value={s.id}>
                                                                {s.name} (Stok: {s.quantity}) — {formatCurrency(s.sellPrice)}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <div className="flex gap-1">
                                                        <input type="number" min="1" value={partQty} onChange={e => setPartQty(e.target.value)} className="w-16 text-sm" placeholder="Adet" />
                                                        <button type="button" onClick={addPartFromStock} className="btn-primary text-xs py-1 px-2">Ekle</button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {editUsedParts.length > 0 ? (
                                            <div className="space-y-1">
                                                {editUsedParts.map((part, i) => (
                                                    <div key={i} className="flex items-center justify-between text-xs py-1.5 px-2 rounded" style={{ background: 'var(--bg-secondary)' }}>
                                                        <span>{part.name} x{part.quantity}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium" style={{ color: 'var(--accent)' }}>{formatCurrency(part.cost * part.quantity)}</span>
                                                            <button type="button" onClick={() => removeUsedPart(i)} className="text-red-400 hover:text-red-300"><X size={12} /></button>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="text-right text-xs font-medium mt-1" style={{ color: 'var(--accent)' }}>
                                                    Toplam Parça: {formatCurrency(editUsedParts.reduce((s, p) => s + p.cost * p.quantity, 0))}
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Henüz parça eklenmedi.</p>
                                        )}
                                    </div>

                                    {/* Cost */}
                                    <div>
                                        <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Nihai Ücret (₺)</label>
                                        <input type="number" value={editCost} onChange={e => setEditCost(e.target.value)} />
                                    </div>

                                    <div className="flex gap-2 mt-4">
                                        <button onClick={handleSaveEdit} className="btn-primary flex-1 justify-center">Kaydet</button>
                                        <button onClick={() => setEditingId(null)} className="btn-secondary flex-1 justify-center">İptal</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* WhatsApp Auto-Prompt after status change */}
            {whatsappPrompt && (
                <div className="modal-backdrop" onClick={() => setWhatsappPrompt(null)}>
                    <div className="modal-content !max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="text-center">
                            <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                                <MessageCircle size={28} className="text-green-400" />
                            </div>
                            <h3 className="text-lg font-bold mb-1">Durum Güncellendi!</h3>
                            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                                <strong>{whatsappPrompt.name}</strong> müşterisine durum değişikliğini bildirmek ister misiniz?
                            </p>
                            <p className="text-xs mb-4 px-4 py-2 rounded-lg" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                                Yeni Durum: <strong>{statusLabels[whatsappPrompt.status]}</strong>
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        handleWhatsApp(whatsappPrompt.phone, whatsappPrompt.name, whatsappPrompt.ticketNo, whatsappPrompt.status);
                                        setWhatsappPrompt(null);
                                    }}
                                    className="flex-1 py-2.5 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 font-semibold flex items-center justify-center gap-2 transition-colors"
                                >
                                    <MessageCircle size={16} /> WhatsApp ile Bildir
                                </button>
                                <button
                                    onClick={() => setWhatsappPrompt(null)}
                                    className="flex-1 py-2.5 rounded-lg font-medium transition-colors"
                                    style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
                                >
                                    Geç
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
