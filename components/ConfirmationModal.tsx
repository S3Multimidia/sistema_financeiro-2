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
                    {/* This part will be replaced by the sophisticated 3-button logic below */}
                </div>
            </div>
        </div>
    );
};
