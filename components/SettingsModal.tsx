
import React, { useState, useRef, useEffect } from 'react';
import {
  X, Download, Upload, Share2, Save, ListTree, ChevronRight, CheckCircle2,
  FileSpreadsheet, Code, Copy, RefreshCw, AlertCircle, Info, ShieldAlert,
  Settings, ClipboardCopy, FileOutput, FolderOpen, Timer, History
} from 'lucide-react';
import { Transaction } from '../types';
import { GoogleSheetsService } from '../services/googleSheetsService';

interface SettingsModalProps {
  transactions: Transaction[];
  categories: string[];
  onImport: (data: { transactions: any, categories?: any }) => void;
  onClose: () => void;
  onOpenCategoryManager: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  transactions,
  categories,
  onImport,
  onClose,
  onOpenCategoryManager
}) => {
  const [sheetsUrl, setSheetsUrl] = useState(localStorage.getItem('google_sheets_url') || '');
  const [driveFolderId, setDriveFolderId] = useState(localStorage.getItem('google_drive_folder_id') || '');
  const [autoSync, setAutoSync] = useState(localStorage.getItem('finan_auto_sync') === 'true');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [copyCodeSuccess, setCopyCodeSuccess] = useState(false);
  const [copyTableSuccess, setCopyTableSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persistir configurações automaticamente
  useEffect(() => { localStorage.setItem('google_sheets_url', sheetsUrl); }, [sheetsUrl]);
  useEffect(() => { localStorage.setItem('google_drive_folder_id', driveFolderId); }, [driveFolderId]);

  // Script V6: Adicionado suporte para leitura (GET)
  const googleScriptCode = `function doGet(e) {
  var action = e.parameter.action;
  
  if (action == "read") {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("LANÇAMENTOS");
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ transactions: [] })).setMimeType(ContentService.MimeType.JSON);
    }
    
    var data = sheet.getDataRange().getValues();
    var transactions = [];
    
    // Pular cabeçalho (i=1)
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      // Ignora linhas vazias
      if (!row[0]) continue;

      transactions.push({
        id: "gs-" + i, // ID temporário
        day: parseInt(row[0]),
        month: parseInt(row[1]) - 1, // Sheets usa 1-12, App usa 0-11
        year: parseInt(row[2]),
        type: row[3].toLowerCase() == "expense" ? "expense" : "income",
        category: row[4],
        subCategory: row[5],
        description: row[6],
        amount: parseFloat(row[7]),
        completed: true 
      });
    }
    
    return ContentService.createTextOutput(JSON.stringify({ transactions: transactions })).setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput("Action not found").setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var folderId = data.folderId || "${driveFolderId || 'COLE_O_ID_DA_PASTA_AQUI'}";
    var transactions = data.transactions || [];
    
    // 1. Atualizar Planilha Atual
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("LANÇAMENTOS") || ss.insertSheet("LANÇAMENTOS");
    sheet.clear();
    var header = ["DIA", "MÊS", "ANO", "TIPO", "CATEGORIA", "SUBCATEGORIA", "DESCRIÇÃO", "VALOR"];
    sheet.appendRow(header);
    
    if (transactions.length > 0) {
      var rows = transactions.map(function(t) {
        return [t.day, t.month + 1, t.year, t.type.toUpperCase(), t.category, t.subCategory || "", t.description, t.amount];
      });
      sheet.getRange(2, 1, rows.length, header.length).setValues(rows);
    }

    // 2. Salvar CSV no Drive
    if (folderId && folderId !== "COLE_O_ID_DA_PASTA_AQUI") {
      var csvContent = header.join(";") + "\\n";
      transactions.forEach(function(t) {
        csvContent += t.day + ";" + (t.month + 1) + ";" + t.year + ";" + t.type + ";" + t.category + ";" + (t.subCategory || "") + ";" + t.description + ";" + t.amount + "\\n";
      });

      var fileName = "Export_Financeiro_" + new Date().toISOString().split('T')[0] + ".csv";
      var folder = DriveApp.getFolderById(folderId);
      
      // Remover arquivos anteriores com mesmo nome se desejar manter apenas um
      var oldFiles = folder.getFilesByName(fileName);
      while(oldFiles.hasNext()) { oldFiles.next().setTrashed(true); }
      
      folder.createFile(fileName, csvContent, MimeType.CSV);
    }

    return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    console.log("ERRO: " + err.message);
    return ContentService.createTextOutput("ERRO: " + err.message).setMimeType(ContentService.MimeType.TEXT);
  }
}`;

  const handleCopyTable = () => {
    const header = "DIA\tMÊS\tANO\tTIPO\tCATEGORIA\tSUBCATEGORIA\tDESCRIÇÃO\tVALOR\n";
    const rows = transactions.map(t =>
      `${t.day}\t${t.month + 1}\t${t.year}\t${t.type.toUpperCase()}\t${t.category}\t${t.subCategory || ""}\t${t.description}\t${t.amount.toString().replace('.', ',')}`
    ).join('\n');
    navigator.clipboard.writeText(header + rows);
    setCopyTableSuccess(true);
    setTimeout(() => setCopyTableSuccess(false), 2000);
  };

  const forceSync = async () => {
    if (!sheetsUrl) return alert("Insira o link /exec");
    setIsSyncing(true);
    setSyncStatus('idle');
    try {
      localStorage.setItem('google_sheets_url', sheetsUrl.trim());
      localStorage.setItem('google_drive_folder_id', driveFolderId.trim());
      localStorage.setItem('finan_auto_sync', autoSync.toString());
      await GoogleSheetsService.sync({ transactions });
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (e) {
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300 border border-white/20">
        <div className="bg-slate-900 px-8 py-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-2xl shadow-lg">
              <Settings size={22} />
            </div>
            <div>
              <h3 className="font-black text-xs uppercase tracking-[0.2em]">Automação Premium</h3>
              <p className="text-[9px] font-bold text-white/30 uppercase">Google Drive & Sincronismo</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-2xl transition-colors"><X size={24} /></button>
        </div>

        <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">

          <button
            onClick={onOpenCategoryManager}
            className="w-full p-6 bg-slate-900 text-white rounded-[2rem] hover:bg-indigo-600 transition-all flex items-center justify-between group shadow-xl"
          >
            <div className="flex items-center gap-5">
              <div className="bg-white/10 p-3 rounded-2xl group-hover:bg-white/20">
                <ListTree size={24} className="text-indigo-400 group-hover:text-white" />
              </div>
              <div className="text-left">
                <span className="text-sm font-black uppercase block mb-1">Gerenciar Categorias</span>
                <span className="text-[10px] font-bold text-white/40 uppercase">Ajuste nomes e subcategorias</span>
              </div>
            </div>
            <ChevronRight size={20} className="text-white/20" />
          </button>

          <section className="bg-indigo-50 p-6 rounded-[2.5rem] border border-indigo-100 space-y-4">
            <div className="flex justify-between items-start">
              <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                <Timer size={16} /> Upload Automático (10 min)
              </h4>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={autoSync} onChange={(e) => {
                  setAutoSync(e.target.checked);
                  localStorage.setItem('finan_auto_sync', e.target.checked.toString());
                }} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div className="space-y-3">
              <div className="bg-white p-4 rounded-2xl border border-indigo-100">
                <label className="text-[9px] font-black text-slate-400 uppercase block mb-2">ID da Pasta do Google Drive</label>
                <div className="flex gap-2">
                  <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400"><FolderOpen size={16} /></div>
                  <input
                    type="text"
                    placeholder="Cole o ID da pasta do Drive aqui..."
                    value={driveFolderId}
                    onChange={(e) => setDriveFolderId(e.target.value)}
                    className="flex-1 text-[10px] font-mono outline-none bg-transparent"
                  />
                </div>
              </div>
            </div>
            <p className="text-[8px] font-bold text-indigo-400 uppercase text-center italic">
              Se ligado, o sistema enviará um CSV para o Drive a cada 10 minutos se a aba estiver aberta.
            </p>
          </section>

          <section className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-200 space-y-4">
            <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
              <Code size={16} /> Configurar Script V6 (Leitura/Escrita)
            </h4>

            <button
              onClick={() => {
                navigator.clipboard.writeText(googleScriptCode);
                setCopyCodeSuccess(true);
                setTimeout(() => setCopyCodeSuccess(false), 2000);
              }}
              className="w-full py-4 px-5 bg-white border-2 border-dashed border-indigo-100 rounded-2xl text-indigo-600 flex items-center justify-between"
            >
              <div className="flex items-center gap-3"><Code size={20} /><span className="text-[10px] font-black uppercase">Copiar Novo Script V6</span></div>
              {copyCodeSuccess ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Copy size={18} />}
            </button>

            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <label className="text-[9px] font-black text-slate-400 uppercase block mb-2">Link da Implantação (/exec)</label>
              <input
                type="text"
                placeholder="URL do Web App Google..."
                value={sheetsUrl}
                onChange={(e) => setSheetsUrl(e.target.value)}
                className="w-full px-4 py-3 border border-slate-100 rounded-xl text-[10px] font-mono outline-none bg-slate-50"
              />
            </div>

            <button
              onClick={forceSync}
              disabled={isSyncing}
              className={`w-full py-5 rounded-[1.5rem] font-black text-xs uppercase transition-all flex items-center justify-center gap-3 shadow-xl ${syncStatus === 'success' ? 'bg-emerald-600 text-white' :
                syncStatus === 'error' ? 'bg-rose-600 text-white' :
                  'bg-slate-900 text-white hover:bg-slate-800'
                }`}
            >
              {isSyncing ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              {isSyncing ? 'Enviando Dados...' : syncStatus === 'success' ? 'Sucesso!' : syncStatus === 'error' ? 'Erro: Verifique o Link' : 'Sincronizar Manual Agora'}
            </button>
          </section>

          <div className="grid grid-cols-2 gap-4">
            <button onClick={handleCopyTable} className="flex flex-col items-center justify-center p-6 bg-slate-900 text-white rounded-3xl hover:bg-indigo-600 transition-all group shadow-lg">
              <ClipboardCopy size={24} className="mb-2 opacity-50 group-hover:opacity-100" />
              <span className="text-[9px] font-black uppercase">{copyTableSuccess ? 'Copiado!' : 'Copiar p/ Planilha'}</span>
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-3xl hover:border-slate-400 transition-all group">
              <Upload size={24} className="text-slate-400 mb-2" />
              <span className="text-[9px] font-black uppercase text-slate-500">Restaurar Backup</span>
              <input type="file" ref={fileInputRef} className="hidden" accept=".json" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
