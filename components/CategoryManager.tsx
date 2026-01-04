
import React, { useState } from 'react';
import { X, Plus, Trash2, Pencil, Check, RotateCcw, ChevronRight, Tags } from 'lucide-react';

interface CategoryManagerProps {
  categoriesMap: Record<string, string[]>;
  setCategoriesMap: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  onUpdateCategory: (oldName: string, newName: string) => void;
  onRemoveCategory: (name: string) => void;
  onClose: () => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categoriesMap,
  setCategoriesMap,
  onUpdateCategory,
  onRemoveCategory,
  onClose
}) => {
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [selectedForSubs, setSelectedForSubs] = useState<string | null>(null);
  const [newSub, setNewSub] = useState('');

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory.trim() && !categoriesMap[newCategory.trim()]) {
      setCategoriesMap(prev => ({ ...prev, [newCategory.trim()]: [] }));
      setNewCategory('');
    }
  };

  const handleAddSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForSubs || !newSub.trim()) return;
    
    setCategoriesMap(prev => {
      const currentSubs = prev[selectedForSubs] || [];
      if (currentSubs.includes(newSub.trim())) return prev;
      return {
        ...prev,
        [selectedForSubs]: [...currentSubs, newSub.trim()]
      };
    });
    setNewSub('');
  };

  const handleRemoveSub = (cat: string, sub: string) => {
    setCategoriesMap(prev => ({
      ...prev,
      [cat]: prev[cat].filter(s => s !== sub)
    }));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col md:flex-row h-[85vh] animate-in zoom-in duration-200">
        
        {/* Painel de Categorias Principais */}
        <div className="w-full md:w-1/2 border-r border-slate-100 flex flex-col">
          <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="font-black text-slate-800 text-base uppercase">Categorias</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Principais</p>
            </div>
            <button onClick={onClose} className="md:hidden text-slate-400 p-2"><X size={20} /></button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
            <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Nova Categoria..."
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
              />
              <button type="submit" className="bg-slate-900 text-white p-2 rounded-xl"><Plus size={18} /></button>
            </form>

            <div className="space-y-1">
              {Object.keys(categoriesMap).map(cat => (
                <div 
                  key={cat} 
                  onClick={() => setSelectedForSubs(cat)}
                  className={`group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedForSubs === cat ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-transparent hover:border-slate-100'
                  }`}
                >
                  <span className={`text-sm font-bold ${selectedForSubs === cat ? 'text-indigo-700' : 'text-slate-700'}`}>{cat}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-black text-slate-300 mr-2">{categoriesMap[cat]?.length || 0} SUBS</span>
                    <button onClick={(e) => { e.stopPropagation(); onRemoveCategory(cat); if(selectedForSubs === cat) setSelectedForSubs(null); }} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                    <ChevronRight size={14} className={selectedForSubs === cat ? 'text-indigo-400' : 'text-slate-300'} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Painel de Subcategorias */}
        <div className="w-full md:w-1/2 bg-slate-50/50 flex flex-col">
          <div className="p-5 bg-white border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="font-black text-slate-800 text-base uppercase">Subcategorias</h3>
              <p className="text-[10px] text-indigo-500 font-black uppercase">{selectedForSubs || 'Selecione uma categoria'}</p>
            </div>
            <button onClick={onClose} className="hidden md:block text-slate-400 p-2"><X size={20} /></button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
            {selectedForSubs ? (
              <>
                <form onSubmit={handleAddSub} className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="Nova Subcategoria Predefinida..."
                    value={newSub}
                    onChange={(e) => setNewSub(e.target.value)}
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  />
                  <button type="submit" className="bg-indigo-600 text-white p-2 rounded-xl"><Plus size={18} /></button>
                </form>

                <div className="space-y-1">
                  {categoriesMap[selectedForSubs].length === 0 ? (
                    <div className="text-center py-10">
                      <Tags size={32} className="mx-auto text-slate-200 mb-2" />
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Nenhuma subcategoria predefinida</p>
                    </div>
                  ) : (
                    categoriesMap[selectedForSubs].map(sub => (
                      <div key={sub} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl">
                        <span className="text-sm text-slate-600 font-medium">{sub}</span>
                        <button onClick={() => handleRemoveSub(selectedForSubs, sub)} className="text-slate-300 hover:text-rose-500"><Trash2 size={14} /></button>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-30">
                <ChevronRight size={40} className="text-slate-300 rotate-180 mb-2" />
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Selecione uma categoria ao lado<br/>para gerenciar suas subs</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
