import React from 'react';
import { TransactionList } from './TransactionList';
import { DailyBalanceTable } from './DailyBalanceTable';
import { AdvancedDashboard } from './AdvancedDashboard';
import { TransactionForm } from './TransactionForm';
import { AppointmentsSidebarList } from './AppointmentsSidebarList';
import { CreditCardWidget } from './CreditCardWidget';
import { SubscriptionsWidget } from './SubscriptionsWidget';
import { DebtWidget } from './DebtWidget';
import { ApiService } from '../services/apiService';
import { Transaction, CreditCard, CardTransaction, Subscription, DebtAccount, DebtTransaction } from '../types';

interface DashboardProps {
  transactions: Transaction[];
  currentMonth: number;
  currentYear: number;
  summary: any;
  categoriesMap: Record<string, string[]>;
  setShowCategoryManager: (show: boolean) => void;
  setEditingTransaction: (t: Transaction | null) => void;
  handleDeleteRequest: (id: string) => void;
  updateTransactions: (action: 'add' | 'update' | 'delete', payload: any, optimisticUpdate: (prev: Transaction[]) => Transaction[]) => void;
  handleAddTransaction: (tData: Omit<Transaction, 'id'>, options: { installments: number, isFixed: boolean }) => void;
  cards: CreditCard[];
  setCards: React.Dispatch<React.SetStateAction<CreditCard[]>>;
  cardTransactions: CardTransaction[];
  setCardTransactions: React.Dispatch<React.SetStateAction<CardTransaction[]>>;
  handleDeleteCardTransaction: (id: string, cascade?: boolean) => void;
  handleEditCardTransaction: (id: string, updates: Partial<CardTransaction>, cascade?: boolean) => void;
  debts: DebtAccount[];
  setDebts: React.Dispatch<React.SetStateAction<DebtAccount[]>>;
  subscriptions: Subscription[];
  setSubscriptions: React.Dispatch<React.SetStateAction<Subscription[]>>;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterType: 'ALL' | 'income' | 'expense' | 'appointment';
  setFilterType: (type: 'ALL' | 'income' | 'expense' | 'appointment') => void;
  setSelectedDayFilter: (day: string) => void;
  handleDeleteSubscription: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  transactions,
  currentMonth,
  currentYear,
  summary,
  categoriesMap,
  setShowCategoryManager,
  setEditingTransaction,
  handleDeleteRequest,
  updateTransactions,
  handleAddTransaction,
  cards,
  setCards,
  cardTransactions,
  setCardTransactions,
  handleDeleteCardTransaction,
  handleEditCardTransaction,
  debts,
  setDebts,
  subscriptions,
  setSubscriptions,
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  selectedDayFilter,
  setSelectedDayFilter,
  handleDeleteSubscription
}) => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* LEFT COLUMN - 75% */}
        <div className="lg:col-span-9 space-y-8">
          {/* Extrato de Lançamentos */}
          <div className="glass-card rounded-3xl overflow-hidden p-1 shadow-sm border-white/40">
            <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <div className="w-1 h-6 bg-secondary-500 rounded-full"></div>
                Extrato de Lançamentos
              </h3>
            </div>
            <TransactionList
              transactions={transactions.filter(t => t.month === currentMonth && t.year === currentYear)}
              previousBalance={summary.previousBalance}
              previousExpectedBalance={summary.previousExpectedBalance}
              onDelete={(id) => handleDeleteRequest(id)}
              onEdit={setEditingTransaction}
              onMove={(id, d) => updateTransactions('update', { id, updates: { day: d } }, prev => prev.map(t => t.id === id ? { ...t, day: d } : t))}
              onToggleComplete={id => {
                const t = transactions.find(tx => tx.id === id);
                if (t) {
                  const newCompletedStatus = !t.completed;

                  // Debt Logic Integration
                  if (t.debtId) {
                    const debt = debts.find(d => d.id === t.debtId);
                    if (debt) {
                      if (newCompletedStatus) {
                        // Paying off -> Decrease Debt
                        const paymentTrans: DebtTransaction = {
                          id: Math.random().toString(36).substr(2, 9),
                          date: new Date().toISOString(),
                          description: 'Pagamento via Extrato',
                          amount: t.amount,
                          type: 'payment',
                          linkedTransactionId: t.id
                        };
                        setDebts(prev => prev.map(d => d.id === t.debtId ? {
                          ...d,
                          currentBalance: d.currentBalance - t.amount,
                          history: [paymentTrans, ...d.history]
                        } : d));
                      } else {
                        // Reverting payment -> Increase Debt back
                        setDebts(prev => prev.map(d => d.id === t.debtId ? {
                          ...d,
                          currentBalance: d.currentBalance + t.amount,
                          history: d.history.filter(h => h.linkedTransactionId !== t.id)
                        } : d));
                      }
                    }
                  }

                  updateTransactions('update', { id, updates: { completed: newCompletedStatus } }, prev => prev.map(tx => tx.id === id ? { ...tx, completed: newCompletedStatus } : tx));
                }
              }}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filterType={filterType}
              onFilterTypeChange={setFilterType}
              selectedDay={selectedDayFilter}
              onSelectedDayChange={setSelectedDayFilter}
              categoriesMap={categoriesMap}
              onManageCategories={() => setShowCategoryManager(true)}
            />
          </div>

          <DailyBalanceTable transactions={transactions.filter(t => t.month === currentMonth && t.year === currentYear)} previousBalance={summary.previousBalance} month={currentMonth} year={currentYear} />

          <AdvancedDashboard
            transactions={transactions.filter(t => t.month === currentMonth && t.year === currentYear)}
            allTransactions={transactions}
            currentMonth={currentMonth}
            year={currentYear}
            previousBalance={summary.previousBalance}
          />
        </div>

        {/* RIGHT COLUMN - 25% */}
        <div className="lg:col-span-3 space-y-6">

          {/* 1. LANÇAMENTOS */}
          <div className="bg-[#1e1e2d] p-6 rounded-3xl shadow-2xl border border-white/5">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <div className="w-1 h-6 bg-indigo-500 rounded-full"></div>
              LANÇAMENTOS
            </h3>
            <TransactionForm
              onAdd={handleAddTransaction}
              categoriesMap={categoriesMap}
              currentMonth={currentMonth}
              currentYear={currentYear}
              isDarkMode={true}

              // New Props
              cards={cards}
              debts={debts}
              subscriptions={subscriptions}

              onAddCardTransaction={(newTrans) => setCardTransactions(prev => [...prev, ...newTrans])}

              onAddSubscription={(newSub) => {
                setSubscriptions(prev => [...prev, newSub]);
              }}

              onAddDebtTransaction={(debtId, amount, description, date) => {
                // Create Transaction
                handleAddTransaction({
                  description: description,
                  amount: amount,
                  day: date.getDate(),
                  month: date.getMonth(),
                  year: date.getFullYear(),
                  type: 'expense',
                  category: 'Crediário/Dividas',
                  completed: false,
                  debtId: debtId
                }, { installments: 1, isFixed: false });

                const newDebtTrans: DebtTransaction = {
                  id: Math.random().toString(36).substr(2, 9),
                  date: date.toISOString(),
                  description: description,
                  amount: amount,
                  type: 'purchase'
                };

                setDebts(prev => prev.map(d => {
                  if (d.id === debtId) {
                    return {
                      ...d,
                      currentBalance: d.currentBalance + amount,
                      history: [newDebtTrans, ...d.history]
                    };
                  }
                  return d;
                }));
              }}
            />
          </div>

          {/* 2. Agenda (Fixed Height for Scroll) */}
          <div className="h-[450px]">
            <AppointmentsSidebarList
              transactions={transactions}
              currentMonth={currentMonth}
              currentYear={currentYear}
              onToggleComplete={(id) => {
                const t = transactions.find(tx => tx.id === id);
                if (t) {
                  updateTransactions('update', { id, updates: { completed: !t.completed } }, prev => prev.map(tx => tx.id === id ? { ...tx, completed: !tx.completed } : tx));
                }
              }}
              isDarkMode={true}
            />
          </div>

          {/* Widgets (Following Sequence) */}
          <div className="flex flex-col gap-6">
            <div className="h-[400px] overflow-hidden rounded-3xl shadow-2xl">
              <CreditCardWidget
                cards={cards}
                setCards={setCards}
                cardTransactions={cardTransactions}
                onAddTransaction={(newTrans) => setCardTransactions(prev => [...prev, ...newTrans])}
                onDeleteTransaction={handleDeleteCardTransaction}
                onEditTransaction={handleEditCardTransaction}
              />
            </div>

            <div className="h-[400px] overflow-hidden rounded-3xl shadow-2xl">
              <SubscriptionsWidget
                subscriptions={subscriptions}
                setSubscriptions={setSubscriptions}
                onDelete={handleDeleteSubscription}
                onSync={(sub) => {
                  handleAddTransaction({
                    description: sub.name,
                    amount: sub.amount,
                    day: sub.day,
                    month: currentMonth,
                    year: currentYear,
                    type: 'expense',
                    category: 'Contas Fixas',
                    completed: false,
                    isSubscription: true,
                    subscriptionId: sub.id,
                    isFixed: true,
                    installmentNumber: 1,
                    totalInstallments: 1
                  }, { installments: 1, isFixed: true });
                }}
              />
            </div>

            <div className="h-[400px] overflow-hidden rounded-3xl shadow-2xl">
              <DebtWidget
                debts={debts}
                setDebts={setDebts}
                onSchedulePay={(debtId, amount, name, date) => {
                  handleAddTransaction({
                    description: `Pagamento Crediário - ${name}`,
                    amount: amount,
                    day: date.getDate(),
                    month: date.getMonth(),
                    year: date.getFullYear(),
                    type: 'expense',
                    category: 'Crediário/Dividas',
                    completed: false,
                    debtId: debtId
                  }, { installments: 1, isFixed: false });
                }}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
