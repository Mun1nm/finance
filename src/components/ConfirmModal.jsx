import { X, AlertTriangle } from "lucide-react";

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-sm w-full p-6 relative animate-scale-up">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-3 bg-red-500/10 rounded-full text-red-500">
            <AlertTriangle size={32} />
          </div>
          
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            {message}
          </p>

          <div className="flex gap-3 w-full pt-2">
            <button 
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-600 text-gray-300 font-medium hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={onConfirm}
              className="flex-1 py-2.5 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-900/20 transition-colors"
            >
              Sim, excluir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}