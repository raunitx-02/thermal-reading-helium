import React, { createContext, useState, useContext } from 'react';
import { AlertTriangle, CheckCircle2, Info, HelpCircle } from 'lucide-react';

const ModalContext = createContext(null);

export const ModalProvider = ({ children }) => {
  const [modalConfig, setModalConfig] = useState(null);

  const showAlert = (title, message, type = 'info') => {
    return new Promise((resolve) => {
      setModalConfig({
        title,
        message,
        type,
        isConfirm: false,
        onClose: () => {
          setModalConfig(null);
          resolve();
        }
      });
    });
  };

  const showConfirm = (title, message, type = 'warning', confirmText = 'Confirm', cancelText = 'Cancel') => {
    return new Promise((resolve) => {
      setModalConfig({
        title,
        message,
        type,
        isConfirm: true,
        confirmText,
        cancelText,
        onConfirm: () => {
          setModalConfig(null);
          resolve(true);
        },
        onCancel: () => {
          setModalConfig(null);
          resolve(false);
        }
      });
    });
  };

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {modalConfig && <CustomModal config={modalConfig} />}
    </ModalContext.Provider>
  );
};

const CustomModal = ({ config }) => {
  const { title, message, type, isConfirm, confirmText, cancelText, onConfirm, onCancel, onClose } = config;

  let Icon = Info;
  let iconColor = 'text-blue-500 bg-blue-50';
  let buttonColor = 'bg-blue-600 hover:bg-blue-700';

  if (type === 'success') {
    Icon = CheckCircle2;
    iconColor = 'text-emerald-500 bg-emerald-50';
    buttonColor = 'bg-emerald-600 hover:bg-emerald-700';
  } else if (type === 'warning') {
    Icon = AlertTriangle;
    iconColor = 'text-amber-500 bg-amber-50';
    buttonColor = 'bg-amber-600 hover:bg-amber-700';
  } else if (type === 'error' || type === 'critical') {
    Icon = AlertTriangle;
    iconColor = 'text-red-500 bg-red-50';
    buttonColor = 'bg-red-600 hover:bg-red-700';
  } else if (type === 'confirm') {
    Icon = HelpCircle;
    iconColor = 'text-blue-500 bg-blue-50';
    buttonColor = 'bg-blue-600 hover:bg-blue-700';
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[9999] transition-opacity duration-300 animate-fade-in">
      <div className="bg-white border border-slate-100 rounded-3xl w-full max-w-sm shadow-2xl p-6 relative overflow-hidden transition-all transform scale-100 animate-ios-spring flex flex-col items-center text-center">
        {/* Icon */}
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 shrink-0 ${iconColor}`}>
          <Icon className="w-7 h-7" />
        </div>

        {/* Title & Description */}
        <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-2 px-2">{title}</h3>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed px-4">{message}</p>

        {/* Action Buttons */}
        <div className="flex gap-3 w-full mt-auto">
          {isConfirm ? (
            <>
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition active:scale-[0.98]"
              >
                {cancelText || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`flex-1 py-2.5 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-[0.98] ${buttonColor}`}
              >
                {confirmText || 'Confirm'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className={`w-full py-2.5 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-[0.98] ${buttonColor}`}
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const useModal = () => useContext(ModalContext);
