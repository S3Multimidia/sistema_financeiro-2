
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Transaction } from '../types';
import { 
  Send, Bot, Trash2, Loader2, Mic, MicOff, Check, Zap, Briefcase, Paperclip, X, Image as ImageIcon
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
  image?: string; // Base64 da imagem para exibição no histórico
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
  const [isRecording, setIsRecording] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
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
          description: action.args.description.toUpperCase(),
          category: action.args.category.toUpperCase()
        }]);
      }
      action.status = 'confirmed';
      return newMessages;
    });
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;
    
    const userText = input.trim();
    const currentImg = selectedImage;
    
    setMessages(prev => [...prev, { 
      role: 'user', 
      agent: activeAgent, 
      text: userText || (currentImg ? "Enviou uma imagem para análise." : ""),
      image: currentImg || undefined
    }]);
    
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const today = new Date();
      
      const sysIns = activeAgent === 'executor' 
        ? `Você é o AGENTE EXECUTOR do sistema FINANCEIRO PRO 2026. 
           Sua missão é ENTENDER mensagens de texto e IMAGENS (extratos, recibos, anotações).
           DATA ATUAL: ${today.toLocaleDateString()}.
           
           REGRAS:
           1. Se o usuário enviar uma imagem, extraia valores, datas, descrições e categorias.
           2. Sempre use a ferramenta 'add_transaction' para sugerir lançamentos.
           3. Se faltar informação na imagem (como categoria), tente inferir ou pergunte.
           4. Seja profissional e direto.`
        : `Você é o CONSULTOR ESTRATEGISTA. Saldo atual: ${currentBalance}. 
           Analise os dados financeiros e imagens de planejamento que o usuário enviar.`;

      const contents: any[] = [];
      const parts: any[] = [{ text: sysIns }];
      
      if (currentImg) {
        parts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: currentImg.split(',')[1]
          }
        });
      }
      
      parts.push({ text: userText || "Analise esta imagem e identifique lançamentos financeiros nela." });
      
      contents.push({ role: 'user', parts });

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents,
        config: activeAgent === 'executor' ? { 
          tools: [{ 
            functionDeclarations: [{
              name: 'add_transaction',
              description: 'Adiciona um novo registro financeiro baseado na análise.',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.NUMBER, description: 'Dia do mês' },
                  month: { type: Type.NUMBER, description: 'Mês (0-11)' },
                  year: { type: Type.NUMBER, description: 'Ano' },
                  description: { type: Type.STRING, description: 'Descrição curta' },
                  amount: { type: Type.NUMBER, description: 'Valor numérico' },
                  type: { type: Type.STRING, description: 'income, expense ou appointment' },
                  category: { type: Type.STRING, description: 'Categoria principal' }
                },
                required: ['day', 'month', 'year', 'description', 'amount', 'type', 'category']
              }
            }]
          }] 
        } : {}
      });

      let actions: ChatAction[] = [];
      if (response.functionCalls && activeAgent === 'executor') {
        actions = response.functionCalls.map(c => ({
          id: Math.random().toString(36).substr(2, 9),
          name: c.name,
          args: c.args,
          status: 'pending'
        }));
      }

      setMessages(prev => [...prev, { 
        role: 'model', 
        agent: activeAgent, 
        text: response.text || (actions.length > 0 ? "Identifiquei o seguinte lançamento na imagem:" : "Entendido."), 
        actions 
      }]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'model', text: "Erro ao processar a imagem ou texto. Verifique sua conexão." }]);
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
        <button onClick={() => setMessages([{role:'model', text:'Histórico limpo.'}])} className="text-white/20 hover:text-rose-400 transition-colors"><Trash2 size={14} /></button>
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
              {msg.image && (
                <div className="mb-2 rounded-lg overflow-hidden border border-white/10">
                  <img src={msg.image} alt="Upload" className="max-w-full h-auto object-cover" />
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
                  {action.status === 'confirmed' && <div className="text-emerald-400 text-[9px] font-black uppercase flex items-center gap-1 justify-center py-1"><Check size={12}/> Confirmado no Sistema</div>}
                </div>
              ))}
            </div>
          </div>
        ))}
        {isLoading && <div className="flex justify-center py-2"><Loader2 size={16} className="animate-spin text-indigo-500" /></div>}
      </div>

      {/* Preview da Imagem Selecionada */}
      {selectedImage && (
        <div className="px-4 py-2 bg-slate-800/80 border-t border-white/5 flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-indigo-500 shadow-lg">
            <img src={selectedImage} className="w-full h-full object-cover" />
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute top-0 right-0 bg-rose-600 text-white p-0.5 rounded-bl-lg"
            >
              <X size={10} />
            </button>
          </div>
          <span className="text-[10px] text-indigo-400 font-bold uppercase">Imagem pronta para análise</span>
        </div>
      )}

      <div className="p-4 bg-slate-900/60 border-t border-white/5">
        <div className="bg-slate-800/50 rounded-2xl flex items-center p-1.5 border border-white/5">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageSelect} 
            accept="image/*" 
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
            placeholder={selectedImage ? "O que deseja fazer com a foto?" : "O que lançamos hoje?"} 
            className="flex-1 bg-transparent px-3 py-2 text-xs text-white outline-none placeholder:text-white/20" 
          />
          
          <button className="p-2 text-white/20 hover:text-white transition-colors"><Mic size={18} /></button>
          <button onClick={handleSend} className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition-all ml-1"><Send size={16} /></button>
        </div>
      </div>
    </div>
  );
};
