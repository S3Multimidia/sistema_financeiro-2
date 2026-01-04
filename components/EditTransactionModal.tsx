
import React, { useState, useMemo } from 'react';
import { X, Save, DollarSign, Calendar, Tag, FileText, ChevronRight } from 'lucide-react';
import { Transaction } from '../types';

interface EditTransactionModalProps {
  transaction: Transaction;
  categoriesMap: Record<string, string[]>;
  onSave: (updated: Transaction) => void;
  onClose: () => void;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  transaction,
  categoriesMap,
  onSave,
  onClose
}) => {
  const categories = Object.keys(categoriesMap);
  const [formData, setFormData] = useState<Transaction>({ ...transaction });

  const subCategoriesList = useMemo(() => {
    return categoriesMap[formData.category] || [];
  }, [formData.category, categoriesMap]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white border-b border-white/5">
          <h3 className="font-bold flex items-center gap-2 text-sm uppercase tracking-widest">
            <Save size={18} className="text-indigo-400" />
            Editar Lançamento
          </h3>
          <button onClick={onClose} className="hover:bg-white/10 p-1 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Tipo</label>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'income' })}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${formData.type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                >
                  RECEITA
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'expense' })}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${formData.type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}
                >
                  DESPESA
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'appointment' })}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${formData.type === 'appointment' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                >
                  AGENDA
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Dia</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.day}
                  onChange={(e) => setFormData({ ...formData, day: parseInt(e.target.value) })}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Descrição</label>
            <div className="relative">
              <FileText size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">
                {formData.type === 'appointment' ? 'Prioridade' : 'Valor (R$)'}
              </label>
              <div className="relative">
                <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={formData.type === 'appointment' ? 'text' : 'number'}
                  step="0.01"
                  disabled={formData.type === 'appointment'}
                  value={formData.type === 'appointment' ? '' : formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className={`w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${formData.type === 'appointment' ? 'bg-slate-50 opacity-50' : ''}`}
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Categoria</label>
              <div className="relative">
                <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value, subCategory: '' })}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {formData.type !== 'appointment' && (
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Subcategoria (Opcional)</label>
              <div className="relative">
                <ChevronRight size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  list="sub-edit-options"
                  placeholder="Selecione ou digite..."
                  value={formData.subCategory || ''}
                  onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <datalist id="sub-edit-options">
                  {subCategoriesList.map(sub => (
                    <option key={sub} value={sub} />
                  ))}
                </datalist>
              </div>
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm uppercase"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 text-sm flex items-center justify-center gap-2 uppercase"
            >
              <Save size={18} />
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
