'use client';

import { useState } from 'react';
import { useAppState } from '@/lib/store';
import { Delete, Smartphone, LogIn, Lock } from 'lucide-react';

export default function LoginScreen() {
    const { login, state } = useAppState();
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);

    const handleInput = (digit: string) => {
        if (pin.length < 4) {
            setPin(prev => prev + digit);
            setError(false);
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
        setError(false);
    };

    const handleLogin = () => {
        if (login(pin)) {
            // Success
        } else {
            setError(true);
            setPin('');
        }
    };

    const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'];

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-[var(--bg-primary)]">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                        style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}>
                        <Smartphone size={32} />
                    </div>
                    <h1 className="text-2xl font-bold mb-1">Teknik Servis</h1>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Personel Girişi</p>
                </div>

                <div className="card p-6 shadow-2xl border-[var(--border)]">
                    {/* PIN Display */}
                    <div className="mb-6">
                        <div className={`h-14 rounded-xl flex items-center justify-center gap-3 text-2xl font-bold tracking-widest transition-all ${error ? 'bg-red-500/10 border border-red-500/30 text-red-500' : 'bg-[var(--bg-secondary)] border border-[var(--border)]'
                            }`}>
                            {pin.split('').map((_, i) => (
                                <span key={i} className="w-3 h-3 rounded-full bg-[var(--text-primary)] animate-pulse-fast" />
                            ))}
                            {pin.length === 0 && <span className="text-sm font-normal opacity-30">PIN Giriniz</span>}
                        </div>
                        {error && <p className="text-xs text-red-500 text-center mt-2">Hatalı PIN kodu!</p>}
                    </div>

                    {/* Numpad */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {numbers.map((num, i) => {
                            if (num === '') return <div key={i} />;
                            if (num === 'delete') return (
                                <button
                                    key={i}
                                    onClick={handleDelete}
                                    className="h-14 rounded-xl flex items-center justify-center text-lg font-medium transition-all hover:bg-white/5 active:scale-95"
                                    style={{ color: 'var(--text-muted)' }}
                                >
                                    <Delete size={20} />
                                </button>
                            );
                            return (
                                <button
                                    key={i}
                                    onClick={() => handleInput(num)}
                                    className="h-14 rounded-xl flex items-center justify-center text-xl font-semibold transition-all hover:bg-white/5 active:scale-95"
                                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                >
                                    {num}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={handleLogin}
                        disabled={pin.length < 4}
                        className="btn-primary w-full justify-center h-12 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <LogIn size={18} className="mr-2" /> Giriş Yap
                    </button>

                    <div className="mt-4 text-center">
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            Varsayılan PIN: <strong>1234</strong>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
