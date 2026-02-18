'use client';

import { useSearchParams } from 'next/navigation';
import { useAppState } from '@/lib/store';
import { useState, useEffect } from 'react';

export default function PrintPage() {
    const searchParams = useSearchParams();
    const repairId = searchParams.get('id');
    const { state } = useAppState();
    const repairs = state.repairs;
    const [repair, setRepair] = useState<any>(null);

    useEffect(() => {
        if (repairId && repairs.length > 0) {
            const found = repairs.find(r => r.id === repairId);
            setRepair(found);
            // Auto print after load
            if (found) {
                setTimeout(() => window.print(), 800);
            }
        }
    }, [repairId, repairs]);

    if (!repair && repairs.length > 0) return <div className="p-8 text-center">Kayıt bulunamadı...</div>;
    if (repairs.length === 0) return <div className="p-8 text-center">Veriler yükleniyor...</div>;

    return (
        <div className="max-w-3xl mx-auto p-8 font-sans text-black bg-white min-h-screen">
            <style jsx global>{`
                @media print {
                    @page { margin: 0; size: auto; }
                    body { margin: 1cm; background: white; color: black; }
                    .no-print { display: none !important; }
                }
            `}</style>

            <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-4">
                <div>
                    <h1 className="text-2xl font-bold uppercase tracking-wider">TEKNİK SERVİS FİŞİ</h1>
                    <p className="text-sm mt-1">Telefon Tamir & Bakım Hizmetleri</p>
                    <p className="text-xs text-gray-600 mt-2">Tel: 0555 123 45 67 | Adres: Örnek Mah. Cadde Sk. No:1</p>
                </div>
                <div className="text-right">
                    <div className="text-xl font-mono font-bold">#{repair.id.slice(0, 8).toUpperCase()}</div>
                    <div className="text-sm">{new Date().toLocaleDateString('tr-TR')}</div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                    <h3 className="font-bold border-b border-gray-300 mb-2 pb-1 text-sm text-gray-700">MÜŞTERİ BİLGİLERİ</h3>
                    <div className="space-y-1 text-sm text-black">
                        <div className="flex"><span className="w-24 font-medium text-gray-600">Ad Soyad:</span> <span className="font-semibold">{repair.customerName}</span></div>
                        <div className="flex"><span className="w-24 font-medium text-gray-600">Telefon:</span> {repair.contactInfo}</div>
                    </div>
                </div>
                <div>
                    <h3 className="font-bold border-b border-gray-300 mb-2 pb-1 text-sm text-gray-700">CİHAZ BİLGİLERİ</h3>
                    <div className="space-y-1 text-sm text-black">
                        <div className="flex"><span className="w-24 font-medium text-gray-600">Cihaz:</span> <span className="font-semibold">{repair.deviceBrand} {repair.deviceModel}</span></div>
                        <div className="flex"><span className="w-24 font-medium text-gray-600">IMEI/Seri:</span> {repair.imei}</div>
                    </div>
                </div>
            </div>

            <div className="mb-8">
                <h3 className="font-bold border-b border-gray-300 mb-2 pb-1 text-sm text-gray-700">ARIZA VE İŞLEM DETAYLARI</h3>
                <div className="border border-gray-200 p-4 rounded-lg bg-gray-50 min-h-[120px]">
                    <div className="mb-3"><span className="font-medium text-gray-600">Şikayet:</span> <span className="text-black ml-2">{repair.issueDescription}</span></div>
                    {repair.notes && <div className="mb-3"><span className="font-medium text-gray-600">Notlar:</span> <span className="text-black ml-2 italic">{repair.notes}</span></div>}

                    <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-end">
                        <div>
                            <div className="text-xs text-gray-500 mb-1">DURUM</div>
                            <span className="px-3 py-1 rounded text-sm font-bold uppercase border border-black bg-white">
                                {repair.status === 'completed' ? 'TAMAMLANDI' :
                                    repair.status === 'delivered' ? 'TESLİM EDİLDİ' :
                                        repair.status === 'pending' ? 'BEKLİYOR' :
                                            repair.status === 'in_progress' ? 'İŞLEMDE' : repair.status}
                            </span>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-gray-500 mb-1">TOPLAM TUTAR</div>
                            <div className="text-2xl font-bold font-mono tracking-tight text-black">
                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(repair.price)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="text-xs text-gray-500 mb-12 text-justify leading-tight border p-4 rounded bg-gray-50">
                <p className="mb-2 uppercase text-gray-700 font-bold">GARANTİ VE TESLİM ŞARTLARI:</p>
                <ul className="list-disc pl-4 space-y-1">
                    <li>Cihaz teslim alındıktan sonra 3 ay (90 gün) işçilik garantisi altındadır. Sıvı teması ve darbe garanti dışıdır.</li>
                    <li>30 gün içinde teslim alınmayan cihazlardan firmamız sorumlu değildir.</li>
                    <li>Yedekleme sorumluluğu müşteriye aittir. Veri kaybından firmamız sorumlu tutulamaz.</li>
                    <li>Bu belge olmadan cihaz teslimi yapılmaz. Lütfen belgeyi saklayınız.</li>
                </ul>
            </div>

            <div className="flex justify-between mt-8 pt-8 px-8">
                <div className="text-center w-48">
                    <div className="mb-12 font-bold text-sm text-gray-700">TESLİM ALAN (Firma)</div>
                    <div className="border-b border-dashed border-black w-full"></div>
                </div>
                <div className="text-center w-48">
                    <div className="mb-12 font-bold text-sm text-gray-700">TESLİM EDEN (Müşteri)</div>
                    <div className="border-b border-dashed border-black w-full"></div>
                    <div className="text-xs mt-2 text-gray-500">Okudum, onaylıyorum.</div>
                </div>
            </div>

            <div className="fixed bottom-6 right-6 no-print flex gap-3 z-50">
                <button
                    onClick={() => window.print()}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 shadow-xl font-bold flex items-center gap-2 transition-all hover:scale-105"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><path d="M6 14h12v8H6z"></path></svg>
                    YAZDIR
                </button>
                <button
                    onClick={() => window.close()}
                    className="bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-black shadow-xl font-medium transition-all"
                >
                    KAPAT
                </button>
            </div>
        </div>
    );
}
