import { useState, useEffect } from "react";
import { Pencil, X, Calendar, Wallet, ChevronDown, Loader2 } from "lucide-react"; 
import { MoneyInput } from "../ui/MoneyInput";
import { TypeSelector } from "./form/TypeSelector";
import { CategorySelector } from "./form/CategorySelector";
import { PaymentOptions } from "./form/PaymentOptions";
import { AdditionalOptions } from "./form/AdditionalOptions";
// IMPORTAR AQUI
import { calculateInstallmentPreview } from "../../utils/formatters"; 

export function TransactionForm({ onSubmit, categories, assets, wallets, initialData, onCancelEdit }) {
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

  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentWallet = wallets.find(w => w.id === selectedWallet);
  const hasCredit = currentWallet?.hasCredit;

  const setDefaultWallet = () => {
      if (wallets && wallets.length > 0) {
          const defaultWallet = wallets.find(w => w.isDefault);
          setSelectedWallet(defaultWallet ? defaultWallet.id : wallets[0].id);
      }
  };

  useEffect(() => {
      if (!initialData && !selectedWallet && wallets.length > 0) {
          setDefaultWallet();
      }
  }, [wallets, initialData, selectedWallet]);

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
    }
  }, [initialData, categories, assets, wallets]);

  useEffect(() => { if (type !== 'expense') { setPaymentMethod("debit"); setIsInstallment(false); } }, [type]);
  useEffect(() => { if (paymentMethod === 'debit') setIsInstallment(false); }, [paymentMethod]);

  const resetForm = () => {
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
      setDefaultWallet(); 
  };

  const handleTypeReset = () => {
      setSelectedId("");
      setIsDebt(false);
      setIsFuture(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!amount || !selectedId) return;
    if (wallets.length > 0 && !selectedWallet && type !== 'investment') { alert("Selecione uma conta/carteira!"); return; }
    if (isDebt && !selectedPerson) { alert("Selecione a pessoa vinculada."); return; }

    setIsSubmitting(true);

    try {
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
        
        await onSubmit(submitData);
        
        if (!initialData) {
            resetForm();
        }
    } catch (error) {
        console.error("Erro no envio:", error);
    } finally {
        setIsSubmitting(false);
    }
  };

  // --- HELPER LOCAL REMOVIDO DAQUI ---

  return (
    <div className={`p-6 rounded-2xl shadow-lg border transition-all ${initialData ? 'bg-blue-900/10 border-blue-500/30' : 'bg-gray-800 border-gray-700'}`}>
      
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-sm font-bold uppercase ${initialData ? 'text-blue-400' : 'text-gray-400'}`}>
          {initialData ? "Editando Lançamento" : "Novo Registro"}
        </h3>
        {initialData && <button onClick={onCancelEdit} className="text-xs flex items-center gap-1 text-gray-400 hover:text-white bg-gray-700 px-2 py-1 rounded"><X size={12} /> Cancelar</button>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        <TypeSelector 
            type={type} 
            setType={setType} 
            disabled={!!initialData} 
            resetFields={handleTypeReset} 
        />

        <MoneyInput value={amount} onChange={setAmount} />

        {isInstallment && amount > 0 && (
            <div className="bg-purple-900/20 border border-purple-500/30 p-2 rounded-lg text-center animate-fade-in">
                {/* USA O HELPER IMPORTADO AQUI */}
                <span className="text-xs text-purple-300">{installmentsCount}x de <strong className="text-white ml-1">R$ {calculateInstallmentPreview(amount, installmentsCount)}</strong></span>
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

        {type === 'expense' && hasCredit && (
            <PaymentOptions 
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                hasCredit={hasCredit}
                isInstallment={isInstallment}
                setIsInstallment={setIsInstallment}
                installmentsCount={installmentsCount}
                setInstallmentsCount={setInstallmentsCount}
                isSubscription={isSubscription}
            />
        )}

        <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative w-full sm:w-40 shrink-0">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"><Calendar size={16} /></div>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-gray-700 text-white rounded-lg p-3 pl-10 outline-none focus:ring-2 focus:ring-blue-500 text-sm h-full appearance-none min-w-[120px] [&::-webkit-calendar-picker-indicator]:hidden" required />
            </div>
            <input type="text" placeholder="Descrição (Opcional)" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-gray-700 text-white rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 text-sm" />
        </div>

        <CategorySelector 
            type={type}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            assets={assets}
            categories={categories}
        />

        {!initialData && !isInstallment && (
            <AdditionalOptions 
                type={type}
                isSubscription={isSubscription} setIsSubscription={setIsSubscription}
                isFuture={isFuture} setIsFuture={setIsFuture}
                isDebt={isDebt} setIsDebt={setIsDebt}
                dueDay={dueDay} setDueDay={setDueDay}
                selectedPerson={selectedPerson} setSelectedPerson={setSelectedPerson}
                setIsInstallment={setIsInstallment}
            />
        )}

        <button 
            type="submit" 
            disabled={isSubmitting} 
            className={`w-full py-3 rounded-lg text-white font-bold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${type === 'expense' ? 'bg-red-600 hover:bg-red-700' : type === 'investment' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-green-600 hover:bg-green-700'}`}
        >
            {isSubmitting ? (
                <Loader2 className="animate-spin" size={20} /> 
            ) : (
                initialData ? <><Pencil size={18}/> Salvar</> : "Registrar"
            )}
        </button>
      </form>
    </div>
  );
}