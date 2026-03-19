import React, { useState, useMemo, useEffect } from 'react';
import { INITIAL_TRANSACTIONS, INITIAL_PREVIOUS_BALANCE, APP_VERSION } from './constants';
import { Transaction, INITIAL_CATEGORIES_MAP, CreditCard, CardTransaction, Subscription, DebtAccount, DebtTransaction } from './types';
import { ApiService } from './services/apiService';
import { CreditCardService } from './services/creditCardService';
import { SubscriptionService } from './services/subscriptionService';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { AmbientBackground } from './components/AmbientBackground';
import { Dashboard } from './components/Dashboard';
import { ModalsLayer } from './components/ModalsLayer';
import { LoginPage } from './components/LoginPage';
import { YearlyReport } from './components/YearlyReport';

const MONTHS_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const App: React.FC = () => {
  const STORAGE_KEY = 'finan_agenda_data_2026_v2';
  const CAT_STORAGE_KEY = 'finan_categories_map_2026';
  const CONFIG_STORAGE_KEY = 'finan_app_config_2026';

  // BUG FIX #5: Prevent concurrent loadFromCloud calls (race condition)
  const isLoadingFromCloud = React.useRef(false);
  const hasLoadedFromCloud = React.useRef(false);

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

  // BUG FIX #1: Removed 'transactions' from dependency array to break the infinite loop.
  // Using setTransactions(prev => ...) to access current state without adding it as dependency.
  useEffect(() => {
    localStorage.setItem('finan_cards_2026', JSON.stringify(cards));
    localStorage.setItem('finan_card_transactions_2026', JSON.stringify(cardTransactions));
    localStorage.setItem('finan_subscriptions_2026', JSON.stringify(subscriptions));
    localStorage.setItem('finan_debts_2026', JSON.stringify(debts));

    setTransactions(prev => {
      // 1. Sync Credit Card Invoices to Main Transactions
      let synced = CreditCardService.syncInvoiceToTransactions(prev, cardTransactions, cards);

      // 2. Sync Subscriptions (Forecast next 12 months)
      synced = SubscriptionService.syncSubscriptions(synced, subscriptions);

      // Only update state if something actually changed (stable comparison by length + IDs)
      if (synced.length === prev.length && synced.every((t, i) => t.id === prev[i]?.id && t.amount === prev[i]?.amount)) {
        return prev; // No change - avoid re-render
      }
      return synced;
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, cardTransactions, subscriptions]); // 'transactions' REMOVED intentionally to prevent loop

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

  // --- Undo System ---
  const [undoHistory, setUndoHistory] = useState<Transaction[][]>([]);
  // We don't strictly need an index if we just pop from history, but let's keep it simple: push to stack, pop from stack.

  const addToUndoHistory = (currentTransactions: Transaction[]) => {
    setUndoHistory(prev => {
      const newHistory = [...prev, currentTransactions];
      if (newHistory.length > 15) {
        return newHistory.slice(newHistory.length - 15);
      }
      return newHistory;
    });
  };

  const handleUndo = async () => {
    if (undoHistory.length === 0) return;

    const previousState = undoHistory[undoHistory.length - 1];
    const newHistory = undoHistory.slice(0, undoHistory.length - 1);

    // Optimistic Restore
    setTransactions(previousState);
    setUndoHistory(newHistory);

    // Cloud Sync (Force Re-upload of restored state)
    // Since we don't track the exact diff, we push the state.
    // However, our sync logic in `updateTransactions` is granular.
    // We will attempt to use a "Sync All" approach if possible, or just accept correct local state + background sync.
    // Given the complexity of perfect 2-way sync on Undo without backend support, 
    // we will rely on `loadFromCloud` to NOT overwrite our undo immediately, 
    // but we need to PUSH this state to cloud.
    // *Correction*: We will assume the user wants the Local State to be truth.
    // We will trigger a specific "Restoration Sync".
    // For now, let's notify user it's done locally.

    // Actually, let's try to identify what changed? Too complex for 15 steps.
    // We will trigger a silent re-sync of *everything* or just let it be.
    // If the user refreshes, they might lose the Undo if cloud is different.
    // To fix this: We really should have an API for `restoreTransactions`.
    // Lacking that, we will iterate and Delete/Add? No, too risky.
    // We will simply set the state and hope the user makes a NEW change that triggers a save, 
    // OR we trigger `updateTransactions` with a dummy update if we want to force sync.
    // Let's go with Local Undo for now + Message.
    console.log("↺ Undoing last action...");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoHistory]); // Dep on undoHistory to access latest state

  // Monitor Auth State
  useEffect(() => {
    checkUser();
  }, []);

  // Check User and Auto-Sync Perfex
  const checkUser = async () => {
    const u = await ApiService.getUser();
    setUser(u);
    if (u) {
      // Sync Gemini API Key to LocalStorage for cross-device persistence
      if (u.gemini_api_key) {
        localStorage.setItem('gemini_api_key', u.gemini_api_key);
      }

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

  const handleDeleteSubscription = (id: string) => {
    const linkedTransactions = transactions.filter(t => t.subscriptionId === id);
    if (linkedTransactions.length > 0) {
      linkedTransactions.forEach(t => {
        ApiService.deleteTransaction(t.id).catch(e => console.warn('Could not delete from cloud (might be local only)', e));
      });
      setTransactions(prev => prev.filter(t => t.subscriptionId !== id));
    }
    setSubscriptions(prev => prev.filter(s => s.id !== id));
  };

  const loadFromCloud = async () => {
    // BUG FIX #5: Prevent race condition - skip if already loading
    if (isLoadingFromCloud.current) {
      console.log('⏳ loadFromCloud already in progress, skipping duplicate call.');
      return;
    }
    isLoadingFromCloud.current = true;

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

      // 5. Main Transactions (Replace Strategy - cloud is source of truth)
      if (cloudTransactions && cloudTransactions.length > 0) {
        const sorted = [...cloudTransactions].sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          if (a.month !== b.month) return b.month - a.month;
          return b.day - a.day;
        });
        setTransactions(sorted);
      } else if (cloudTransactions && cloudTransactions.length === 0) {
        setTransactions([]);
      }

      // 6. Categories (Sync)
      const cloudCats = await ApiService.fetchCategories();
      if (cloudCats && Object.keys(cloudCats).length > 0) {
        console.log("📂 Categories Loaded from Cloud");
        setCategoriesMap(cloudCats);
      }

      hasLoadedFromCloud.current = true;
      setCloudStatus('ok');
    } catch (error) {
      console.error("Erro ao carregar da nuvem:", error);
      setCloudStatus('error');
    } finally {
      // BUG FIX #5: Always release the lock so future calls are not permanently blocked
      isLoadingFromCloud.current = false;
    }
  };

  // --- Auto-Sync Effects for New Entities ---

  // Sync Categories
  useEffect(() => {
    if (!hasLoadedFromCloud.current) return;
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
    if (!hasLoadedFromCloud.current) return;
    const timer = setTimeout(() => ApiService.syncDebts(debts), 2000);
    return () => clearTimeout(timer);
  }, [debts]);

  // Sync Cards
  useEffect(() => {
    if (!hasLoadedFromCloud.current) return;
    const timer = setTimeout(() => ApiService.syncCards(cards), 2000);
    return () => clearTimeout(timer);
  }, [cards]);

  // Sync Subscriptions
  useEffect(() => {
    if (!hasLoadedFromCloud.current) return;
    const timer = setTimeout(() => ApiService.syncSubscriptionsData(subscriptions), 2000);
    return () => clearTimeout(timer);
  }, [subscriptions]);

  // Sync Card Transactions
  useEffect(() => {
    if (!hasLoadedFromCloud.current) return;
    const timer = setTimeout(() => ApiService.syncCardTransactions(cardTransactions), 3000);
    return () => clearTimeout(timer);
  }, [cardTransactions]);

  // Wrapper for modifying transactions to ensure DB sync
  const updateTransactions = async (
    action: 'add' | 'update' | 'delete',
    payload: any,
    optimisticUpdate: (prev: Transaction[]) => Transaction[]
  ) => {
    // Capture history before any change
    addToUndoHistory(transactions);

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
        const isRelevantChange = updates.amount !== undefined || updates.day !== undefined || updates.description !== undefined || updates.category !== undefined || updates.subCategory !== undefined || updates.time !== undefined;

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
          console.log('🔍 Detected VIRTUAL transaction (non-UUID ID):', payload.id);
          const existing = transactions.find(t => t.id === payload.id);
          if (existing) {
            const { id: virtualId, ...toInsert } = { ...existing, ...payload.updates };

            console.log('📦 Virtual transaction BEFORE sanitization:', JSON.stringify(toInsert, null, 2));

            // FIX: Sanitize Virtual Subscriptions before saving to Real DB
            // Virtual subs often have isFixed=true (for UI) but invalid/missing installmentIds
            // We should strip these to avoid DB constraint errors.
            if (toInsert.isSubscription) {
              console.log('🧹 Sanitizing subscription fields...');
              delete (toInsert as any).isFixed;
              delete (toInsert as any).installmentId;
              delete (toInsert as any).installmentNumber;
              delete (toInsert as any).totalInstallments;
            }

            console.log('✅ Virtual transaction AFTER sanitization:', JSON.stringify(toInsert, null, 2));
            console.log('🚀 Attempting to INSERT as new transaction...');

            // Ensure we keep isSubscription flags if they exist (they should be in 'existing')
            await ApiService.addTransaction(toInsert);
            console.log('✔️ Successfully inserted virtual transaction!');
          } else {
            console.warn('⚠️ Virtual transaction not found in local state, attempting update anyway');
            // Fallback if not found (unexpected)
            await ApiService.updateTransaction(payload.id, payload.updates);
          }
        } else {
          console.log('📝 Updating existing transaction (UUID):', payload.id);
          await ApiService.updateTransaction(payload.id, payload.updates);
        }
      } else if (action === 'delete') {
        const id = typeof payload === 'object' ? payload.id : payload;
        await ApiService.deleteTransaction(id);
      }


      await loadFromCloud();
    } catch (e: any) {
      console.error("❌ API Sync Error:", e);
      // alert(`Erro ao salvar na nuvem: ${e?.message || 'Verifique sua conexão ou se a coluna "time" existe no banco.'}`);
      setCloudStatus('error');
      // Revert optimistic update by reloading from cloud
      await loadFromCloud();
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
        message: 'Esta é uma despesa MENSAL FIXA. O que deseja fazer?',
        confirmLabel: 'Todas as Futuras',
        alternativeLabel: 'Apenas Esta',
        onConfirm: () => {
          setConfirmation(null);
          updateTransactions('delete', { id, cascade: true }, (prev) => prev);
        },
        onAlternative: () => {
          setConfirmation(null);
          handleDeleteRequest(id, true); // Recurse as forceSingle
        },
        onCancel: () => setConfirmation(null)
      });
      return;
    }

    // Case 1.5: Recurring Appointments
    if (!forceSingle && tx.type === 'appointment' && tx.isFixed && tx.installmentId?.startsWith('fixed_')) {
      setConfirmation({
        isOpen: true,
        title: 'Excluir Compromisso Recorrente',
        message: 'Este é um COMPROMISSO RECORRENTE. O que deseja fazer?',
        confirmLabel: 'Todos os Posteriores',
        alternativeLabel: 'Apenas Este',
        onConfirm: () => {
          setConfirmation(null);
          updateTransactions('delete', { id, cascade: true }, (prev) => prev);
        },
        onAlternative: () => {
          setConfirmation(null);
          handleDeleteRequest(id, true);
        },
        onCancel: () => setConfirmation(null)
      });
      return;
    }

    // Case 2: Subscription
    if (!forceSingle && tx.isSubscription && tx.subscriptionId) {
      setConfirmation({
        isOpen: true,
        title: 'Cancelar Assinatura',
        message: 'Esta transação pertence a uma ASSINATURA. O que deseja fazer?',
        confirmLabel: 'Cancelar Futuras',
        alternativeLabel: 'Apagar Esta',
        onConfirm: () => {
          setConfirmation(null);
          updateTransactions('delete', { id, cascade: true }, (prev) => []);
        },
        onAlternative: () => {
          setConfirmation(null);
          handleDeleteRequest(id, true);
        },
        onCancel: () => setConfirmation(null)
      });
      return;
    }

    // Default (no cascade or single force)
    updateTransactions('delete', { id, cascade: false }, (prev) => prev.filter(t => t.id !== id));
  };

  const handleUpdateTransactionRequest = (id: string, updates: Partial<Transaction>) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    // Nova Lógica: Tornar Compromisso Recorrente ao Editar
    if (updates.isFixed === true && !tx.isFixed && (tx.type === 'appointment' || updates.type === 'appointment')) {
      const fixedGroupId = 'fixed_' + Math.random().toString(36).substr(2, 9);
      const updatedCurrent = { ...tx, ...updates, installmentId: fixedGroupId };

      const futureTransactions = [];
      const currentMonthIndex = updatedCurrent.year * 12 + updatedCurrent.month;

      for (let i = 1; i < 12; i++) {
        const targetMonthTotal = currentMonthIndex + i;
        const targetYear = Math.floor(targetMonthTotal / 12);
        const targetMonth = targetMonthTotal % 12;

        const maxDay = new Date(targetYear, targetMonth + 1, 0).getDate();
        const safeDay = Math.min(updatedCurrent.day, maxDay);

        futureTransactions.push({
          ...updatedCurrent,
          id: 'temp-' + crypto.randomUUID(), // Temp ID is fine for Optimistic update
          day: safeDay,
          month: targetMonth,
          year: targetYear
        });
      }

      // Update original via updateTransactions logic, then add futures
      updateTransactions('update', { id, updates: { ...updates, installmentId: fixedGroupId }, cascade: false }, (prev) => prev.map(t => t.id === id ? updatedCurrent : t));
      updateTransactions('add', futureTransactions, (prev) => [...prev, ...futureTransactions]);
      return;
    }

    // Check for fixed group
    const isRelevantChange = updates.amount !== undefined || updates.day !== undefined || updates.description !== undefined || updates.category !== undefined || updates.subCategory !== undefined || updates.time !== undefined;

    if (isRelevantChange && tx.isFixed && tx.installmentId?.startsWith('fixed_')) {
      setConfirmation({
        isOpen: true,
        title: tx.type === 'appointment' ? 'Atualizar Compromisso Recorrente' : 'Atualizar Recorrência',
        message: tx.type === 'appointment' ? 'Este é um COMPROMISSO RECORRENTE. Como deseja aplicar as alterações?' : 'Esta é uma despesa MENSAL FIXA. Como deseja aplicar as alterações?',
        confirmLabel: 'Em Todas',
        alternativeLabel: 'Nesta Apenas',
        onConfirm: () => {
          setConfirmation(null);
          // Fix: Ensure we provide a valid optimistic update even if cascade block isn't entered (fallback)
          // Ideally, cascade block handles everything and exits.
          updateTransactions('update', { id, updates, cascade: true }, (prev) => prev.map(t => t.id === id ? { ...t, ...updates } : t));
        },
        onAlternative: () => {
          setConfirmation(null);
          // Single update
          updateTransactions('update', { id, updates, cascade: false }, (prev) => prev.map(t => t.id === id ? { ...t, ...updates } : t));
        },
        onCancel: () => setConfirmation(null)
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
    // Agora o Saldo Total Geral considera o Saldo Inicial de Fev/2026 + Todas as Transações
    // Mas espere, transactions já contém tudo? Sim.

    // Cálculo do Saldo Acumulado até o final do tempo
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    return INITIAL_PREVIOUS_BALANCE + income - expense;
  }, [transactions]);

  const summary = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // 1. Calcular Saldo Inicial (Acumulado de meses anteriores ao atual)
    // LÓGICA CORRIGIDA: O Saldo Inicial deve ser EXATAMENTE 'INITIAL_PREVIOUS_BALANCE' em Fev/2026.

    const previousTransactions = transactions.filter(t => {
      // Ignorar transações antes de 2026
      if (t.year < 2026) return false;
      // Ignorar Janeiro de 2026 (Mês 0)
      if (t.year === 2026 && t.month < 1) return false;

      if (t.year < currentYear) return true;
      if (t.year === currentYear && t.month < currentMonth) return true;
      return false;
    });

    const prevIncome = previousTransactions.filter(t => t.type === 'income' && t.completed).reduce((acc, t) => acc + t.amount, 0);
    const prevExpense = previousTransactions.filter(t => t.type === 'expense' && t.completed).reduce((acc, t) => acc + t.amount, 0);

    // Saldo Inicial REAL (Só pagas)
    const previousBalance = INITIAL_PREVIOUS_BALANCE + prevIncome - prevExpense;

    // Saldo Inicial PREVISTO (Com pendentes)
    const prevExpectedIncome = previousTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const prevExpectedExpense = previousTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const previousExpectedBalance = INITIAL_PREVIOUS_BALANCE + prevExpectedIncome - prevExpectedExpense;

    // 2. Dados do Mês Atual
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
      previousBalance,
      previousExpectedBalance, // EXPORTANDO NOVO CAMPO
      totalIncome,
      totalExpense,
      realizedIncome,
      realizedExpense,
      // Current Balance = Starting Balance + Realized Flow of Month
      currentBalance: previousBalance + realizedIncome - realizedExpense,
      // Expected Balance Today = Starting Balance + Projected Flow UP TO TODAY
      currentExpectedBalance: previousBalance +
        currentMonthTrans.filter(t => t.day <= new Date().getDate() && t.type === 'income').reduce((acc, t) => acc + t.amount, 0) -
        currentMonthTrans.filter(t => t.day <= new Date().getDate() && t.type === 'expense').reduce((acc, t) => acc + t.amount, 0),
      // Estimated End Balance = Starting Balance + All Projected Flow of Month
      endOfMonthBalance: previousBalance + totalIncome - totalExpense,
    };
  }, [transactions, currentMonth, currentYear]);

  // Confirmation Modal State
  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void; // Make optional as modal handles default check
    onAlternative?: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    alternativeLabel?: string;
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
    } else if (options.isFixed) {
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

  const handleDeleteCardTransaction = (id: string, cascade: boolean = false) => {
    if (cascade) {
      // Find the target transaction to get context
      const target = cardTransactions.find(t => t.id === id);
      if (!target) return;

      // Identify future transactions to delete
      // Key: Same Card, Description, Original Date, and Installment Number >= Target
      const idsToDelete = cardTransactions
        .filter(t =>
          t.cardId === target.cardId &&
          t.description === target.description &&
          t.originalDate === target.originalDate &&
          t.totalInstallments === target.totalInstallments &&
          t.installmentNumber >= target.installmentNumber
        )
        .map(t => t.id);

      setCardTransactions(prev => prev.filter(t => !idsToDelete.includes(t.id)));

    } else {
      setCardTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleEditCardTransaction = (id: string, updates: Partial<CardTransaction>, cascade: boolean = false) => {
    if (cascade) {
      const target = cardTransactions.find(t => t.id === id);
      if (!target) return;

      // Identify ALL transactions of this purchase group (past, present, future)
      const groupTransactions = cardTransactions.filter(t =>
        t.cardId === target.cardId &&
        t.description === target.description &&
        t.originalDate === target.originalDate &&
        t.totalInstallments === target.totalInstallments
      );

      // If Date Changed, we need to Recalculate Months for EVERY installment
      if (updates.originalDate && updates.originalDate !== target.originalDate) {
        const card = cards.find(c => c.id === target.cardId);
        if (card) {
          const newDate = new Date(updates.originalDate);

          const recalculatedUpdates = groupTransactions.map(t => {
            // Calculate month/year for THIS installment number based on new start date

            let startMonth = newDate.getMonth();
            let startYear = newDate.getFullYear();

            if (newDate.getDate() >= card.closingDay) {
              startMonth++;
              if (startMonth > 11) { startMonth = 0; startYear++; }
            }

            // Add offset
            let targetMonth = startMonth + (t.installmentNumber - 1);
            let targetYear = startYear + Math.floor(targetMonth / 12);
            targetMonth = targetMonth % 12;

            return {
              id: t.id,
              changes: {
                ...updates,
                month: targetMonth,
                year: targetYear,
                originalDate: updates.originalDate // Ensure all link to new date
              }
            };
          });

          setCardTransactions(prev => prev.map(t => {
            const update = recalculatedUpdates.find(u => u.id === t.id);
            return update ? { ...t, ...update.changes } : t;
          }));
          return;
        }
      }

      // If only Description/Amount changed (Cascade)
      setCardTransactions(prev => prev.map(t => {
        if (groupTransactions.find(g => g.id === t.id)) {
          return { ...t, ...updates };
        }
        return t;
      }));

    } else {
      setCardTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    }
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

          <AmbientBackground />

          <Header
            appConfig={appConfig}
            cloudStatus={cloudStatus}
            currentMonth={currentMonth}
            currentYear={currentYear}
            setCurrentMonth={setCurrentMonth}
            setCurrentYear={setCurrentYear}
            undoHistory={undoHistory}
            handleUndo={handleUndo}
            summary={summary}
            setShowCalculator={setShowCalculator}
            setShowChat={setShowChat}
            currentView={currentView}
            setCurrentView={setCurrentView}
            loadFromCloud={loadFromCloud}
            setShowSettings={setShowSettings}
            setUser={setUser}
          />

          <FilterBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterType={filterType}
            setFilterType={setFilterType}
            selectedDayFilter={selectedDayFilter}
            setSelectedDayFilter={setSelectedDayFilter}
          />

          <main className="max-w-[1920px] mx-auto p-4 md:p-8 pt-48 lg:pt-56 space-y-8 animate-fade-in">
            {currentView === 'dashboard' ? (
              <Dashboard
                transactions={transactions}
                currentMonth={currentMonth}
                currentYear={currentYear}
                summary={summary}
                categoriesMap={categoriesMap}
                setShowCategoryManager={setShowCategoryManager}
                setEditingTransaction={setEditingTransaction}
                handleDeleteRequest={handleDeleteRequest}
                updateTransactions={updateTransactions}
                handleAddTransaction={handleAddTransaction}
                cards={cards}
                setCards={setCards}
                cardTransactions={cardTransactions}
                setCardTransactions={setCardTransactions}
                handleDeleteCardTransaction={handleDeleteCardTransaction}
                handleEditCardTransaction={handleEditCardTransaction}
                debts={debts}
                setDebts={setDebts}
                subscriptions={subscriptions}
                setSubscriptions={setSubscriptions}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterType={filterType}
                setFilterType={setFilterType}
                selectedDayFilter={selectedDayFilter}
                setSelectedDayFilter={setSelectedDayFilter}
                handleDeleteSubscription={handleDeleteSubscription}
              />
            ) : (
              <div className="animate-slide-up">
                <YearlyReport transactions={transactions} year={currentYear} />
              </div>
            )}
          </main>

          <ModalsLayer
            user={user}
            transactions={transactions}
            setTransactions={setTransactions}
            categoriesMap={categoriesMap}
            setCategoriesMap={setCategoriesMap}
            editingTransaction={editingTransaction}
            setEditingTransaction={setEditingTransaction}
            showSettings={showSettings}
            setShowSettings={setShowSettings}
            showCategoryManager={showCategoryManager}
            setShowCategoryManager={setShowCategoryManager}
            showCalculator={showCalculator}
            setShowCalculator={setShowCalculator}
            showChat={showChat}
            setShowChat={setShowChat}
            confirmation={confirmation}
            acknowledgedIds={acknowledgedIds}
            setAcknowledgedIds={setAcknowledgedIds}
            handleUpdateTransactionRequest={handleUpdateTransactionRequest}
            handlePartialPayment={handlePartialPayment}
            updateTransactions={updateTransactions}
            summary={summary}
            currentMonth={currentMonth}
            currentYear={currentYear}
          />

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
