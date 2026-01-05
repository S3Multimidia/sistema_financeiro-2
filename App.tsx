
import React, { useState, useMemo, useEffect } from 'react';
import { INITIAL_TRANSACTIONS, INITIAL_PREVIOUS_BALANCE, APP_VERSION } from './constants';
import { Transaction, INITIAL_CATEGORIES_MAP } from './types';
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
import { GoogleSheetsService } from './services/googleSheetsService';
import { PerfexService } from './services/perfexService';
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
  LogOut
} from 'lucide-react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GOOGLE_CLIENT_ID } from './constants';
import { LoginPage } from './components/LoginPage';

const MONTHS_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const App: React.FC = () => {
  const STORAGE_KEY = 'finan_agenda_data_2026_v2';
  const CAT_STORAGE_KEY = 'finan_categories_map_2026';
  const CONFIG_STORAGE_KEY = 'finan_app_config_2026';
  const LAST_SYNC_KEY = 'finan_last_sync_timestamp';

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
    return saved ? JSON.parse(saved) : { appName: 'FINANCEIRO PRO 2026', startingBalance: INITIAL_PREVIOUS_BALANCE };
  });

  const [currentView, setCurrentView] = useState<'dashboard' | 'yearly'>('dashboard');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(2026);
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('');
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());
  const [cloudStatus, setCloudStatus] = useState<'idle' | 'syncing' | 'error' | 'ok'>('idle');
  const [isCrmSyncing, setIsCrmSyncing] = useState(false);
  const [user, setUser] = useState<any>(null); // State para usuário logado

  // Se não houver usuário logado, mostra tela de login (apenas se tiver Client ID configurado)
  // Se não tiver Client ID configurado em dev, permite bypass ou mostra aviso.
  // Vamos assumir production-first: Bloqueia.

  const syncToCloud = async () => {
    const hasSheets = !!localStorage.getItem('google_sheets_url');
    if (!hasSheets) {
      setCloudStatus('idle');
      return;
    }
    setCloudStatus('syncing');
    try {
      await GoogleSheetsService.sync({ transactions, appConfig, categoriesMap });
      setCloudStatus('ok');
      localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
      console.log("✅ Sincronismo automático realizado com sucesso.");
    } catch (e) {
      setCloudStatus('error');
    }
  };

  const syncFromCRM = async () => {
    setIsCrmSyncing(true);
    try {
      const crmData = await PerfexService.getAllTransactions();
      if (crmData.length > 0) {
        setTransactions(prev => {
          const nonCrm = prev.filter(t => !t.id.startsWith('perfex-'));
          return [...nonCrm, ...crmData];
        });
      }
    } catch (err) {
      console.error("CRM Sync Error:", err);
    } finally {
      setIsCrmSyncing(false);
    }
  };

  const loadFromCloud = async () => {
    setCloudStatus('syncing');
    try {
      const data = await GoogleSheetsService.load();
      if (data && data.transactions) {
        setTransactions(data.transactions);
        if (data.appConfig) setAppConfig(data.appConfig);
        if (data.categoriesMap) setCategoriesMap(data.categoriesMap);

        setCloudStatus('ok');
        console.log("✅ Dados carregados da nuvem com sucesso.");
      } else {
        setCloudStatus('idle'); // Sem dados ou erro silencioso
      }
    } catch (e) {
      setCloudStatus('error');
    }
  };

  // Carregar dados automaticamente assim que o usuário fizer login
  useEffect(() => {
    const hasSheets = !!localStorage.getItem('google_sheets_url');
    if (user && hasSheets) {
      console.log("👤 Usuário logado detected. Iniciando restauração automática...");
      loadFromCloud();
    }
  }, [user]);

  // Timer de 1 minuto (MODO TESTE ATIVADO)
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const isAutoSyncEnabled = localStorage.getItem('finan_auto_sync') === 'true';
      if (!isAutoSyncEnabled) return;

      const lastSync = parseInt(localStorage.getItem(LAST_SYNC_KEY) || '0');
      const now = Date.now();
      const oneMinute = 60 * 1000; // Alterado de 1 hora para 1 minuto para testes

      if (now - lastSync >= oneMinute) {
        console.log("🕒 [TESTE] Iniciando sincronismo automático (Ciclo de 1 min)...");
        syncToCloud();
      }
    }, 15000); // Verifica a cada 15 segundos se já deu 1 minuto

    return () => clearInterval(checkInterval);
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    localStorage.setItem(CAT_STORAGE_KEY, JSON.stringify(categoriesMap));
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(appConfig));
    const timeout = setTimeout(() => syncToCloud(), 3000);
    return () => clearTimeout(timeout);
  }, [transactions, categoriesMap, appConfig]);

  const handleUpdateStartingBalance = (value: number) => {
    setAppConfig(prev => ({ ...prev, startingBalance: isNaN(value) ? 0 : value }));
  };

  const totalOverallBalance = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    return (Number(appConfig.startingBalance) || 0) + income - expense;
  }, [transactions, appConfig.startingBalance]);

  const summary = useMemo(() => {
    const currentMonthTrans = transactions.filter(t => t.month === currentMonth && t.year === currentYear);
    const totalIncome = currentMonthTrans.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = currentMonthTrans.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
    const prevTrans = transactions.filter(t => t.year < currentYear || (t.year === currentYear && t.month < currentMonth));
    const prevIncome = prevTrans.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const prevExpense = prevTrans.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const accumulatedPrevBalance = (Number(appConfig.startingBalance) || 0) + prevIncome - prevExpense;
    return {
      previousBalance: accumulatedPrevBalance,
      totalIncome,
      totalExpense,
      currentBalance: accumulatedPrevBalance + totalIncome - totalExpense,
      endOfMonthBalance: accumulatedPrevBalance + totalIncome - totalExpense,
    };
  }, [transactions, currentMonth, currentYear, appConfig.startingBalance]);

  const handleAddTransaction = (tData: Omit<Transaction, 'id'>, options: { installments: number, isFixed: boolean }) => {
    const newId = Math.random().toString(36).substr(2, 9);
    if (options.installments > 1 && tData.type !== 'appointment') {
      const installmentTransactions: Transaction[] = [];
      for (let i = 0; i < options.installments; i++) {
        const d = new Date(tData.year, tData.month + i, tData.day);
        installmentTransactions.push({
          ...tData,
          id: `${newId}-${i}`,
          day: d.getDate(),
          month: d.getMonth(),
          year: d.getFullYear(),
          installmentNumber: i + 1,
          totalInstallments: options.installments
        });
      }
      setTransactions(prev => [...prev, ...installmentTransactions]);
    } else {
      setTransactions(prev => [...prev, { ...tData, id: newId }]);
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {!user ? (
        <LoginPage onLoginSuccess={setUser} />
      ) : (
        <div className="min-h-screen bg-slate-50 pb-12 font-sans">
          <AppointmentPopup appointments={transactions.filter(t => t.type === 'appointment' && t.day === new Date().getDate() && t.month === new Date().getMonth() && !t.completed && !acknowledgedIds.has(t.id))} onAcknowledge={id => setAcknowledgedIds(prev => new Set([...prev, id]))} />

          {editingTransaction && (
            <EditTransactionModal
              transaction={editingTransaction}
              categoriesMap={categoriesMap}
              onSave={(u) => { setTransactions(prev => prev.map(t => t.id === u.id ? u : t)); setEditingTransaction(null); }}
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

          <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-3">
            <div className="max-w-[1800px] mx-auto flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-900 p-2 rounded-xl text-white shadow-lg"><LayoutDashboard size={22} /></div>
                  <div>
                    <h1 className="text-sm font-black text-slate-900 leading-none uppercase tracking-tight">{appConfig.appName}</h1>
                    <div className="flex items-center gap-3 mt-1">
                      {cloudStatus === 'ok' ? (
                        <span className="text-[8px] font-black text-emerald-500 uppercase flex items-center gap-1">
                          <CloudCheck size={10} /> Sincronizado
                        </span>
                      ) : cloudStatus === 'syncing' ? (
                        <span className="text-[8px] font-black text-amber-500 uppercase flex items-center gap-1">
                          <Loader2 size={10} className="animate-spin" /> Salvando...
                        </span>
                      ) : (
                        <span className="text-[8px] font-black text-rose-500 uppercase flex items-center gap-1">
                          <AlertTriangle size={10} /> Erro Nuvem
                        </span>
                      )}
                      {localStorage.getItem('finan_auto_sync') === 'true' && (
                        <span className="text-[8px] font-black text-indigo-500 uppercase flex items-center gap-1 border-l border-slate-200 pl-2">
                          <Timer size={10} /> 1 Min Teste
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => { syncToCloud(); syncFromCRM(); }}
                  disabled={isCrmSyncing}
                  className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl border border-slate-200 transition-all group disabled:opacity-50"
                  title="Salvar na Nuvem"
                >
                  <RefreshCw size={14} className={`text-slate-500 ${isCrmSyncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform'}`} />
                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Salvar</span>
                </button>

                <button
                  onClick={() => { loadFromCloud(); }}
                  className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl border border-indigo-200 transition-all group"
                  title="Carregar da Nuvem"
                >
                  <CloudCheck size={14} className="text-indigo-500 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Restaurar</span>
                </button>

                <div className="bg-slate-900 text-white rounded-xl px-4 py-2 flex items-center gap-3 shadow-xl">
                  <Wallet size={16} className="text-emerald-400" />
                  <div className="flex flex-col">
                    <span className="text-[7px] font-black text-white/40 uppercase leading-none mb-0.5">Saldo Total</span>
                    <span className="text-xs font-black leading-none">{totalOverallBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button onClick={() => setCurrentView('dashboard')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all ${currentView === 'dashboard' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                    <LayoutDashboard size={14} /> Dashboard
                  </button>
                  <button onClick={() => setCurrentView('yearly')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all ${currentView === 'yearly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                    <BarChart3 size={14} /> Relatório Anual
                  </button>
                </div>

                <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                  <button onClick={() => { const d = new Date(currentYear, currentMonth - 1); setCurrentMonth(d.getMonth()); setCurrentYear(d.getFullYear()); }} className="p-1 hover:bg-white rounded-lg transition-all text-slate-400"><ChevronLeft size={16} /></button>
                  <div className="text-center min-w-[120px]">
                    <p className="text-[10px] font-black text-indigo-500 uppercase leading-none mb-1">{MONTHS_NAMES[currentMonth]}</p>
                    <p className="text-xs font-bold text-slate-800 leading-none">{currentYear}</p>
                  </div>
                  <button onClick={() => { const d = new Date(currentYear, currentMonth + 1); setCurrentMonth(d.getMonth()); setCurrentYear(d.getFullYear()); }} className="p-1 hover:bg-white rounded-lg transition-all text-slate-400"><ChevronRight size={16} /></button>
                </div>

                <button onClick={() => setShowSettings(true)} className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition-all border border-slate-200">
                  <Settings size={20} />
                </button>

                <button
                  onClick={() => setUser(null)}
                  className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-xl transition-all border border-rose-200"
                  title="Sair"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </header>

          <main className="max-w-[1800px] mx-auto p-6 space-y-8">
            {currentView === 'dashboard' ? (
              <div className="space-y-8">
                <SummaryCards summary={summary} onUpdateStartingBalance={handleUpdateStartingBalance} />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-3">
                    <TransactionForm onAdd={handleAddTransaction} categoriesMap={categoriesMap} currentMonth={currentMonth} currentYear={currentYear} />
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

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-9">
                    <TransactionList
                      transactions={transactions.filter(t => t.month === currentMonth && t.year === currentYear)}
                      onDelete={id => setTransactions(prev => prev.filter(t => t.id !== id))}
                      onEdit={setEditingTransaction}
                      onMove={(id, d) => setTransactions(prev => prev.map(t => t.id === id ? { ...t, day: d } : t))}
                      onToggleComplete={id => setTransactions(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t))}
                      selectedDay={selectedDayFilter}
                      onSelectedDayChange={setSelectedDayFilter}
                      categoriesMap={categoriesMap}
                      onManageCategories={() => setShowCategoryManager(true)}
                    />
                  </div>

                  <div className="lg:col-span-3 space-y-6">
                    <Calculator />
                    <ChatAgent
                      transactions={transactions}
                      currentBalance={totalOverallBalance}
                      categoriesMap={categoriesMap}
                      setTransactions={setTransactions}
                      setCategoriesMap={setCategoriesMap}
                    />
                  </div>
                </div>

                <AdvancedDashboard transactions={transactions.filter(t => t.month === currentMonth && t.year === currentYear)} allTransactions={transactions} currentMonth={currentMonth} year={currentYear} />
              </div>
            ) : (
              <YearlyReport transactions={transactions} year={currentYear} />
            )}
          </main>

          <footer className="max-w-[1800px] mx-auto px-6 py-4 text-center">
            <p className="text-[10px] text-slate-400 font-medium uppercas tracking-wider">
              Versão {APP_VERSION} dev • © 2026 S3 Multimídia
            </p>
          </footer>
        </div>
      )}
    </GoogleOAuthProvider>
  );
};

export default App;
