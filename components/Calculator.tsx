
import React, { useState, useRef } from 'react';
import { Calculator as CalcIcon, Delete, Keyboard, Percent } from 'lucide-react';

export const Calculator: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleNumber = (n: string) => {
    setDisplay(prev => {
      if (prev === '0' && n !== '.') return n;
      if (n === '.' && prev.includes('.')) return prev;
      return prev + n;
    });
  };

  const handleOp = (op: string) => {
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
  };

  const handlePercent = () => {
    try {
      const val = parseFloat(display);
      if (!isNaN(val)) {
        setDisplay((val / 100).toString());
      }
    } catch {
      setDisplay('Erro');
    }
  };

  const calculate = () => {
    try {
      const result = new Function(`return ${equation + display}`)();
      const finalResult = Number.isFinite(result) ? result.toString() : 'Erro';
      setDisplay(finalResult);
      setEquation('');
    } catch {
      setDisplay('Erro');
    }
  };

  const clear = () => {
    setDisplay('0');
    setEquation('');
  };

  const backspace = () => {
    setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (['+', '-', '*', '/', 'Enter', 'Backspace', 'Escape', '%'].includes(e.key)) {
      e.preventDefault();
    }
    if (/[0-9]/.test(e.key)) {
      handleNumber(e.key);
    } else if (['+', '-', '*', '/'].includes(e.key)) {
      handleOp(e.key);
    } else if (e.key === 'Enter' || e.key === '=') {
      calculate();
    } else if (e.key === 'Backspace') {
      backspace();
    } else if (e.key === 'Escape') {
      clear();
    } else if (e.key === '%') {
      handlePercent();
    } else if (e.key === '.' || e.key === ',') {
      handleNumber('.');
    }
  };

  return (
    <div 
      ref={containerRef}
      tabIndex={0}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onKeyDown={handleKeyDown}
      className={`bg-slate-900 rounded-xl p-4 shadow-xl border transition-all duration-300 outline-none select-none ${
        isFocused ? 'border-indigo-500 ring-4 ring-indigo-500/20 scale-[1.02]' : 'border-slate-800'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-slate-400">
          <CalcIcon size={14} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Calculadora</span>
        </div>
        {isFocused ? (
          <div className="flex items-center gap-1 animate-pulse">
            <Keyboard size={12} className="text-indigo-400" />
            <span className="text-[8px] font-black text-indigo-400 uppercase">Teclado Ativo</span>
          </div>
        ) : (
          <span className="text-[8px] font-black text-slate-600 uppercase">Clique p/ Ativar</span>
        )}
      </div>
      
      <div className={`bg-slate-800 rounded-lg p-3 mb-4 text-right transition-colors ${isFocused ? 'bg-slate-800/80 ring-1 ring-slate-700' : ''}`}>
        <div className="text-[10px] text-slate-500 h-4 font-mono">{equation}</div>
        <div className="text-xl font-mono font-bold text-white truncate flex items-center justify-end gap-1">
          {display !== 'Erro' && <span className="text-indigo-400 text-sm">R$</span>}
          {display}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <button onClick={clear} className="bg-slate-800 hover:bg-slate-700 text-rose-400 p-2 rounded-lg text-xs font-bold transition-colors">C</button>
        <button onClick={backspace} className="bg-slate-800 hover:bg-slate-700 text-slate-400 p-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center">
          <Delete size={14} />
        </button>
        <button onClick={handlePercent} className="bg-slate-800 hover:bg-slate-700 text-indigo-400 p-2 rounded-lg text-sm font-bold transition-colors">%</button>
        <button onClick={() => handleOp('/')} className="bg-slate-800 hover:bg-slate-700 text-indigo-400 p-2 rounded-lg text-sm font-bold transition-colors">/</button>
        
        {['7', '8', '9'].map(n => (
          <button key={n} onClick={() => handleNumber(n)} className="bg-slate-800/40 hover:bg-slate-700 text-white p-2 rounded-lg text-sm font-bold transition-colors">{n}</button>
        ))}
        <button onClick={() => handleOp('*')} className="bg-slate-800 hover:bg-slate-700 text-indigo-400 p-2 rounded-lg text-sm font-bold transition-colors">*</button>
        
        {['4', '5', '6'].map(n => (
          <button key={n} onClick={() => handleNumber(n)} className="bg-slate-800/40 hover:bg-slate-700 text-white p-2 rounded-lg text-sm font-bold transition-colors">{n}</button>
        ))}
        <button onClick={() => handleOp('-')} className="bg-slate-800 hover:bg-slate-700 text-indigo-400 p-2 rounded-lg text-sm font-bold transition-colors">-</button>
        
        {['1', '2', '3'].map(n => (
          <button key={n} onClick={() => handleNumber(n)} className="bg-slate-800/40 hover:bg-slate-700 text-white p-2 rounded-lg text-sm font-bold transition-colors">{n}</button>
        ))}
        <button onClick={() => handleOp('+')} className="bg-slate-800 hover:bg-slate-700 text-indigo-400 p-2 rounded-lg text-sm font-bold transition-colors">+</button>
        
        <button onClick={() => handleNumber('0')} className="bg-slate-800/40 hover:bg-slate-700 text-white p-2 rounded-lg text-sm font-bold">0</button>
        <button onClick={() => handleNumber('.')} className="bg-slate-800/40 hover:bg-slate-700 text-white p-2 rounded-lg text-sm font-bold">.</button>
        <button onClick={calculate} className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-indigo-900/20 col-span-2">=</button>
      </div>
    </div>
  );
};
