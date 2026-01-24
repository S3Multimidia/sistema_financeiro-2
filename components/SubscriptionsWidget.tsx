import React, { useState } from 'react';
import { Plus, Trash2, Calendar, RefreshCcw, CheckCircle2 } from 'lucide-react';
import { Subscription } from '../types';

interface SubscriptionsWidgetProps {
    subscriptions: Subscription[];
    setSubscriptions: React.Dispatch<React.SetStateAction<Subscription[]>>;
    onSync: (sub: Subscription) => void;
    onDelete: (id: string) => void;
}

export const SubscriptionsWidget: React.FC<SubscriptionsWidgetProps> = ({
    subscriptions,
    setSubscriptions,
    onSync,
    onDelete
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newSub, setNewSub] = useState<Partial<Subscription>>({
        name: '',
        amount: 0,
        day: 1,
        category: 'Assinaturas',
        active: true
    });

    const handleAdd = () => {
        if (!newSub.name || !newSub.amount) return;

        const subscriptionToAdd: Subscription = {
            id: Math.random().toString(36).substr(2, 9),
            name: newSub.name!,
            amount: Number(newSub.amount),
            day: Number(newSub.day) || 1,
            category: newSub.category || 'Assinaturas',
            active: true,
            lastGeneratedMonth: undefined,
            lastGeneratedYear: undefined
        };

        setSubscriptions(prev => [...prev, subscriptionToAdd]);

        // Auto-sync immediately so it appears in the list
        onSync(subscriptionToAdd);

        setIsAdding(false);
        setNewSub({ name: '', amount: 0, day: 1, category: 'Assinaturas', active: true });
    };

    const handleDelete = (id: string) => {
        if (confirm('Tem certeza? Isso removerá a assinatura e todos os lançamentos associados.')) {
            // Call parent to handle full cleanup (transactions + subscription state)
            onDelete(id);
        }
    };

    return (
        <div className="bg-[#1e1e2d] p-5 rounded-3xl h-full flex flex-col border border-white/5 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                <h3 className="text-xs font-bold text-indigo-400 flex items-center gap-2 uppercase tracking-widest">
                    <RefreshCcw size={14} />
                    Assinaturas
                </h3>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="p-1.5 bg-white/5 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                    <Plus size={14} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 max-h-[300px]">
                {isAdding && (
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5 animate-fade-in space-y-2">
                        <input
                            className="w-full text-xs font-bold bg-slate-900/50 border border-white/10 rounded p-2 text-white"
                            placeholder="Nome (ex: Netflix)"
                            value={newSub.name}
                            onChange={e => setNewSub({ ...newSub, name: e.target.value })}
                        />
                        <div className="flex gap-2">
                            <input
                                type="number"
                                className="w-1/2 text-xs bg-slate-900/50 border border-white/10 rounded p-2 text-white"
                                placeholder="R$"
                                value={newSub.amount || ''}
                                onChange={e => setNewSub({ ...newSub, amount: parseFloat(e.target.value) })}
                            />
                            <input
                                type="number"
                                max={31} min={1}
                                className="w-1/4 text-xs bg-slate-900/50 border border-white/10 rounded p-2 text-white"
                                placeholder="Dia"
                                value={newSub.day}
                                onChange={e => setNewSub({ ...newSub, day: parseInt(e.target.value) })}
                            />
                            <button
                                onClick={handleAdd}
                                className="w-1/4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center justify-center p-1 transition-colors"
                            >
                                <CheckCircle2 size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {subscriptions.length === 0 && !isAdding && (
                    <div className="text-center py-8 opacity-50">
                        <p className="text-[10px] uppercase font-bold text-white/30 tracking-widest">Nenhuma assinatura</p>
                    </div>
                )}

                {subscriptions.map(sub => (
                    <div key={sub.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all group">
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">{sub.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] text-white/40 bg-white/5 px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <Calendar size={10} /> Dia {sub.day}
                                </span>
                                <span className="text-[10px] font-bold text-emerald-400">R$ {sub.amount.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => onSync(sub)}
                                className="p-1.5 text-indigo-300 hover:text-white bg-indigo-500/20 hover:bg-indigo-500 rounded-lg transition-colors"
                                title="Lançar Agora"
                            >
                                <RefreshCcw size={12} />
                            </button>
                            <button
                                onClick={() => handleDelete(sub.id)}
                                className="p-1.5 text-rose-300 hover:text-white hover:bg-rose-500/20 rounded-lg transition-colors"
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
