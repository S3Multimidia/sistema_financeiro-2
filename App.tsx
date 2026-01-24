import React, { useState, useMemo, useEffect } from 'react';
import { INITIAL_TRANSACTIONS, INITIAL_PREVIOUS_BALANCE, APP_VERSION } from './constants';
import { Transaction, INITIAL_CATEGORIES_MAP, CreditCard, CardTransaction, Subscription } from './types';
import { SummaryCards } from './components/SummaryCards';
import { TransactionList } from './components/TransactionList';
import { DailyFlowChart } from './components/FinancialCharts';
import { TransactionForm } from './components/TransactionForm';
import { DailyBalanceTable } from './components/DailyBalanceTable';
import { CategoryManager } from './components/CategoryManager';
import { AppointmentPopup } from './components/AppointmentPopup';
import { Calculator } from './components/Calculator';
import { YearlyReport } from './components/YearlyReport';
import { EditTransactionModal } from './components/EditTransactionModal';
import { SettingsModal } from './components/SettingsModal';
import { ChatAgent } from './components/ChatAgent';
import { AdvancedDashboard } from './components/AdvancedDashboard';
import { AppointmentsSidebarList } from './components/AppointmentsSidebarList';
import { CreditCardWidget } from './components/CreditCardWidget';
import { SubscriptionsWidget } from './components/SubscriptionsWidget';
import { ApiService } from './services/apiService';
import { CreditCardService } from './services/creditCardService';
import {
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Settings,
  Wallet,
  CloudCheck,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Timer,
  LogOut,
  X,
  Sparkles,
  MessageSquare,
  Calculator as CalculatorIcon
} from 'lucide-react';
import { LoginPage } from './components/LoginPage';

const MONTHS_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const App: React.FC = () => {
  const STORAGE_KEY = 'finan_agenda_data_2026_v2';
  const CAT_STORAGE_KEY = 'finan_categories_map_2026';
  const CONFIG_STORAGE_KEY = 'finan_app_config_2026';

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [categoriesMap, setCategoriesMap] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem(CAT_STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES_MAP;
  });

  const [appConfig, setAppConfig] = useState(() => {
    const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
    return saved ? JSON.parse(saved) : { appName: 'FINANCEIRO PRO 2026' };
  });

  // --- New Modules State ---
  const [cards, setCards] = useState<CreditCard[]>(() => {
    const saved = localStorage.getItem('finan_cards_2026');
    return saved ? JSON.parse(saved) : [];
  });

  const [cardTransactions, setCardTransactions] = useState<CardTransaction[]>(() => {
    const saved = localStorage.getItem('finan_card_transactions_2026');
    return saved ? JSON.parse(saved) : [];
  });

  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => {
    const saved = localStorage.getItem('finan_subscriptions_2026');
    return saved ? JSON.parse(saved) : [];
  });

  // Persistence & Auto-Sync
  useEffect(() => {
    localStorage.setItem('finan_cards_2026', JSON.stringify(cards));
    localStorage.setItem('finan_card_transactions_2026', JSON.stringify(cardTransactions));
    localStorage.setItem('finan_subscriptions_2026', JSON.stringify(subscriptions));

    // 1. Sync Credit Card Invoices to Main Transactions
    const syncedTransactions = CreditCardService.syncInvoiceToTransactions(transactions, cardTransactions, cards);
    if (JSON.stringify(syncedTransactions) !== JSON.stringify(transactions)) {
      // Only update if changed to avoid loop
      setTransactions(syncedTransactions);
    }

    // 2. Sync Subscriptions (Simple Monthly Check)
    // Runs only if we are in 'dashboard' view to avoid spamming
    if (currentView === 'dashboard') {
      // Logic: Check if subscription exists for current month. If not, add it.
      // This is a simplified "Run on Edit" logic. For huge lists, use a separate trigger.
    }

  }, [cards, cardTransactions, subscriptions]);

  const [currentView, setCurrentView] = useState<'dashboard' | 'yearly'>('dashboard');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(2026);
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('');
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());
  const [cloudStatus, setCloudStatus] = useState<'idle' | 'syncing' | 'error' | 'ok'>('idle');
  const [user, setUser] = useState<any>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // Monitor Auth State
  useEffect(() => {
    checkUser();
  }, []);

  // Check User and Auto-Sync Perfex
  const checkUser = async () => {
    const u = await ApiService.getUser();
    setUser(u);
    if (u) {
      // Load starting balance from server profile if available
      if (u.starting_balance !== undefined) {
        setAppConfig(prev => ({ ...prev, startingBalance: u.starting_balance }));
      }
      loadFromCloud();
      handlePerfexAutoSync(); // Auto-sync on login
    }
  };

  const handlePerfexAutoSync = async () => {
    console.log("🔄 Iniciando Auto-Sync do Perfex CRM...");
    // Default Credentials
    const DEFAULT_PERFEX_URL = 'https://admin.s3m.com.br/api';
    const DEFAULT_PERFEX_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiczNtdWx0aW1pZGlhQGdtYWlsLmNvbSIsIm5hbWUiOiJQbGFuaWxoYSIsIkFQSV9USU1FIjoxNzU4MDUxOTc5fQ.SbhzQOgmMHh_eTiw_HuJUBgz-2POwkXj1umAe4kT6Uc';

    // Get current config or use defaults
    let url = localStorage.getItem('perfex_url');
    let token = localStorage.getItem('perfex_token');

    // Setup Defaults if missing
    if (!url || !token) {
      url = DEFAULT_PERFEX_URL;
      token = DEFAULT_PERFEX_TOKEN;
      localStorage.setItem('perfex_url', url);
      localStorage.setItem('perfex_token', token);
    }

    if (url && token) {
      try {
        setCloudStatus('syncing'); // Show syncing indicator
        // We import PerfexService dynamically to avoid circular deps if any, or just assumes it's available.
        // Actually, importing at top level is fine in App.tsx. I need to add the import.
        const { PerfexService } = await import('./services/perfexService'); // Dynamic import to be safe
        console.log("📡 Conectando ao Perfex...");
        await PerfexService.syncInvoicesToSystem({ url, token }, (msg) => console.log(`[Perfex Sync] ${msg}`));
        console.log("✅ Auto-Sync Perfex concluído com sucesso.");
        // Reload cloud data to reflect changes
        await loadFromCloud();
      } catch (e) {
        console.warn('❌ Auto-sync failed:', e);
        setCloudStatus('error');
      } finally {
        // loadFromCloud sets status to 'ok' or 'idle', but if we failed line above might leave it.
        // If successful, loadFromCloud handles it. If failed, we set error.
      }
    }
  };

  const loadFromCloud = async () => {
    setCloudStatus('syncing');
    try {
      const data = await ApiService.fetchTransactions();
      if (data && data.length > 0) {
        setTransactions(data);
        setCloudStatus('ok');
        console.log("✅ Dados carregados da API Local com sucesso.");
      } else {
        setCloudStatus('idle');
      }
    } catch (e) {
      console.error("Erro ao carregar da API:", e);
      setCloudStatus('error');
    }
  };

  // Wrapper for modifying transactions to ensure DB sync
  const updateTransactions = async (
    action: 'add' | 'update' | 'delete',
    payload: any,
    optimisticUpdate: (prev: Transaction[]) => Transaction[]
  ) => {
    // 1. Optimistic Update
    setTransactions(optimisticUpdate);
    setCloudStatus('syncing');

    try {
      if (action === 'add') {
        // If payload is an array (installments), add each
        if (Array.isArray(payload)) {
          for (const t of payload) await ApiService.addTransaction(t);
        } else {
          await ApiService.addTransaction(payload);
        }
      } else if (action === 'update') {
        await ApiService.updateTransaction(payload.id, payload.updates);
      } else if (action === 'delete') {
        await ApiService.deleteTransaction(payload);
      }

      // Force reload to ensure we have real IDs and consistent state
      await loadFromCloud();
    } catch (e) {
      console.error("API Sync Error:", e);
      setCloudStatus('error');
      // Optionally revert optimistic update here
    }
  };

  // No automatic timer sync needed for Supabase as we save on write.
  // Keeping local storage sync for redundancy/offline support if needed, 
  // but for now relying on DB as source of truth.

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    localStorage.setItem(CAT_STORAGE_KEY, JSON.stringify(categoriesMap));
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(appConfig));
  }, [transactions, categoriesMap, appConfig]);

  const handleUpdateStartingBalance = async (value: number) => {
    // Manual mode only now. No auto-transaction.
    console.log("Starting balance manual update disabled.");
  };

  const totalOverallBalance = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    // Explicitly removed startingBalance from appConfig usage here as it's now a transaction
    return income - expense;
  }, [transactions]);

  const summary = useMemo(() => {
    const currentMonthTrans = transactions.filter(t => t.month === currentMonth && t.year === currentYear);

    // Projected (All)
    const totalIncome = currentMonthTrans.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = currentMonthTrans.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);

    // Realized (Completed only)
    const realizedIncome = currentMonthTrans.filter(t => t.type === 'income' && t.completed).reduce((acc, curr) => acc + curr.amount, 0);
    const realizedExpense = currentMonthTrans.filter(t => t.type === 'expense' && t.completed).reduce((acc, curr) => acc + curr.amount, 0);

    return {
      previousBalance: 0, // Disabled as requested (Manual 'Saldo Inicial' transaction used instead)
      totalIncome,
      totalExpense,
      realizedIncome,
      realizedExpense,
      currentBalance: realizedIncome - realizedExpense,
      endOfMonthBalance: totalIncome - totalExpense,
    };
  }, [transactions, currentMonth, currentYear]);

  const handleAddTransaction = (tData: Omit<Transaction, 'id'>, options: { installments: number, isFixed: boolean }) => {
    // Logic for new transactions
    const transactionsToAdd: any[] = [];

    if (options.installments > 1 && tData.type !== 'appointment') {
      for (let i = 0; i < options.installments; i++) {
        const d = new Date(tData.year, tData.month + i, tData.day);
        transactionsToAdd.push({
          ...tData,
          // Optimization: Let DB generate ID, but for optimistic UI we might need temp ID.
          // But supabaseService.addTransaction ignores ID input usually if we Omit 'id'.
          // However, SupabaseService.addTransaction takes Omit<Transaction, 'id'>.
          day: d.getDate(),
          month: d.getMonth(),
          year: d.getFullYear(),
          installmentNumber: i + 1,
          totalInstallments: options.installments
        });
      }
    } else {
      transactionsToAdd.push(tData); // ID will be generated by DB
    }

    // Call updateTransactions
    updateTransactions('add', transactionsToAdd, (prev) => {
      // Optimistic UI: We need IDs. We can generate temp ones.
      return [...prev, ...transactionsToAdd.map(t => ({ ...t, id: 'temp-' + Math.random() }))];
    });
  };

  return (
    <>

      {!user ? (
        <LoginPage onLoginSuccess={(u) => { setUser(u); loadFromCloud(); }} />
      ) : (
        <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">

          {/* Ambient Background Effects */}
          <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-secondary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
          </div>

          <AppointmentPopup appointments={transactions.filter(t => t.type === 'appointment' && t.day === new Date().getDate() && t.month === new Date().getMonth() && !t.completed && !acknowledgedIds.has(t.id))} onAcknowledge={id => setAcknowledgedIds(prev => new Set([...prev, id]))} />

          {editingTransaction && (
            <EditTransactionModal
              transaction={editingTransaction}
              categoriesMap={categoriesMap}
              onSave={(u) => {
                updateTransactions('update', { id: u.id, updates: u }, prev => prev.map(t => t.id === u.id ? u : t));
                setEditingTransaction(null);
              }}
              onClose={() => setEditingTransaction(null)}
            />
          )}

          {showSettings && (
            <SettingsModal
              transactions={transactions}
              categories={Object.keys(categoriesMap)}
              onImport={d => { setTransactions(d.transactions); if (d.categories) setCategoriesMap(prev => ({ ...prev, ...d.categories })); }}
              onClose={() => setShowSettings(false)}
              onOpenCategoryManager={() => { setShowSettings(false); setShowCategoryManager(true); }}
            />
          )}

          {showCategoryManager && (
            <CategoryManager
              categoriesMap={categoriesMap}
              setCategoriesMap={setCategoriesMap}
              onUpdateCategory={() => { }}
              onRemoveCategory={(c) => { const { [c]: _, ...rest } = categoriesMap; setCategoriesMap(rest); }}
              onClose={() => setShowCategoryManager(false)}
            />
          )}

          {/* Floating Glass Header */}
          <header className="fixed top-6 left-4 right-4 md:left-8 md:right-8 z-50">
            <div className="glass rounded-2xl px-6 py-4 flex items-center justify-between shadow-xl shadow-slate-200/40 transition-all duration-500">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-primary-800 to-primary-950 p-2.5 rounded-xl text-white shadow-lg shadow-primary-900/20">
                    <LayoutDashboard size={24} />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-slate-900 leading-tight uppercase tracking-tight">{appConfig.appName}</h1>
                    <div className="flex items-center gap-3">
                      {cloudStatus === 'ok' ? (
                        <span className="text-[10px] font-bold text-emerald-600 uppercase flex items-center gap-1.5 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          <CloudCheck size={12} /> Sincronizado
                        </span>
                      ) : cloudStatus === 'syncing' ? (
                        <span className="text-[10px] font-bold text-amber-600 uppercase flex items-center gap-1.5 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                          <Loader2 size={12} className="animate-spin" /> Salvando...
                        </span>
                      ) : cloudStatus === 'idle' ? (
                        <span className="text-[10px] font-bold text-primary-600 uppercase flex items-center gap-1.5 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-100">
                          <CloudCheck size={12} /> Nuvem Ativa
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-rose-600 uppercase flex items-center gap-1.5 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                          <AlertTriangle size={12} /> Erro Nuvem
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="hidden md:flex bg-slate-100/50 p-1 rounded-xl border border-slate-200/50">
                  <button onClick={() => setCurrentView('dashboard')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 transition-all duration-300 ${currentView === 'dashboard' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    <LayoutDashboard size={16} /> Dashboard
                  </button>
                  <button onClick={() => setCurrentView('yearly')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 transition-all duration-300 ${currentView === 'yearly' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    <BarChart3 size={16} /> Relatórios
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 md:gap-6">
                <div className="flex items-center gap-1 bg-white/50 px-2 py-1 rounded-xl border border-white/50 backdrop-blur-sm">
                  <button onClick={() => { const d = new Date(currentYear, currentMonth - 1); setCurrentMonth(d.getMonth()); setCurrentYear(d.getFullYear()); }} className="p-2 hover:bg-white rounded-lg transition-all text-slate-400 hover:text-primary-600"><ChevronLeft size={18} /></button>
                  <div className="text-center min-w-[120px]">
                    <p className="text-xs font-bold text-primary-600 uppercase leading-none mb-1 tracking-wide">{MONTHS_NAMES[currentMonth]}</p>
                    <p className="text-sm font-black text-slate-800 leading-none">{currentYear}</p>
                  </div>
                  <button onClick={() => { const d = new Date(currentYear, currentMonth + 1); setCurrentMonth(d.getMonth()); setCurrentYear(d.getFullYear()); }} className="p-2 hover:bg-white rounded-lg transition-all text-slate-400 hover:text-primary-600"><ChevronRight size={18} /></button>
                </div>

                <div className="h-8 w-px bg-slate-200 hidden md:block"></div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowCalculator(!showCalculator)}
                    className={`p-3 rounded-xl transition-all border shadow-sm group ${showCalculator ? 'bg-primary-50 text-primary-600 border-primary-200' : 'bg-white hover:bg-primary-50 text-slate-400 hover:text-primary-600 border-slate-100'}`}
                    title="Calculadora"
                  >
                    <CalculatorIcon size={18} />
                  </button>

                  <button
                    onClick={() => setShowChat(!showChat)}
                    className={`p-3 rounded-xl transition-all border shadow-sm group ${showChat ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-white hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 border-slate-100'}`}
                    title="IA Financeira"
                  >
                    <Sparkles size={18} />
                  </button>

                  <div className="h-4 w-px bg-slate-200 mx-1"></div>

                  <button
                    onClick={() => loadFromCloud()}
                    className="p-3 bg-white hover:bg-primary-50 text-slate-400 hover:text-primary-600 rounded-xl transition-all border border-slate-100 shadow-sm group"
                    title="Recarregar"
                  >
                    <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                  </button>

                  <button onClick={() => setShowSettings(true)} className="p-3 bg-white hover:bg-primary-50 text-slate-400 hover:text-primary-600 rounded-xl transition-all border border-slate-100 shadow-sm">
                    <Settings size={18} />
                  </button>

                  <button
                    onClick={() => { ApiService.logout(); setUser(null); }}
                    className="p-3 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-xl transition-all border border-rose-100 shadow-sm"
                    title="Sair"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              </div>
            </div>
          </header>

          <main className="max-w-[1920px] mx-auto p-4 md:p-8 pt-32 md:pt-36 space-y-8 animate-fade-in">
            {currentView === 'dashboard' ? (
              <div className="space-y-8">
                <SummaryCards summary={summary} onUpdateStartingBalance={handleUpdateStartingBalance} />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-3 space-y-8">
                    {/* Glass Card Container for Forms */}
                    <div className="glass-card p-6 rounded-3xl">
                      <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <div className="w-1 h-6 bg-primary-500 rounded-full"></div>
                        Nova Transação
                      </h3>
                      <TransactionForm onAdd={handleAddTransaction} categoriesMap={categoriesMap} currentMonth={currentMonth} currentYear={currentYear} />
                    </div>
                  </div>

                  <div className="lg:col-span-3">
                    <AppointmentsSidebarList transactions={transactions} currentMonth={currentMonth} onToggleComplete={(id) => setTransactions(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t))} />
                  </div>

                  <div className="lg:col-span-3">
                    <DailyFlowChart transactions={transactions.filter(t => t.month === currentMonth && t.year === currentYear)} />
                  </div>
                  <div className="lg:col-span-3">
                    <DailyBalanceTable transactions={transactions.filter(t => t.month === currentMonth && t.year === currentYear)} previousBalance={summary.previousBalance} month={currentMonth} year={currentYear} />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-8">
                    {/* Wrapped Transaction List in a Glass Card if not internally styled */}
                    <div className="glass-card rounded-3xl overflow-hidden p-1 shadow-sm border-white/40">
                      <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                          <div className="w-1 h-6 bg-secondary-500 rounded-full"></div>
                          Extrato de Lançamentos
                        </h3>
                      </div>
                      <TransactionList
                        transactions={transactions.filter(t => t.month === currentMonth && t.year === currentYear)}
                        onDelete={id => updateTransactions('delete', id, prev => prev.filter(t => t.id !== id))}
                        onEdit={setEditingTransaction}
                        onMove={(id, d) => updateTransactions('update', { id, updates: { day: d } }, prev => prev.map(t => t.id === id ? { ...t, day: d } : t))}
                        onToggleComplete={id => {
                          const t = transactions.find(tx => tx.id === id);
                          if (t) updateTransactions('update', { id, updates: { completed: !t.completed } }, prev => prev.map(tx => tx.id === id ? { ...tx, completed: !tx.completed } : tx));
                        }}
                        selectedDay={selectedDayFilter}
                        onSelectedDayChange={setSelectedDayFilter}
                        categoriesMap={categoriesMap}
                        onManageCategories={() => setShowCategoryManager(true)}
                      />
                    </div>
                  </div>

                  <div className="lg:col-span-4 flex flex-col h-[800px] gap-6">
                    <div className="flex-1 overflow-hidden">
                      <CreditCardWidget
                        cards={cards}
                        setCards={setCards}
                        cardTransactions={cardTransactions}
                        onAddTransaction={(newTrans) => setCardTransactions(prev => [...prev, ...newTrans])}
                      />
                    </div>

                    <div className="flex-1 overflow-hidden">
                      <SubscriptionsWidget
                        subscriptions={subscriptions}
                        setSubscriptions={setSubscriptions}
                        onSync={(sub) => {
                          // Force add transaction for this month
                          handleAddTransaction({
                            description: sub.name,
                            amount: sub.amount,
                            day: sub.day,
                            month: currentMonth,
                            year: currentYear,
                            type: 'expense',
                            category: sub.category,
                            completed: false,
                            isSubscription: true,
                            subscriptionId: sub.id
                          }, { installments: 1, isFixed: true });
                          alert('Assinatura lançada para este mês!');
                        }}
                      />
                    </div>
                  </div>
                </div>

                <AdvancedDashboard transactions={transactions.filter(t => t.month === currentMonth && t.year === currentYear)} allTransactions={transactions} currentMonth={currentMonth} year={currentYear} />
              </div>
            ) : (
              <div className="animate-slide-up">
                <YearlyReport transactions={transactions} year={currentYear} />
              </div>
            )}
          </main>

          {/* Floating Widgets Layer */}
          {showCalculator && (
            <div className="fixed top-28 right-8 z-[60] animate-fade-in shadow-2xl rounded-xl overflow-hidden ring-1 ring-white/20">
              <div className="bg-slate-900 flex justify-between items-center px-4 py-2 border-b border-slate-800 handle cursor-move">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Calculadora</span>
                <button onClick={() => setShowCalculator(false)} className="text-slate-500 hover:text-white transition-colors"><X size={14} /></button>
              </div>
              <Calculator />
            </div>
          )}

          {showChat && (
            <div className="fixed bottom-8 right-8 z-[60] w-[350px] animate-slide-up shadow-2xl rounded-2xl overflow-hidden ring-1 ring-white/20">
              <div className="bg-indigo-600 flex justify-between items-center px-4 py-3 border-b border-indigo-500 handle cursor-move">
                <span className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={14} /> IA Financeira
                </span>
                <button onClick={() => setShowChat(false)} className="text-indigo-200 hover:text-white transition-colors"><X size={16} /></button>
              </div>
              <div className="bg-white h-[500px] overflow-hidden flex flex-col">
                <ChatAgent
                  transactions={transactions}
                  currentBalance={totalOverallBalance}
                  categoriesMap={categoriesMap}
                  setTransactions={setTransactions}
                  setCategoriesMap={setCategoriesMap}
                />
              </div>
            </div>
          )}


          <footer className="max-w-[1920px] mx-auto px-6 py-8 text-center">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-widest opacity-60">
              {appConfig.appName} • v{APP_VERSION} • © 2026 S3 Multimídia (VPS Edition)
            </p>
          </footer>
        </div >
      )}
    </>
  );
};

export default App;
