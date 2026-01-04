
import React from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';
import { Transaction } from '../types';

interface AppointmentPopupProps {
  appointments: Transaction[];
  onAcknowledge: (id: string) => void;
}

export const AppointmentPopup: React.FC<AppointmentPopupProps> = ({ appointments, onAcknowledge }) => {
  if (appointments.length === 0) return null;

  // Pegamos o primeiro não reconhecido
  const current = appointments[0];

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-indigo-600 p-6 text-white flex flex-col items-center text-center">
          <div className="bg-white/20 p-4 rounded-full mb-4">
            <Bell size={40} className="animate-bounce" />
          </div>
          <h2 className="text-2xl font-bold italic">Lembrete de Agenda</h2>
          <p className="text-indigo-100 mt-1">Você tem um compromisso hoje!</p>
        </div>
        
        <div className="p-8 text-center">
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl mb-6">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Compromisso</span>
            <p className="text-xl font-semibold text-slate-800 mt-2">{current.description}</p>
          </div>

          <button
            onClick={() => onAcknowledge(current.id)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 group"
          >
            <CheckCircle2 size={20} className="group-hover:scale-110 transition-transform" />
            Eu estou ciente deste compromisso
          </button>
        </div>
      </div>
    </div>
  );
};
