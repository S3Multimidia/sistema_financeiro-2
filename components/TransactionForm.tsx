import React, { useState, useMemo } from 'react';
import { Transaction, CreditCard, Subscription, DebtAccount, DebtTransaction, CardTransaction } from '../types';
import { PlusCircle, Calendar, Repeat, CreditCard as CreditCardIcon, RefreshCcw, Landmark, Receipt, CheckCircle2, DollarSign } from 'lucide-react';
import { CreditCardService } from '../services/creditCardService';

interface TransactionFormProps {
  onAdd: (transaction: Omit<Transaction, 'id'>, options: { installments: number, isFixed: boolean }) => void;
  categoriesMap: Record<string, string[]>;
  currentMonth: number;
  currentYear: number;
  isDarkMode?: boolean;

  // New Props for Extended Functionality
  cards: CreditCard[];
  debts: DebtAccount[];
  subscriptions: Subscription[];

  onAddCardTransaction: (newTrans: CardTransaction[]) => void;
  onAddSubscription: (newSub: Subscription) => void;
  onAddDebtTransaction: (debtId: string, amount: number, description: string, date: Date) => void;
}

type TabType = 'RECEITA' | 'DESPESA' | 'AGENDA' | 'CARTÕES' | 'CONTAS FIXAS' | 'DÍVIDAS';

export const TransactionForm: React.FC<TransactionFormProps> = ({
  onAdd,
  categoriesMap,
  currentMonth,
  currentYear,
  isDarkMode = false,
  cards,
  debts,
  subscriptions,
  onAddCardTransaction,
  onAddSubscription,
  onAddDebtTransaction
}) => {
  const categories = Object.keys(categoriesMap);
  const [activeTab, setActiveTab] = useState<TabType>('DESPESA');

  // Common State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>(categories[0] || '');
  const [subCategory, setSubCategory] = useState('');
  const [day, setDay] = useState<number>(new Date().getDate());
  const [time, setTime] = useState('');

  // Recurrence / Options
  const [isFixed, setIsFixed] = useState(false);
  const [isInstallment, setIsInstallment] = useState(false); // Used only for standard expense visual toggle
  const [installmentsCount, setInstallmentsCount] = useState('1');
  const [isPaid, setIsPaid] = useState(false);

  // New Category Logic
  const [newCategoryMode, setNewCategoryMode] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Specific States
  const [selectedCardId, setSelectedCardId] = useState('');
  const [cardInstallments, setCardInstallments] = useState('1');

  const [subDay, setSubDay] = useState('1'); // Subscription Day

  const [selectedDebtId, setSelectedDebtId] = useState('');

  const subCategoriesList = useMemo(() => {
    return categoriesMap[category] || [];
  }, [category, categoriesMap]);

  // Reset form when tab changes
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setDescription('');
    setAmount('');
    setDay(new Date().getDate());
    setTime('');

    // Set Defaults per Tab
    if (tab === 'CONTAS FIXAS') {
      setCategory('Contas Fixas');
    } else if (tab === 'DÍVIDAS') {
      setCategory('Crediário/Dividas');
    } else if (tab === 'CARTÕES') {
      // Card transactions don't necessarily need a category if handled by CardService, 
      // but for the main transaction record we might want one.
      setCategory('Cartão de Crédito');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description && activeTab !== 'DÍVIDAS') return; // Debts might have default desc
    if (!amount && activeTab !== 'AGENDA') return; // AGENDA doesn't require amount

    const numAmount = amount ? parseFloat(amount.replace(',', '.')) : 0;
    const transactionDate = new Date(currentYear, currentMonth, day);

    // 1. RECEITA / DESPESA / AGENDA (Standard)
    if (activeTab === 'RECEITA' || activeTab === 'DESPESA' || activeTab === 'AGENDA') {
      const finalCategory = newCategoryMode ? newCategoryName : (activeTab === 'AGENDA' ? 'AGENDA' : category);
      const type = activeTab === 'RECEITA' ? 'income' : (activeTab === 'AGENDA' ? 'appointment' : 'expense');

      onAdd({
        day,
        month: currentMonth,
        year: currentYear,
        category: finalCategory,
        subCategory: activeTab === 'AGENDA' ? undefined : subCategory.trim(),
        description,
        amount: activeTab === 'AGENDA' ? 0 : numAmount,
        type: type,
        completed: isPaid,
        time: activeTab === 'AGENDA' ? time : undefined
      }, {
        installments: (isInstallment && activeTab === 'DESPESA') ? parseInt(installmentsCount) : 1,
        isFixed: activeTab === 'AGENDA' ? isFixed : (isFixed && type !== 'appointment')
      });
    }

    // 2. CARTÕES
    else if (activeTab === 'CARTÕES') {
      const card = cards.find(c => c.id === selectedCardId);
      if (!card) { alert('Selecione um cartão'); return; }

      const installments = CreditCardService.generateInstallments(
        card,
        description,
        numAmount,
        parseInt(cardInstallments) || 1,
        transactionDate,
        category
      );
      onAddCardTransaction(installments);
    }

    // 3. CONTAS FIXAS
    else if (activeTab === 'CONTAS FIXAS') {
      const newSub: Subscription = {
        id: Math.random().toString(36).substr(2, 9),
        name: description,
        amount: numAmount,
        day: parseInt(subDay) || 1,
        category: category,
        active: true
      };
      onAddSubscription(newSub);
    }

    // 4. DÍVIDAS
    else if (activeTab === 'DÍVIDAS') {
      if (!selectedDebtId) { alert('Selecione um crediário'); return; }
      onAddDebtTransaction(selectedDebtId, numAmount, description || 'Nova Compra', transactionDate);
    }

    // Reset basics
    setDescription('');
    setAmount('');
    setIsPaid(false);
  };

  return (
    <div className={`${isDarkMode ? 'bg-transparent text-white border-0' : 'bg-white p-5 rounded-xl shadow-sm border border-slate-200'} h-full flex flex-col`}>

      {/* TABS HEADER */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide mb-4 border-b border-white/10">
        {[
          { id: 'RECEITA', icon: DollarSign, color: 'text-emerald-400' },
          { id: 'DESPESA', icon: DollarSign, color: 'text-rose-400' },
          { id: 'AGENDA', icon: Calendar, color: 'text-indigo-400' },
          { id: 'CARTÕES', icon: CreditCardIcon, color: 'text-purple-400' },
          { id: 'CONTAS FIXAS', icon: RefreshCcw, color: 'text-blue-400' },
          { id: 'DÍVIDAS', icon: Receipt, color: 'text-amber-400' },
        ].map((tab: any) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap 
                ${activeTab === tab.id
                ? `bg-white/10 text-white border-b-2 ${tab.color.replace('text-', 'border-')}`
                : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}
          >
            <tab.icon size={12} className={activeTab === tab.id ? tab.color : ''} />
            {tab.id}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 flex-1">

        {/* === COMMON UPPER FIELDS === */}
        <div className="grid grid-cols-12 gap-3">

          {/* DATA (Todos) */}
          <div className={activeTab === 'AGENDA' ? 'col-span-6' : 'col-span-3'}>
            <label className="block text-[10px] font-bold mb-1 uppercase text-white/30">Dia</label>
            {(activeTab === 'CONTAS FIXAS') ? (
              <input type="number" min="1" max="31" value={subDay} onChange={(e) => setSubDay(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500/50 outline-none" placeholder="Venc." />
            ) : (
              <input type="number" min="1" max="31" value={day} onChange={(e) => setDay(parseInt(e.target.value))} className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500/50 outline-none" />
            )}
          </div>

          {/* HORA (Só AGENDA) */}
          {activeTab === 'AGENDA' && (
            <div className="col-span-6">
              <label className="block text-[10px] font-bold mb-1 uppercase text-white/30">Hora (Opcional)</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500/50 outline-none"
              />
            </div>
          )}

          {/* VALOR (Todos exceto AGENDA) */}
          {activeTab !== 'AGENDA' && (
            <div className="col-span-9">
              <label className="block text-[10px] font-bold mb-1 uppercase text-white/30">Valor (R$)</label>
              <input
                type="number" step="0.01"
                value={amount} onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500/50 outline-none placeholder:text-white/10 font-bold"
                placeholder="0,00"
              />
            </div>
          )}
        </div>

        {/* === SPECIFIC FIELDS === */}

        {/* 1. CARTÕES -> Select Card + Parcelas */}
        {activeTab === 'CARTÕES' && (
          <div className="grid grid-cols-2 gap-3 animate-fade-in">
            <div>
              <label className="block text-[10px] font-bold mb-1 uppercase text-white/30">Cartão</label>
              <select value={selectedCardId} onChange={e => setSelectedCardId(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none">
                <option value="">Selecione...</option>
                {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold mb-1 uppercase text-white/30">Parcelas</label>
              <input type="number" value={cardInstallments} onChange={e => setCardInstallments(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none" placeholder="1x" />
            </div>
          </div>
        )}

        {/* 2. DÍVIDAS -> Select Debt */}
        {activeTab === 'DÍVIDAS' && (
          <div className="animate-fade-in">
            <label className="block text-[10px] font-bold mb-1 uppercase text-white/30">Crediário / Dívida</label>
            <select value={selectedDebtId} onChange={e => setSelectedDebtId(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none">
              <option value="">Selecione o Crediário...</option>
              {debts.map(d => <option key={d.id} value={d.id}>{d.name} (Saldo: {d.currentBalance.toFixed(2)})</option>)}
            </select>
          </div>
        )}

        {/* DESCRIÇÃO (Standard) */}
        <div>
          <label className="block text-[10px] font-bold mb-1 uppercase tracking-wider text-white/30">Descrição / Nome</label>
          <input type="text" placeholder={activeTab === 'CONTAS FIXAS' ? "Ex: Netflix" : "Ex: Supermercado"} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500/50 outline-none placeholder:text-white/10" />
        </div>

        {/* CATEGORIA (Exceto Cartões, Dívidas e AGENDA) */}
        {activeTab !== 'CARTÕES' && activeTab !== 'DÍVIDAS' && activeTab !== 'AGENDA' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/30">Categoria</label>
                <button type="button" onClick={() => setNewCategoryMode(!newCategoryMode)} className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-widest">{newCategoryMode ? 'Selecionar' : '+ Nova'}</button>
              </div>
              {newCategoryMode ? (
                <input type="text" placeholder="Nova Categoria" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="w-full bg-indigo-500/10 border border-indigo-500/50 rounded-lg p-2.5 text-xs text-white outline-none" autoFocus />
              ) : (
                <select value={category} onChange={(e) => { setCategory(e.target.value); setSubCategory(''); }} className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none truncate">
                  {categories.map(cat => <option key={cat} value={cat} className="text-slate-800">{cat}</option>)}
                </select>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-bold mb-1 uppercase tracking-wider text-white/30">Subcategoria</label>
              <input type="text" list="sub-options" placeholder="Opcional" value={subCategory} onChange={(e) => setSubCategory(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none" />
              <datalist id="sub-options">{subCategoriesList.map(sub => <option key={sub} value={sub} />)}</datalist>
            </div>
          </div>
        )}

        {/* === OPTIONS TOGGLES === */}
        <div className="space-y-3 pt-2 mt-auto border-t border-white/10">
          <div className="flex flex-wrap items-center gap-4">

            {/* 1. JÁ PAGO (Only for Standard Income/Expense or Debt maybe?) */}
            {(activeTab === 'RECEITA' || activeTab === 'DESPESA' || activeTab === 'DÍVIDAS') && (
              <label className="flex items-center gap-2 cursor-pointer group w-full bg-slate-800/30 p-2 rounded-lg border border-white/5 hover:bg-slate-800/50 transition-all">
                <div className="relative flex items-center">
                  <input type="checkbox" checked={isPaid} onChange={e => setIsPaid(e.target.checked)} className="peer sr-only" />
                  <div className="w-9 h-5 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </div>
                <span className={`text-[11px] font-bold uppercase ${isPaid ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-300'}`}>
                  {isPaid ? 'Confirmado / Pago' : 'Marcar como Pago'}
                </span>
              </label>
            )}

            {/* 2. RECORRÊNCIA (Standard + AGENDA) */}
            {(activeTab === 'RECEITA' || activeTab === 'DESPESA' || activeTab === 'AGENDA') && (
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" checked={isFixed} onChange={e => setIsFixed(e.target.checked)} className="w-4 h-4 rounded text-indigo-600" />
                <div className="flex items-center gap-1 text-white/50 group-hover:text-white">
                  <Repeat size={14} className={isFixed ? 'text-indigo-600' : ''} />
                  <span className="text-[11px] font-bold uppercase">{activeTab === 'AGENDA' ? 'Compromisso Recorrente' : 'Mensal Fixo'}</span>
                </div>
              </label>
            )}

            {/* 3. PARCELAMENTO PADRÃO (Sem cartão) */}
            {(activeTab === 'DESPESA') && (
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" checked={isInstallment} onChange={e => { setIsInstallment(e.target.checked); if (e.target.checked) setIsFixed(false); }} className="w-4 h-4 rounded text-indigo-600" />
                <div className="flex items-center gap-1 text-white/50 group-hover:text-white">
                  <CreditCardIcon size={14} className={isInstallment ? 'text-indigo-600' : ''} />
                  <span className="text-[11px] font-bold uppercase">Parcelar (Manual)</span>
                </div>
              </label>
            )}

            {isInstallment && activeTab === 'DESPESA' && (
              <input type="number" value={installmentsCount} onChange={e => setInstallmentsCount(e.target.value)} className="w-16 bg-slate-900/50 border border-white/10 rounded p-1 text-xs text-white text-center" placeholder="Qtde" />
            )}
          </div>

          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg flex items-center justify-center gap-2 uppercase tracking-wide text-xs">
            <CheckCircle2 size={16} />
            Lançar {activeTab}
          </button>
        </div>
      </form>
    </div>
  );
};
