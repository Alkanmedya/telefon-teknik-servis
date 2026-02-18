import type { DeviceTemplate } from './types';

export const deviceTemplates: DeviceTemplate[] = [
    // Apple
    { brand: 'Apple', model: 'iPhone 17 Pro Max', commonIssues: ['Ekran Değişimi', 'Pil Değişimi', 'Arka Cam', 'Kamera Lens', 'Face ID Arızası', 'Portsuz Şarj'] },
    { brand: 'Apple', model: 'iPhone 17 Pro', commonIssues: ['Ekran Değişimi', 'Pil Değişimi', 'Arka Cam', 'Face ID Arızası'] },
    { brand: 'Apple', model: 'iPhone 17', commonIssues: ['Ekran Değişimi', 'Pil Değişimi', 'Şarj Soketi', 'Kamera'] },
    { brand: 'Apple', model: 'iPhone 16 Pro Max', commonIssues: ['Ekran Değişimi', 'Pil Değişimi', 'Arka Cam', 'Face ID Arızası', 'Titanyum Çerçeve', 'Capture Button'] },
    { brand: 'Apple', model: 'iPhone 16 Pro', commonIssues: ['Ekran Değişimi', 'Pil Değişimi', 'Face ID Arızası', 'Capture Button'] },
    { brand: 'Apple', model: 'iPhone 16', commonIssues: ['Ekran Değişimi', 'Pil Değişimi', 'Şarj Soketi'] },
    { brand: 'Apple', model: 'iPhone 15 Pro Max', commonIssues: ['Ekran Değişimi', 'Pil Değişimi', 'Arka Cam', 'Kamera Lens', 'Face ID Arızası'] },
    { brand: 'Apple', model: 'iPhone 15 Pro', commonIssues: ['Ekran Değişimi', 'Pil Değişimi', 'Arka Cam', 'Face ID Arızası', 'Hoparlör'] },
    { brand: 'Apple', model: 'iPhone 15', commonIssues: ['Ekran Değişimi', 'Pil Değişimi', 'Şarj Soketi', 'Kamera'] },
    { brand: 'Apple', model: 'iPhone 14 Pro Max', commonIssues: ['Ekran Değişimi', 'Pil Değişimi', 'Arka Cam', 'Face ID Arızası'] },
    { brand: 'Apple', model: 'iPhone 14 Pro', commonIssues: ['Ekran Değişimi', 'Pil Değişimi', 'Face ID Arızası', 'Hoparlör'] },
    { brand: 'Apple', model: 'iPhone 14', commonIssues: ['Ekran Değişimi', 'Pil Değişimi', 'Şarj Soketi'] },
    { brand: 'Apple', model: 'iPhone 13 Pro Max', commonIssues: ['Ekran Değişimi', 'Pil Değişimi', 'Arka Cam', 'Face ID Arızası'] },
    { brand: 'Apple', model: 'iPhone 13 Pro', commonIssues: ['Ekran Değişimi', 'Pil Değişimi', 'Face ID Arızası'] },
    { brand: 'Apple', model: 'iPhone 13', commonIssues: ['Ekran Değişimi', 'Pil Değişimi', 'Şarj Soketi', 'Hoparlör'] },
    { brand: 'Apple', model: 'iPhone 12 Pro Max', commonIssues: ['Ekran Değişimi', 'Pil Değişimi', 'Face ID Arızası'] },
    { brand: 'Apple', model: 'iPhone 12', commonIssues: ['Ekran Değişimi', 'Pil Değişimi', 'Şarj Soketi'] },
    { brand: 'Apple', model: 'iPhone 11', commonIssues: ['Ekran Değişimi', 'Pil Değişimi', 'Face ID Arızası', 'Şarj Soketi', 'Hoparlör'] },
    { brand: 'Apple', model: 'iPhone SE 2022', commonIssues: ['Ekran Değişimi', 'Pil Değişimi', 'Touch ID Arızası'] },
    // Samsung
    { brand: 'Samsung', model: 'Galaxy S25 Ultra', commonIssues: ['Ekran Değişimi', 'Pil Değişimi', 'S-Pen Arızası', 'Kamera', 'Titanyum Gövde'] },
    { brand: 'Samsung', model: 'Galaxy S25+', commonIssues: ['Ekran Değişimi', 'Pil Değişimi', 'Şarj Soketi'] },
    { brand: 'Samsung', model: 'Galaxy S25', commonIssues: ['Ekran Değişimi', 'Pil Değişimi', 'Şarj Soketi'] },
    { brand: 'Samsung', model: 'Galaxy S24 Ultra', commonIssues: ['Ekran Değişimi', 'Pil Değişimi', 'S-Pen Arızası', 'Kamera', 'Arka Cam'] },
    { brand: 'Samsung', model: 'Galaxy S24', commonIssues: ['Ekran Değişimi', 'Pil Değişimi', 'Şarj Soketi'] },
    { brand: 'Samsung', model: 'Galaxy S23 Ultra', commonIssues: ['Ekran Değişimi', 'Pil Değişimi', 'S-Pen Arızası', 'Kamera'] },
    { brand: 'Samsung', model: 'Galaxy S23', commonIssues: ['Ekran Değişimi', 'Pil Değişimi', 'Şarj Soketi'] },
    { brand: 'Samsung', model: 'Galaxy S22 Ultra', commonIssues: ['Ekran Değişimi', 'Pil Değişimi', 'S-Pen Arızası'] },
    { brand: 'Samsung', model: 'Galaxy S21 FE', commonIssues: ['Ekran Değişimi', 'Pil Değişimi', 'Ghost Touch'] },
    { brand: 'Samsung', model: 'Galaxy A54', commonIssues: ['Ekran Değişimi', 'Pil Değişimi', 'Şarj Soketi', 'Kamera'] },
    { brand: 'Samsung', model: 'Galaxy A34', commonIssues: ['Ekran Değişimi', 'Pil Değişimi', 'Hoparlör'] },
    { brand: 'Samsung', model: 'Galaxy A14', commonIssues: ['Ekran Değişimi', 'Pil Değişimi', 'Şarj Soketi'] },
    { brand: 'Samsung', model: 'Galaxy Z Fold 5', commonIssues: ['İç Ekran Değişimi', 'Menteşe Sorunu', 'Dış Ekran', 'Pil'] },
    { brand: 'Samsung', model: 'Galaxy Z Flip 5', commonIssues: ['İç Ekran Değişimi', 'Menteşe Sorunu', 'Dış Ekran'] },
    // Xiaomi
    { brand: 'Xiaomi', model: 'Xiaomi 14 Ultra', commonIssues: ['Ekran Değişimi', 'Pil Değişimi', 'Leica Kamera Lens', 'Arka Kapak'] },
    { brand: 'Xiaomi', model: 'Xiaomi 14', commonIssues: ['Ekran Değişimi', 'Pil Değişimi', 'Şarj Soketi'] },
    { brand: 'Xiaomi', model: 'Redmi Note 13 Pro', commonIssues: ['Ekran Değişimi', 'Pil Değişimi', 'Şarj Soketi', 'Kamera'] },
    { brand: 'Xiaomi', model: 'Redmi Note 12', commonIssues: ['Ekran Değişimi', 'Pil Değişimi', 'Şarj Soketi'] },
    { brand: 'Xiaomi', model: 'Redmi 13C', commonIssues: ['Ekran Değişimi', 'Pil Değişimi', 'Hoparlör'] },
    { brand: 'Xiaomi', model: 'Poco X6 Pro', commonIssues: ['Ekran Değişimi', 'Pil Değişimi', 'Şarj Soketi'] },
    // Huawei
    { brand: 'Huawei', model: 'P40 Pro', commonIssues: ['Ekran Değişimi', 'Pil Değişimi', 'Parmak İzi Sensörü'] },
    { brand: 'Huawei', model: 'P30 Lite', commonIssues: ['Ekran Değişimi', 'Pil Değişimi', 'Şarj Soketi', 'Hoparlör'] },
    // Oppo
    { brand: 'Oppo', model: 'A78', commonIssues: ['Ekran Değişimi', 'Pil Değişimi', 'Şarj Soketi'] },
    { brand: 'Oppo', model: 'Reno 10', commonIssues: ['Ekran Değişimi', 'Pil Değişimi', 'Kamera'] },
    // Diğer
    { brand: 'Diğer', model: 'Tablet', commonIssues: ['Ekran Değişimi', 'Pil Değişimi', 'Şarj Soketi', 'Hoparlör', 'Kamera'] },
    { brand: 'Diğer', model: 'Akıllı Saat', commonIssues: ['Ekran Değişimi', 'Pil Değişimi', 'Kordon', 'Sensör'] },
];

export const brands = [...new Set(deviceTemplates.map(t => t.brand))];

export function getModelsForBrand(brand: string): string[] {
    return deviceTemplates.filter(t => t.brand === brand).map(t => t.model);
}

export function getCommonIssues(brand: string, model: string): string[] {
    const template = deviceTemplates.find(t => t.brand === brand && t.model === model);
    return template?.commonIssues || [];
}
