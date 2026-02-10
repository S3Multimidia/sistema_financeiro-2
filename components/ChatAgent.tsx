import React, { useState, useRef, useEffect } from 'react';
import { Type } from "@google/genai";
import { Transaction } from '../types';
import {
  Send, Bot, Trash2, Loader2, Mic, Check, Zap, Briefcase, Paperclip, X
} from 'lucide-react';

type AgentMode = 'executor' | 'consultant';

interface ChatAction {
  id: string;
  name: string;
  args: any;
  status: 'pending' | 'confirmed' | 'cancelled';
}

interface ChatAgentProps {
  transactions: Transaction[];
  currentBalance: number;
  categoriesMap: Record<string, string[]>;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  setCategoriesMap: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
}

interface Message {
  role: 'user' | 'model';
  agent?: AgentMode;
  text: string;
  file?: { data: string; mimeType: string };
  actions?: ChatAction[];
}

export const ChatAgent: React.FC<ChatAgentProps> = ({
  transactions,
  currentBalance,
  categoriesMap,
  setTransactions,
  setCategoriesMap
}) => {
  const [activeAgent, setActiveAgent] = useState<AgentMode>('executor');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', agent: 'executor', text: 'Agente Executor ativo. Pronto para realizar lançamentos, analisar imagens e sincronizar dados.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ data: string, name: string, type: string } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedFile({
          data: reader.result as string,
          name: file.name,
          type: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmAction = (msgIdx: number, actionId: string) => {
    setMessages(prev => {
      const newMessages = [...prev];
      const msg = newMessages[msgIdx];
      if (!msg.actions) return prev;
      const action = msg.actions.find(a => a.id === actionId);
      if (!action || action.status !== 'pending') return prev;

      if (action.name === 'add_transaction') {
        setTransactions(old => [...old, {
          id: Math.random().toString(36).substr(2, 9),
          ...action.args,
          description: action.args.description?.toUpperCase() || 'SEM DESCRIÇÃO',
          category: action.args.category?.toUpperCase() || 'GERAL'
        }]);
      }
      action.status = 'confirmed';
      return newMessages;
    });
  };

  const handleSend = async () => {
    const apiKey = localStorage.getItem('gemini_api_key') || 'AIzaSyAJx8Uo5aONwpKpwYAJBoVrqfBdBrxp0Ek';

    if (!apiKey || apiKey === 'SUA_CHAVE_API_AQUI') {
      setMessages(prev => [...prev, {
        role: 'model',
        text: "⚠️ Erro de Configuração: Chave de API não definida."
      }]);
      return;
    }

    const userText = input.trim();
    const currentFile = selectedFile;

    setMessages(prev => [...prev, {
      role: 'user',
      agent: activeAgent,
      text: userText || (currentFile ? `Enviou um arquivo para análise: ${currentFile.name}` : ""),
      file: currentFile ? { data: currentFile.data, mimeType: currentFile.type } : undefined
    }]);

    setInput('');
    setSelectedFile(null);
    setIsLoading(true);

    try {
      const today = new Date();
      const validCategories = Object.keys(categoriesMap).join(', ');

      const sysIns = activeAgent === 'executor'
        ? `Você é o AGENTE EXECUTOR do sistema FINANCEIRO PRO 2026. 
           Sua missão é ENTENDER mensagens de texto, IMAGENS e PDFs (extratos bancários, recibos).
           DATA ATUAL: ${today.toLocaleDateString()} (Dia/Mês/Ano).
           
           INSTRUÇÕES PARA PDFs/EXTRATOS:
           1. Extraia EXCLUSIVAMENTE os lançamentos de DÉBITO (saídas de dinheiro). IGNORE RECEITAS (entradas).
           2. Identifique o DIA exato de cada lançamento conforme consta no arquivo.
           3. CATEGORIZAÇÃO INTELIGENTE:
              - Use estas categorias existentes: [${validCategories}].
              - Tente mapear o lançamento para a categoria mais lógica.
              - Caso NÃO consiga identificar uma categoria compatível ou tenha dúvida, use OBRIGATORIAMENTE a categoria: "CATEGORIA NÃO DEFINIDA".
           4. Status: Todos os débitos extraídos de extratos/arquivos devem ser marcados com 'completed: true' (lançados como pagos).
           5. Chame 'add_transaction' para cada débito encontrado.
           6. Se a data (mês/ano) não for especificada no arquivo, use o mês/ano atual (${today.getMonth()}/${today.getFullYear()}).
           7. Responda brevemente confirmando quantos débitos foram identificados.`
        : `Você é o CONSULTOR ESTRATEGISTA do sistema. 
           CATEGORIAS: [${validCategories}]
           CONTEXTO ATUAL:
           - Saldo Atual: R$ ${currentBalance.toFixed(2)}
           - Data: ${today.toLocaleDateString()}`;

      // Construct Payload manually for REST API
      const model = 'gemini-1.5-flash-latest';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const contents = [{
        role: "user",
        parts: [
          { text: sysIns },
          ...(currentFile ? [{ inline_data: { mime_type: currentFile.type, data: currentFile.data.split(',')[1] } }] : []),
          { text: userText || "Analise o arquivo e extraia os débitos." }
        ]
      }];

      const tools = activeAgent === 'executor' ? [{
        function_declarations: [{
          name: 'add_transaction',
          description: 'Adiciona um novo registro financeiro no sistema.',
          parameters: {
            type: 'OBJECT',
            properties: {
              day: { type: 'NUMBER', description: 'Dia do mês (1-31)' },
              month: { type: 'NUMBER', description: 'Mês (0-11)' },
              year: { type: 'NUMBER', description: 'Ano (ex: 2026)' },
              description: { type: 'STRING', description: 'Descrição da transação' },
              amount: { type: 'NUMBER', description: 'Valor da transação (positivo)' },
              type: { type: 'STRING', description: 'income (receita), expense (despesa) ou appointment (agenda)' },
              category: { type: 'STRING', description: 'Categoria da transação' },
              completed: { type: 'BOOLEAN', description: 'Se a transação já foi paga (true) ou está pendente (false)' }
            },
            required: ['day', 'month', 'year', 'description', 'amount', 'type', 'category', 'completed']
          }
        }]
      }] : undefined;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents, tools })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      const data = await response.json();
      const candidate = data.candidates?.[0];
      const modelResponse = candidate?.content?.parts?.[0]?.text;

      // Handle Function Calls separately for REST
      const functionCalls = candidate?.content?.parts?.filter((p: any) => p.functionCall).map((p: any) => p.functionCall);

      let actions: ChatAction[] = [];
      if (functionCalls && functionCalls.length > 0 && activeAgent === 'executor') {
        actions = functionCalls.map((fc: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          name: fc.name,
          args: fc.args, // REST API returns args as object directly usually, or struct
          status: 'pending'
        }));
      }

      setMessages(prev => [...prev, {
        role: 'model',
        agent: activeAgent,
        text: modelResponse || (actions.length > 0 ? "Preparei os lançamentos abaixo para sua confirmação:" : "Processado."),
        actions
      }]);

    } catch (e: any) {
      console.error(e);
      let errorMsg = "Erro ao processar solicitação.";
      if (e.message) errorMsg += `\nDetalhes: ${e.message}`;
      setMessages(prev => [...prev, { role: 'model', text: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#1e1e2d] rounded-2xl shadow-2xl border border-white/5 flex flex-col h-[520px] overflow-hidden">
      <div className="bg-slate-900/80 p-3 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-2">
          <Bot size={14} className="text-indigo-400" />
          <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">IA Online</span>
        </div>
        <button onClick={() => setMessages([{ role: 'model', agent: 'executor', text: 'Histórico limpo.' }])} className="text-white/20 hover:text-rose-400 transition-colors"><Trash2 size={14} /></button>
      </div>

      <div className="p-1.5 flex gap-1 bg-slate-900/40">
        <button onClick={() => setActiveAgent('executor')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeAgent === 'executor' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/30 hover:text-white/50'}`}>
          <Zap size={14} /> Executor
        </button>
        <button onClick={() => setActiveAgent('consultant')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeAgent === 'consultant' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/30 hover:text-white/50'}`}>
          <Briefcase size={14} /> Consultor
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-900/20">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-[11px] leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-white/80 border border-white/5'}`}>
              {msg.file && (
                <div className="mb-2 rounded-lg overflow-hidden border border-white/10">
                  {msg.file.mimeType.startsWith('image/') ? (
                    <img src={msg.file.data} alt="Upload" className="max-w-full h-auto object-cover" />
                  ) : (
                    <div className="bg-slate-800 p-4 flex items-center gap-3">
                      <Zap size={20} className="text-amber-400" />
                      <span className="text-[10px] font-bold text-white/60">DOCUMENTO PDF ANALISADO</span>
                    </div>
                  )}
                </div>
              )}
              <div className="whitespace-pre-wrap">{msg.text}</div>
              {msg.actions?.map(action => (
                <div key={action.id} className="mt-3 p-3 rounded-xl bg-slate-900/50 border border-indigo-500/30">
                  <div className="text-[9px] text-indigo-400 font-black mb-1 uppercase tracking-widest">Sugestão de Análise</div>
                  <div className="text-[11px] font-bold text-white mb-3">{action.args.description} • R$ {action.args.amount?.toFixed(2)}</div>
                  {action.status === 'pending' && (
                    <button onClick={() => handleConfirmAction(idx, action.id)} className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase transition-all shadow-lg">Lançar Agora</button>
                  )}
                  {action.status === 'confirmed' && <div className="text-emerald-400 text-[9px] font-black uppercase flex items-center gap-1 justify-center py-1"><Check size={12} /> Confirmado no Sistema</div>}
                </div>
              ))}
            </div>
          </div>
        ))}
        {isLoading && <div className="flex justify-center py-2"><Loader2 size={16} className="animate-spin text-indigo-500" /></div>}
      </div>

      {/* Preview do Arquivo Selecionado */}
      {selectedFile && (
        <div className="px-4 py-2 bg-slate-800/80 border-t border-white/5 flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-indigo-500 shadow-lg flex items-center justify-center bg-slate-900">
            {selectedFile.type.startsWith('image/') ? (
              <img src={selectedFile.data} className="w-full h-full object-cover" />
            ) : (
              <Zap size={20} className="text-amber-400" />
            )}
            <button
              onClick={() => setSelectedFile(null)}
              className="absolute top-0 right-0 bg-rose-600 text-white p-0.5 rounded-bl-lg"
            >
              <X size={10} />
            </button>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-indigo-400 font-bold uppercase truncate max-w-[200px]">{selectedFile.name}</span>
            <span className="text-[8px] text-white/40 uppercase">Pronto para processamento</span>
          </div>
        </div>
      )}

      <div className="p-4 bg-slate-900/60 border-t border-white/5">
        <div className="bg-slate-800/50 rounded-2xl flex items-center p-1.5 border border-white/5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*, application/pdf"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-white/30 hover:text-indigo-400 transition-colors"
            title="Anexar Foto/Extrato"
          >
            <Paperclip size={18} />
          </button>

          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={selectedFile ? "O que deseja fazer com o arquivo?" : "O que lançamos hoje?"}
            className="flex-1 bg-transparent px-3 py-2 text-xs text-white outline-none placeholder:text-white/20"
          />

          <button className="p-2 text-white/20 hover:text-white transition-colors invisible"><Mic size={18} /></button>
          <button onClick={handleSend} className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition-all ml-1"><Send size={16} /></button>
        </div>
      </div>
    </div>
  );
};
