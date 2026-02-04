import React, { useState, useMemo, useEffect } from 'react';
import { INITIAL_TRANSACTIONS, INITIAL_PREVIOUS_BALANCE, APP_VERSION } from './constants';
import { Transaction, INITIAL_CATEGORIES_MAP, CreditCard, CardTransaction, Subscription, DebtAccount, DebtTransaction } from './types';
import { SummaryCards } from './components/SummaryCards';
import { TransactionList } from './components/TransactionList';
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
import { DebtWidget } from './components/DebtWidget';
import { ApiService } from './services/apiService';
import { CreditCardService } from './services/creditCardService';
import { SubscriptionService } from './services/subscriptionService';
import { ConfirmationModal } from './components/ConfirmationModal';
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
  Calculator as CalculatorIcon,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  CalendarCheck,
  Search,
  Calendar,
  ChevronDown,
  Filter,
  Clock
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

  const [debts, setDebts] = useState<DebtAccount[]>(() => {
    const saved = localStorage.getItem('finan_debts_2026');
    return saved ? JSON.parse(saved) : [];
  });

  // Persistence & Auto-Sync
  useEffect(() => {
    localStorage.setItem('finan_cards_2026', JSON.stringify(cards));
    localStorage.setItem('finan_card_transactions_2026', JSON.stringify(cardTransactions));
    localStorage.setItem('finan_subscriptions_2026', JSON.stringify(subscriptions));
    localStorage.setItem('finan_debts_2026', JSON.stringify(debts));

    // 1. Sync Credit Card Invoices to Main Transactions
    let syncedTransactions = CreditCardService.syncInvoiceToTransactions(transactions, cardTransactions, cards);

    // 2. Sync Subscriptions (Forecast next 12 months)
    syncedTransactions = SubscriptionService.syncSubscriptions(syncedTransactions, subscriptions);

    if (JSON.stringify(syncedTransactions) !== JSON.stringify(transactions)) {
      // Only update if changed to avoid loop
      setTransactions(syncedTransactions);
    }

  }, [cards, cardTransactions, subscriptions, transactions]);

  const [currentView, setCurrentView] = useState<'dashboard' | 'yearly'>('dashboard');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(2026);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('');
  const [filterType, setFilterType] = useState<'ALL' | 'income' | 'expense' | 'appointment'>('ALL');
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
    // 1. Check Global Config (Cloud)
    let globalConfig = null;
    try {
      globalConfig = await ApiService.getPerfexConfig();
      if (globalConfig) {
        // Sync Local with Global
        localStorage.setItem('perfex_sync_enabled', String(globalConfig.enabled !== false));
        if (globalConfig.url) localStorage.setItem('perfex_url', globalConfig.url);
        if (globalConfig.token) localStorage.setItem('perfex_token', globalConfig.token);
      }
    } catch (e) { console.warn('Could not fetch global perfex config, using local.'); }

    // 2. Decide based on (Global > Local)
    const isSyncEnabled = globalConfig ? (globalConfig.enabled !== false) : (localStorage.getItem('perfex_sync_enabled') !== 'false');

    if (!isSyncEnabled) {
      console.log("🚫 Auto-Sync Perfex DESATIVADO (Global/Local Settings). Ignorando.");
      return;
    }

    console.log("🔄 Iniciando Auto-Sync do Perfex CRM...");
    // Default Credentials
    const DEFAULT_PERFEX_URL = 'https://admin.s3m.com.br/api';
    const DEFAULT_PERFEX_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiczNtdWx0aW1pZGlhQGdtYWlsLmNvbSIsIm5hbWUiOiJQbGFuaWxoYSIsIkFQSV9USU1FIjoxNzU4MDUxOTc5fQ.SbhzQOgmMHh_eTiw_HuJUBgz-2POwkXj1umAe4kT6Uc';

    // Get current config (Prioritise Global -> Local -> Default)
    let url = globalConfig?.url || localStorage.getItem('perfex_url');
    let token = globalConfig?.token || localStorage.getItem('perfex_token');

    // Setup Defaults if missing
    if (!url || !token) {
      url = DEFAULT_PERFEX_URL;
      token = DEFAULT_PERFEX_TOKEN;
      localStorage.setItem('perfex_url', url);
      localStorage.setItem('perfex_token', token);
    }

    // Save defaults to global if first run and we have defaults but nothing upstream? 
    // Maybe too aggressive. Let's just use them.

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
    try {
      setCloudStatus('syncing');
      const [
        cloudTransactions,
        cloudDebts,
        cloudCards,
        cloudSubs,
        cloudCardTrans
      ] = await Promise.all([
        ApiService.fetchTransactions(),
        ApiService.fetchDebts(),
        ApiService.fetchCards(),
        ApiService.fetchSubscriptions(),
        ApiService.fetchCardTransactions()
      ]);

      console.log('☁️ Cloud Data Loaded:', {
        trans: cloudTransactions.length,
        debts: cloudDebts.length,
        cards: cloudCards.length,
        subs: cloudSubs.length,
        cardTrans: cloudCardTrans.length
      });

      // 1. Debts
      if (cloudDebts && cloudDebts.length > 0) setDebts(cloudDebts);

      // 2. Cards
      if (cloudCards && cloudCards.length > 0) setCards(cloudCards);

      // 3. Subscriptions
      if (cloudSubs && cloudSubs.length > 0) setSubscriptions(cloudSubs);

      // 4. Card Transactions
      if (cloudCardTrans && cloudCardTrans.length > 0) setCardTransactions(cloudCardTrans);

      // 5. Main Transactions (Replace Strategy)
      if (cloudTransactions && cloudTransactions.length > 0) {
        // Sort
        const sorted = [...cloudTransactions].sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          if (a.month !== b.month) return b.month - a.month;
          return b.day - a.day;
        });
        setTransactions(sorted);
      } else if (cloudTransactions) {
        if (transactions.length === 0) setTransactions([]);
      }

      // 6. Categories (Sync)
      const cloudCats = await ApiService.fetchCategories();
      if (cloudCats && Object.keys(cloudCats).length > 0) {
        console.log("📂 Categories Loaded from Cloud");
        setCategoriesMap(cloudCats);
      }

      setCloudStatus('ok');
    } catch (error) {
      console.error("Erro ao carregar da nuvem:", error);
      setCloudStatus('error');
    }
  };

  // --- Auto-Sync Effects for New Entities ---

  // Sync Categories
  useEffect(() => {
    // Debounce to avoid spamming API on every keystroke in manager
    const timer = setTimeout(() => {
      if (categoriesMap && Object.keys(categoriesMap).length > 0) {
        ApiService.saveCategories(categoriesMap);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [categoriesMap]);

  // Sync Debts
  useEffect(() => {
    const timer = setTimeout(() => ApiService.syncDebts(debts), 2000);
    return () => clearTimeout(timer);
  }, [debts]);

  // Sync Cards
  useEffect(() => {
    const timer = setTimeout(() => ApiService.syncCards(cards), 2000);
    return () => clearTimeout(timer);
  }, [cards]);

  // Sync Subscriptions
  useEffect(() => {
    const timer = setTimeout(() => ApiService.syncSubscriptionsData(subscriptions), 2000);
    return () => clearTimeout(timer);
  }, [subscriptions]);

  // Sync Card Transactions
  useEffect(() => {
    const timer = setTimeout(() => ApiService.syncCardTransactions(cardTransactions), 3000);
    return () => clearTimeout(timer);
  }, [cardTransactions]);

  // Wrapper for modifying transactions to ensure DB sync
  const updateTransactions = async (
    action: 'add' | 'update' | 'delete',
    payload: any,
    optimisticUpdate: (prev: Transaction[]) => Transaction[]
  ) => {

    // CUSTOM LOGIC: Debt Amount Update (Sync Back to Debt Balance)
    if (action === 'update' && payload.updates.amount !== undefined) {
      const t = transactions.find(tx => tx.id === payload.id);
      if (t && t.debtId) {
        const diff = t.amount - payload.updates.amount;
        setDebts(prev => prev.map(d => d.id === t.debtId ? {
          ...d,
          currentBalance: d.currentBalance + diff
        } : d));
      }
    }

    // CUSTOM LOGIC: Cascade Update for Fixed Monthly (Grouped)
    if (action === 'update') {
      const transToEdit = transactions.find(t => t.id === payload.id);
      if (transToEdit && transToEdit.isFixed && transToEdit.installmentId && transToEdit.installmentId.startsWith('fixed_')) {
        const updates = payload.updates;
        const isRelevantChange = updates.amount !== undefined || updates.day !== undefined || updates.description !== undefined || updates.category !== undefined;

        if (isRelevantChange && payload.cascade === true) {
          const startMonthParams = (transToEdit.year * 12) + transToEdit.month;
          const groupTransactions = transactions.filter(t =>
            t.installmentId === transToEdit.installmentId &&
            ((t.year * 12) + t.month) >= startMonthParams
          );

          // Prepare updates excluding month/year to preserve series sequence
          const { month, year, id, ...safeUpdates } = updates;

          // Apply to Local State
          setTransactions(prev => prev.map(t => {
            if (groupTransactions.find(g => g.id === t.id)) {
              return { ...t, ...safeUpdates };
            }
            return t;
          }));

          // Apply to Cloud
          setCloudStatus('syncing');
          try {
            for (const t of groupTransactions) {
              await ApiService.updateTransaction(t.id, safeUpdates);
            }
            await loadFromCloud();
            return; // Exit handled
          } catch (e) { console.error("Error updating fixed group", e); }
        }
      }
    }

    // CUSTOM LOGIC: Reverse Sync for Debts (Delete Payment -> Increase Debt)
    if (action === 'delete') {
      // Payload might be object {id, cascade} or just string id
      const idToDelete = typeof payload === 'object' ? payload.id : payload;
      const cascade = typeof payload === 'object' ? payload.cascade : false;

      const transactionToDelete = transactions.find(t => t.id === idToDelete);

      if (transactionToDelete && transactionToDelete.debtId) {
        const debt = debts.find(d => d.id === transactionToDelete.debtId);
        if (debt) {
          setDebts(prev => prev.map(d => d.id === debt.id ? {
            ...d,
            currentBalance: d.currentBalance + transactionToDelete.amount,
            history: d.history ? d.history.filter(h => h.linkedTransactionId !== transactionToDelete.id) : []
          } : d));
        }
      }

      // CUSTOM LOGIC: Cascade Delete for Fixed Monthly (Grouped)
      if (transactionToDelete && transactionToDelete.isFixed && transactionToDelete.installmentId && transactionToDelete.installmentId.startsWith('fixed_')) {
        if (cascade === true) {
          const startMonthParams = (transactionToDelete.year * 12) + transactionToDelete.month;
          const groupTransactions = transactions.filter(t =>
            t.installmentId === transactionToDelete.installmentId &&
            ((t.year * 12) + t.month) >= startMonthParams
          );

          const idsToDelete = groupTransactions.map(t => t.id);

          // Optimistic UI
          setTransactions(prev => prev.filter(t => !idsToDelete.includes(t.id)));

          // Cloud Sync
          try {
            for (const id of idsToDelete) {
              await ApiService.deleteTransaction(id);
            }
            await loadFromCloud();
            return; // Exit as handled
          } catch (e) { console.error("Error deleting fixed group", e); }
        }
      }

      // CUSTOM LOGIC: Cascade Delete for Subscriptions
      if (transactionToDelete && transactionToDelete.isSubscription && transactionToDelete.subscriptionId) {
        if (cascade === true) {
          const futureTransactions = transactions.filter(t =>
            t.isSubscription &&
            t.subscriptionId === transactionToDelete.subscriptionId &&
            (t.year > transactionToDelete.year || (t.year === transactionToDelete.year && t.month >= transactionToDelete.month))
          );

          setTransactions(prev => prev.filter(t => !futureTransactions.map(ft => ft.id).includes(t.id)));
          setCloudStatus('syncing');

          try {
            for (const ft of futureTransactions) {
              await ApiService.deleteTransaction(ft.id);
            }
            const subId = transactionToDelete.subscriptionId;
            const sub = subscriptions.find(s => s.id === subId);
            if (sub) {
              setSubscriptions(prev => prev.map(s => s.id === subId ? { ...s, active: false } : s));
            }
            await loadFromCloud();
            return;
          } catch (e) {
            console.error("Cascade Delete Error:", e);
            setCloudStatus('error');
            return;
          }
        }
      }
    }

    // 1. Optimistic Update (Normal Flow)
    if (optimisticUpdate) setTransactions(optimisticUpdate);
    setCloudStatus('syncing');

    try {
      if (action === 'add') {
        if (Array.isArray(payload)) {
          for (const t of payload) await ApiService.addTransaction(t);
        } else {
          await ApiService.addTransaction(payload);
        }
      } else if (action === 'update') {
        // Auto-Detect Virtual Transaction (Subscription not yet saved)
        // If ID is not UUID, it's a local virtual ID. We must INSERT instead of UPDATE.
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(payload.id)) {
          const existing = transactions.find(t => t.id === payload.id);
          if (existing) {
            const { id: virtualId, ...toInsert } = { ...existing, ...payload.updates };
            // Ensure we keep isSubscription flags if they exist (they should be in 'existing')
            await ApiService.addTransaction(toInsert);
          } else {
            // Fallback if not found (unexpected)
            await ApiService.updateTransaction(payload.id, payload.updates);
          }
        } else {
          await ApiService.updateTransaction(payload.id, payload.updates);
        }
      } else if (action === 'delete') {
        const id = typeof payload === 'object' ? payload.id : payload;
        await ApiService.deleteTransaction(id);
      }

      await loadFromCloud();
    } catch (e) {
      console.error("API Sync Error:", e);
      setCloudStatus('error');
    }
  };

  // --- Handlers for Confirmation ---
  const handleDeleteRequest = (id: string, forceSingle = false) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    // Case 1: Fixed Monthly
    if (!forceSingle && tx.isFixed && tx.installmentId?.startsWith('fixed_')) {
      setConfirmation({
        isOpen: true,
        title: 'Excluir Recorrência',
        message: 'Esta é uma despesa MENSAL FIXA. Deseja apagar todas as ocorrências futuras também?',
        confirmLabel: 'Todas as Futuras',
        cancelLabel: 'Apenas Esta',
        onConfirm: () => {
          setConfirmation(null);
          updateTransactions('delete', { id, cascade: true }, (prev) => prev /* handled inside or need optimistic? */);
          // Wait, updateTransactions with cascade handles optimistic inside.
          // But updateTransactions signature requires optimisticUpdate function.
          // I will pass a dummy identity function because updateTransactions cascade logic calls setTransactions directly.
          // Or I will pass null definition in my signature.
          // In the signature above: optimisticUpdate is mandatory? No, I added check `if (optimisticUpdate)`.
        },
        onCancel: () => {
          setConfirmation(null);
          handleDeleteRequest(id, true); // Recurse as forceSingle
        }
      });
      return;
    }

    // Case 2: Subscription
    if (!forceSingle && tx.isSubscription && tx.subscriptionId) {
      setConfirmation({
        isOpen: true,
        title: 'Cancelar Assinatura',
        message: 'Esta transação pertence a uma ASSINATURA. Deseja cancelar e remover as cobranças futuras?',
        confirmLabel: 'Sim, Cancelar Futuras',
        cancelLabel: 'Apenas Esta',
        onConfirm: () => {
          setConfirmation(null);
          updateTransactions('delete', { id, cascade: true }, (prev) => []); // Dummy
        },
        onCancel: () => {
          setConfirmation(null);
          handleDeleteRequest(id, true);
        }
      });
      return;
    }

    // Default (no cascade or single force)
    updateTransactions('delete', { id, cascade: false }, (prev) => prev.filter(t => t.id !== id));
  };

  const handleUpdateTransactionRequest = (id: string, updates: Partial<Transaction>) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    // Check for fixed group
    const isRelevantChange = updates.amount !== undefined || updates.day !== undefined || updates.description !== undefined || updates.category !== undefined;

    if (isRelevantChange && tx.isFixed && tx.installmentId?.startsWith('fixed_')) {
      setConfirmation({
        isOpen: true,
        title: 'Atualizar Recorrência',
        message: 'Esta é uma despesa MENSAL FIXA. Deseja aplicar as alterações para todos os meses seguintes?',
        confirmLabel: 'Sim, Todas',
        cancelLabel: 'Não, Apenas Esta',
        onConfirm: () => {
          setConfirmation(null);
          updateTransactions('update', { id, updates, cascade: true }, (prev) => []); // Dummy, handled inside
        },
        onCancel: () => {
          setConfirmation(null);
          // Single update
          updateTransactions('update', { id, updates, cascade: false }, (prev) => prev.map(t => t.id === id ? { ...t, ...updates } : t));
        }
      });
      return;
    }

    // Default
    updateTransactions('update', { id, updates, cascade: false }, (prev) => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  // Pre-Update Hook for Debts (Amount Change)
  // We can't easily do it inside the main function because setTransactions is called early.
  // Actually we can do it right at the start of updateTransactions.
  // But wait, I'm already inside updateTransactions logic in previous step (delete).
  // For update, I need to add it handled in a similar way.

  // Let's add it near the top of the function, handling 'update'.


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
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const currentMonthTrans = transactions.filter(t =>
      t.month === currentMonth &&
      t.year === currentYear &&
      t.day !== undefined &&
      t.day >= 1 &&
      t.day <= daysInMonth
    );

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

  // Confirmation Modal State
  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning'
  } | null>(null);

  const handleAddTransaction = (tData: Omit<Transaction, 'id'>, options: { installments: number, isFixed: boolean }) => {
    // Logic for new transactions
    const transactionsToAdd: any[] = [];

    if (options.installments > 1 && tData.type !== 'appointment') {
      for (let i = 0; i < options.installments; i++) {
        // Handle month rollover correctly with day clamping
        // If day is 31, and next month has 30, it should be 30.
        const targetMonth = tData.month + i;
        const yearOffset = Math.floor(targetMonth / 12);
        const monthInYear = targetMonth % 12;
        const targetYear = tData.year + yearOffset;

        // Find max day in target month
        const maxDay = new Date(targetYear, monthInYear + 1, 0).getDate();
        const safeDay = Math.min(tData.day, maxDay);

        const d = new Date(targetYear, monthInYear, safeDay);

        transactionsToAdd.push({
          ...tData,
          day: d.getDate(),
          month: d.getMonth(),
          year: d.getFullYear(),
          installmentNumber: i + 1,
          totalInstallments: options.installments
        });
      }
    } else if (options.isFixed && tData.type !== 'appointment') {
      // Mensal Fixo: Generate for next 12 months by default
      const fixedGroupId = 'fixed_' + Math.random().toString(36).substr(2, 9); // Create unique group ID
      for (let i = 0; i < 12; i++) {
        const targetMonth = tData.month + i;
        const yearOffset = Math.floor(targetMonth / 12);
        const monthInYear = targetMonth % 12;
        const targetYear = tData.year + yearOffset;

        // Find max day in target month (Safety for day 31 -> 30/28)
        const maxDay = new Date(targetYear, monthInYear + 1, 0).getDate();
        const safeDay = Math.min(tData.day, maxDay);

        const d = new Date(targetYear, monthInYear, safeDay);

        transactionsToAdd.push({
          ...tData,
          day: d.getDate(),
          month: d.getMonth(),
          year: d.getFullYear(),
          isFixed: true,
          installmentId: fixedGroupId // Link them together
        });
      }
    } else {
      transactionsToAdd.push(tData); // Single transaction
    }

    // Call updateTransactions (Optimistic ID generation)
    updateTransactions('add', transactionsToAdd, (prev) => {
      return [...prev, ...transactionsToAdd.map(t => ({ ...t, id: 'temp-' + Math.random() }))];
    });
  };

  const handleDeleteCardTransaction = (id: string) => {
    setCardTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleEditCardTransaction = (id: string, updates: Partial<CardTransaction>) => {
    setCardTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  // Handler para Pagamento Parcial
  const handlePartialPayment = (originalId: string, date: { day: number, month: number, year: number }, amount: number) => {
    const originalTransaction = transactions.find(t => t.id === originalId);
    if (!originalTransaction) return;

    // 1. Atualizar transação original (reduzir valor e registrar histórico)
    const updatedOriginal: Transaction = {
      ...originalTransaction,
      amount: originalTransaction.amount - amount,
      originalAmount: originalTransaction.originalAmount || originalTransaction.amount,
      partialPayments: [
        ...(originalTransaction.partialPayments || []),
        {
          id: crypto.randomUUID(),
          date: new Date(date.year, date.month, date.day).toISOString(),
          amount: amount
        }
      ]
    };

    // 2. Criar nova transação do pagamento parcial
    const paymentTransaction: Transaction = {
      id: crypto.randomUUID(),
      description: `Pagamento Parcial - ${originalTransaction.description}`,
      amount: amount,
      type: originalTransaction.type,
      category: originalTransaction.category,
      subCategory: 'Parcial',
      day: date.day,
      month: date.month,
      year: date.year,
      completed: true,
      isFixed: false
    };

    setTransactions(prev => [
      ...prev.map(t => t.id === originalId ? updatedOriginal : t),
      paymentTransaction
    ]);

    // Persistir API (manual para garantir)
    ApiService.updateTransaction(originalId, {
      amount: updatedOriginal.amount,
      originalAmount: updatedOriginal.originalAmount,
      partialPayments: updatedOriginal.partialPayments
    });
    ApiService.addTransaction(paymentTransaction);
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

          {/* Fixed Minimalist Header - Acinzentado */}
          <header className="fixed top-0 left-0 right-0 z-50 bg-slate-100/90 backdrop-blur-xl border-b border-slate-200/60 shadow-sm transition-all duration-300 h-16">
            <div className="max-w-[1920px] mx-auto px-4 md:px-6 h-full flex items-center justify-between gap-4">

              {/* Left: Logo & Month Nav */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-md shadow-indigo-600/20">
                    <LayoutDashboard size={20} />
                  </div>
                  <div className="hidden md:block">
                    <h1 className="text-sm font-bold text-slate-900 leading-none uppercase tracking-tight">{appConfig.appName}</h1>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {cloudStatus === 'ok' && <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-100"><CloudCheck size={10} /> Sync On</span>}
                      {cloudStatus === 'syncing' && <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full flex items-center gap-1 border border-amber-100"><Loader2 size={10} className="animate-spin" /> Saving</span>}
                      {cloudStatus === 'error' && <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full flex items-center gap-1 border border-rose-100"><AlertTriangle size={10} /> Error</span>}
                    </div>
                  </div>
                </div>

                <div className="h-6 w-px bg-slate-200/80 hidden md:block"></div>

                {/* Date Navigation */}
                <div className="flex items-center bg-slate-100/80 rounded-lg p-1 border border-slate-200/50">
                  <button onClick={() => { const d = new Date(currentYear, currentMonth - 1); setCurrentMonth(d.getMonth()); setCurrentYear(d.getFullYear()); }} className="p-1 hover:bg-white rounded-md text-slate-400 hover:text-indigo-600 transition-all"><ChevronLeft size={16} /></button>
                  <div className="px-3 text-center min-w-[90px]">
                    <span className="text-xs font-black text-slate-700 uppercase block leading-none">{MONTHS_NAMES[currentMonth]}</span>
                    <span className="text-[10px] font-bold text-slate-400 leading-none">{currentYear}</span>
                  </div>
                  <button onClick={() => { const d = new Date(currentYear, currentMonth + 1); setCurrentMonth(d.getMonth()); setCurrentYear(d.getFullYear()); }} className="p-1 hover:bg-white rounded-md text-slate-400 hover:text-indigo-600 transition-all"><ChevronRight size={16} /></button>
                </div>
              </div>

              {/* Center: Financial Stats (The Requested "Fixed Values") */}
              <div className="flex-1 max-w-4xl hidden lg:flex items-center justify-center gap-3">
                <div className="flex items-center gap-1 bg-white border border-slate-200/60 shadow-sm rounded-2xl px-2 py-1.5">

                  {/* Receitas */}
                  <div className="flex flex-col px-4 py-1 border-r border-slate-100 min-w-[140px]">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Receitas
                    </span>
                    <span className="text-sm font-black text-slate-700">
                      {summary.realizedIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                    <span className="text-[9px] font-medium text-slate-400">
                      de {summary.totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>

                  {/* Despesas */}
                  <div className="flex flex-col px-4 py-1 border-r border-slate-100 min-w-[140px]">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div> Despesas
                    </span>
                    <span className="text-sm font-black text-slate-700">
                      {summary.realizedExpense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                    <span className="text-[9px] font-medium text-slate-400">
                      de {summary.totalExpense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>

                  {/* Saldo */}
                  <div className="flex flex-col px-4 py-1 border-r border-slate-100 min-w-[160px]">
                    <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
                      <Wallet size={10} strokeWidth={3} /> Saldo Atual
                    </span>
                    <span className={`text-lg font-black ${summary.currentBalance >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                      {summary.currentBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>

                  {/* Previsão */}
                  <div className="flex flex-col px-4 py-1 min-w-[140px]">
                    <span className="text-[9px] font-bold text-violet-500 uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
                      <CalendarCheck size={10} strokeWidth={3} /> Previsão
                    </span>
                    <span className={`text-md font-black ${summary.endOfMonthBalance >= 0 ? 'text-slate-700' : 'text-rose-600'}`}>
                      {summary.endOfMonthBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>

                {/* Calculadora (Destacado - Standalone) */}
                <button
                  onClick={() => setShowCalculator(true)}
                  className="group relative flex items-center justify-center p-0.5"
                  title="Abrir Calculadora"
                >
                  <div className="absolute inset-0 bg-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                  <div className="relative w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-600/30 border border-indigo-400 hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all duration-300">
                    <CalculatorIcon size={22} strokeWidth={2.5} />
                  </div>
                </button>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center gap-1 mr-2">
                  <button onClick={() => setCurrentView('dashboard')} className={`p-2 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${currentView === 'dashboard' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>Dashboard</button>
                  <button onClick={() => setCurrentView('yearly')} className={`p-2 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${currentView === 'yearly' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>Relatórios</button>
                </div>

                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <button onClick={() => loadFromCloud()} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors" title="Recarregar">
                    <RefreshCw size={18} />
                  </button>
                  <button onClick={() => setShowSettings(true)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors" title="Configurações">
                    <Settings size={18} />
                  </button>
                  <button onClick={() => { ApiService.logout(); setUser(null); }} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Sair">
                    <LogOut size={18} />
                  </button>
                </div>
              </div>

            </div>
          </header>

          {/* Fixed Search Bar - Unified & Clean Design */}
          <div className="fixed top-20 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 shadow-sm h-auto py-3 animate-slide-down transition-all">
            <div className="max-w-[1920px] mx-auto px-4 md:px-8 flex flex-col xl:flex-row items-center gap-4 justify-between">

              {/* Search Input - Expanding */}
              <div className="relative w-full xl:max-w-xl group order-2 xl:order-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-600 transition-colors pointer-events-none">
                  <Search size={18} />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="O que você procura?"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 placeholder:text-slate-400 font-medium focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500/50 transition-all shadow-inner focus:bg-white"
                />
              </div>

              {/* Filters & Actions - Unified Row */}
              <div className="flex flex-wrap md:flex-nowrap items-center gap-3 w-full xl:w-auto order-1 xl:order-2 justify-center xl:justify-end">

                {/* Type Filters Group */}
                <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner overflow-x-auto max-w-full">
                  <button
                    onClick={() => setFilterType('ALL')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all whitespace-nowrap ${filterType === 'ALL' ? 'bg-white text-slate-800 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                  >
                    Todos
                  </button>
                  <div className="w-px h-4 bg-slate-300 mx-1"></div>
                  <button
                    onClick={() => setFilterType('income')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 whitespace-nowrap ${filterType === 'income' ? 'bg-emerald-50 text-emerald-600 shadow-sm ring-1 ring-emerald-500/20' : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50/50'}`}
                  >
                    <TrendingUp size={14} /> <span className="hidden sm:inline">Receitas</span>
                  </button>
                  <div className="w-px h-4 bg-slate-300 mx-1"></div>
                  <button
                    onClick={() => setFilterType('expense')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 whitespace-nowrap ${filterType === 'expense' ? 'bg-rose-50 text-rose-600 shadow-sm ring-1 ring-rose-500/20' : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50/50'}`}
                  >
                    <TrendingDown size={14} /> <span className="hidden sm:inline">Despesas</span>
                  </button>
                  <div className="w-px h-4 bg-slate-300 mx-1"></div>
                  <button
                    onClick={() => setFilterType('appointment')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 whitespace-nowrap ${filterType === 'appointment' ? 'bg-violet-50 text-violet-600 shadow-sm ring-1 ring-violet-500/20' : 'text-slate-500 hover:text-violet-600 hover:bg-violet-50/50'}`}
                  >
                    <Clock size={14} /> <span className="hidden sm:inline">Agenda</span>
                  </button>
                </div>

                {/* Vertical Divider */}
                <div className="w-px h-8 bg-slate-200 mx-1 hidden md:block"></div>

                {/* Date Filter */}
                <div className="relative min-w-[140px] group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-600 transition-colors pointer-events-none">
                    <Calendar size={16} />
                  </div>
                  <select
                    value={selectedDayFilter}
                    onChange={(e) => setSelectedDayFilter(e.target.value)}
                    className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-2xl text-slate-700 font-bold text-xs uppercase tracking-wide focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500/50 transition-all appearance-none cursor-pointer shadow-sm hover:border-violet-300"
                  >
                    <option value="">Todo o Mês</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d}>Dia {d}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronDown size={14} />
                  </div>
                </div>

              </div>
            </div>
          </div>

          <main className="max-w-[1920px] mx-auto p-4 md:p-8 pt-48 lg:pt-56 space-y-8 animate-fade-in">
            {currentView === 'dashboard' ? (
              <div className="space-y-8">
                {/* SummaryCards removed as requested - Stats now in Header */}

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

                    <AdvancedDashboard transactions={transactions.filter(t => t.month === currentMonth && t.year === currentYear)} allTransactions={transactions} currentMonth={currentMonth} year={currentYear} />
                  </div>

                  {/* RIGHT COLUMN - 25% */}
                  <div className="lg:col-span-3 space-y-6">

                    {/* 1. Lançamento Inteligente */}
                    <div className="bg-[#1e1e2d] p-6 rounded-3xl shadow-2xl border border-white/5">
                      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <div className="w-1 h-6 bg-indigo-500 rounded-full"></div>
                        Lançamento Inteligente
                      </h3>
                      <TransactionForm onAdd={handleAddTransaction} categoriesMap={categoriesMap} currentMonth={currentMonth} currentYear={currentYear} isDarkMode={true} />
                    </div>

                    {/* 2. Agenda (Fixed Height for Scroll) */}
                    <div className="h-[450px]">
                      <AppointmentsSidebarList transactions={transactions} currentMonth={currentMonth} onToggleComplete={(id) => setTransactions(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t))} isDarkMode={true} />
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
                          onDelete={(id) => {
                            const linkedTransactions = transactions.filter(t => t.subscriptionId === id);
                            if (linkedTransactions.length > 0) {
                              linkedTransactions.forEach(t => {
                                ApiService.deleteTransaction(t.id).catch(e => console.warn('Could not delete from cloud (might be local only)', e));
                              });
                              setTransactions(prev => prev.filter(t => t.subscriptionId !== id));
                            }
                            setSubscriptions(prev => prev.filter(s => s.id !== id));
                          }}
                          onSync={(sub) => {
                            handleAddTransaction({
                              description: sub.name,
                              amount: sub.amount,
                              day: sub.day,
                              month: currentMonth,
                              year: currentYear,
                              type: 'expense',
                              category: 'Assinaturas',
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
            ) : (
              <div className="animate-slide-up">
                <YearlyReport transactions={transactions} year={currentYear} />
              </div>
            )}
          </main >

          {/* Floating Widgets Layer */}
          {
            showCalculator && (
              <div className="fixed top-28 right-8 z-[60] animate-fade-in shadow-2xl rounded-xl overflow-hidden ring-1 ring-white/20">
                <div className="bg-slate-900 flex justify-between items-center px-4 py-2 border-b border-slate-800 handle cursor-move">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Calculadora</span>
                  <button onClick={() => setShowCalculator(false)} className="text-slate-500 hover:text-white transition-colors"><X size={14} /></button>
                </div>
                <Calculator />
              </div>
            )
          }

          {
            showChat && (
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
            )
          }



          {
            confirmation && (
              <ConfirmationModal
                isOpen={confirmation.isOpen}
                title={confirmation.title}
                message={confirmation.message}
                onConfirm={confirmation.onConfirm}
                onCancel={confirmation.onCancel}
                confirmLabel={confirmation.confirmLabel}
                cancelLabel={confirmation.cancelLabel}
                type={confirmation.type}
              />
            )
          }

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
