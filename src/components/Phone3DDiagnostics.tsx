'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { DiagnosticMark, PhoneFace } from '@/lib/types';
import { RotateCw, MousePointerClick, Layers } from 'lucide-react';

interface Phone3DDiagnosticsProps {
    marks: DiagnosticMark[];
    onAddMark: (mark: DiagnosticMark) => void;
    onRemoveMark: (id: string) => void;
    brand?: string;
    model?: string;
}

const FACE_LABELS: Record<PhoneFace, string> = {
    front: 'Ön Yüz',
    back: 'Arka Yüz',
    left: 'Sol Kenar',
    right: 'Sağ Kenar',
    top: 'Üst Kenar',
    bottom: 'Alt Kenar',
};

const MARK_TYPE_ICONS: Record<string, string> = {
    scratch: '⚡',
    crack: '💥',
    dent: '🔵',
    missing: '❌',
    discoloration: '🎨',
};

const MARK_TYPE_LABELS: Record<string, string> = {
    scratch: 'Çizik',
    crack: 'Çatlak',
    dent: 'Ezik',
    missing: 'Eksik Parça',
    discoloration: 'Renk Bozulması',
};

// ==================== ZONE DEFINITIONS ====================
// Each zone: { name, label, x1, y1, x2, y2 } where coords are in % of face
interface PhoneZone {
    name: string;
    label: string;
    x1: number; y1: number;
    x2: number; y2: number;
}

const FACE_ZONES: Record<PhoneFace, PhoneZone[]> = {
    front: [
        { name: 'front-camera', label: '📷 Ön Kamera / Face ID', x1: 25, y1: 0, x2: 75, y2: 5 },
        { name: 'earpiece', label: '🔊 Kulaklık Hoparlörü', x1: 30, y1: 0, x2: 70, y2: 3 },
        { name: 'screen-top', label: '📱 Ekran (Üst)', x1: 5, y1: 5, x2: 95, y2: 35 },
        { name: 'screen-center', label: '📱 Ekran (Orta)', x1: 5, y1: 35, x2: 95, y2: 65 },
        { name: 'screen-bottom', label: '📱 Ekran (Alt)', x1: 5, y1: 65, x2: 95, y2: 90 },
        { name: 'home-button', label: '🔘 Ana Ekran Tuşu', x1: 30, y1: 90, x2: 70, y2: 100 },
        { name: 'front-frame-left', label: '🔲 Ön Çerçeve (Sol)', x1: 0, y1: 0, x2: 5, y2: 100 },
        { name: 'front-frame-right', label: '🔲 Ön Çerçeve (Sağ)', x1: 95, y1: 0, x2: 100, y2: 100 },
        { name: 'front-frame-top', label: '🔲 Ön Çerçeve (Üst)', x1: 0, y1: 0, x2: 100, y2: 3 },
        { name: 'front-frame-bottom', label: '🔲 Ön Çerçeve (Alt)', x1: 0, y1: 97, x2: 100, y2: 100 },
    ],
    back: [
        { name: 'rear-camera', label: '📸 Arka Kamera', x1: 0, y1: 0, x2: 50, y2: 25 },
        { name: 'flash', label: '💡 Flaş', x1: 50, y1: 0, x2: 80, y2: 10 },
        { name: 'back-glass-top', label: '🔳 Arka Cam (Üst)', x1: 0, y1: 25, x2: 100, y2: 45 },
        { name: 'logo-area', label: '🏷️ Logo / Orta Alan', x1: 15, y1: 35, x2: 85, y2: 65 },
        { name: 'back-glass-center', label: '🔳 Arka Cam (Orta)', x1: 0, y1: 45, x2: 100, y2: 70 },
        { name: 'back-glass-bottom', label: '🔳 Arka Cam (Alt)', x1: 0, y1: 70, x2: 100, y2: 100 },
        { name: 'wireless-charging', label: '🔋 Kablosuz Şarj Alanı', x1: 20, y1: 30, x2: 80, y2: 60 },
    ],
    left: [
        { name: 'volume-up', label: '🔊 Ses Açma Tuşu', x1: 0, y1: 15, x2: 100, y2: 28 },
        { name: 'volume-down', label: '🔉 Ses Kısma Tuşu', x1: 0, y1: 28, x2: 100, y2: 42 },
        { name: 'mute-switch', label: '🔇 Sessiz Modu Anahtarı', x1: 0, y1: 8, x2: 100, y2: 15 },
        { name: 'left-frame-top', label: '📐 Sol Kenar (Üst)', x1: 0, y1: 0, x2: 100, y2: 8 },
        { name: 'left-frame-mid', label: '📐 Sol Kenar (Orta)', x1: 0, y1: 42, x2: 100, y2: 70 },
        { name: 'left-frame-bottom', label: '📐 Sol Kenar (Alt)', x1: 0, y1: 70, x2: 100, y2: 100 },
        { name: 'sim-tray', label: '📶 SIM Tepsisi', x1: 0, y1: 55, x2: 100, y2: 65 },
    ],
    right: [
        { name: 'power-button', label: '⚡ Güç / Kilit Tuşu', x1: 0, y1: 20, x2: 100, y2: 35 },
        { name: 'right-frame-top', label: '📐 Sağ Kenar (Üst)', x1: 0, y1: 0, x2: 100, y2: 20 },
        { name: 'right-frame-mid', label: '📐 Sağ Kenar (Orta)', x1: 0, y1: 35, x2: 100, y2: 70 },
        { name: 'right-frame-bottom', label: '📐 Sağ Kenar (Alt)', x1: 0, y1: 70, x2: 100, y2: 100 },
    ],
    top: [
        { name: 'top-mic', label: '🎤 Üst Mikrofon', x1: 35, y1: 0, x2: 65, y2: 100 },
        { name: 'top-frame-left', label: '📐 Üst Kenar (Sol)', x1: 0, y1: 0, x2: 35, y2: 100 },
        { name: 'top-frame-right', label: '📐 Üst Kenar (Sağ)', x1: 65, y1: 0, x2: 100, y2: 100 },
    ],
    bottom: [
        { name: 'usb-port', label: '🔌 Şarj Girişi (USB-C/Lightning)', x1: 30, y1: 0, x2: 70, y2: 100 },
        { name: 'bottom-speaker-left', label: '🔊 Alt Hoparlör (Sol)', x1: 0, y1: 0, x2: 30, y2: 100 },
        { name: 'bottom-speaker-right', label: '🔊 Alt Hoparlör (Sağ)', x1: 70, y1: 0, x2: 100, y2: 100 },
    ],
};

function detectZone(face: PhoneFace, x: number, y: number): PhoneZone | null {
    const zones = FACE_ZONES[face];
    // More specific zones first (smaller area = higher priority)
    const sorted = [...zones].sort((a, b) => {
        const areaA = (a.x2 - a.x1) * (a.y2 - a.y1);
        const areaB = (b.x2 - b.x1) * (b.y2 - b.y1);
        return areaA - areaB; // smallest area first
    });
    for (const zone of sorted) {
        if (x >= zone.x1 && x <= zone.x2 && y >= zone.y1 && y <= zone.y2) {
            return zone;
        }
    }
    return null;
}

function getDeviceConfig(brand: string = '', model: string = '') {
    const b = brand.toLowerCase();
    const m = model.toLowerCase();

    let config = {
        front: 'punch-hole', // punch-hole, notch, dynamic-island, home-button
        backCameras: 'vertical-3', // vertical-3, square-2, square-3, center-round
        logo: 'text', // apple, text
        frame: 'flat', // flat, rounded
    };

    if (b === 'apple') {
        config.logo = 'apple';
        config.frame = 'flat';

        // Dynamic Island Models (14 Pro/Max, All 15, 16, 17)
        if (m.includes('17') || m.includes('16') || m.includes('15') || (m.includes('14') && (m.includes('pro') || m.includes('max')))) {
            config.front = 'dynamic-island';
            // Pro models have 3 cameras, others have 2
            config.backCameras = m.includes('pro') ? 'square-3' : 'square-2';
        }
        // Notch Models (X, 11, 12, 13, 14 base)
        else if (m.includes('14') || m.includes('13') || m.includes('12') || m.includes('11') || m.includes('x')) {
            config.front = 'notch';
            config.backCameras = (m.includes('pro') || m.includes('max')) && !m.includes('plus') ? 'square-3' : 'square-2';
            // Note: 12 Pro Max has 3, 12 Mini has 2. Logic above handles 'pro' correctly.
        }
        // Classic Models (SE, 6, 7, 8)
        else {
            config.front = 'home-button';
            config.backCameras = 'single';
            config.frame = 'rounded';
        }
    } else if (b === 'samsung') {
        config.logo = 'samsung'; // changed from text to specific
        config.front = 'punch-hole';
        if (m.includes('ultra')) {
            config.backCameras = 'vertical-4';
            config.frame = 'flat';
        } else {
            config.backCameras = 'vertical-3';
            config.frame = 'rounded';
        }
    } else if (b === 'xiaomi' || b === 'redmi') {
        config.backCameras = 'square-large';
        config.logo = 'xiaomi';
    }

    return config;
}

// ==================== COMPONENT ====================
export default function Phone3DDiagnostics({ marks, onAddMark, onRemoveMark, brand, model }: Phone3DDiagnosticsProps) {
    const config = getDeviceConfig(brand, model);
    const [rotateX, setRotateX] = useState(-15);
    const [rotateY, setRotateY] = useState(-25);
    const [isDragging, setIsDragging] = useState(false);
    const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
    const [markType, setMarkType] = useState<DiagnosticMark['type']>('scratch');
    const [autoRotate, setAutoRotate] = useState(true);
    const [highlightFace, setHighlightFace] = useState<PhoneFace | null>(null);
    const [hoveredZone, setHoveredZone] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const angleRef = useRef(0);

    const W = 200;
    const H = 400;
    const D = 18;

    // Auto-rotate animation
    useEffect(() => {
        if (!autoRotate || isDragging) return;
        let raf: number;
        const animate = () => {
            angleRef.current += 0.3;
            setRotateY(prev => prev + 0.3);
            raf = requestAnimationFrame(animate);
        };
        raf = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(raf);
    }, [autoRotate, isDragging]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setAutoRotate(false);
        setLastMouse({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging) return;
        const dx = e.clientX - lastMouse.x;
        const dy = e.clientY - lastMouse.y;
        setRotateY(prev => prev + dx * 0.5);
        setRotateX(prev => Math.max(-80, Math.min(80, prev - dy * 0.5)));
        setLastMouse({ x: e.clientX, y: e.clientY });
    }, [isDragging, lastMouse]);

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Detect zone on face hover
    const handleFaceMouseMove = (face: PhoneFace, e: React.MouseEvent<HTMLDivElement>) => {
        if (isDragging) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        const zone = detectZone(face, x, y);
        setHoveredZone(zone ? zone.label : FACE_LABELS[face]);
    };

    const handleFaceMouseLeave = () => {
        setHoveredZone(null);
    };

    const handleFaceClick = (face: PhoneFace, e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        const zone = detectZone(face, x, y);

        onAddMark({
            id: crypto.randomUUID(),
            x, y, face,
            type: markType,
            note: zone ? zone.label : FACE_LABELS[face],
        });
    };

    const snapToFace = (face: PhoneFace) => {
        setAutoRotate(false);
        setHighlightFace(face);
        switch (face) {
            case 'front': setRotateX(0); setRotateY(0); break;
            case 'back': setRotateX(0); setRotateY(180); break;
            case 'left': setRotateX(0); setRotateY(-90); break;
            case 'right': setRotateX(0); setRotateY(90); break;
            case 'top': setRotateX(90); setRotateY(0); break;
            case 'bottom': setRotateX(-90); setRotateY(0); break;
        }
        setTimeout(() => setHighlightFace(null), 1500);
    };

    const faceCounts = marks.reduce((acc, m) => {
        acc[m.face] = (acc[m.face] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Render mark with tooltip showing part name
    const renderMark = (mark: DiagnosticMark, size: number = 20, fontSize: string = '8px') => (
        <div
            key={mark.id}
            className="absolute flex items-center justify-center cursor-pointer z-10 group"
            style={{
                left: `${mark.x}%`, top: `${mark.y}%`,
                transform: 'translate(-50%, -50%)',
            }}
            onClick={(e) => { e.stopPropagation(); onRemoveMark(mark.id); }}
        >
            {/* Glow ring */}
            <div className="absolute rounded-full animate-ping" style={{
                width: `${size + 6}px`, height: `${size + 6}px`,
                background: 'rgba(255,60,60,0.2)',
            }} />
            {/* Main dot */}
            <div
                className="relative flex items-center justify-center rounded-full hover:scale-150 transition-transform"
                style={{
                    width: `${size}px`, height: `${size}px`,
                    background: 'radial-gradient(circle, rgba(255,60,60,0.9) 0%, rgba(255,60,60,0.4) 100%)',
                    boxShadow: '0 0 10px rgba(255,60,60,0.6)',
                    border: '2px solid rgba(255,100,100,0.8)',
                }}
            >
                <span style={{ fontSize }}>{MARK_TYPE_ICONS[mark.type]}</span>
            </div>
            {/* Tooltip with part name */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                <div className="px-2 py-1 rounded-md text-[10px] font-medium shadow-lg"
                    style={{ background: 'rgba(0,0,0,0.9)', color: '#fff', border: '1px solid rgba(0,200,255,0.3)' }}>
                    {mark.note || FACE_LABELS[mark.face]}
                    <div className="text-[8px] opacity-60">{MARK_TYPE_LABELS[mark.type]} — Silmek için tıkla</div>
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 rotate-45"
                    style={{ background: 'rgba(0,0,0,0.9)', marginTop: '-4px' }} />
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            {/* Mark Type Selector */}
            <div>
                <label className="text-xs mb-2 block" style={{ color: 'var(--text-muted)' }}>Hasar Tipi</label>
                <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(MARK_TYPE_LABELS) as DiagnosticMark['type'][]).map(type => (
                        <button
                            key={type}
                            onClick={() => setMarkType(type)}
                            className={`text-[10px] px-2.5 py-1.5 rounded-full border transition-all ${markType === type
                                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                                : 'border-[var(--border)] text-[var(--text-muted)] hover:border-cyan-500/30'
                                }`}
                        >
                            {MARK_TYPE_ICONS[type]} {MARK_TYPE_LABELS[type]}
                        </button>
                    ))}
                </div>
            </div>

            {/* 3D Phone Viewport */}
            <div
                ref={containerRef}
                className="relative rounded-xl overflow-hidden select-none"
                style={{
                    background: 'radial-gradient(ellipse at center, #1e293b 0%, #0f172a 70%)',
                    height: '500px',
                    cursor: isDragging ? 'grabbing' : 'grab',
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => { handleMouseUp(); handleFaceMouseLeave(); }}
            >
                {/* Grid floor reference */}
                <div className="absolute inset-0" style={{
                    backgroundImage: `
                        linear-gradient(rgba(0,255,255,0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0,255,255,0.03) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px',
                }} />

                {/* Perspective Container */}
                <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: '800px' }}>
                    <div
                        className="relative"
                        style={{
                            width: `${W}px`,
                            height: `${H}px`,
                            transformStyle: 'preserve-3d',
                            transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
                            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                        }}
                    >
                        {/* FRONT Face */}
                        <div
                            className="absolute inset-0 rounded-2xl border cursor-crosshair"
                            style={{
                                width: `${W}px`, height: `${H}px`,
                                transform: `translateZ(${D / 2}px)`,
                                background: 'linear-gradient(145deg, #2d3748 0%, #1a202c 100%)',
                                borderColor: highlightFace === 'front' ? 'var(--accent)' : 'rgba(148, 163, 184, 0.5)',
                                boxShadow: highlightFace === 'front' ? '0 0 20px rgba(0,200,255,0.3)' : 'inset 0 0 30px rgba(0,0,0,0.3)',
                                backfaceVisibility: 'hidden',
                            }}
                            onClick={(e) => handleFaceClick('front', e)}
                            onMouseMove={(e) => handleFaceMouseMove('front', e)}
                            onMouseLeave={handleFaceMouseLeave}
                        >
                            {config.front === 'dynamic-island' && (
                                <div className="absolute top-2 left-1/2 -translate-x-1/2 h-6 rounded-full bg-black z-20 flex items-center justify-center gap-2" style={{ width: '80px' }}>
                                    <div className="w-2 h-2 rounded-full bg-[#1a1a1a]" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#0f0f0f]" />
                                </div>
                            )}
                            {config.front === 'notch' && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 rounded-b-xl bg-black z-20" style={{ width: '100px' }}>
                                    <div className="absolute top-1 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full bg-[#1a1a1a] opacity-50" />
                                </div>
                            )}
                            {config.front === 'punch-hole' && (
                                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-black z-20 border border-white/5" />
                            )}
                            {config.front === 'home-button' && (
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-black/20" />
                            )}
                            <div className="absolute top-9 left-2 right-2 bottom-3 rounded-lg"
                                style={{ background: 'linear-gradient(180deg, #0a0f1e 0%, #060a14 100%)', border: '1px solid rgba(60,80,140,0.15)' }}>
                                <div className="flex items-center justify-center h-full">
                                    <span className="text-[10px] font-medium" style={{ color: 'rgba(100,160,220,0.4)' }}>ÖN YÜZ</span>
                                </div>
                            </div>
                            {marks.filter(m => m.face === 'front').map(mark => renderMark(mark, 20, '8px'))}
                        </div>

                        {/* BACK Face */}
                        <div
                            className="absolute inset-0 rounded-2xl border cursor-crosshair"
                            style={{
                                width: `${W}px`, height: `${H}px`,
                                transform: `rotateY(180deg) translateZ(${D / 2}px)`,
                                background: 'linear-gradient(145deg, #334155 0%, #1e293b 100%)',
                                borderColor: highlightFace === 'back' ? 'var(--accent)' : 'rgba(148, 163, 184, 0.5)',
                                boxShadow: highlightFace === 'back' ? '0 0 20px rgba(0,200,255,0.3)' : 'inset 0 0 30px rgba(0,0,0,0.3)',
                                backfaceVisibility: 'hidden',
                            }}
                            onClick={(e) => handleFaceClick('back', e)}
                            onMouseMove={(e) => handleFaceMouseMove('back', e)}
                            onMouseLeave={handleFaceMouseLeave}
                        >
                            {config.backCameras.startsWith('square') && (
                                <div className="absolute top-4 left-4 w-20 h-20 rounded-2xl bg-black/20 backdrop-blur-md border border-white/5 shadow-inner">
                                    <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-[#0f0f0f] border border-white/10 shadow-lg flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-blue-900/40" /></div>
                                    <div className="absolute bottom-2 left-2 w-6 h-6 rounded-full bg-[#0f0f0f] border border-white/10 shadow-lg flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-blue-900/40" /></div>
                                    {(config.backCameras === 'square-3' || config.backCameras === 'square-large') && (
                                        <div className="absolute top-1/2 right-2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0f0f0f] border border-white/10 shadow-lg flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-blue-900/40" /></div>
                                    )}
                                </div>
                            )}
                            {config.backCameras.startsWith('vertical') && (
                                <div className="absolute top-4 left-4 w-8 flex flex-col gap-2">
                                    <div className="w-8 h-8 rounded-full bg-[#0f0f0f] border border-white/10 shadow-lg flex items-center justify-center"><div className="w-3 h-3 rounded-full bg-blue-900/40" /></div>
                                    <div className="w-8 h-8 rounded-full bg-[#0f0f0f] border border-white/10 shadow-lg flex items-center justify-center"><div className="w-3 h-3 rounded-full bg-blue-900/40" /></div>
                                    <div className="w-8 h-8 rounded-full bg-[#0f0f0f] border border-white/10 shadow-lg flex items-center justify-center"><div className="w-3 h-3 rounded-full bg-blue-900/40" /></div>
                                    {config.backCameras === 'vertical-4' && (
                                        <div className="w-6 h-6 rounded-full bg-[#0f0f0f] border border-white/10 shadow-lg self-center flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-blue-900/40" /></div>
                                    )}
                                </div>
                            )}
                            {config.backCameras === 'single' && (
                                <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-[#0f0f0f] border border-white/10 shadow-lg flex items-center justify-center"><div className="w-4 h-4 rounded-full bg-blue-900/40" /></div>
                            )}

                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none opacity-20 rotate-180" style={{ transform: 'translate(-50%, -50%) scale(-1, 1)' }}>
                                <span className="text-xl font-bold tracking-widest uppercase">{brand}</span>
                            </div>
                            <div className="absolute top-5 left-20 w-3 h-3 rounded-full" style={{ background: 'rgba(255,220,100,0.15)', border: '1px solid rgba(255,220,100,0.3)' }} />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                <span className="text-[10px] font-medium" style={{ color: 'rgba(100,160,220,0.3)' }}>ARKA YÜZ</span>
                            </div>
                            {marks.filter(m => m.face === 'back').map(mark => renderMark(mark, 20, '8px'))}
                        </div>

                        {/* LEFT Face */}
                        <div
                            className="absolute rounded-lg border cursor-crosshair"
                            style={{
                                width: `${D}px`, height: `${H}px`,
                                left: `${-D / 2}px`,
                                transform: `rotateY(-90deg) translateZ(0px)`,
                                transformOrigin: 'right center',
                                background: 'linear-gradient(180deg, #334155 0%, #0f172a 100%)',
                                borderColor: highlightFace === 'left' ? 'var(--accent)' : 'rgba(80,100,160,0.2)',
                                boxShadow: highlightFace === 'left' ? '0 0 20px rgba(0,200,255,0.3)' : 'none',
                                backfaceVisibility: 'hidden',
                            }}
                            onClick={(e) => handleFaceClick('left', e)}
                            onMouseMove={(e) => handleFaceMouseMove('left', e)}
                            onMouseLeave={handleFaceMouseLeave}
                        >
                            <div className="absolute top-20 left-0 right-0 h-10 mx-auto" style={{ width: '3px', background: 'rgba(80,100,160,0.3)', borderRadius: '2px' }} />
                            <div className="absolute top-34 left-0 right-0 h-10 mx-auto" style={{ width: '3px', background: 'rgba(80,100,160,0.3)', borderRadius: '2px' }} />
                            {marks.filter(m => m.face === 'left').map(mark => renderMark(mark, 14, '6px'))}
                        </div>

                        {/* RIGHT Face */}
                        <div
                            className="absolute rounded-lg border cursor-crosshair"
                            style={{
                                width: `${D}px`, height: `${H}px`,
                                right: `${-D / 2}px`,
                                transform: `rotateY(90deg) translateZ(0px)`,
                                transformOrigin: 'left center',
                                background: 'linear-gradient(180deg, #334155 0%, #0f172a 100%)',
                                borderColor: highlightFace === 'right' ? 'var(--accent)' : 'rgba(80,100,160,0.2)',
                                boxShadow: highlightFace === 'right' ? '0 0 20px rgba(0,200,255,0.3)' : 'none',
                                backfaceVisibility: 'hidden',
                            }}
                            onClick={(e) => handleFaceClick('right', e)}
                            onMouseMove={(e) => handleFaceMouseMove('right', e)}
                            onMouseLeave={handleFaceMouseLeave}
                        >
                            <div className="absolute top-24 left-0 right-0 h-12 mx-auto" style={{ width: '3px', background: 'rgba(80,100,160,0.3)', borderRadius: '2px' }} />
                            {marks.filter(m => m.face === 'right').map(mark => renderMark(mark, 14, '6px'))}
                        </div>

                        {/* TOP Face */}
                        <div
                            className="absolute rounded-lg border cursor-crosshair"
                            style={{
                                width: `${W}px`, height: `${D}px`,
                                top: `${-D / 2}px`,
                                transform: `rotateX(90deg) translateZ(0px)`,
                                transformOrigin: 'center bottom',
                                background: 'linear-gradient(90deg, #334155 0%, #0f172a 100%)',
                                borderColor: highlightFace === 'top' ? 'var(--accent)' : 'rgba(80,100,160,0.2)',
                                boxShadow: highlightFace === 'top' ? '0 0 20px rgba(0,200,255,0.3)' : 'none',
                                backfaceVisibility: 'hidden',
                            }}
                            onClick={(e) => handleFaceClick('top', e)}
                            onMouseMove={(e) => handleFaceMouseMove('top', e)}
                            onMouseLeave={handleFaceMouseLeave}
                        >
                            {marks.filter(m => m.face === 'top').map(mark => renderMark(mark, 12, '5px'))}
                        </div>

                        {/* BOTTOM Face */}
                        <div
                            className="absolute rounded-lg border cursor-crosshair"
                            style={{
                                width: `${W}px`, height: `${D}px`,
                                bottom: `${-D / 2}px`,
                                transform: `rotateX(-90deg) translateZ(0px)`,
                                transformOrigin: 'center top',
                                background: 'linear-gradient(90deg, #334155 0%, #0f172a 100%)',
                                borderColor: highlightFace === 'bottom' ? 'var(--accent)' : 'rgba(80,100,160,0.2)',
                                boxShadow: highlightFace === 'bottom' ? '0 0 20px rgba(0,200,255,0.3)' : 'none',
                                backfaceVisibility: 'hidden',
                            }}
                            onClick={(e) => handleFaceClick('bottom', e)}
                            onMouseMove={(e) => handleFaceMouseMove('bottom', e)}
                            onMouseLeave={handleFaceMouseLeave}
                        >
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: '18px', height: '6px', background: 'rgba(40,50,80,0.8)', borderRadius: '3px', border: '1px solid rgba(80,100,160,0.3)' }} />
                            <div className="absolute top-1/2 left-6 -translate-y-1/2 flex gap-1">
                                {[...Array(4)].map((_, i) => <div key={i} className="w-1 h-1 rounded-full" style={{ background: 'rgba(80,100,160,0.3)' }} />)}
                            </div>
                            <div className="absolute top-1/2 right-6 -translate-y-1/2 flex gap-1">
                                {[...Array(4)].map((_, i) => <div key={i} className="w-1 h-1 rounded-full" style={{ background: 'rgba(80,100,160,0.3)' }} />)}
                            </div>
                            {marks.filter(m => m.face === 'bottom').map(mark => renderMark(mark, 12, '5px'))}
                        </div>
                    </div>
                </div>

                {/* Controls overlay */}
                <div className="absolute top-3 right-3 flex flex-col gap-1.5">
                    <button
                        onClick={() => { setAutoRotate(!autoRotate); }}
                        className={`p-2 rounded-lg backdrop-blur-sm border transition-all ${autoRotate ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' : 'bg-black/30 border-white/10 text-white/50 hover:text-white/80'}`}
                        title={autoRotate ? 'Otomatik döndürmeyi durdur' : 'Otomatik döndür'}
                    >
                        <RotateCw size={14} className={autoRotate ? 'animate-spin' : ''} style={autoRotate ? { animationDuration: '3s' } : {}} />
                    </button>
                </div>

                {/* Live zone indicator */}
                {hoveredZone && !isDragging && (
                    <div className="absolute top-3 left-3 text-[11px] px-3 py-1.5 rounded-lg backdrop-blur-sm bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 font-medium transition-all">
                        🎯 {hoveredZone}
                    </div>
                )}

                {/* Info overlay */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] px-2.5 py-1.5 rounded-lg backdrop-blur-sm bg-black/40 border border-white/10" style={{ color: 'var(--text-muted)' }}>
                        <MousePointerClick size={12} />
                        <span>Sürükle: Döndür | Tıkla: İşaretle</span>
                    </div>
                    {marks.length > 0 && (
                        <div className="text-[10px] px-2.5 py-1.5 rounded-lg backdrop-blur-sm bg-red-500/20 border border-red-500/30 text-red-400 font-medium">
                            {marks.length} hasar
                        </div>
                    )}
                </div>
            </div>

            {/* Quick-snap face buttons */}
            <div>
                <label className="text-xs mb-2 block" style={{ color: 'var(--text-muted)' }}>
                    <Layers size={12} className="inline mr-1" />Hızlı Yüz Seçimi
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                    {(Object.keys(FACE_LABELS) as PhoneFace[]).map(face => (
                        <button
                            key={face}
                            onClick={() => snapToFace(face)}
                            className={`text-[10px] py-2 px-2 rounded-lg border transition-all text-center ${highlightFace === face
                                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                                : 'border-[var(--border)] text-[var(--text-muted)] hover:border-cyan-500/30 hover:text-cyan-400'
                                }`}
                        >
                            {FACE_LABELS[face]}
                            {faceCounts[face] ? (
                                <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-[8px] bg-red-500/30 text-red-400">{faceCounts[face]}</span>
                            ) : null}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary of marks with part names */}
            {marks.length > 0 && (
                <div>
                    <label className="text-xs mb-2 block" style={{ color: 'var(--text-muted)' }}>İşaretlenen Hasarlar</label>
                    <div className="space-y-1 max-h-44 overflow-y-auto">
                        {marks.map((mark) => (
                            <div key={mark.id} className="flex items-center justify-between text-[11px] py-2 px-2.5 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                                <div className="flex flex-col gap-0.5 min-w-0">
                                    <div className="flex items-center gap-1">
                                        <span>{MARK_TYPE_ICONS[mark.type]}</span>
                                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{mark.note || FACE_LABELS[mark.face]}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px]">
                                        <span className="px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-primary)', color: 'var(--accent)' }}>{FACE_LABELS[mark.face]}</span>
                                        <span style={{ color: 'var(--text-muted)' }}>{MARK_TYPE_LABELS[mark.type]}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onRemoveMark(mark.id)}
                                    className="text-red-400 hover:text-red-300 ml-2 flex-shrink-0"
                                    title="Sil"
                                >✕</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
