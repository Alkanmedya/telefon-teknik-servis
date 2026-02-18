'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface PatternLockProps {
    value: string;
    onChange: (pattern: string) => void;
    size?: number;
}

const DOT_COUNT = 3;

export default function PatternLock({ value, onChange, size = 180 }: PatternLockProps) {
    const [selectedDots, setSelectedDots] = useState<number[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const canvasRef = useRef<HTMLDivElement>(null);

    const cellSize = size / DOT_COUNT;
    const dotRadius = cellSize * 0.15;

    // Parse existing value
    useEffect(() => {
        if (value && !isDrawing) {
            const dots = value.split(',').map(Number).filter(n => !isNaN(n));
            setSelectedDots(dots);
        }
    }, [value, isDrawing]);

    const getDotCenter = (index: number) => {
        const row = Math.floor(index / DOT_COUNT);
        const col = index % DOT_COUNT;
        return {
            x: col * cellSize + cellSize / 2,
            y: row * cellSize + cellSize / 2,
        };
    };

    const getDotAtPos = (clientX: number, clientY: number): number | null => {
        if (!canvasRef.current) return null;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        for (let i = 0; i < DOT_COUNT * DOT_COUNT; i++) {
            const center = getDotCenter(i);
            const dist = Math.sqrt((x - center.x) ** 2 + (y - center.y) ** 2);
            if (dist < cellSize * 0.35) return i;
        }
        return null;
    };

    const handleStart = (clientX: number, clientY: number) => {
        const dot = getDotAtPos(clientX, clientY);
        if (dot !== null) {
            setSelectedDots([dot]);
            setIsDrawing(true);
        }
    };

    const handleMove = useCallback((clientX: number, clientY: number) => {
        if (!isDrawing || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        setMousePos({ x: clientX - rect.left, y: clientY - rect.top });

        const dot = getDotAtPos(clientX, clientY);
        if (dot !== null && !selectedDots.includes(dot)) {
            setSelectedDots(prev => [...prev, dot]);
        }
    }, [isDrawing, selectedDots, cellSize]);

    const handleEnd = useCallback(() => {
        if (isDrawing && selectedDots.length > 0) {
            onChange(selectedDots.join(','));
        }
        setIsDrawing(false);
    }, [isDrawing, selectedDots, onChange]);

    const handleClear = () => {
        setSelectedDots([]);
        onChange('');
    };

    // SVG lines between selected dots
    const lines = selectedDots.slice(1).map((dot, i) => {
        const from = getDotCenter(selectedDots[i]);
        const to = getDotCenter(dot);
        return { x1: from.x, y1: from.y, x2: to.x, y2: to.y, key: `${selectedDots[i]}-${dot}` };
    });

    // Active line from last dot to cursor
    const activeLine = isDrawing && selectedDots.length > 0 ? (() => {
        const last = getDotCenter(selectedDots[selectedDots.length - 1]);
        return { x1: last.x, y1: last.y, x2: mousePos.x, y2: mousePos.y };
    })() : null;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Desen Kilidi</label>
                {selectedDots.length > 0 && (
                    <button type="button" onClick={handleClear} className="text-[10px] px-2 py-0.5 rounded text-red-400 hover:bg-red-500/20">
                        Temizle
                    </button>
                )}
            </div>
            <div
                ref={canvasRef}
                className="relative rounded-xl border cursor-pointer select-none mx-auto"
                style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    background: 'var(--bg-secondary)',
                    borderColor: 'var(--border)',
                }}
                onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
                onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={(e) => { e.preventDefault(); const t = e.touches[0]; handleStart(t.clientX, t.clientY); }}
                onTouchMove={(e) => { e.preventDefault(); const t = e.touches[0]; handleMove(t.clientX, t.clientY); }}
                onTouchEnd={handleEnd}
            >
                {/* SVG overlay for lines */}
                <svg className="absolute inset-0 pointer-events-none" width={size} height={size}>
                    {lines.map(l => (
                        <line key={l.key} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                            stroke="rgba(0, 200, 255, 0.7)" strokeWidth="3" strokeLinecap="round" />
                    ))}
                    {activeLine && (
                        <line x1={activeLine.x1} y1={activeLine.y1} x2={activeLine.x2} y2={activeLine.y2}
                            stroke="rgba(0, 200, 255, 0.4)" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4" />
                    )}
                </svg>

                {/* Dots */}
                {Array.from({ length: DOT_COUNT * DOT_COUNT }, (_, i) => {
                    const center = getDotCenter(i);
                    const isSelected = selectedDots.includes(i);
                    const order = selectedDots.indexOf(i);
                    return (
                        <div
                            key={i}
                            className="absolute flex items-center justify-center"
                            style={{
                                left: `${center.x - dotRadius * 2}px`,
                                top: `${center.y - dotRadius * 2}px`,
                                width: `${dotRadius * 4}px`,
                                height: `${dotRadius * 4}px`,
                            }}
                        >
                            {/* Outer ring */}
                            <div className="absolute rounded-full transition-all" style={{
                                width: `${dotRadius * 3.5}px`, height: `${dotRadius * 3.5}px`,
                                border: `2px solid ${isSelected ? 'rgba(0,200,255,0.6)' : 'rgba(100,120,180,0.3)'}`,
                                background: isSelected ? 'rgba(0,200,255,0.1)' : 'transparent',
                            }} />
                            {/* Inner dot */}
                            <div className="absolute rounded-full transition-all" style={{
                                width: `${dotRadius * 1.5}px`, height: `${dotRadius * 1.5}px`,
                                background: isSelected ? 'rgba(0,200,255,0.9)' : 'rgba(100,120,180,0.5)',
                                boxShadow: isSelected ? '0 0 8px rgba(0,200,255,0.5)' : 'none',
                            }} />
                            {/* Order number */}
                            {isSelected && (
                                <span className="absolute text-[8px] font-bold" style={{ color: 'rgba(0,200,255,0.8)', top: '-2px', right: '0' }}>
                                    {order + 1}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
            {selectedDots.length > 0 && (
                <p className="text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>
                    {selectedDots.length} nokta seçildi
                </p>
            )}
        </div>
    );
}
