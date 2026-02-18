import type { RepairStatus } from './types';

export function generateTicketNo(): string {
    const now = new Date();
    const y = now.getFullYear().toString().slice(-2);
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    const d = now.getDate().toString().padStart(2, '0');
    const rand = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `TS-${y}${m}${d}-${rand}`;
}

export const statusLabels: Record<RepairStatus, string> = {
    pending: 'Bekliyor',
    diagnosing: 'İnceleniyor',
    waiting_parts: 'Parça Bekleniyor',
    repairing: 'Tamir Ediliyor',
    ready: 'Hazır',
    delivered: 'Teslim Edildi',
    cancelled: 'İptal',
};

export const statusColors: Record<RepairStatus, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    diagnosing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    waiting_parts: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    repairing: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    ready: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    delivered: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export function formatCurrency(amount: number, privacy: boolean = false): string {
    if (privacy) return '***';
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
}

export function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

export function formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Az önce';
    if (minutes < 60) return `${minutes} dk önce`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} saat önce`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} gün önce`;
    const months = Math.floor(days / 30);
    return `${months} ay önce`;
}

export function cn(...classes: (string | undefined | null | false)[]): string {
    return classes.filter(Boolean).join(' ');
}

export function getWarrantyExpiryDate(startDate: string, days: number): string {
    const start = new Date(startDate);
    start.setDate(start.getDate() + days);
    return start.toISOString();
}

export function isWarrantyExpired(startDate: string, days: number): boolean {
    const expiry = new Date(startDate);
    expiry.setDate(expiry.getDate() + days);
    return Date.now() > expiry.getTime();
}

export function openWhatsApp(phone: string, message: string) {
    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('90') ? cleanPhone : `90${cleanPhone}`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${fullPhone}?text=${encoded}`, '_blank');
}

export const categoryLabels: Record<string, string> = {
    screen: 'Ekran',
    battery: 'Batarya',
    connector: 'Şarj Soketi',
    camera: 'Kamera',
    housing: 'Kasa',
    ic: 'Entegre (IC)',
    flex: 'Flex Kablo',
    accessory: 'Aksesuar',
    other: 'Diğer',
    rent: 'Kira',
    bills: 'Fatura',
    salary: 'Maaş',
    marketing: 'Pazarlama',
    supplies: 'Sarf Malzeme',
    food: 'Yemek',
    transport: 'Ulaşım',
    tax: 'Vergi',
};
