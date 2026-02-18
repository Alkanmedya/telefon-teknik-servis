'use client';

import { useState } from 'react';
import { useAppState } from '@/lib/store';
import { Plus, Trash2, Check, X, Phone, MessageCircle } from 'lucide-react';
import { openWhatsApp } from '@/lib/utils';
import type { Appointment } from '@/lib/types';

export default function AppointmentCalendar() {
    const { state, addAppointment, updateAppointment, deleteAppointment } = useAppState();
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [timeSlot, setTimeSlot] = useState('10:00');
    const [deviceModel, setDeviceModel] = useState('');
    const [issue, setIssue] = useState('');

    const handleAdd = () => {
        if (!name.trim()) return;
        addAppointment({
            id: crypto.randomUUID(),
            customerName: name, customerPhone: phone, date, timeSlot, deviceModel, issueDescription: issue,
            status: 'scheduled',
        });
        setShowForm(false);
        setName(''); setPhone(''); setDeviceModel(''); setIssue('');
    };

    const today = new Date().toISOString().slice(0, 10);
    const todayApps = state.appointments.filter(a => a.date === today).sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
    const upcomingApps = state.appointments.filter(a => a.date > today && a.status === 'scheduled').sort((a, b) => a.date.localeCompare(b.date));
    const pastApps = state.appointments.filter(a => a.date < today || a.status !== 'scheduled').sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);

    const handleRemind = (a: Appointment) => {
        const msg = `Sayın ${a.customerName}, ${a.date} tarihinde saat ${a.timeSlot} için randevunuz bulunmaktadır. ${a.deviceModel ? `(${a.deviceModel})` : ''} Bekliyoruz.`;
        openWhatsApp(a.customerPhone, msg);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold">Randevu Takvimi</h2>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{state.appointments.length} randevu</p>
                </div>
                <button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={16} /> Yeni Randevu</button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="card !p-3 text-center">
                    <p className="text-xl font-bold" style={{ color: 'var(--accent)' }}>{todayApps.length}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Bugün</p>
                </div>
                <div className="card !p-3 text-center">
                    <p className="text-xl font-bold text-blue-400">{upcomingApps.length}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Yaklaşan</p>
                </div>
                <div className="card !p-3 text-center">
                    <p className="text-xl font-bold text-emerald-400">{state.appointments.filter(a => a.status === 'completed').length}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Tamamlanan</p>
                </div>
                <div className="card !p-3 text-center">
                    <p className="text-xl font-bold text-red-400">{state.appointments.filter(a => a.status === 'no-show').length}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Gelmedi</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                    <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--accent)' }}>📅 Bugün ({today})</h3>
                    {todayApps.length === 0 ? (
                        <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>Bugün randevu yok.</p>
                    ) : (
                        <div className="space-y-2">
                            {todayApps.map(a => (
                                <div key={a.id} className={`p-3 rounded-lg border flex items-center justify-between ${a.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20 opacity-60' :
                                    a.status === 'cancelled' ? 'bg-red-500/10 border-red-500/20 opacity-40' :
                                        a.status === 'no-show' ? 'bg-orange-500/10 border-orange-500/20 opacity-40' :
                                            'border-[var(--border)]'
                                    }`}>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>{a.timeSlot}</span>
                                            <span className="text-sm font-medium">{a.customerName}</span>
                                        </div>
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{a.deviceModel} - {a.issueDescription}</p>
                                        {a.customerPhone && <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{a.customerPhone}</p>}
                                    </div>
                                    <div className="flex gap-1">
                                        {a.status === 'scheduled' && (
                                            <>
                                                {a.customerPhone && (
                                                    <button onClick={() => handleRemind(a)}
                                                        className="p-1.5 rounded hover:bg-green-500/20 text-green-400" title="WhatsApp Hatırlat">
                                                        <MessageCircle size={14} />
                                                    </button>
                                                )}
                                                <button onClick={() => updateAppointment(a.id, { status: 'completed' })}
                                                    className="p-1.5 rounded hover:bg-emerald-500/20 text-emerald-400" title="Tamamlandı"><Check size={14} /></button>
                                                <button onClick={() => updateAppointment(a.id, { status: 'no-show' })}
                                                    className="p-1.5 rounded hover:bg-orange-500/20 text-orange-400" title="Gelmedi"><X size={14} /></button>
                                            </>
                                        )}
                                        <button onClick={() => { if (confirm('Bu randevuyu silmek istediğinize emin misiniz?')) deleteAppointment(a.id); }}
                                            className="p-1.5 rounded hover:bg-red-500/20 text-red-400" title="Sil"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="card">
                    <h3 className="text-sm font-semibold mb-4">📋 Gelecek Randevular</h3>
                    {upcomingApps.length === 0 ? (
                        <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>Planlanmış randevu yok.</p>
                    ) : (
                        <div className="space-y-2">
                            {upcomingApps.map(a => (
                                <div key={a.id} className="p-3 rounded-lg border border-[var(--border)] flex items-center justify-between">
                                    <div>
                                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">{a.date}</span>
                                        <span className="text-xs ml-2" style={{ color: 'var(--accent)' }}>{a.timeSlot}</span>
                                        <p className="text-sm mt-1">{a.customerName} - {a.deviceModel}</p>
                                    </div>
                                    <div className="flex gap-1">
                                        {a.customerPhone && (
                                            <button onClick={() => handleRemind(a)}
                                                className="p-1.5 rounded hover:bg-green-500/20 text-green-400" title="WhatsApp Hatırlat">
                                                <MessageCircle size={14} />
                                            </button>
                                        )}
                                        <button onClick={() => updateAppointment(a.id, { status: 'cancelled' })}
                                            className="p-1.5 rounded hover:bg-orange-500/20 text-orange-400" title="İptal Et"><X size={14} /></button>
                                        <button onClick={() => { if (confirm('Bu randevuyu silmek istediğinize emin misiniz?')) deleteAppointment(a.id); }}
                                            className="p-1.5 rounded hover:bg-red-500/20 text-red-400" title="Sil"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Past appointments */}
            {pastApps.length > 0 && (
                <div className="card mt-6">
                    <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-muted)' }}>📜 Geçmiş/Tamamlanan (Son 10)</h3>
                    <div className="space-y-2">
                        {pastApps.map(a => (
                            <div key={a.id} className="p-2 rounded-lg flex items-center justify-between opacity-60" style={{ background: 'var(--bg-secondary)' }}>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{a.date} {a.timeSlot}</span>
                                    <span className="text-sm">{a.customerName}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${a.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                                            a.status === 'no-show' ? 'bg-orange-500/20 text-orange-400' :
                                                a.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                                                    'bg-blue-500/20 text-blue-400'
                                        }`}>{a.status === 'completed' ? 'Geldi' : a.status === 'no-show' ? 'Gelmedi' : a.status === 'cancelled' ? 'İptal' : 'Bekliyor'}</span>
                                </div>
                                <button onClick={() => { if (confirm('Silmek istediğinize emin misiniz?')) deleteAppointment(a.id); }}
                                    className="p-1 rounded hover:bg-red-500/20 text-red-400"><Trash2 size={12} /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {showForm && (
                <div className="modal-backdrop" onClick={() => setShowForm(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-4">Yeni Randevu</h3>
                        <div className="space-y-3">
                            <input value={name} onChange={e => setName(e.target.value)} placeholder="Müşteri Adı *" />
                            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Telefon" />
                            <div className="grid grid-cols-2 gap-3">
                                <input type="date" value={date} onChange={e => setDate(e.target.value)} />
                                <input type="time" value={timeSlot} onChange={e => setTimeSlot(e.target.value)} />
                            </div>
                            <input value={deviceModel} onChange={e => setDeviceModel(e.target.value)} placeholder="Cihaz Modeli" />
                            <input value={issue} onChange={e => setIssue(e.target.value)} placeholder="Konu / Arıza" />
                            <div className="flex gap-2"><button onClick={handleAdd} className="btn-primary flex-1 justify-center">Kaydet</button><button onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center">İptal</button></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
