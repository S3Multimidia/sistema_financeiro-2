import React from 'react';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Calendar, 
  ChevronDown 
} from 'lucide-react';

interface FilterBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterType: 'ALL' | 'income' | 'expense' | 'appointment';
  setFilterType: (type: 'ALL' | 'income' | 'expense' | 'appointment') => void;
  selectedDayFilter: string;
  setSelectedDayFilter: (day: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  selectedDayFilter,
  setSelectedDayFilter
}) => {
  return (
    <div className="fixed top-20 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 shadow-sm h-auto py-3 animate-slide-down transition-all">
      <div className="max-w-[1920px] mx-auto px-4 md:px-8 flex flex-col xl:flex-row items-center gap-4 justify-between">

        {/* Search Input - Expanding */}
        <div className="relative w-full xl:max-w-xl group order-2 xl:order-1">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-600 transition-colors pointer-events-none">
            <Search size={18} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="O que você procura?"
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 placeholder:text-slate-400 font-medium focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500/50 transition-all shadow-inner focus:bg-white"
          />
        </div>

        {/* Filters & Actions - Unified Row */}
        <div className="flex flex-wrap md:flex-nowrap items-center gap-3 w-full xl:w-auto order-1 xl:order-2 justify-center xl:justify-end">

          {/* Type Filters Group */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner overflow-x-auto max-w-full">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all whitespace-nowrap ${filterType === 'ALL' ? 'bg-white text-slate-800 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
            >
              Todos
            </button>
            <div className="w-px h-4 bg-slate-300 mx-1"></div>
            <button
              onClick={() => setFilterType('income')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 whitespace-nowrap ${filterType === 'income' ? 'bg-emerald-50 text-emerald-600 shadow-sm ring-1 ring-emerald-500/20' : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50/50'}`}
            >
              <TrendingUp size={14} /> <span className="hidden sm:inline">Receitas</span>
            </button>
            <div className="w-px h-4 bg-slate-300 mx-1"></div>
            <button
              onClick={() => setFilterType('expense')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 whitespace-nowrap ${filterType === 'expense' ? 'bg-rose-50 text-rose-600 shadow-sm ring-1 ring-rose-500/20' : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50/50'}`}
            >
              <TrendingDown size={14} /> <span className="hidden sm:inline">Despesas</span>
            </button>
            <div className="w-px h-4 bg-slate-300 mx-1"></div>
            <button
              onClick={() => setFilterType('appointment')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 whitespace-nowrap ${filterType === 'appointment' ? 'bg-violet-50 text-violet-600 shadow-sm ring-1 ring-violet-500/20' : 'text-slate-500 hover:text-violet-600 hover:bg-violet-50/50'}`}
            >
              <Clock size={14} /> <span className="hidden sm:inline">Agenda</span>
            </button>
          </div>

          {/* Vertical Divider */}
          <div className="w-px h-8 bg-slate-200 mx-1 hidden md:block"></div>

          {/* Date Filter */}
          <div className="relative min-w-[140px] group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-600 transition-colors pointer-events-none">
              <Calendar size={16} />
            </div>
            <select
              value={selectedDayFilter}
              onChange={(e) => setSelectedDayFilter(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-2xl text-slate-700 font-bold text-xs uppercase tracking-wide focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500/50 transition-all appearance-none cursor-pointer shadow-sm hover:border-violet-300"
            >
              <option value="">Todo o Mês</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                <option key={d} value={d}>Dia {d}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <ChevronDown size={14} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
