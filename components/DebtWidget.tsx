import React, { useState } from 'react';
import { Plus, Trash2, TrendingDown, Receipt, Wallet, ChevronDown, ChevronUp, History } from 'lucide-react';
import { DebtAccount, DebtTransaction } from '../types';

interface DebtWidgetProps {
    debts: DebtAccount[];
    setDebts: React.Dispatch<React.SetStateAction<DebtAccount[]>>;
    onSchedulePay: (debtId: string, amount: number, accountName: string, date: Date) => void;
}

export const DebtWidget: React.FC<DebtWidgetProps> = ({
    debts,
    setDebts,
    onSchedulePay
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [newDebtName, setNewDebtName] = useState('');

    // Action States
    const [actionDebtId, setActionDebtId] = useState<string | null>(null);
    const [actionType, setActionType] = useState<'purchase' | 'payment' | null>(null);
    const [actionAmount, setActionAmount] = useState('');
    const [actionDesc, setActionDesc] = useState('');
    const [actionDate, setActionDate] = useState<string>(new Date().toISOString().slice(0, 10));

    const handleAddDebt = () => {
        if (!newDebtName) return;
        const newDebt: DebtAccount = {
            id: Math.random().toString(36).substr(2, 9),
            name: newDebtName,
            currentBalance: 0,
            history: []
        };
        setDebts(prev => [...prev, newDebt]);
        setNewDebtName('');
        setIsAdding(false);
    };

    const handleDeleteDebt = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Tem certeza? Isso apagará todo o histórico deste crediário.')) {
            setDebts(prev => prev.filter(d => d.id !== id));
        }
    };

    const handleTransaction = () => {
        if (!actionDebtId || !actionAmount || !actionType) return;
        const amount = Number(actionAmount);
        if (isNaN(amount) || amount <= 0) return;

        const debt = debts.find(d => d.id === actionDebtId);
        if (!debt) return;

        if (actionType === 'payment') {
            // Schedule payment (creates pending expense in main app)
            // Does NOT decrease debt yet.
            const [y, m, d] = actionDate.split('-').map(Number);
            onSchedulePay(debt.id, amount, debt.name, new Date(y, m - 1, d)); // Pass selected date

            // Reset and close
            setActionDebtId(null);
            setActionType(null);
            setActionAmount('');
            setActionDesc('');
            setActionDate(new Date().toISOString().slice(0, 10)); // Reset date
            return;
        }

        // Purchase Logic (Immediate Increase)
        const newTrans: DebtTransaction = {
            id: Math.random().toString(36).substr(2, 9),
            date: actionDate, // Use selected date for purchase too
            description: actionDesc || 'Nova Compra',
            amount: amount,
            type: 'purchase'
        };

        setDebts(prev => prev.map(d => {
            if (d.id === actionDebtId) {
                return {
                    ...d,
                    currentBalance: d.currentBalance + amount,
                    history: [newTrans, ...d.history]
                };
            }
            return d;
        }));

        // Reset
        setActionDebtId(null);
        setActionType(null);
        setActionAmount('');
        setActionDesc('');
        setActionDate(new Date().toISOString().slice(0, 10)); // Reset date
    };

    return (
        <div className="bg-[#1e1e2d] p-5 rounded-3xl h-full flex flex-col border border-white/5 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                <h3 className="text-xs font-bold text-rose-400 flex items-center gap-2 uppercase tracking-widest">
                    <Receipt size={14} />
                    Crediários / Dívidas
                </h3>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="p-1.5 bg-white/5 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                    <Plus size={14} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 max-h-[300px]">
                {isAdding && (
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5 animate-fade-in flex gap-2">
                        <input
                            className="flex-1 text-xs font-bold bg-slate-900/50 border border-white/10 rounded p-2 text-white"
                            placeholder="Nome (ex: Construção)"
                            value={newDebtName}
                            onChange={e => setNewDebtName(e.target.value)}
                        />
                        <button
                            onClick={handleAddDebt}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg p-2"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                )}

                {debts.length === 0 && !isAdding && (
                    <div className="text-center py-8 opacity-50">
                        <p className="text-[10px] uppercase font-bold text-white/30 tracking-widest">Nenhum crediário</p>
                    </div>
                )}

                {debts.map(debt => (
                    <div key={debt.id} className="bg-white/5 border border-white/5 rounded-xl overflow-hidden transition-all">
                        {/* Header */}
                        <div
                            className="p-3 flex items-center justify-between cursor-pointer hover:bg-white/5"
                            onClick={() => setExpandedId(expandedId === debt.id ? null : debt.id)}
                        >
                            <div className="flex-1">
                                <p className="text-xs font-bold text-white mb-1">{debt.name}</p>
                                <p className="text-[10px] text-white/50 flex items-center gap-1">
                                    Devendo: <span className="text-rose-400 font-bold">R$ {debt.currentBalance.toFixed(2)}</span>
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setActionDebtId(debt.id); setActionType('purchase'); }}
                                    className="p-1.5 text-amber-300 hover:bg-amber-500/20 rounded-lg text-[10px] font-bold border border-amber-500/30"
                                    title="Adicionar Compra (Sobe Dívida)"
                                >
                                    + Compra
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setActionDebtId(debt.id); setActionType('payment'); }}
                                    className="p-1.5 text-emerald-300 hover:bg-emerald-500/20 rounded-lg text-[10px] font-bold border border-emerald-500/30"
                                    title="Pagar (Abate Dívida)"
                                >
                                    Pagar
                                </button>
                                {expandedId === debt.id ? <ChevronUp size={14} className="text-white/30" /> : <ChevronDown size={14} className="text-white/30" />}
                            </div>
                        </div>

                        {/* Expandable History */}
                        {expandedId === debt.id && (
                            <div className="bg-black/20 p-3 border-t border-white/5 animate-slide-down">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] uppercase font-bold text-white/30 flex items-center gap-1">
                                        <History size={10} /> Histórico
                                    </span>
                                    <button
                                        onClick={(e) => handleDeleteDebt(debt.id, e)}
                                        className="text-rose-500 hover:text-rose-400"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                                <div className="space-y-1 max-h-[150px] overflow-y-auto custom-scrollbar">
                                    {debt.history.length === 0 && <p className="text-[10px] text-white/20 text-center py-2">Sem histórico</p>}
                                    {debt.history.map(h => (
                                        <div key={h.id} className="flex justify-between items-center text-[10px] py-1 border-b border-white/5 last:border-0">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1 h-1 rounded-full ${h.type === 'purchase' ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                                                <span className="text-white/70">{new Date(h.date).toLocaleDateString('pt-BR')}</span>
                                                <span className="text-white truncate max-w-[80px]">{h.description}</span>
                                            </div>
                                            <span className={`font-bold ${h.type === 'purchase' ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                {h.type === 'purchase' ? '+' : '-'} R$ {h.amount.toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Action Modal/Input (Inline for simplicity) */}
            {actionDebtId && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex items-center justify-center p-6 rounded-3xl animate-fade-in">
                    <div className="bg-[#1e1e2d] border border-white/10 p-4 rounded-2xl w-full shadow-2xl">
                        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                            {actionType === 'purchase' ? <TrendingDown className="text-rose-400" size={16} /> : <Wallet className="text-emerald-400" size={16} />}
                            {actionType === 'purchase' ? 'Nova Compra (Fiado)' : 'Pagar Crediário'}
                        </h4>

                        <input
                            type="date"
                            className="w-full text-xs font-bold bg-slate-900/50 border border-white/10 rounded p-3 text-white mb-2"
                            value={actionDate}
                            onChange={e => setActionDate(e.target.value)}
                        />

                        <input
                            className="w-full text-xs bg-slate-900/50 border border-white/10 rounded p-3 text-white mb-2"
                            placeholder="Descrição (ex: Cimento / Pagamento Maio)"
                            value={actionDesc}
                            onChange={e => setActionDesc(e.target.value)}
                        />
                        <input
                            type="number"
                            className="w-full text-lg font-bold bg-slate-900/50 border border-white/10 rounded p-3 text-white mb-4"
                            placeholder="R$ 0,00"
                            value={actionAmount}
                            onChange={e => setActionAmount(e.target.value)}
                            autoFocus
                        />

                        <div className="flex gap-2">
                            <button
                                onClick={() => { setActionDebtId(null); setActionType(null); }}
                                className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 text-xs font-bold py-2.5 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleTransaction}
                                className={`flex-1 text-white text-xs font-bold py-2.5 rounded-lg transition-colors ${actionType === 'purchase' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
