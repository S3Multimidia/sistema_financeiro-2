import React, { useState } from 'react';
import { CreditCard, Plus, Calendar, DollarSign, CreditCard as CardIcon, ChevronRight, Trash2, Pencil } from 'lucide-react';
import { CreditCard as ICreditCard, CardTransaction } from '../types';
import { CreditCardService } from '../services/creditCardService';

interface CreditCardWidgetProps {
    cards: ICreditCard[];
    setCards: React.Dispatch<React.SetStateAction<ICreditCard[]>>;
    cardTransactions: CardTransaction[];
    onAddTransaction: (newTrans: CardTransaction[]) => void;
    onDeleteTransaction: (id: string) => void;
    onEditTransaction: (id: string, updates: Partial<CardTransaction>) => void;
}

export const CreditCardWidget: React.FC<CreditCardWidgetProps> = ({
    cards,
    setCards,
    cardTransactions,
    onAddTransaction,
    onDeleteTransaction,
    onEditTransaction
}) => {
    // STATE DEFINITIONS
    const [view, setView] = useState<'list' | 'add_card' | 'add_purchase' | 'details' | 'edit_purchase'>('list');
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    const [newCard, setNewCard] = useState<Partial<ICreditCard>>({ name: '', closingDay: 1, dueDay: 10, limit: 0, color: 'bg-indigo-600' });
    const [purchase, setPurchase] = useState({ description: '', amount: '', installments: '1', date: new Date().toISOString().split('T')[0], cardId: '' });
    const [editingTransaction, setEditingTransaction] = useState<CardTransaction | null>(null);

    // HANDLERS
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
            Number(purchase.installments) || 1,
            new Date(purchase.date),
            'OUTROS'
        );

        console.log("Generating installments:", installments);
        onAddTransaction(installments);

        setView('list');
        setPurchase({ description: '', amount: '', installments: '1', date: new Date().toISOString().split('T')[0], cardId: '' });
    };

    const handleViewDetails = (cardId: string) => {
        setSelectedCardId(cardId);
        setView('details');
    };

    const handleEditStart = (t: CardTransaction) => {
        setEditingTransaction(t);
        setView('edit_purchase');
    }

    const handleSaveEdit = () => {
        if (!editingTransaction) return;
        onEditTransaction(editingTransaction.id, {
            description: editingTransaction.description,
            amount: editingTransaction.amount
        });
        setView('details');
        setEditingTransaction(null);
    };

    const getNextInvoice = (card: ICreditCard) => {
        const today = new Date();
        const total = CreditCardService.calculateInvoiceTotal(cardTransactions, card.id, today.getMonth(), today.getFullYear());
        return total;
    };

    const getCardTransactions = (cardId: string) => {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        // Filter transactions for this card and CURRENT invoice month
        return cardTransactions.filter(t =>
            t.cardId === cardId &&
            t.month === currentMonth &&
            t.year === currentYear
        );
    };

    return (
        <div className="bg-[#1e1e2d] p-5 rounded-3xl h-full flex flex-col border border-white/5 shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                <h3 className="text-xs font-bold flex items-center gap-2 text-indigo-400 uppercase tracking-widest">
                    <CardIcon size={14} />
                    {view === 'details' ? 'Extrato Fatura' : 'Cartões'}
                </h3>
                {view === 'list' && (
                    <div className="flex gap-1">
                        <button onClick={() => setView('add_purchase')} className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors text-[9px] font-bold uppercase tracking-wide">
                            Nova Compra
                        </button>
                        <button onClick={() => setView('add_card')} className="p-1.5 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-lg transition-colors">
                            <Plus size={14} />
                        </button>
                    </div>
                )}
                {view !== 'list' && (
                    <button onClick={() => { setView('list'); setSelectedCardId(null); }} className="text-[10px] font-bold text-white/40 hover:text-white uppercase">Voltar</button>
                )}
            </div>

            {/* LIST VIEW */}
            {view === 'list' && (
                <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
                    {cards.length === 0 && <p className="text-center text-[10px] text-white/30 py-6 uppercase font-bold tracking-widest">Nenhum cartão</p>}

                    {cards.map(card => {
                        const invoiceTotal = getNextInvoice(card);
                        return (
                            <div key={card.id} onClick={() => handleViewDetails(card.id)} className="cursor-pointer p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all group">
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${card.color.replace('bg-', 'bg-')}`}></div>
                                        <span className="font-bold text-xs text-white">{card.name}</span>
                                    </div>
                                    <span className="text-[9px] font-bold bg-white/10 text-white/60 px-2 py-0.5 rounded-full">Dia {card.dueDay}</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[9px] text-white/30 font-bold uppercase tracking-wider mb-0.5">Fatura Atual</p>
                                        <p className="text-base font-black text-white">R$ {invoiceTotal.toFixed(2)}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-[9px] text-white/30">Limite: {card.limit.toLocaleString()}</span>
                                        <div className="h-1 w-12 bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500 w-[30%] rounded-full"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* DETAILS VIEW */}
            {view === 'details' && selectedCardId && (
                <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1 animate-fade-in">
                    {getCardTransactions(selectedCardId).length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <p className="text-center text-[10px] text-white/30 uppercase font-bold tracking-widest">Fatura Zerada</p>
                            <p className="text-[9px] text-white/20 mt-1">Nenhum lançamento neste mês</p>
                        </div>
                    ) : (
                        getCardTransactions(selectedCardId).map(t => (
                            <div key={t.id} className="flex justify-between items-center p-3 bg-white/5 border border-white/5 rounded-xl">
                                <div>
                                    <p className="text-xs font-bold text-white mb-0.5">{t.description}</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-bold bg-indigo-500/20 text-indigo-300 px-1.5 rounded uppercase border border-indigo-500/10">
                                            {t.installmentNumber}/{t.totalInstallments}
                                        </span>
                                        <span className="text-[9px] text-white/30">{new Date(t.originalDate).toLocaleDateString()}</span>
                                    </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-xs text-white">R$ {t.amount.toFixed(2)}</span>
                                    <div className="flex items-center gap-1">
                                        <button onClick={(e) => { e.stopPropagation(); handleEditStart(t); }} className="p-1.5 text-white/30 hover:text-indigo-400 hover:bg-white/5 rounded-lg transition-colors">
                                            <Pencil size={12} />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); if (confirm('Tem certeza? Isso apagará apenas esta parcela.')) onDeleteTransaction(t.id); }} className="p-1.5 text-white/30 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
            ))
                    )}
            {/* ADD CARD VIEW */}
            {view === 'add_card' && (
                <div className="space-y-3 animate-fade-in bg-white/5 p-4 rounded-2xl border border-white/5">
                    <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">Novo Cartão</h4>
                    <input className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500/50 placeholder:text-white/20" placeholder="Nome do Cartão" value={newCard.name} onChange={e => setNewCard({ ...newCard, name: e.target.value })} />
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="text-[9px] font-bold text-white/30 ml-1 uppercase">Fechamento</label>
                            <input type="number" className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-2 text-xs text-white" placeholder="Dia" value={newCard.closingDay} onChange={e => setNewCard({ ...newCard, closingDay: parseInt(e.target.value) })} />
                        </div>
                        <div className="flex-1">
                            <label className="text-[9px] font-bold text-white/30 ml-1 uppercase">Vencimento</label>
                            <input type="number" className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-2 text-xs text-white" placeholder="Dia" value={newCard.dueDay} onChange={e => setNewCard({ ...newCard, dueDay: parseInt(e.target.value) })} />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-white/30 ml-1 uppercase">Limite</label>
                        <input type="number" className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-2 text-xs text-white" placeholder="R$ 0,00" value={newCard.limit || ''} onChange={e => setNewCard({ ...newCard, limit: parseFloat(e.target.value) })} />
                    </div>
                    <button onClick={handleAddCard} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold text-[10px] uppercase tracking-wider shadow-lg mt-2 transition-all">Salvar Cartão</button>
                </div>
            )}

            {/* ADD PURCHASE VIEW */}
            {view === 'add_purchase' && (
                <div className="space-y-3 animate-fade-in bg-white/5 p-4 rounded-2xl border border-white/5">
                    <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2">Lançar Compra</h4>
                    {cards.length === 0 ? (
                        <p className="text-xs text-rose-400 text-center font-bold">Cadastre um cartão primeiro.</p>
                    ) : (
                        <>
                            <select value={purchase.cardId} onChange={e => setPurchase({ ...purchase, cardId: e.target.value })} className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-2 text-xs text-white outline-none">
                                <option value="" className="text-slate-500">Selecione o Cartão</option>
                                {cards.map(c => <option key={c.id} value={c.id} className="text-slate-300">{c.name}</option>)}
                            </select>
                            <input className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-2 text-xs text-white placeholder:text-white/20" placeholder="Descrição (ex: iPhone)" value={purchase.description} onChange={e => setPurchase({ ...purchase, description: e.target.value })} />
                            <div className="flex gap-2">
                                <input type="number" className="w-1/2 bg-slate-900/50 border border-white/10 rounded-xl p-2 text-xs text-white placeholder:text-white/20" placeholder="Valor" value={purchase.amount} onChange={e => setPurchase({ ...purchase, amount: e.target.value })} />
                                <input type="number" className="w-1/2 bg-slate-900/50 border border-white/10 rounded-xl p-2 text-xs text-white placeholder:text-white/20" placeholder="Parcelas" value={purchase.installments} onChange={e => setPurchase({ ...purchase, installments: e.target.value })} />
                            </div>
                            <input type="date" className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-2 text-xs text-white" value={purchase.date} onChange={e => setPurchase({ ...purchase, date: e.target.value })} />

                            <button onClick={handleAddPurchase} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold text-[10px] uppercase tracking-wider shadow-lg mt-2 transition-all">Confirmar Lançamento</button>
                        </>
                    )}
                </div>
            )}

            {/* EDIT PURCHASE VIEW */}
            {view === 'edit_purchase' && editingTransaction && (
                <div className="space-y-3 animate-fade-in bg-white/5 p-4 rounded-2xl border border-white/5">
                    <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">Editar Lançamento</h4>

                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-white/30 ml-1 uppercase">Descrição</label>
                        <input
                            className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-2 text-xs text-white placeholder:text-white/20"
                            value={editingTransaction.description}
                            onChange={e => setEditingTransaction({ ...editingTransaction, description: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-white/30 ml-1 uppercase">Valor da Parcela</label>
                        <input
                            type="number"
                            className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-2 text-xs text-white placeholder:text-white/20"
                            value={editingTransaction.amount}
                            onChange={e => setEditingTransaction({ ...editingTransaction, amount: parseFloat(e.target.value) })}
                        />
                    </div>

                    <div className="flex gap-2 mt-2">
                        <button onClick={() => { setView('details'); setEditingTransaction(null); }} className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all">Cancelar</button>
                        <button onClick={handleSaveEdit} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider shadow-lg transition-all">Salvar</button>
                    </div>
                </div>
            )}

        </div>
    );
};
