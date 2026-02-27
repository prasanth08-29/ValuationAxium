import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';

const AlertContext = createContext();

export function useAlert() {
    return useContext(AlertContext);
}

export function AlertProvider({ children }) {
    const [alertConfig, setAlertConfig] = useState(null);
    const [confirmConfig, setConfirmConfig] = useState(null);

    const showAlert = useCallback((title, message, type = 'info') => {
        setAlertConfig({ title, message, type });
        // Auto dismiss after 4 seconds for non-errors, or let user dismiss
        if (type !== 'error') {
            setTimeout(() => setAlertConfig(null), 4000);
        }
    }, []);

    const showConfirm = useCallback((title, message, onConfirm, confirmText = 'Confirm', cancelText = 'Cancel') => {
        setConfirmConfig({
            title,
            message,
            confirmText,
            cancelText,
            onConfirm: () => {
                onConfirm();
                setConfirmConfig(null);
            },
            onCancel: () => setConfirmConfig(null)
        });
    }, []);

    const closeAlert = () => setAlertConfig(null);
    const closeConfirm = () => setConfirmConfig(null);

    return (
        <AlertContext.Provider value={{ showAlert, showConfirm }}>
            {children}

            {/* Alert Toast / Modal */}
            {alertConfig && (
                <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
                    <div className={`shadow-lg rounded-xl border p-4 max-w-sm w-full flex items-start gap-4 bg-white
                        ${alertConfig.type === 'error' ? 'border-red-200 shadow-red-100/50' :
                            alertConfig.type === 'success' ? 'border-green-200 shadow-green-100/50' :
                                'border-blue-200 shadow-blue-100/50'}
                    `}>
                        <div className="mt-0.5">
                            {alertConfig.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                            {alertConfig.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                            {alertConfig.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
                        </div>
                        <div className="flex-1">
                            {alertConfig.title && <h4 className="font-semibold text-gray-900 text-sm">{alertConfig.title}</h4>}
                            <p className="text-sm text-gray-600 mt-1">{alertConfig.message}</p>
                        </div>
                        <button onClick={closeAlert} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Confirm Modal */}
            {confirmConfig && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                <AlertTriangle className="w-5 h-5 text-amber-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">{confirmConfig.title}</h3>
                        </div>
                        <p className="text-gray-600 mb-6 pl-14">{confirmConfig.message}</p>

                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={confirmConfig.onCancel}
                                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                {confirmConfig.cancelText}
                            </button>
                            <button
                                onClick={confirmConfig.onConfirm}
                                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm"
                            >
                                {confirmConfig.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AlertContext.Provider>
    );
}
