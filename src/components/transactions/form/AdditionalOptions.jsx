import { useState } from "react";
import { RefreshCw, Clock, User, Check, ChevronDown, Plus, X } from "lucide-react";
import { usePeople } from "../../../hooks/usePeople";

export function AdditionalOptions({ 
  type, 
  isSubscription, setIsSubscription, 
  isFuture, setIsFuture, 
  isDebt, setIsDebt, 
  dueDay, setDueDay, 
  selectedPerson, setSelectedPerson, 
  setIsInstallment 
}) {
  const { people, addPerson } = usePeople();
  const [isAddingPerson, setIsAddingPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");

  const handleQuickAddPerson = async () => {
      if(!newPersonName.trim()) return;
      await addPerson(newPersonName);
      setNewPersonName("");
      setIsAddingPerson(false);
  };

  return (
    <div className="grid grid-cols-1 gap-2">
      {/* Assinatura */}
      <div className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${isSubscription ? 'bg-blue-600/20 border-blue-500' : 'bg-gray-700/50 border-gray-600'}`}>
          <div className="relative flex items-center">
              <input 
                type="checkbox" 
                id="subCheck" 
                checked={isSubscription} 
                onChange={(e) => { 
                    setIsSubscription(e.target.checked); 
                    if(e.target.checked) { 
                        setIsDebt(false); 
                        setIsFuture(false); 
                        setIsInstallment(false);
                    } 
                }} 
                className="peer appearance-none w-5 h-5 rounded border border-gray-500 bg-gray-800 checked:bg-blue-600 checked:border-blue-600 transition-colors cursor-pointer" 
              />
              <Check size={12} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white pointer-events-none opacity-0 peer-checked:opacity-100" />
          </div>
          <label htmlFor="subCheck" className="text-sm text-gray-300 flex items-center gap-2 cursor-pointer select-none w-full"><RefreshCw size={14} /> Repetir mensalmente</label>
          {isSubscription && (
              <div className="flex items-center gap-2 ml-auto">
                  <span className="text-xs text-blue-300">Todo dia:</span>
                  <input type="number" inputMode="numeric" min="1" max="31" value={dueDay} onChange={e => setDueDay(e.target.value)} className="w-12 bg-gray-900 border border-blue-500/50 rounded text-center text-white text-sm p-1 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
          )}
      </div>

      {/* Recebimento Futuro */}
      {type === 'income' && !isSubscription && !isDebt && (
         <div className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${isFuture ? 'bg-blue-500/20 border-blue-500' : 'bg-gray-700/50 border-gray-600'}`}>
             <div className="relative flex items-center">
                  <input type="checkbox" id="futureCheck" checked={isFuture} onChange={(e) => setIsFuture(e.target.checked)} className="peer appearance-none w-5 h-5 rounded border border-gray-500 bg-gray-800 checked:bg-blue-500 checked:border-blue-500 transition-colors cursor-pointer" />
                  <Check size={12} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white pointer-events-none opacity-0 peer-checked:opacity-100" />
             </div>
             <label htmlFor="futureCheck" className={`text-sm flex items-center gap-2 cursor-pointer select-none w-full ${isFuture ? 'text-blue-200' : 'text-gray-300'}`}><Clock size={14} /> Recebimento Futuro</label>
         </div>
      )}

      {/* Dívida / Reembolso */}
      {(type === 'expense' || type === 'income') && !isSubscription && !isFuture && (
         <div className={`p-2 rounded-lg border transition-colors ${isDebt ? 'bg-orange-500/20 border-orange-500' : 'bg-gray-700/50 border-gray-600'}`}>
             <div className={`flex items-center gap-2 ${isDebt ? 'mb-2' : ''}`}>
                 <div className="relative flex items-center">
                      <input type="checkbox" id="debtCheck" checked={isDebt} onChange={(e) => setIsDebt(e.target.checked)} className="peer appearance-none w-5 h-5 rounded border border-gray-500 bg-gray-800 checked:bg-orange-500 checked:border-orange-500 transition-colors cursor-pointer" />
                      <Check size={12} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white pointer-events-none opacity-0 peer-checked:opacity-100" />
                 </div>
                 <label htmlFor="debtCheck" className={`text-sm flex items-center gap-2 cursor-pointer select-none w-full ${isDebt ? 'text-orange-200' : 'text-gray-300'}`}><User size={14} /> {type === 'expense' ? "Reembolsável (Vou receber)" : "Empréstimo (Vou pagar)"}</label>
             </div>
             {isDebt && (
                 <div className="flex gap-2 animate-fade-in mt-2 relative">
                     {!isAddingPerson ? (
                         <>
                             <select value={selectedPerson} onChange={e => setSelectedPerson(e.target.value)} className="flex-1 bg-gray-900 text-white text-sm p-2 pr-8 rounded border border-orange-500/50 outline-none appearance-none" required>
                                 <option value="" disabled>Quem {type === 'expense' ? 'deve você?' : 'emprestou?'}</option>
                                 {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                             </select>
                             <ChevronDown size={14} className="absolute left-[calc(100%-60px)] top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                             <button type="button" onClick={() => setIsAddingPerson(true)} className="p-2 bg-orange-500/20 text-orange-400 rounded hover:bg-orange-500 hover:text-white transition-colors" title="Adicionar Pessoa"><Plus size={16} /></button>
                         </>
                     ) : (
                         <div className="flex gap-2 flex-1">
                             <input type="text" placeholder="Nome..." className="flex-1 bg-gray-900 text-white text-sm p-2 rounded border border-orange-500/50 outline-none" value={newPersonName} onChange={e => setNewPersonName(e.target.value)} autoFocus />
                             <button type="button" onClick={handleQuickAddPerson} className="bg-orange-500 text-white px-3 rounded text-xs font-bold">OK</button>
                             <button type="button" onClick={() => setIsAddingPerson(false)} className="bg-gray-600 text-white px-3 rounded text-xs"><X size={14}/></button>
                         </div>
                     )}
                 </div>
             )}
       </div>
      )}
    </div>
  );
}