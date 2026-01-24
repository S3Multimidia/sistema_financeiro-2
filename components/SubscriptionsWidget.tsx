import React, { useState } from 'react';
import { Plus, Trash2, Calendar, RefreshCcw, CheckCircle2 } from 'lucide-react';
import { Subscription } from '../types';

interface SubscriptionsWidgetProps {
    subscriptions: Subscription[];
    setSubscriptions: React.Dispatch<React.SetStateAction<Subscription[]>>;
    onSync: (sub: Subscription) => void;
}

export const SubscriptionsWidget: React.FC<SubscriptionsWidgetProps> = ({
    subscriptions,
    setSubscriptions,
    onSync
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newSub, setNewSub] = useState<Partial<Subscription>>({
        name: '',
        amount: 0,
        day: 1,
        category: 'GERAL',
        active: true
    });

    const handleAdd = () => {
        if (!newSub.name || !newSub.amount) return;

        setSubscriptions(prev => [...prev, {
            id: Math.random().toString(36).substr(2, 9),
            name: newSub.name!,
            amount: Number(newSub.amount),
            day: Number(newSub.day) || 1,
            category: newSub.category || 'GERAL',
            active: true,
            lastGeneratedMonth: undefined,
            lastGeneratedYear: undefined
        }]);
        setIsAdding(false);
        setNewSub({ name: '', amount: 0, day: 1, category: 'GERAL', active: true });
    };

    const handleDelete = (id: string) => {
        setSubscriptions(prev => prev.filter(s => s.id !== id));
    };

    return (
        <div className="glass-card p-5 rounded-3xl h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <RefreshCcw size={16} className="text-indigo-500" />
                    Assinaturas Fixas
                </h3>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                    <Plus size={16} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 max-h-[300px]">
                {isAdding && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-indigo-100 animate-fade-in space-y-2">
                        <input
                            className="w-full text-xs font-bold bg-white border border-slate-200 rounded p-2"
                            placeholder="Nome (ex: Netflix)"
                            value={newSub.name}
                            onChange={e => setNewSub({ ...newSub, name: e.target.value })}
                        />
                        <div className="flex gap-2">
                            <input
                                type="number"
                                className="w-1/2 text-xs bg-white border border-slate-200 rounded p-2"
                                placeholder="R$"
                                value={newSub.amount || ''}
                                onChange={e => setNewSub({ ...newSub, amount: parseFloat(e.target.value) })}
                            />
                            <input
                                type="number"
                                max={31} min={1}
                                className="w-1/4 text-xs bg-white border border-slate-200 rounded p-2"
                                placeholder="Dia"
                                value={newSub.day}
                                onChange={e => setNewSub({ ...newSub, day: parseInt(e.target.value) })}
                            />
                            <button
                                onClick={handleAdd}
                                className="w-1/4 bg-indigo-600 text-white rounded-lg flex items-center justify-center p-1"
                            >
                                <CheckCircle2 size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {subscriptions.length === 0 && !isAdding && (
                    <div className="text-center py-8 opacity-50">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Nenhuma assinatura</p>
                    </div>
                )}

                {subscriptions.map(sub => (
                    <div key={sub.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:shadow-sm transition-all group">
                        <div>
                            <p className="text-xs font-bold text-slate-800">{sub.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <Calendar size={10} /> Dia {sub.day}
                                </span>
                                <span className="text-[10px] font-medium text-emerald-600">R$ {sub.amount.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => onSync(sub)}
                                className="p-1.5 text-indigo-400 hover:text-indigo-600 bg-indigo-50 rounded-lg"
                                title="Forçar Lançamento Agora"
                            >
                                <RefreshCcw size={12} />
                            </button>
                            <button
                                onClick={() => handleDelete(sub.id)}
                                className="p-1.5 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
