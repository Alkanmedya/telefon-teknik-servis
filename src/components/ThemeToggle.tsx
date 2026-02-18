'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
    const [isDark, setIsDark] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem('theme');
        if (saved === 'light') {
            setIsDark(false);
            document.documentElement.setAttribute('data-theme', 'light');
        }
    }, []);

    const toggle = () => {
        const newDark = !isDark;
        setIsDark(newDark);
        document.documentElement.setAttribute('data-theme', newDark ? 'dark' : 'light');
        localStorage.setItem('theme', newDark ? 'dark' : 'light');
    };

    return (
        <button
            onClick={toggle}
            className="fixed bottom-4 right-4 z-40 w-10 h-10 rounded-full flex items-center justify-center shadow-lg border transition-all hover:scale-110"
            style={{
                background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
                color: isDark ? '#fbbf24' : '#6366f1',
            }}
            title={isDark ? 'Aydınlık Tema' : 'Karanlık Tema'}
        >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
    );
}
