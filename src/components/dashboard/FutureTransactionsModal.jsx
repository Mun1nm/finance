import { Clock, ChevronLeft, Calendar, CheckCircle2 } from "lucide-react";

export function FutureTransactionsModal({ isOpen, onClose, transactions, totalValue, onConfirmReceipt }) {
  if (!isOpen) return null;

  return (
    <div 
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
    >
       <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-gray-800 p-6 rounded-2xl w-full max-w-md border border-gray-700 animate-scale-up shadow-2xl"
       >
          <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                  <Clock className="text-blue-400" /> Recebimentos Futuros
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-white"><ChevronLeft/></button>
          </div>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin">
              {transactions.length === 0 ? (
                  <p className="text-gray-500 text-center">Nenhum recebimento agendado.</p>
              ) : (
                  transactions.map(t => (
                      <div key={t.id} className="bg-gray-700/50 p-4 rounded-xl border border-gray-600 flex justify-between items-center">
                          <div>
                              <p className="font-bold text-white text-sm">{t.description || t.category}</p>
                              <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                  <Calendar size={12}/> {new Date(t.date.seconds * 1000).toLocaleDateString('pt-BR')}
                              </p>
                          </div>
                          <div className="text-right">
                              <span className="block font-bold text-green-400 mb-2">R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              <button 
                                onClick={() => onConfirmReceipt(t.id)}
                                className="text-[10px] bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded flex items-center gap-1 transition-colors"
                              >
                                  <CheckCircle2 size={10} /> Confirmar
                              </button>
                          </div>
                      </div>
                  ))
              )}
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-700 flex justify-between items-center">
              <span className="text-gray-400 text-sm">Total a receber:</span>
              <span className="text-xl font-bold text-blue-400">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
       </div>
    </div>
  );
}