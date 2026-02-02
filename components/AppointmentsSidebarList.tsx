
import React, { useMemo } from 'react';
import { Transaction } from '../types';
import { Clock, CalendarDays, CheckCircle2, Circle } from 'lucide-react';

interface AppointmentsSidebarListProps {
  transactions: Transaction[];
  currentMonth: number;
  onToggleComplete: (id: string) => void;
  isDarkMode?: boolean;
}

export const AppointmentsSidebarList: React.FC<AppointmentsSidebarListProps> = ({
  transactions,
  currentMonth,
  onToggleComplete,
  isDarkMode = false
}) => {
  const monthAppointments = useMemo(() => {
    return transactions
      .filter(t => t.type === 'appointment')
      .sort((a, b) => {
        // Ordena primeiro por não concluídos, depois por dia
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return a.day - b.day;
      });
  }, [transactions]);

  return (
    <div className={`${isDarkMode ? 'bg-[#1e1e2d] border-white/5 shadow-2xl' : 'bg-white shadow-sm border-slate-200'} p-5 rounded-3xl border flex flex-col h-full`}>
      <div className={`flex items-center justify-between mb-4 border-b pb-3 ${isDarkMode ? 'border-white/5' : 'border-slate-50'}`}>
        <div className="flex items-center gap-2">
          {!isDarkMode && <CalendarDays size={16} className="text-indigo-600" />}
          <h3 className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-indigo-400' : 'text-slate-400'}`}>Agenda do Mês</h3>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
        {monthAppointments.length === 0 ? (
          <div className="py-8 text-center h-full flex items-center justify-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase italic">Nenhum compromisso</p>
          </div>
        ) : (
          monthAppointments.map((app) => (
            <div
              key={app.id}
              className={`flex items-start gap-3 p-2 rounded-xl transition-all border group ${app.completed
                ? (isDarkMode ? 'bg-white/5 border-transparent opacity-40' : 'bg-slate-50 border-transparent opacity-60')
                : (isDarkMode ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-white border-slate-100 hover:bg-indigo-50 hover:border-indigo-100')
                }`}
            >
              <button
                onClick={() => onToggleComplete(app.id)}
                className={`mt-1 transition-colors ${app.completed ? 'text-emerald-500' : (isDarkMode ? 'text-white/30 hover:text-indigo-400' : 'text-slate-300 hover:text-indigo-500')}`}
                title={app.completed ? "Marcar como pendente" : "Concluir compromisso"}
              >
                {app.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
              </button>

              <div className={`flex flex-col items-center justify-center border rounded-lg min-w-[32px] py-1 shadow-sm ${isDarkMode ? 'bg-white/5 border-white/5 group-hover:border-white/20' : 'bg-white border-slate-200 group-hover:border-indigo-200'}`}>
                <span className={`text-[8px] font-black leading-none uppercase ${isDarkMode ? 'text-white/30' : 'text-slate-400'}`}>Dia</span>
                <span className={`text-xs font-black leading-none mt-0.5 ${app.completed ? (isDarkMode ? 'text-white/20' : 'text-slate-400') : (isDarkMode ? 'text-white' : 'text-indigo-600')}`}>{app.day.toString().padStart(2, '0')}</span>
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-[11px] font-bold leading-tight line-clamp-2 ${app.completed ? (isDarkMode ? 'text-white/30 line-through decoration-white/30 decoration-2' : 'text-slate-400 line-through decoration-slate-400 decoration-2') : (isDarkMode ? 'text-white' : 'text-slate-700')}`}>
                  {app.description}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Clock size={10} className={`${isDarkMode ? 'text-white/30' : 'text-slate-400'}`} />
                  <span className={`text-[9px] font-black uppercase ${isDarkMode ? 'text-white/30' : 'text-slate-400'}`}>
                    {app.completed ? 'Concluído' : 'Compromisso'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
