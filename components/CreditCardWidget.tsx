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
        <div className="glass-card p-5 rounded-3xl h-full flex flex-col bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl shadow-slate-900/20">

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold flex items-center gap-2 text-indigo-400">
                    <CardIcon size={16} />
                    Cartões
                </h3>
                {view === 'list' && (
                    <div className="flex gap-1">
                        <button onClick={() => setView('add_purchase')} className="p-1.5 bg-indigo-500 hover:bg-indigo-400 rounded-lg transition-colors text-[10px] font-bold uppercase">
                            Nova Compra
                        </button>
                        <button onClick={() => setView('add_card')} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                            <Plus size={16} />
                        </button>
                    </div>
                )}
                {view !== 'list' && (
                    <button onClick={() => setView('list')} className="text-xs text-white/50 hover:text-white">Voltar</button>
                )}
            </div>

            {/* LIST VIEW */}
            {view === 'list' && (
                <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                    {cards.length === 0 && <p className="text-center text-xs text-white/30 py-4">Nenhum cartão</p>}

                    {cards.map(card => {
                        const invoiceTotal = getNextInvoice(card);
                        return (
                            <div key={card.id} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-xs">{card.name}</span>
                                    <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded">Dia {card.dueDay}</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[9px] text-white/40 font-bold uppercase">Fatura Atual</p>
                                        <p className="text-sm font-bold text-white">R$ {invoiceTotal.toFixed(2)}</p>
                                    </div>
                                    <div className="h-1.5 w-12 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 w-[40%] rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ADD CARD VIEW */}
            {view === 'add_card' && (
                <div className="space-y-3 animate-fade-in">
                    <input className="w-full bg-white/5 border border-white/10 rounded p-2 text-xs text-white placeholder:text-white/30" placeholder="Nome do Cartão" value={newCard.name} onChange={e => setNewCard({ ...newCard, name: e.target.value })} />
                    <div className="flex gap-2">
                        <input type="number" className="w-1/2 bg-white/5 border border-white/10 rounded p-2 text-xs text-white" placeholder="Fechamento (Dia)" value={newCard.closingDay} onChange={e => setNewCard({ ...newCard, closingDay: parseInt(e.target.value) })} />
                        <input type="number" className="w-1/2 bg-white/5 border border-white/10 rounded p-2 text-xs text-white" placeholder="Vencimento (Dia)" value={newCard.dueDay} onChange={e => setNewCard({ ...newCard, dueDay: parseInt(e.target.value) })} />
                    </div>
                    <input type="number" className="w-full bg-white/5 border border-white/10 rounded p-2 text-xs text-white placeholder:text-white/30" placeholder="Limite (R$)" value={newCard.limit || ''} onChange={e => setNewCard({ ...newCard, limit: parseFloat(e.target.value) })} />
                    <button onClick={handleAddCard} className="w-full bg-indigo-600 hover:bg-indigo-500 py-2 rounded-lg font-bold text-xs uppercase mt-2">Salvar Cartão</button>
                </div>
            )}

            {/* ADD PURCHASE VIEW */}
            {view === 'add_purchase' && (
                <div className="space-y-3 animate-fade-in">
                    {cards.length === 0 ? (
                        <p className="text-xs text-rose-400 text-center">Cadastre um cartão primeiro.</p>
                    ) : (
                        <>
                            <select value={purchase.cardId} onChange={e => setPurchase({ ...purchase, cardId: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded p-2 text-xs text-white outline-none">
                                <option value="" className="text-slate-900">Selecione o Cartão</option>
                                {cards.map(c => <option key={c.id} value={c.id} className="text-slate-900">{c.name}</option>)}
                            </select>
                            <input className="w-full bg-white/5 border border-white/10 rounded p-2 text-xs text-white placeholder:text-white/30" placeholder="Descrição (ex: iPhone)" value={purchase.description} onChange={e => setPurchase({ ...purchase, description: e.target.value })} />
                            <div className="flex gap-2">
                                <input type="number" className="w-1/2 bg-white/5 border border-white/10 rounded p-2 text-xs text-white placeholder:text-white/30" placeholder="Valor Total" value={purchase.amount} onChange={e => setPurchase({ ...purchase, amount: e.target.value })} />
                                <input type="number" className="w-1/2 bg-white/5 border border-white/10 rounded p-2 text-xs text-white placeholder:text-white/30" placeholder="Parcelas (1x)" value={purchase.installments} onChange={e => setPurchase({ ...purchase, installments: e.target.value })} />
                            </div>
                            <input type="date" className="w-full bg-white/5 border border-white/10 rounded p-2 text-xs text-white" value={purchase.date} onChange={e => setPurchase({ ...purchase, date: e.target.value })} />

                            <button onClick={handleAddPurchase} className="w-full bg-emerald-600 hover:bg-emerald-500 py-2 rounded-lg font-bold text-xs uppercase mt-2">Lançar Compra</button>
                        </>
                    )}
                </div>
            )}

        </div>
    );
};
