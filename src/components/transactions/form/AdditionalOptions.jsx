import { useState } from "react";
import { RefreshCw, Clock, User, Check, ChevronDown, Plus, X, Loader2 } from "lucide-react";
import { usePeople } from "../../../hooks/usePeople";

export function AdditionalOptions({
  type,
  isSubscription, setIsSubscription,
  isFuture, setIsFuture,
  isDebt, setIsDebt,
  isBorrowed, setIsBorrowed,
  dueDay, setDueDay,
  selectedPerson, setSelectedPerson,
  setIsInstallment
}) {
  const { people, addPerson } = usePeople();
  const [isAddingPerson, setIsAddingPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");
  const [isSubmittingPerson, setIsSubmittingPerson] = useState(false);

  const handleQuickAddPerson = async () => {
      if(!newPersonName.trim() || isSubmittingPerson) return;

      setIsSubmittingPerson(true);
      try {
          await addPerson(newPersonName);
          setNewPersonName("");
          setIsAddingPerson(false);
      } catch (error) {
          console.error("Erro ao adicionar pessoa:", error);
      } finally {
          setIsSubmittingPerson(false);
      }
  };

  const activeColor = isBorrowed ? 'orange' : 'green';
  const borderActive = isBorrowed ? 'bg-orange-500/20 border-orange-500' : 'bg-green-500/20 border-green-600';
  const checkActive = isBorrowed ? 'checked:bg-orange-500 checked:border-orange-500' : 'checked:bg-green-600 checked:border-green-600';
  const labelActive = isBorrowed ? 'text-orange-200' : 'text-green-200';

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

      {/* Recebimento Futuro — apenas na aba income */}
      {type === 'income' && !isSubscription && !isDebt && (
         <div className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${isFuture ? 'bg-blue-500/20 border-blue-500' : 'bg-gray-700/50 border-gray-600'}`}>
             <div className="relative flex items-center">
                  <input type="checkbox" id="futureCheck" checked={isFuture} onChange={(e) => setIsFuture(e.target.checked)} className="peer appearance-none w-5 h-5 rounded border border-gray-500 bg-gray-800 checked:bg-blue-500 checked:border-blue-500 transition-colors cursor-pointer" />
                  <Check size={12} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white pointer-events-none opacity-0 peer-checked:opacity-100" />
             </div>
             <label htmlFor="futureCheck" className={`text-sm flex items-center gap-2 cursor-pointer select-none w-full ${isFuture ? 'text-blue-200' : 'text-gray-300'}`}><Clock size={14} /> Recebimento Futuro</label>
         </div>
      )}

      {/* Dívida — aba expense, agora compatível com assinatura */}
      {type === 'expense' && !isFuture && (
         <div className={`p-2 rounded-lg border transition-colors ${isDebt ? borderActive : 'bg-gray-700/50 border-gray-600'}`}>
             <div className={`flex items-center gap-2 ${isDebt ? 'mb-3' : ''}`}>
                 <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        id="debtCheck"
                        checked={isDebt}
                        onChange={(e) => {
                            setIsDebt(e.target.checked);
                            if (!e.target.checked) setIsBorrowed(false);
                        }}
                        className={`peer appearance-none w-5 h-5 rounded border border-gray-500 bg-gray-800 transition-colors cursor-pointer ${isDebt ? checkActive : 'checked:bg-green-600 checked:border-green-600'}`}
                      />
                      <Check size={12} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white pointer-events-none opacity-0 peer-checked:opacity-100" />
                 </div>
                 <label htmlFor="debtCheck" className={`text-sm flex items-center gap-2 cursor-pointer select-none w-full ${isDebt ? labelActive : 'text-gray-300'}`}>
                   <User size={14} /> Envolve outra pessoa
                 </label>
             </div>

             {isDebt && (
               <div className="flex flex-col gap-2 animate-fade-in">

                 {/* Toggle segmentado */}
                 <div className="flex rounded-lg overflow-hidden border border-gray-600 text-xs font-bold">
                   <button
                     type="button"
                     onClick={() => setIsBorrowed(false)}
                     className={`flex-1 py-1.5 px-2 transition-colors ${!isBorrowed ? 'bg-green-600 text-white' : 'bg-transparent text-gray-400 hover:text-gray-200'}`}
                   >
                     Vou receber de volta
                   </button>
                   <button
                     type="button"
                     onClick={() => setIsBorrowed(true)}
                     className={`flex-1 py-1.5 px-2 transition-colors ${isBorrowed ? 'bg-orange-500 text-white' : 'bg-transparent text-gray-400 hover:text-gray-200'}`}
                   >
                     Vou pagar depois
                   </button>
                 </div>

                 {/* Select de pessoa */}
                 <div className="flex gap-2 relative">
                     {!isAddingPerson ? (
                         <>
                             <select
                               value={selectedPerson}
                               onChange={e => setSelectedPerson(e.target.value)}
                               className={`flex-1 bg-gray-900 text-white text-sm p-2 pr-8 rounded border outline-none appearance-none ${isBorrowed ? 'border-orange-500/50' : 'border-green-600/50'}`}
                             >
                                 <option value="" disabled>{isBorrowed ? 'Quem te emprestou?' : 'Quem te deve?'}</option>
                                 {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                             </select>
                             <ChevronDown size={14} className="absolute left-[calc(100%-60px)] top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                             <button
                               type="button"
                               onClick={() => setIsAddingPerson(true)}
                               className={`p-2 rounded transition-colors ${isBorrowed ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-white' : 'bg-green-500/20 text-green-400 hover:bg-green-600 hover:text-white'}`}
                               title="Adicionar Pessoa"
                             >
                               <Plus size={16} />
                             </button>
                         </>
                     ) : (
                         <div className="flex gap-2 flex-1">
                             <input
                                type="text"
                                placeholder="Nome..."
                                className={`flex-1 bg-gray-900 text-white text-sm p-2 rounded border outline-none ${isBorrowed ? 'border-orange-500/50' : 'border-green-600/50'}`}
                                value={newPersonName}
                                onChange={e => setNewPersonName(e.target.value)}
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleQuickAddPerson()}
                             />
                             <button
                                type="button"
                                onClick={handleQuickAddPerson}
                                disabled={isSubmittingPerson}
                                className={`px-3 rounded text-xs font-bold flex items-center justify-center min-w-[40px] text-white disabled:opacity-60 ${isBorrowed ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'}`}
                             >
                                {isSubmittingPerson ? <Loader2 className="animate-spin" size={14}/> : "OK"}
                             </button>
                             <button
                                type="button"
                                onClick={() => setIsAddingPerson(false)}
                                disabled={isSubmittingPerson}
                                className="bg-gray-600 hover:bg-gray-500 text-white px-3 rounded text-xs"
                             >
                                <X size={14}/>
                             </button>
                         </div>
                     )}
                 </div>

               </div>
             )}
         </div>
      )}
    </div>
  );
}
