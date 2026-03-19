import React from 'react';
import { AppointmentPopup } from './AppointmentPopup';
import { EditTransactionModal } from './EditTransactionModal';
import { SettingsModal } from './SettingsModal';
import { CategoryManager } from './CategoryManager';
import { IntellicenterModal } from './IntellicenterModal';
import { ConfirmationModal } from './ConfirmationModal';
import { DraggableContainer } from './DraggableContainer';
import { Calculator } from './Calculator';
import { X } from 'lucide-react';
import { Transaction, CreditCard, DebtAccount, Subscription } from '../types';

interface ModalsLayerProps {
  user: any;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  categoriesMap: Record<string, string[]>;
  setCategoriesMap: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  editingTransaction: Transaction | null;
  setEditingTransaction: (t: Transaction | null) => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  showCategoryManager: boolean;
  setShowCategoryManager: (show: boolean) => void;
  showCalculator: boolean;
  setShowCalculator: (show: boolean) => void;
  showChat: boolean;
  setShowChat: (show: boolean) => void;
  confirmation: any;
  acknowledgedIds: Set<string>;
  setAcknowledgedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  handleUpdateTransactionRequest: (id: string, updates: Partial<Transaction>) => void;
  handlePartialPayment: (id: string, amount: number) => void;
  updateTransactions: (action: 'add' | 'update' | 'delete', payload: any, optimisticUpdate: (prev: Transaction[]) => Transaction[]) => void;
  summary: any;
  currentMonth: number;
  currentYear: number;
}

export const ModalsLayer: React.FC<ModalsLayerProps> = ({
  user,
  transactions,
  setTransactions,
  categoriesMap,
  setCategoriesMap,
  editingTransaction,
  setEditingTransaction,
  showSettings,
  setShowSettings,
  showCategoryManager,
  setShowCategoryManager,
  showCalculator,
  setShowCalculator,
  showChat,
  setShowChat,
  confirmation,
  acknowledgedIds,
  setAcknowledgedIds,
  handleUpdateTransactionRequest,
  handlePartialPayment,
  updateTransactions,
  summary,
  currentMonth,
  currentYear
}) => {
  return (
    <>
      <AppointmentPopup
        appointments={transactions.filter(t =>
          t.type === 'appointment' &&
          t.day === new Date().getDate() &&
          t.month === new Date().getMonth() &&
          !t.completed &&
          !acknowledgedIds.has(t.id)
        )}
        onAcknowledge={id => setAcknowledgedIds(prev => new Set([...prev, id]))}
      />

      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          categoriesMap={categoriesMap}
          onSave={(u) => {
            handleUpdateTransactionRequest(u.id, u);
            setEditingTransaction(null);
          }}
          onClose={() => setEditingTransaction(null)}
          onPartialPayment={handlePartialPayment}
        />
      )}

      {showSettings && (
        <SettingsModal
          transactions={transactions}
          categories={Object.keys(categoriesMap)}
          onImport={d => {
            setTransactions(d.transactions);
            if (d.categories) setCategoriesMap(prev => ({ ...prev, ...d.categories }));
          }}
          onClose={() => setShowSettings(false)}
          onOpenCategoryManager={() => {
            setShowSettings(false);
            setShowCategoryManager(true);
          }}
        />
      )}

      {showCategoryManager && (
        <CategoryManager
          categoriesMap={categoriesMap}
          setCategoriesMap={setCategoriesMap}
          onClose={() => setShowCategoryManager(false)}
        />
      )}

      {showCalculator && (
        <DraggableContainer>
          <div className="w-[320px] shadow-2xl rounded-xl overflow-hidden ring-1 ring-white/20">
            <div className="bg-slate-900 flex justify-between items-center px-4 py-2 border-b border-slate-800 handle cursor-move active:cursor-grabbing">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pointer-events-none">Calculadora</span>
              <button onClick={() => setShowCalculator(false)} className="text-slate-500 hover:text-white transition-colors"><X size={14} /></button>
            </div>
            <Calculator />
          </div>
        </DraggableContainer>
      )}

      <IntellicenterModal
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        transactions={transactions}
        currentMonth={currentMonth}
        currentYear={currentYear}
        currentBalance={summary.currentBalance}
        summary={summary}
        categoriesMap={categoriesMap}
        onAddTransaction={(t) => {
          updateTransactions('add', t, (prev) => [...prev, { ...t, id: Math.random().toString(36).substr(2, 9) }]);
        }}
        setCategoriesMap={setCategoriesMap}
      />

      {confirmation && (
        <ConfirmationModal
          isOpen={confirmation.isOpen}
          title={confirmation.title}
          message={confirmation.message}
          onConfirm={confirmation.onConfirm}
          onCancel={confirmation.onCancel}
          confirmLabel={confirmation.confirmLabel}
          cancelLabel={confirmation.cancelLabel}
          onAlternative={confirmation.onAlternative}
          alternativeLabel={confirmation.alternativeLabel}
          type={confirmation.type}
        />
      )}
    </>
  );
};
