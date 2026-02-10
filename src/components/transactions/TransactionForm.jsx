import { useState, useEffect } from "react";
import { RefreshCw, Pencil, X, User, TrendingUp, Calendar, Plus, Clock, Wallet, CreditCard, Layers, Check, ChevronDown } from "lucide-react"; 
import { MoneyInput } from "../ui/MoneyInput";
import { useNavigate } from "react-router-dom";
import { usePeople } from "../../hooks/usePeople";

export function TransactionForm({ onSubmit, categories, assets, wallets, initialData, onCancelEdit }) {
  const navigate = useNavigate();
  const { people, addPerson } = usePeople();
  const today = new Date().toLocaleDateString('en-CA');

  const [amount, setAmount] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(today);
  const [type, setType] = useState("expense");
  const [isSubscription, setIsSubscription] = useState(false);
  const [isDebt, setIsDebt] = useState(false);
  const [isFuture, setIsFuture] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState("");
  const [selectedPerson, setSelectedPerson] = useState("");
  
  const [paymentMethod, setPaymentMethod] = useState("debit"); 
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentsCount, setInstallmentsCount] = useState(2);

  const [dueDay, setDueDay] = useState(new Date().getDate());
  const [isAddingPerson, setIsAddingPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");

  const currentWallet = wallets.find(w => w.id === selectedWallet);
  const hasCredit = currentWallet?.hasCredit;

  useEffect(() => {
    if (initialData) {
      setAmount(initialData.amount);
      setType(initialData.type || 'expense');
      setDescription(initialData.description || "");
      if (initialData.date && initialData.date.seconds) {
        const d = new Date(initialData.date.seconds * 1000);
        setDate(d.toLocaleDateString('en-CA'));
      } else {
        setDate(today);
      }
      if (initialData.type === 'investment') {
         const asset = assets.find(a => a.name === initialData.category);
         if (asset) setSelectedId(asset.id);
      } else {
         const cat = categories.find(c => c.name === initialData.category && (c.type || 'expense') === (initialData.type || 'expense'));
         if (cat) setSelectedId(cat.id);
      }
      setIsSubscription(false);
      setIsDebt(initialData.isDebt || false);
      setIsFuture(initialData.isFuture || false);
      setSelectedWallet(initialData.walletId || "");
      setSelectedPerson(initialData.personId || "");
      setPaymentMethod(initialData.paymentMethod || "debit");
      setDueDay(new Date().getDate());
      setIsInstallment(false); 
    } else {
      setAmount("");
      setSelectedId("");
      setDescription("");
      setDate(today);
      setIsSubscription(false);
      setIsDebt(false);
      setIsFuture(false);
      setSelectedPerson("");
      setPaymentMethod("debit");
      setDueDay(new Date().getDate());
      setIsInstallment(false);
      setInstallmentsCount(2);
      if (wallets && wallets.length > 0) {
          const defaultWallet = wallets.find(w => w.isDefault);
          setSelectedWallet(defaultWallet ? defaultWallet.id : wallets[0].id);
      }
    }
  }, [initialData, categories, assets, wallets]);

  useEffect(() => { if (type !== 'expense') { setPaymentMethod("debit"); setIsInstallment(false); } }, [type]);
  useEffect(() => { if (paymentMethod === 'debit') setIsInstallment(false); }, [paymentMethod]);

  const availableCategories = categories.filter(c => (c.type || 'expense') === type);

  const handleQuickAddPerson = async () => {
      if(!newPersonName.trim()) return;
      await addPerson(newPersonName);
      setNewPersonName("");
      setIsAddingPerson(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || !selectedId) return;
    if (wallets.length > 0 && !selectedWallet && type !== 'investment') { alert("Selecione uma conta/carteira!"); return; }
    if (isDebt && !selectedPerson) { alert("Selecione a pessoa vinculada."); return; }

    let submitData = {
      amount, type, description, date, isSubscription, isDebt, isFuture,
      walletId: selectedWallet, personId: isDebt ? selectedPerson : null,
      dueDay: isSubscription ? dueDay : null,
      paymentMethod: type === 'expense' ? paymentMethod : 'debit',
      installments: isInstallment ? parseInt(installmentsCount) : 1,
      closingDay: currentWallet?.closingDay || null
    };

    if (type === 'investment') {
      const assetObj = assets.find(a => a.id === selectedId);
      submitData.categoryName = assetObj.name;
      submitData.macro = "Investimentos";
      submitData.assetId = assetObj.id;
    } else {
      const catObj = categories.find(c => c.id === selectedId);
      submitData.categoryName = catObj.name;
      submitData.macro = catObj.macro;
    }
    onSubmit(submitData);
    if (!initialData) {
        setAmount(""); setDescription(""); setDate(today); setIsSubscription(false);
        setIsDebt(false); setIsFuture(false); setSelectedPerson(""); setPaymentMethod("debit");
        setDueDay(new Date().getDate()); setIsInstallment(false); setInstallmentsCount(2);
    }
  };

  return (
    <div className={`p-6 rounded-2xl shadow-lg border transition-all ${initialData ? 'bg-blue-900/10 border-blue-500/30' : 'bg-gray-800 border-gray-700'}`}>
      
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-sm font-bold uppercase ${initialData ? 'text-blue-400' : 'text-gray-400'}`}>
          {initialData ? "Editando Lançamento" : "Novo Registro"}
        </h3>
        {initialData && <button onClick={onCancelEdit} className="text-xs flex items-center gap-1 text-gray-400 hover:text-white bg-gray-700 px-2 py-1 rounded"><X size={12} /> Cancelar</button>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2 mb-4">
          <button type="button" disabled={!!initialData} onClick={() => { setType("expense"); setSelectedId(""); setIsDebt(false); setIsFuture(false); }} className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${type === "expense" ? "bg-red-500/20 text-red-400 border-red-500" : "bg-gray-700 border-transparent text-gray-400 hover:bg-gray-600 disabled:opacity-50"}`}>Saída</button>
          <button type="button" disabled={!!initialData} onClick={() => { setType("investment"); setSelectedId(""); setIsDebt(false); setIsFuture(false); }} className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${type === "investment" ? "bg-purple-500/20 text-purple-400 border-purple-500" : "bg-gray-700 border-transparent text-gray-400 hover:bg-gray-600 disabled:opacity-50"}`}>Invest.</button>
          <button type="button" disabled={!!initialData} onClick={() => { setType("income"); setSelectedId(""); setIsDebt(false); setIsFuture(false); }} className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${type === "income" ? "bg-green-500/20 text-green-400 border-green-500" : "bg-gray-700 border-transparent text-gray-400 hover:bg-gray-600 disabled:opacity-50"}`}>Entrada</button>
        </div>

        <MoneyInput value={amount} onChange={setAmount} />

        {isInstallment && amount > 0 && (
            <div className="bg-purple-900/20 border border-purple-500/30 p-2 rounded-lg text-center animate-fade-in">
                <span className="text-xs text-purple-300">{installmentsCount}x de <strong className="text-white ml-1">R$ {(parseFloat(amount) / installmentsCount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span>
            </div>
        )}

        {wallets && wallets.length > 0 && (
           <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><Wallet size={16} /></div>
              <select value={selectedWallet} onChange={e => setSelectedWallet(e.target.value)} className="w-full bg-gray-700 text-white rounded-lg p-2.5 pl-10 pr-10 outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600 text-sm appearance-none" required={type !== 'investment'}>
                 <option value="" disabled>Selecione a Conta / Carteira</option>
                 {wallets.map(w => <option key={w.id} value={w.id}>{w.name} {w.isDefault ? '(Padrão)' : ''}</option>)}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><ChevronDown size={16} /></div>
           </div>
        )}

        {/* CORREÇÃO AQUI: Removemos !isSubscription para permitir Crédito na Assinatura */}
        {type === 'expense' && hasCredit && (
            <div className="space-y-2">
                <div className="flex gap-2 bg-gray-700/50 p-1 rounded-lg border border-gray-600">
                    <button type="button" onClick={() => setPaymentMethod("debit")} className={`flex-1 py-2 rounded text-xs font-bold transition-all flex items-center justify-center gap-2 ${paymentMethod === 'debit' ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}><Wallet size={14} /> Débito</button>
                    <button type="button" onClick={() => setPaymentMethod("credit")} className={`flex-1 py-2 rounded text-xs font-bold transition-all flex items-center justify-center gap-2 ${paymentMethod === 'credit' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}><CreditCard size={14} /> Crédito</button>
                </div>
                
                {/* CORREÇÃO AQUI: Parcelamento só aparece se NÃO for assinatura */}
                {paymentMethod === 'credit' && !isSubscription && (
                    <div className={`p-2 rounded-lg border transition-all ${isInstallment ? 'bg-purple-500/10 border-purple-500' : 'bg-gray-700/30 border-gray-600'}`}>
                        <div className={`flex items-center gap-2 ${isInstallment ? 'mb-2' : ''}`}>
                            <div className="relative flex items-center">
                                <input type="checkbox" id="installCheck" checked={isInstallment} onChange={(e) => setIsInstallment(e.target.checked)} className="peer appearance-none w-5 h-5 rounded border border-gray-500 bg-gray-800 checked:bg-purple-600 checked:border-purple-600 transition-colors cursor-pointer" />
                                <Check size={12} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white pointer-events-none opacity-0 peer-checked:opacity-100" />
                            </div>
                            <label htmlFor="installCheck" className="text-sm text-gray-300 cursor-pointer select-none flex items-center gap-2 w-full"><Layers size={14} /> Parcelar Compra</label>
                        </div>
                        {isInstallment && (
                            <div className="flex items-center gap-2 animate-fade-in">
                                <label className="text-xs text-gray-400 whitespace-nowrap">Nº Parcelas:</label>
                                <input type="number" inputMode="numeric" min="2" max="60" value={installmentsCount} onChange={e => setInstallmentsCount(e.target.value)} className="w-16 bg-gray-900 text-white p-1 rounded text-center border border-purple-500/50 outline-none text-sm h-auto" />
                            </div>
                        )}
                    </div>
                )}
            </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative w-full sm:w-40 shrink-0">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"><Calendar size={16} /></div>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-gray-700 text-white rounded-lg p-3 pl-10 outline-none focus:ring-2 focus:ring-blue-500 text-sm h-full appearance-none min-w-[120px] [&::-webkit-calendar-picker-indicator]:hidden" required />
            </div>
            <input type="text" placeholder="Descrição (Opcional)" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-gray-700 text-white rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 text-sm" />
        </div>

        <div className="relative">
          {type === 'investment' ? (
             assets.length > 0 ? (
                <>
                    <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="w-full bg-gray-700 text-white rounded-lg p-3 pr-10 outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                    <option value="" disabled>Selecione o Ativo</option>
                    {assets.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </>
             ) : (
                <button type="button" onClick={() => navigate("/investments")} className="w-full py-3 border-2 border-dashed border-purple-500/50 text-purple-400 rounded-lg hover:bg-purple-500/10 flex items-center justify-center gap-2"><TrendingUp size={16}/> + Cadastrar Novo Ativo</button>
             )
          ) : (
             availableCategories.length > 0 ? (
                <>
                    <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="w-full bg-gray-700 text-white rounded-lg p-3 pr-10 outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                    <option value="" disabled>Selecione a Categoria</option>
                    {availableCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name} ({cat.macro})</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </>
              ) : (
                <button type="button" onClick={() => navigate("/categories")} className="w-full py-3 border-2 border-dashed border-gray-600 text-gray-400 rounded-lg hover:border-blue-500">+ Criar Categoria</button>
              )
          )}
        </div>

        {!initialData && (
          <div className="grid grid-cols-1 gap-2">
            {!isInstallment && (
                <div className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${isSubscription ? 'bg-blue-600/20 border-blue-500' : 'bg-gray-700/50 border-gray-600'}`}>
                    <div className="relative flex items-center">
                        <input type="checkbox" id="subCheck" checked={isSubscription} onChange={(e) => { setIsSubscription(e.target.checked); if(e.target.checked) { setIsDebt(false); setIsFuture(false); } }} className="peer appearance-none w-5 h-5 rounded border border-gray-500 bg-gray-800 checked:bg-blue-600 checked:border-blue-600 transition-colors cursor-pointer" />
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
            )}

            {type === 'income' && !isSubscription && !isDebt && (
               <div className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${isFuture ? 'bg-blue-500/20 border-blue-500' : 'bg-gray-700/50 border-gray-600'}`}>
                   <div className="relative flex items-center">
                        <input type="checkbox" id="futureCheck" checked={isFuture} onChange={(e) => setIsFuture(e.target.checked)} className="peer appearance-none w-5 h-5 rounded border border-gray-500 bg-gray-800 checked:bg-blue-500 checked:border-blue-500 transition-colors cursor-pointer" />
                        <Check size={12} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white pointer-events-none opacity-0 peer-checked:opacity-100" />
                   </div>
                   <label htmlFor="futureCheck" className={`text-sm flex items-center gap-2 cursor-pointer select-none w-full ${isFuture ? 'text-blue-200' : 'text-gray-300'}`}><Clock size={14} /> Recebimento Futuro</label>
               </div>
            )}

            {(type === 'expense' || type === 'income') && !isSubscription && !isFuture && !isInstallment && (
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
        )}

        <button type="submit" className={`w-full py-3 rounded-lg text-white font-bold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${type === 'expense' ? 'bg-red-600 hover:bg-red-700' : type === 'investment' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-green-600 hover:bg-green-700'}`}>{initialData ? <><Pencil size={18}/> Salvar</> : "Registrar"}</button>
      </form>
    </div>
  );
}