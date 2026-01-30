import React from 'react';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    type?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmLabel = 'Sim, Confirmar',
    cancelLabel = 'Não, Cancelar',
    type = 'warning'
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">

                <div className="p-6 text-center space-y-4">
                    <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${type === 'danger' ? 'bg-rose-100 text-rose-600' :
                        type === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'
                        }`}>
                        <AlertTriangle size={32} />
                    </div>

                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none px-4">
                        {title}
                    </h3>

                    <p className="text-sm text-slate-500 font-medium leading-relaxed px-4">
                        {message}
                    </p>
                </div>

                <div className="bg-slate-50 p-4 border-t border-slate-100 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold uppercase text-xs hover:bg-slate-100 transition-colors shadow-sm"
                    >
                        {cancelLabel}
                    </button>

                    <button
                        onClick={onConfirm}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold uppercase text-xs text-white shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 ${type === 'danger' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' :
                            type === 'warning' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                            }`}
                    >
                        <CheckCircle2 size={16} />
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};
