'use client';

import { useState, useMemo, useRef } from 'react';
import { useAppState } from '@/lib/store';
import { brands, getModelsForBrand, getCommonIssues } from '@/lib/templates';
import { generateTicketNo } from '@/lib/utils';
import { Save, ArrowLeft, Camera, X, ImagePlus, Search, UserCheck } from 'lucide-react';
import type { PageType } from '@/app/page';
import type { RepairRecord, DiagnosticMark, RepairPhoto } from '@/lib/types';
import Phone3DDiagnostics from './Phone3DDiagnostics';
import PatternLock from './PatternLock';
import SignaturePad from './SignaturePad';

interface RepairFormProps {
    onNavigate: (page: PageType) => void;
}

export default function RepairForm({ onNavigate }: RepairFormProps) {
    const { addRepair, state } = useAppState();

    // Customer
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);

    // Device
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    const [imei, setImei] = useState('');
    const [serialNo, setSerialNo] = useState('');
    const [passwordType, setPasswordType] = useState<'none' | 'pin' | 'pattern' | 'password'>('none');
    const [passwordValue, setPasswordValue] = useState('');

    // Issue
    const [issueDescription, setIssueDescription] = useState('');
    const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
    const [estimatedCost, setEstimatedCost] = useState('');
    const [warrantyDays, setWarrantyDays] = useState('180');
    const [assignedTo, setAssignedTo] = useState('');
    const [companyId, setCompanyId] = useState('');

    // Diagnostics & Photos
    const [diagnosticMarks, setDiagnosticMarks] = useState<DiagnosticMark[]>([]);
    const [photos, setPhotos] = useState<RepairPhoto[]>([]);
    const [signatureDataUrl, setSignatureDataUrl] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const models = brand ? getModelsForBrand(brand) : [];
    const commonIssues = brand && model ? getCommonIssues(brand, model) : [];

    // ==================== CUSTOMER AUTOCOMPLETE ====================
    const customerSuggestions = useMemo(() => {
        if (!customerPhone || customerPhone.length < 3) return [];
        const phone = customerPhone.replace(/\s/g, '');
        // Search in existing repairs for matching phone numbers
        const seen = new Map<string, { name: string; phone: string }>();
        state.repairs.forEach(r => {
            const rPhone = r.customer.phone.replace(/\s/g, '');
            if (rPhone.includes(phone) && !seen.has(rPhone)) {
                seen.set(rPhone, { name: r.customer.fullName, phone: r.customer.phone });
            }
        });
        return Array.from(seen.values()).slice(0, 5);
    }, [customerPhone, state.repairs]);

    const selectCustomer = (name: string, phone: string) => {
        setCustomerName(name);
        setCustomerPhone(phone);
        setShowCustomerSuggestions(false);
    };

    // ==================== PHOTO HANDLING ====================
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
        const files = e.target.files;
        if (!files) return;

        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const dataUrl = ev.target?.result as string;
                // Compress if too large (> 500KB)
                if (dataUrl.length > 500000) {
                    compressImage(dataUrl, (compressed) => {
                        addPhoto(compressed, type);
                    });
                } else {
                    addPhoto(dataUrl, type);
                }
            };
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    };

    const compressImage = (dataUrl: string, callback: (result: string) => void) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxDim = 800;
            let w = img.width, h = img.height;
            if (w > maxDim || h > maxDim) {
                if (w > h) { h = (h / w) * maxDim; w = maxDim; }
                else { w = (w / h) * maxDim; h = maxDim; }
            }
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, w, h);
            callback(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = dataUrl;
    };

    const addPhoto = (dataUrl: string, type: 'before' | 'after') => {
        setPhotos(prev => [...prev, {
            id: crypto.randomUUID(),
            dataUrl,
            type,
            takenAt: new Date().toISOString(),
        }]);
    };

    const removePhoto = (id: string) => {
        setPhotos(prev => prev.filter(p => p.id !== id));
    };

    // ==================== ISSUES ====================
    const toggleIssue = (issue: string) => {
        setSelectedIssues(prev => prev.includes(issue) ? prev.filter(i => i !== issue) : [...prev, issue]);
    };

    const handleAddMark = (mark: DiagnosticMark) => {
        setDiagnosticMarks(prev => [...prev, mark]);
    };

    const handleRemoveMark = (id: string) => {
        setDiagnosticMarks(prev => prev.filter(m => m.id !== id));
    };

    // ==================== SUBMIT ====================
    const handleSubmit = () => {
        if (!customerName.trim() || !customerPhone.trim() || !brand || !model) {
            alert('Lütfen zorunlu alanları doldurun (İsim, Telefon, Marka, Model)');
            return;
        }

        const fullDescription = [
            ...selectedIssues,
            issueDescription,
        ].filter(Boolean).join(', ');

        const repair: RepairRecord = {
            id: crypto.randomUUID(),
            ticketNo: generateTicketNo(),
            customer: {
                id: crypto.randomUUID(),
                fullName: customerName,
                phone: customerPhone,
                createdAt: new Date().toISOString(),
            },
            device: {
                brand,
                model,
                serialNumber: serialNo,
                imei,
                passwordType,
                passwordValue,
            },
            issueDescription: fullDescription,
            status: 'pending',
            assignedTo: assignedTo || undefined,
            technicianNotes: '',
            diagnosticMarks,
            photos,
            usedParts: [],
            estimatedCost: parseFloat(estimatedCost) || 0,
            finalCost: 0,
            warrantyDays: parseInt(warrantyDays) || 180,
            signatureDataUrl: signatureDataUrl || undefined,
            companyId: companyId || undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        addRepair(repair);
        onNavigate('repairs');
    };

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => onNavigate('repairs')} className="btn-secondary py-2 px-3">
                    <ArrowLeft size={16} />
                </button>
                <div>
                    <h2 className="text-xl font-bold">Yeni Tamir Kaydı</h2>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Cihaz bilgilerini girin</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Customer & Device */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Customer with Autocomplete */}
                    <div className="card">
                        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--accent)' }}>👤 Müşteri Bilgileri</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Ad Soyad *</label>
                                <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Müşteri adı" />
                            </div>
                            <div className="relative">
                                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>
                                    Telefon * <Search size={10} className="inline ml-1 opacity-50" />
                                </label>
                                <input
                                    value={customerPhone}
                                    onChange={e => { setCustomerPhone(e.target.value); setShowCustomerSuggestions(true); }}
                                    onFocus={() => setShowCustomerSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowCustomerSuggestions(false), 200)}
                                    placeholder="05XX XXX XX XX"
                                />
                                {/* Autocomplete dropdown */}
                                {showCustomerSuggestions && customerSuggestions.length > 0 && (
                                    <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-lg border overflow-hidden shadow-xl"
                                        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                                        <div className="px-2 py-1.5 text-[10px] font-medium" style={{ color: 'var(--text-muted)', background: 'var(--bg-secondary)' }}>
                                            <UserCheck size={10} className="inline mr-1" />Kayıtlı Müşteriler
                                        </div>
                                        {customerSuggestions.map((s, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors flex justify-between items-center"
                                                onMouseDown={(e) => { e.preventDefault(); selectCustomer(s.name, s.phone); }}
                                            >
                                                <span className="text-sm font-medium">{s.name}</span>
                                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.phone}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        {state.companies.length > 0 && (
                            <div className="mt-3">
                                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Kurumsal Hesap (Opsiyonel)</label>
                                <select value={companyId} onChange={e => setCompanyId(e.target.value)}>
                                    <option value="">Bireysel Müşteri</option>
                                    {state.companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Device */}
                    <div className="card">
                        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--accent)' }}>📱 Cihaz Bilgileri</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Marka *</label>
                                <select value={brand} onChange={e => { setBrand(e.target.value); setModel(''); setSelectedIssues([]); }}>
                                    <option value="">Seçiniz</option>
                                    {brands.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Model *</label>
                                <select value={model} onChange={e => { setModel(e.target.value); setSelectedIssues([]); }}>
                                    <option value="">Seçiniz</option>
                                    {models.map(m => <option key={m} value={m}>{m}</option>)}
                                    <option value="__other">Diğer (Elle Yaz)</option>
                                </select>
                                {model === '__other' && (
                                    <input className="mt-2" placeholder="Model adını yazın" onChange={e => setModel(e.target.value)} />
                                )}
                            </div>
                            <div>
                                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>IMEI</label>
                                <input value={imei} onChange={e => setImei(e.target.value)} placeholder="Opsiyonel" />
                            </div>
                            <div>
                                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Seri No</label>
                                <input value={serialNo} onChange={e => setSerialNo(e.target.value)} placeholder="Opsiyonel" />
                            </div>
                        </div>

                        {/* Password / Pattern Lock */}
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Şifre Tipi</label>
                                <select value={passwordType} onChange={e => { setPasswordType(e.target.value as any); setPasswordValue(''); }}>
                                    <option value="none">Şifre Yok</option>
                                    <option value="pin">PIN Kodu</option>
                                    <option value="pattern">Desen</option>
                                    <option value="password">Şifre (Alfanümerik)</option>
                                </select>
                            </div>
                            {passwordType === 'pattern' ? (
                                <div className="md:col-span-1">
                                    <PatternLock value={passwordValue} onChange={setPasswordValue} size={160} />
                                </div>
                            ) : passwordType !== 'none' ? (
                                <div>
                                    <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>
                                        {passwordType === 'pin' ? 'PIN Kodu' : 'Şifre'}
                                    </label>
                                    <input
                                        value={passwordValue}
                                        onChange={e => setPasswordValue(e.target.value)}
                                        placeholder="Giriniz"
                                        type={passwordType === 'pin' ? 'number' : 'text'}
                                    />
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {/* Issue */}
                    <div className="card">
                        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--accent)' }}>🔧 Arıza Bilgisi</h3>

                        {commonIssues.length > 0 && (
                            <div className="mb-3">
                                <label className="text-xs mb-2 block" style={{ color: 'var(--text-muted)' }}>Hızlı Seçim (Bu model için yaygın sorunlar)</label>
                                <div className="flex flex-wrap gap-2">
                                    {commonIssues.map(issue => (
                                        <button
                                            key={issue}
                                            onClick={() => toggleIssue(issue)}
                                            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${selectedIssues.includes(issue)
                                                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                                                : 'border-[var(--border)] text-[var(--text-muted)] hover:border-cyan-500/30'
                                                }`}
                                        >
                                            {issue}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Müşteri Şikayeti / Detay</label>
                            <textarea
                                value={issueDescription}
                                onChange={e => setIssueDescription(e.target.value)}
                                rows={3}
                                placeholder="Ek notlar..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                            <div>
                                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Tahmini Ücret (₺)</label>
                                <input type="number" value={estimatedCost} onChange={e => setEstimatedCost(e.target.value)} placeholder="0" />
                            </div>
                            <div>
                                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Garanti (Gün)</label>
                                <select value={warrantyDays} onChange={e => setWarrantyDays(e.target.value)}>
                                    <option value="0">Garanti Yok</option>
                                    <option value="30">30 Gün</option>
                                    <option value="90">90 Gün</option>
                                    <option value="180">6 Ay (180 Gün)</option>
                                    <option value="365">1 Yıl (365 Gün)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Atanan Teknisyen</label>
                                <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
                                    <option value="">Henüz Atanmadı</option>
                                    {state.staff.filter(s => s.isActive).map(s => (
                                        <option key={s.id} value={s.name}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Photos */}
                    <div className="card">
                        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--accent)' }}>📷 Fotoğraflar</h3>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                                <label className="text-xs mb-2 block" style={{ color: 'var(--text-muted)' }}>Teslim Öncesi (Before)</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="btn-secondary text-xs py-2 flex-1 justify-center"
                                    >
                                        <ImagePlus size={14} /> Dosyadan
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => cameraInputRef.current?.click()}
                                        className="btn-secondary text-xs py-2 flex-1 justify-center"
                                    >
                                        <Camera size={14} /> Kamera
                                    </button>
                                </div>
                                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFileSelect(e, 'before')} />
                                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleFileSelect(e, 'before')} />
                            </div>
                            <div>
                                <label className="text-xs mb-2 block" style={{ color: 'var(--text-muted)' }}>Teslim Sonrası (After)</label>
                                <div className="flex gap-2">
                                    <input type="file" accept="image/*" multiple className="hidden" id="after-file" onChange={e => handleFileSelect(e, 'after')} />
                                    <button
                                        type="button"
                                        onClick={() => (document.getElementById('after-file') as HTMLInputElement)?.click()}
                                        className="btn-secondary text-xs py-2 flex-1 justify-center"
                                    >
                                        <ImagePlus size={14} /> Dosyadan
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Photo grid */}
                        {photos.length > 0 && (
                            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                                {photos.map(photo => (
                                    <div key={photo.id} className="relative group rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
                                        <img src={photo.dataUrl} alt="Cihaz fotoğrafı" className="w-full h-20 object-cover" />
                                        <div className="absolute top-1 left-1">
                                            <span className={`text-[8px] px-1.5 py-0.5 rounded font-medium ${photo.type === 'before'
                                                ? 'bg-yellow-500/80 text-yellow-950'
                                                : 'bg-emerald-500/80 text-emerald-950'
                                                }`}>{photo.type === 'before' ? 'ÖNCE' : 'SONRA'}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removePhoto(photo.id)}
                                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={10} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {photos.length === 0 && (
                            <p className="text-[11px] text-center py-3" style={{ color: 'var(--text-muted)' }}>
                                Henüz fotoğraf eklenmedi. Cihazın durumunu belgelemek için fotoğraf ekleyin.
                            </p>
                        )}
                    </div>

                    {/* Signature */}
                    <div className="card">
                        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--accent)' }}>✍️ Teslim İmzası</h3>
                        <SignaturePad value={signatureDataUrl} onChange={setSignatureDataUrl} />
                    </div>
                </div>

                {/* Right Column - 3D Visual Diagnostics */}
                <div className="space-y-4">
                    <div className="card">
                        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--accent)' }}>
                            📐 3D Görsel Arıza İşaretleme
                        </h3>
                        <Phone3DDiagnostics
                            marks={diagnosticMarks}
                            onAddMark={handleAddMark}
                            onRemoveMark={handleRemoveMark}
                            brand={brand}
                            model={model}
                        />
                    </div>

                    {/* Submit Button */}
                    <button onClick={handleSubmit} className="btn-primary w-full justify-center text-base py-3">
                        <Save size={18} /> Kaydet
                    </button>
                </div>
            </div>
        </div>
    );
}
