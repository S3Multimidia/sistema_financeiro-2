import React, { useState } from 'react';
import { CreditCard, Plus, Calendar, DollarSign, CreditCard as CardIcon, ChevronRight } from 'lucide-react';
import { CreditCard as ICreditCard, CardTransaction } from '../types';
import { CreditCardService } from '../services/creditCardService';

interface CreditCardWidgetProps {
    cards: ICreditCard[];
    setCards: React.Dispatch<React.SetStateAction<ICreditCard[]>>;
    cardTransactions: CardTransaction[];
    onAddTransaction: (newTrans: CardTransaction[]) => void;
}

export const CreditCardWidget: React.FC<CreditCardWidgetProps> = ({
    cards,
    setCards,
    cardTransactions,
    onAddTransaction
}) => {
    const [view, setView] = useState<'list' | 'add_card' | 'add_purchase'>('list');
    const [newCard, setNewCard] = useState<Partial<ICreditCard>>({ name: '', closingDay: 1, dueDay: 10, limit: 0, color: 'bg-indigo-600' });
    const [purchase, setPurchase] = useState({ description: '', amount: '', installments: '1', date: new Date().toISOString().split('T')[0], cardId: '' });

    const handleAddCard = () => {
        if (!newCard.name) return;
        setCards([...cards, {
            id: Math.random().toString(36).substr(2, 9),
            name: newCard.name,
            closingDay: Number(newCard.closingDay),
            dueDay: Number(newCard.dueDay),
            limit: Number(newCard.limit),
            color: newCard.color || 'bg-slate-800'
        } as ICreditCard]);
        setView('list');
    };

    const handleAddPurchase = () => {
        if (!purchase.cardId || !purchase.amount || !purchase.description) return;

        const card = cards.find(c => c.id === purchase.cardId);
        if (!card) return;

        const installments = CreditCardService.generateInstallments(
            card,
            purchase.description,
            Number(purchase.amount),
            Number(purchase.installments),
            new Date(purchase.date),
            'OUTROS' // Default category for now
        );

        onAddTransaction(installments);
        setView('list');
        setPurchase({ description: '', amount: '', installments: '1', date: new Date().toISOString().split('T')[0], cardId: '' });
    };

    const getNextInvoice = (card: ICreditCard) => {
        const today = new Date();
        // Simple logic: show current month header
        const total = CreditCardService.calculateInvoiceTotal(cardTransactions, card.id, today.getMonth(), today.getFullYear());
        return total;
    };

    return (
        <div className="glass-card p-5 rounded-3xl h-full flex flex-col bg-white/50 border border-white/60 shadow-xl shadow-indigo-500/5">

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold flex items-center gap-2 text-indigo-600">
                    <CardIcon size={16} />
                    Cartões
                </h3>
                {view === 'list' && (
                    <div className="flex gap-1">
                        <button onClick={() => setView('add_purchase')} className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors text-[10px] font-bold uppercase" title="Lançar Compra">
                            <Plus size={14} /> Compra
                        </button>
                        <button onClick={() => setView('add_card')} className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors text-slate-500">
                            <Plus size={16} />
                        </button>
                    </div>
                )}
                {view !== 'list' && (
                    <button onClick={() => setView('list')} className="text-xs text-slate-400 hover:text-indigo-600">Voltar</button>
                )}
            </div>

            {/* LIST VIEW */}
            {view === 'list' && (
                <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
                    {cards.length === 0 && <p className="text-center text-xs text-slate-400 py-6 italic">Nenhum cartão cadastrado</p>}

                    {cards.map(card => {
                        const invoiceTotal = getNextInvoice(card);
                        return (
                            <div key={card.id} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${card.color.replace('bg-', 'bg-')}`}></div>
                                        <span className="font-bold text-xs text-slate-700">{card.name}</span>
                                    </div>
                                    <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Dia {card.dueDay}</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Fatura Atual</p>
                                        <p className="text-base font-black text-slate-800">R$ {invoiceTotal.toFixed(2)}</p>
                                    </div>
                                    {/* Visual limit bar (mockup) */}
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-[9px] text-slate-400">Limite: R$ {card.limit.toLocaleString()}</span>
                                        <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500 w-[30%] rounded-full"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ADD CARD VIEW */}
            {view === 'add_card' && (
                <div className="space-y-3 animate-fade-in bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <h4 className="text-xs font-bold text-slate-700 uppercase">Novo Cartão</h4>
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="Nome do Cartão (ex: Nubank)" value={newCard.name} onChange={e => setNewCard({ ...newCard, name: e.target.value })} />
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-slate-400 ml-1">Fechamento</label>
                            <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700" placeholder="Dia" value={newCard.closingDay} onChange={e => setNewCard({ ...newCard, closingDay: parseInt(e.target.value) })} />
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-slate-400 ml-1">Vencimento</label>
                            <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700" placeholder="Dia" value={newCard.dueDay} onChange={e => setNewCard({ ...newCard, dueDay: parseInt(e.target.value) })} />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 ml-1">Limite Total</label>
                        <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700" placeholder="R$ 0,00" value={newCard.limit || ''} onChange={e => setNewCard({ ...newCard, limit: parseFloat(e.target.value) })} />
                    </div>
                    <button onClick={handleAddCard} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-xs uppercase shadow-lg shadow-indigo-500/20 mt-2 transition-all">Salvar Cartão</button>
                </div>
            )}

            {/* ADD PURCHASE VIEW */}
            {view === 'add_purchase' && (
                <div className="space-y-3 animate-fade-in bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <h4 className="text-xs font-bold text-slate-700 uppercase">Lançar no Crédito</h4>
                    {cards.length === 0 ? (
                        <p className="text-xs text-rose-500 text-center font-bold">Cadastre um cartão primeiro.</p>
                    ) : (
                        <>
                            <select value={purchase.cardId} onChange={e => setPurchase({ ...purchase, cardId: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 outline-none">
                                <option value="" className="text-slate-400">Selecione o Cartão</option>
                                {cards.map(c => <option key={c.id} value={c.id} className="text-slate-700">{c.name}</option>)}
                            </select>
                            <input className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700" placeholder="Descrição (ex: iPhone)" value={purchase.description} onChange={e => setPurchase({ ...purchase, description: e.target.value })} />
                            <div className="flex gap-2">
                                <input type="number" className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700" placeholder="Valor Total" value={purchase.amount} onChange={e => setPurchase({ ...purchase, amount: e.target.value })} />
                                <input type="number" className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700" placeholder="Parcelas (1x)" value={purchase.installments} onChange={e => setPurchase({ ...purchase, installments: e.target.value })} />
                            </div>
                            <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700" value={purchase.date} onChange={e => setPurchase({ ...purchase, date: e.target.value })} />

                            <button onClick={handleAddPurchase} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-bold text-xs uppercase shadow-lg shadow-emerald-500/20 mt-2 transition-all">Lançar Compra</button>
                        </>
                    )}
                </div>
            )}

        </div>
    );
};
