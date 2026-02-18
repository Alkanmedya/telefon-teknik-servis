'use client';

import { useState } from 'react';
import { useAppState } from '@/lib/store';
import { Product, SaleItem } from '@/lib/types';
import { Plus, Trash2, ShoppingCart, CreditCard, Banknote, Search, X, Package, Smartphone, Disc, Shield, Cable } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const CATEGORIES = [
    { id: 'case', label: 'Kılıf', icon: Smartphone },
    { id: 'screen_protector', label: 'Ekran Koruyucu', icon: Shield },
    { id: 'charger', label: 'Şarj Aleti', icon: Banknote }, // Use Banknote as placeholder or Battery if available
    { id: 'cable', label: 'Kablo', icon: Cable },
    { id: 'audio', label: 'Ses/Kulaklık', icon: Disc },
    { id: 'other', label: 'Diğer', icon: Package },
];

export default function ShopView() {
    const { state, addProduct, updateProduct, deleteProduct, addSale } = useAppState();
    const [cart, setCart] = useState<SaleItem[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');

    // New Product State
    const [newProduct, setNewProduct] = useState<Partial<Product>>({
        name: '',
        category: 'case',
        price: 0,
        stock: 0
    });

    const filteredProducts = state.products.filter(p => {
        const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const addToCart = (product: Product) => {
        if (product.stock <= 0) return; // Prevent if out of stock

        setCart(prev => {
            const existing = prev.find(item => item.productId === product.id);
            if (existing) {
                // Check stock limit
                if (existing.quantity >= product.stock) return prev;
                return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1 }];
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.productId !== productId));
    };

    const updateCartQuantity = (productId: string, delta: number) => {
        setCart(prev => {
            return prev.map(item => {
                if (item.productId === productId) {
                    const newQty = item.quantity + delta;
                    if (newQty <= 0) return item; // Or remove? Let's keep at 1
                    // Check stock
                    const product = state.products.find(p => p.id === productId);
                    if (product && newQty > product.stock) return item;
                    return { ...item, quantity: newQty };
                }
                return item;
            });
        });
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const handleCheckout = () => {
        if (cart.length === 0) return;

        addSale({
            id: crypto.randomUUID(),
            items: cart,
            total: cartTotal,
            paymentMethod,
            date: new Date().toISOString()
        });

        setCart([]);
        alert('Satış başarıyla tamamlandı!');
    };

    const handleAddProduct = () => {
        if (!newProduct.name || !newProduct.price) return;
        addProduct({
            id: crypto.randomUUID(),
            name: newProduct.name,
            category: newProduct.category as any,
            price: Number(newProduct.price),
            stock: Number(newProduct.stock) || 0
        });
        setIsAddModalOpen(false);
        setNewProduct({ name: '', category: 'case', price: 0, stock: 0 });
    };

    return (
        <div className="flex h-[calc(100vh-140px)] gap-6">
            {/* Left: Products */}
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                {/* Top Bar: Search & Categories */}
                <div className="flex gap-4 overflow-x-auto pb-2 min-h-[50px]">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-[#1e293b] text-gray-400 hover:text-white'}`}
                    >
                        Tümü
                    </button>
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-colors ${selectedCategory === cat.id ? 'bg-blue-600 text-white' : 'bg-[#1e293b] text-gray-400 hover:text-white'}`}
                        >
                            <cat.icon size={16} />
                            {cat.label}
                        </button>
                    ))}
                </div>

                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                        <input
                            type="text"
                            placeholder="Ürün ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#1e293b] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 rounded-xl font-medium flex items-center gap-2 transition-colors"
                    >
                        <Plus size={20} /> Yeni Ürün
                    </button>
                </div>

                {/* Product Grid */}
                <div className="flex-1 overflow-y-auto pr-2">
                    {filteredProducts.length === 0 ? (
                        <div className="text-center py-20 text-gray-500">
                            {state.products.length === 0 ? 'Henüz ürün eklenmemiş.' : 'Ürün bulunamadı.'}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredProducts.map(product => (
                                <button
                                    key={product.id}
                                    onClick={() => addToCart(product)}
                                    disabled={product.stock <= 0}
                                    className={`text-left bg-[#1e293b] border border-white/10 rounded-xl p-4 transition-all hover:border-blue-500/50 group ${product.stock <= 0 ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-1 active:scale-95'}`}
                                >
                                    <div className="text-xs text-blue-400 mb-1 font-medium uppercase tracking-wider">{product.category}</div>
                                    <h3 className="font-semibold text-white mb-2 line-clamp-2 min-h-[48px]">{product.name}</h3>
                                    <div className="flex justify-between items-end">
                                        <div className="text-xl font-bold text-emerald-400">
                                            {formatCurrency(product.price)}
                                        </div>
                                        <div className={`text-xs font-medium px-2 py-1 rounded-md ${product.stock > 0 ? 'bg-white/10 text-gray-300' : 'bg-red-500/20 text-red-400'}`}>
                                            {product.stock > 0 ? `${product.stock} Adet` : 'Tükendi'}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Cart */}
            <div className="w-96 bg-[#1e293b] rounded-xl border border-white/10 flex flex-col shadow-2xl">
                <div className="p-4 border-b border-white/10 flex items-center gap-2">
                    <ShoppingCart className="text-blue-500" />
                    <h2 className="font-bold text-lg text-white">Sepet</h2>
                    <span className="ml-auto bg-blue-500/20 text-blue-400 text-xs font-bold px-2 py-1 rounded-full">
                        {cart.reduce((sum, item) => sum + item.quantity, 0)} Parça
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="text-center py-10 text-gray-500 flex flex-col items-center gap-2">
                            <ShoppingCart size={48} className="opacity-20" />
                            <p>Sepet boş</p>
                            <p className="text-xs">Ürünlere tıklayarak sepete ekleyin.</p>
                        </div>
                    ) : (
                        cart.map((item, index) => (
                            <div key={index} className="bg-black/20 rounded-lg p-3 flex justify-between items-center group">
                                <div className="flex-1">
                                    <div className="font-medium text-white text-sm line-clamp-1">{item.name}</div>
                                    <div className="text-xs text-emerald-400 font-mono">{formatCurrency(item.price)}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1 bg-white/5 rounded-lg">
                                        <button
                                            onClick={() => updateCartQuantity(item.productId, -1)}
                                            className="w-8 h-8 flex items-center justify-center hover:bg-white/10 text-gray-400 hover:text-white"
                                        >
                                            -
                                        </button>
                                        <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                                        <button
                                            onClick={() => updateCartQuantity(item.productId, 1)}
                                            className="w-8 h-8 flex items-center justify-center hover:bg-white/10 text-gray-400 hover:text-white"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => removeFromCart(item.productId)}
                                        className="text-gray-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 border-t border-white/10 bg-black/20">
                    <div className="flex gap-2 mb-4 p-1 bg-[#0f172a] rounded-lg">
                        <button
                            onClick={() => setPaymentMethod('cash')}
                            className={`flex-1 py-2 rounded-md font-medium text-sm flex items-center justify-center gap-2 transition-all ${paymentMethod === 'cash' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Banknote size={16} /> Nakit
                        </button>
                        <button
                            onClick={() => setPaymentMethod('card')}
                            className={`flex-1 py-2 rounded-md font-medium text-sm flex items-center justify-center gap-2 transition-all ${paymentMethod === 'card' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            <CreditCard size={16} /> Kart
                        </button>
                    </div>

                    <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-400">Toplam Tutar</span>
                        <span className="text-2xl font-bold text-white">{formatCurrency(cartTotal)}</span>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={cart.length === 0}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                    >
                        <ShoppingCart /> Satışı Tamamla
                    </button>
                </div>
            </div>

            {/* Add Product Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1e293b] rounded-2xl w-full max-w-md border border-white/10 shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Yeni Ürün Ekle</h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-white"><X /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Ürün Adı</label>
                                <input
                                    value={newProduct.name}
                                    onChange={e => setNewProduct(s => ({ ...s, name: e.target.value }))}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                    placeholder="Örn: iPhone 13 Kılıf"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Kategori</label>
                                    <select
                                        value={newProduct.category}
                                        onChange={e => setNewProduct(s => ({ ...s, category: e.target.value as any }))}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none appearance-none"
                                    >
                                        {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Stok Adedi</label>
                                    <input
                                        type="number"
                                        value={newProduct.stock || ''}
                                        onChange={e => setNewProduct(s => ({ ...s, stock: Number(e.target.value) }))}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Satış Fiyatı (₺)</label>
                                <input
                                    type="number"
                                    value={newProduct.price || ''}
                                    onChange={e => setNewProduct(s => ({ ...s, price: Number(e.target.value) }))}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none font-bold text-lg"
                                    placeholder="0.00"
                                />
                            </div>

                            <button
                                onClick={handleAddProduct}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold mt-4"
                            >
                                Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
