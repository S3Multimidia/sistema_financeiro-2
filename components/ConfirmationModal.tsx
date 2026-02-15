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
    onAlternative?: () => void;
    alternativeLabel?: string;
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
    onAlternative,
    alternativeLabel,
    type = 'warning'
}) => {
    if (!isOpen) return null;

    // Check if we need the 3-button layout (based on labels provided in App.tsx usages)
    // Actually, App.tsx passes `cancelLabel` as the "Alternative" action in current logic.
    // We need to refactor App.tsx to use a new prop structure if we want a true "Cancel" (X) button + 2 choices.
    // BUT for now, I will enable a 3rd button if `onCancel` is treated as a third option.
    // Wait, the plan says:
    // 1. Cancel (Gray) -> New
    // 2. Alternative (White) -> Was "cancelLabel"
    // 3. Confirm (Color) -> Was "confirmLabel"

    // I need to add `onAlternative` prop to the interface first.
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

                <div className="bg-slate-50 p-4 border-t border-slate-100 flex gap-3 flex-wrap">
                    <div className="flex gap-3 w-full">
                        {onAlternative ? (
                            <>
                                <button
                                    onClick={onCancel}
                                    className="px-4 py-3 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl font-bold uppercase text-[10px] hover:bg-slate-200 transition-colors shadow-sm min-w-[80px]"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={onAlternative}
                                    className="flex-1 py-3 px-4 bg-white border-2 border-indigo-100 text-indigo-600 rounded-xl font-bold uppercase text-[10px] hover:bg-indigo-50 hover:border-indigo-200 transition-colors shadow-sm"
                                >
                                    {alternativeLabel || 'Opção 2'}
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className={`flex-1 py-3 px-4 rounded-xl font-bold uppercase text-[10px] text-white shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 ${type === 'danger' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' :
                                        type === 'warning' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                                        }`}
                                >
                                    <CheckCircle2 size={14} />
                                    {confirmLabel}
                                </button>
                            </>
                        ) : (
                            <>
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
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
