'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Eraser, Check } from 'lucide-react';

interface SignaturePadProps {
    value?: string;
    onChange: (dataUrl: string) => void;
    width?: number;
    height?: number;
}

export default function SignaturePad({ value, onChange, width = 400, height = 150 }: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasContent, setHasContent] = useState(false);

    // Load existing signature
    useEffect(() => {
        if (value && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (!ctx) return;
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0);
                setHasContent(true);
            };
            img.src = value;
        }
    }, [value, width, height]);

    const getPos = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        if ('touches' in e) {
            const touch = e.touches[0];
            return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY };
        }
        return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        setIsDrawing(true);
    };

    const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        e.preventDefault();
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        const pos = getPos(e);
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#00c8ff';
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        setHasContent(true);
    }, [isDrawing]);

    const stopDrawing = () => {
        setIsDrawing(false);
        // Save to data URL
        if (canvasRef.current && hasContent) {
            onChange(canvasRef.current.toDataURL('image/png'));
        }
    };

    const clearCanvas = () => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, width, height);
        setHasContent(false);
        onChange('');
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-xs" style={{ color: 'var(--text-muted)' }}>✍️ Müşteri İmzası</label>
                <div className="flex gap-1">
                    {hasContent && (
                        <button type="button" onClick={clearCanvas} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded text-red-400 hover:bg-red-500/20">
                            <Eraser size={10} /> Temizle
                        </button>
                    )}
                </div>
            </div>
            <div className="relative rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
                <canvas
                    ref={canvasRef}
                    width={width}
                    height={height}
                    className="w-full cursor-crosshair"
                    style={{ height: `${height * 0.75}px`, touchAction: 'none' }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
                {!hasContent && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>Buraya imza atınız...</span>
                    </div>
                )}
                {/* Baseline */}
                <div className="absolute bottom-4 left-8 right-8 border-b border-dashed" style={{ borderColor: 'rgba(100,120,180,0.2)' }} />
            </div>
        </div>
    );
}
