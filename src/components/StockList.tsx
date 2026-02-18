'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAppState } from '@/lib/store';
import { formatCurrency, categoryLabels } from '@/lib/utils';
import { Plus, Search, AlertTriangle, Trash2, Edit2, Package, Camera, X } from 'lucide-react';
import type { StockItem } from '@/lib/types';

export default function StockList() {
    const { state, addStockItem, updateStockItem, deleteStockItem, addExpense } = useAppState();
    const [search, setSearch] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [category, setCategory] = useState('screen');
    const [brand, setBrand] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [criticalLevel, setCriticalLevel] = useState('3');
    const [buyPrice, setBuyPrice] = useState('');
    const [buyCurrency, setBuyCurrency] = useState<'TRY' | 'USD' | 'EUR'>('TRY');
    const [sellPrice, setSellPrice] = useState('');
    const [barcode, setBarcode] = useState('');
    const [addToExpense, setAddToExpense] = useState(false);

    const usdRate = state.exchangeRates.find(r => r.currency === 'USD')?.rate || 32;
    const eurRate = state.exchangeRates.find(r => r.currency === 'EUR')?.rate || 35;

    const getCostInTRY = (price: number, currency: string) => {
        if (currency === 'USD') return price * usdRate;
        if (currency === 'EUR') return price * eurRate;
        return price;
    };

    const filteredStock = state.stockItems.filter(i =>
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        (i.brand && i.brand.toLowerCase().includes(search.toLowerCase())) ||
        (i.barcode && i.barcode.includes(search))
    );

    const criticalCount = state.stockItems.filter(s => s.quantity <= s.criticalLevel).length;
    const totalValue = state.stockItems.reduce((s, i) => s + (i.sellPrice * i.quantity), 0);

    const resetForm = () => {
        setName(''); setBuyPrice(''); setSellPrice(''); setBarcode('');
        setBrand(''); setCategory('screen'); setQuantity('1'); setCriticalLevel('3');
        setBuyCurrency('TRY'); setAddToExpense(false);
    };

    const handleAddItem = () => {
        if (!name.trim()) return;
        const qty = parseInt(quantity) || 1;
        const bPrice = parseFloat(buyPrice) || 0;

        const item: StockItem = {
            id: crypto.randomUUID(),
            name, category: category as any, brand,
            compatibleModels: [],
            quantity: qty,
            criticalLevel: parseInt(criticalLevel) || 3,
            buyPrice: bPrice,
            buyCurrency,
            sellPrice: parseFloat(sellPrice) || 0,
            barcode: barcode || undefined,
            createdAt: new Date().toISOString(),
        };
        addStockItem(item);

        if (addToExpense && bPrice > 0) {
            const costTRY = getCostInTRY(bPrice, buyCurrency) * qty;
            addExpense({
                id: crypto.randomUUID(),
                category: 'supplies',
                amount: costTRY,
                description: `Stok Alımı: ${name} (${qty} adet)`,
                date: new Date().toISOString().slice(0, 10),
            });
        }

        setShowAddForm(false);
        resetForm();
    };

    const handleStartEdit = (item: StockItem) => {
        setEditingId(item.id);
        setName(item.name);
        setCategory(item.category);
        setBrand(item.brand || '');
        setQuantity(item.quantity.toString());
        setCriticalLevel(item.criticalLevel.toString());
        setBuyPrice(item.buyPrice.toString());
        setBuyCurrency(item.buyCurrency);
        setSellPrice(item.sellPrice.toString());
        setBarcode(item.barcode || '');
        setAddToExpense(false); // Default false on edit
    };

    const handleSaveEdit = () => {
        if (!editingId || !name.trim()) return;
        const qty = parseInt(quantity) || 0;
        const bPrice = parseFloat(buyPrice) || 0;

        // Calculate difference for expense if needed (only if quantity increased)
        const oldItem = state.stockItems.find(s => s.id === editingId);
        const qtyDiff = qty - (oldItem?.quantity || 0);

        updateStockItem(editingId, {
            name, category: category as any, brand,
            quantity: qty,
            criticalLevel: parseInt(criticalLevel) || 3,
            buyPrice: bPrice,
            buyCurrency,
            sellPrice: parseFloat(sellPrice) || 0,
            barcode: barcode || undefined,
        });

        if (addToExpense && bPrice > 0 && qtyDiff > 0) {
            const costTRY = getCostInTRY(bPrice, buyCurrency) * qtyDiff;
            addExpense({
                id: crypto.randomUUID(),
                category: 'supplies',
                amount: costTRY,
                description: `Stok Güncelleme (Ek): ${name} (+${qtyDiff} adet)`,
                date: new Date().toISOString().slice(0, 10),
            });
        }

        setEditingId(null);
        resetForm();
    };

    // Barcode scanner logic (omitted for brevity as it's unchanged) ... 
    // Just keeping the scanner functions in the file
    const startScanner = useCallback(async () => {
        setShowScanner(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
            if ('BarcodeDetector' in window) {
                const detector = new (window as any).BarcodeDetector({ formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code'] });
                const scan = async () => {
                    if (!videoRef.current || !streamRef.current) return;
                    try {
                        const barcodes = await detector.detect(videoRef.current);
                        if (barcodes.length > 0) {
                            setSearch(barcodes[0].rawValue);
                            stopScanner();
                            return;
                        }
                    } catch { /* ignore */ }
                    if (streamRef.current) requestAnimationFrame(scan);
                };
                setTimeout(scan, 500);
            }
        } catch {
            alert('Kamera erişimi sağlanamadı. Lütfen barkodu manuel girin.');
            setShowScanner(false);
        }
    }, []);

    const stopScanner = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setShowScanner(false);
    }, []);

    useEffect(() => {
        return () => { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()); };
    }, []);

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold">Stok & Parça Yönetimi</h2>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {state.stockItems.length} ürün | USD: {usdRate.toFixed(2)}₺ | EUR: {eurRate.toFixed(2)}₺
                    </p>
                </div>
                <button onClick={() => setShowAddForm(true)} className="btn-primary"><Plus size={16} /> Parça Ekle</button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="card !p-3 text-center">
                    <p className="text-xl font-bold" style={{ color: 'var(--accent)' }}>{state.stockItems.length}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Toplam Ürün</p>
                </div>
                <div className="card !p-3 text-center">
                    <p className={`text-xl font-bold ${criticalCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{criticalCount}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Kritik Stok</p>
                </div>
                <div className="card !p-3 text-center">
                    <p className={`text-xl font-bold text-emerald-400 ${state.privacyMode ? 'privacy-blur' : ''}`}>{formatCurrency(totalValue)}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Stok Değeri</p>
                </div>
                <div className="card !p-3 text-center">
                    <p className="text-xl font-bold text-purple-400">{state.stockItems.reduce((s, i) => s + i.quantity, 0)}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Toplam Adet</p>
                </div>
            </div>

            {/* Search + Barcode */}
            <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Parça adı, marka, barkod..." className="!pl-9" />
                </div>
                <button onClick={startScanner} className="btn-secondary !px-3" title="Barkod Tara">
                    <Camera size={18} />
                </button>
            </div>

            {/* Barcode Scanner Modal */}
            {showScanner && (
                <div className="modal-backdrop" onClick={stopScanner}>
                    <div className="modal-content !max-w-md text-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold">Barkod Tarayıcı</h3>
                            <button onClick={stopScanner} className="p-1 rounded hover:bg-white/10"><X size={16} /></button>
                        </div>
                        <div className="relative rounded-lg overflow-hidden bg-black mb-3">
                            <video ref={videoRef} className="w-full" style={{ maxHeight: '300px' }} playsInline muted />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-48 h-24 border-2 border-cyan-400 rounded-lg opacity-60" />
                            </div>
                        </div>
                        <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Barkodu kamera alanına tutun</p>
                        <input
                            placeholder="veya barkod numarasını manuel girin..."
                            onKeyDown={e => { if (e.key === 'Enter') { setSearch((e.target as HTMLInputElement).value); stopScanner(); } }}
                        />
                    </div>
                </div>
            )}

            {/* Stock Table */}
            <div className="card !p-0 overflow-x-auto">
                {filteredStock.length === 0 ? (
                    <p className="text-sm text-center py-12" style={{ color: 'var(--text-muted)' }}>Stokta ürün bulunamadı.</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Parça</th>
                                <th>Kategori</th>
                                <th>Adet</th>
                                <th>Alış</th>
                                <th>Alış (TL)</th>
                                <th>Satış</th>
                                <th>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStock.map(item => (
                                <tr key={item.id} className={item.quantity <= item.criticalLevel ? 'bg-red-500/5' : ''}>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            {item.quantity <= item.criticalLevel && <AlertTriangle size={14} className="text-red-400" />}
                                            <div>
                                                <div className="text-sm font-medium">{item.name}</div>
                                                {item.brand && <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.brand}</div>}
                                                {item.barcode && <div className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>#{item.barcode}</div>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-xs">{categoryLabels[item.category] || item.category}</td>
                                    <td>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => updateStockItem(item.id, { quantity: Math.max(0, item.quantity - 1) })}
                                                className="w-6 h-6 rounded bg-red-500/20 text-red-400 text-xs font-bold">-</button>
                                            <span className={`text-sm font-bold px-2 ${item.quantity <= item.criticalLevel ? 'text-red-400' : ''}`}>
                                                {item.quantity}
                                            </span>
                                            <button onClick={() => updateStockItem(item.id, { quantity: item.quantity + 1 })}
                                                className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold">+</button>
                                        </div>
                                    </td>
                                    <td className={`text-sm ${state.privacyMode ? 'privacy-blur' : ''}`}>
                                        {item.buyPrice > 0 ? `${item.buyPrice.toFixed(2)} ${item.buyCurrency === 'TRY' ? '₺' : item.buyCurrency === 'USD' ? '$' : '€'}` : '-'}
                                    </td>
                                    <td className={`text-sm ${state.privacyMode ? 'privacy-blur' : ''}`}>
                                        {item.buyPrice > 0 ? formatCurrency(getCostInTRY(item.buyPrice, item.buyCurrency)) : '-'}
                                    </td>
                                    <td className={`text-sm font-medium ${state.privacyMode ? 'privacy-blur' : ''}`}>
                                        {item.sellPrice > 0 ? formatCurrency(item.sellPrice) : '-'}
                                    </td>
                                    <td>
                                        <div className="flex gap-1">
                                            <button onClick={() => handleStartEdit(item)}
                                                className="p-1.5 rounded hover:bg-blue-500/20 text-blue-400" title="Düzenle">
                                                <Edit2 size={14} />
                                            </button>
                                            <button onClick={() => { if (confirm('Silmek istediğinize emin misiniz?')) deleteStockItem(item.id); }}
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

            {/* Add/Edit Stock Modal */}
            {(showAddForm || editingId) && (
                <div className="modal-backdrop" onClick={() => { setShowAddForm(false); setEditingId(null); resetForm(); }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-4">{editingId ? 'Parça Düzenle' : 'Yeni Parça Ekle'}</h3>
                        <div className="space-y-3">
                            <input value={name} onChange={e => setName(e.target.value)} placeholder="Parça Adı *" />
                            <div className="grid grid-cols-2 gap-3">
                                <select value={category} onChange={e => setCategory(e.target.value)}>
                                    {Object.entries(categoryLabels).filter(([k]) => ['screen', 'battery', 'connector', 'camera', 'housing', 'ic', 'flex', 'accessory', 'other'].includes(k)).map(([k, v]) => (
                                        <option key={k} value={k}>{v}</option>
                                    ))}
                                </select>
                                <input value={brand} onChange={e => setBrand(e.target.value)} placeholder="Marka (Opsiyonel)" />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Adet" />
                                <input type="number" value={criticalLevel} onChange={e => setCriticalLevel(e.target.value)} placeholder="Kritik Seviye" />
                                <input value={barcode} onChange={e => setBarcode(e.target.value)} placeholder="Barkod" />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <input type="number" value={buyPrice} onChange={e => setBuyPrice(e.target.value)} placeholder="Alış Fiyatı" />
                                <select value={buyCurrency} onChange={e => setBuyCurrency(e.target.value as any)}>
                                    <option value="TRY">₺ TL</option>
                                    <option value="USD">$ USD</option>
                                    <option value="EUR">€ EUR</option>
                                </select>
                                <input type="number" value={sellPrice} onChange={e => setSellPrice(e.target.value)} placeholder="Satış (₺)" />
                            </div>
                            <div className="flex items-center justify-between">
                                {buyCurrency !== 'TRY' && buyPrice ? (
                                    <p className="text-xs" style={{ color: 'var(--accent)' }}>
                                        ≈ {formatCurrency(getCostInTRY(parseFloat(buyPrice) || 0, buyCurrency))} (güncel kurla)
                                    </p>
                                ) : (<div></div>)}

                                {buyPrice && parseFloat(buyPrice) > 0 && (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="addToStockExpense"
                                            checked={addToExpense}
                                            onChange={e => setAddToExpense(e.target.checked)}
                                            className="accent-red-500"
                                        />
                                        <label htmlFor="addToStockExpense" className="text-xs cursor-pointer select-none" style={{ color: 'var(--text-primary)' }}>
                                            {editingId ? 'Farkı Gider (Malzeme) Olarak İşle' : 'Gider (Malzeme) Olarak İşle'}
                                        </label>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button onClick={editingId ? handleSaveEdit : handleAddItem} className="btn-primary flex-1 justify-center">
                                    {editingId ? 'Güncelle' : 'Ekle'}
                                </button>
                                <button onClick={() => { setShowAddForm(false); setEditingId(null); resetForm(); }} className="btn-secondary flex-1 justify-center">İptal</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
