import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";

export function InstallmentDeleteModal({ isOpen, onClose, onDeleteSingle, onDeleteAll }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) setIsSubmitting(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDeleteSingle = async () => {
    setIsSubmitting(true);
    await onDeleteSingle();
  };

  const handleDeleteAll = async () => {
    setIsSubmitting(true);
    await onDeleteAll();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-sm w-full p-6 relative animate-scale-up">
        
        {/* Botão Fechar */}
        <button 
          onClick={!isSubmitting ? onClose : undefined}
          disabled={isSubmitting}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
        >
          <X size={20} />
        </button>

        {/* Conteúdo */}
        <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-2">Excluir Parcela</h3>
            
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Esta é uma transação parcelada. O que você deseja excluir?
            </p>

            <div className="flex gap-3">
                {/* Botão Apenas Esta */}
                <button 
                  onClick={handleDeleteSingle}
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-lg border border-gray-600 text-gray-300 font-bold hover:bg-gray-700 hover:text-white transition-colors text-sm disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Apenas Esta"}
                </button>

                {/* Botão Todas */}
                <button 
                  onClick={handleDeleteAll}
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-900/20 transition-colors text-sm disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Todas"}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}