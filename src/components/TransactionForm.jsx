import { useState, useEffect } from "react";
import { RefreshCw, Pencil, X, User, TrendingUp, Calendar } from "lucide-react";
import { MoneyInput } from "./MoneyInput";
import { useNavigate } from "react-router-dom";

export function TransactionForm({ onSubmit, categories, assets, initialData, onCancelEdit }) {
  const navigate = useNavigate();

  const today = new Date().toLocaleDateString('en-CA');

  const [amount, setAmount] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(today);
  const [type, setType] = useState("expense");
  const [isSubscription, setIsSubscription] = useState(false);
  const [isDebt, setIsDebt] = useState(false);

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
    } else {
      setAmount("");
      setSelectedId("");
      setDescription("");
      setDate(today);
      setIsSubscription(false);
      setIsDebt(false);
    }
  }, [initialData, categories, assets]);

  const availableCategories = categories.filter(c => (c.type || 'expense') === type);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || !selectedId) return;

    let submitData = {
      amount,
      type,
      description,
      date,
      isSubscription,
      isDebt
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
        setAmount("");
        setDescription("");
        setDate(today);
        setIsSubscription(false);
        setIsDebt(false);
    }
  };

  return (
    <div className={`p-6 rounded-2xl shadow-lg border transition-all ${initialData ? 'bg-blue-900/10 border-blue-500/30' : 'bg-gray-800 border-gray-700'}`}>
      
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-sm font-bold uppercase ${initialData ? 'text-blue-400' : 'text-gray-400'}`}>
          {initialData ? "Editando Lançamento" : "Novo Registro"}
        </h3>
        {initialData && (
          <button onClick={onCancelEdit} className="text-xs flex items-center gap-1 text-gray-400 hover:text-white bg-gray-700 px-2 py-1 rounded">
            <X size={12} /> Cancelar
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div className="flex gap-2 mb-4">
          <button type="button" disabled={!!initialData} onClick={() => { setType("expense"); setSelectedId(""); }} className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${type === "expense" ? "bg-red-500/20 text-red-400 border-red-500" : "bg-gray-700 border-transparent text-gray-400 hover:bg-gray-600 disabled:opacity-50"}`}>Saída</button>
          <button type="button" disabled={!!initialData} onClick={() => { setType("investment"); setSelectedId(""); }} className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${type === "investment" ? "bg-purple-500/20 text-purple-400 border-purple-500" : "bg-gray-700 border-transparent text-gray-400 hover:bg-gray-600 disabled:opacity-50"}`}>Invest.</button>
          <button type="button" disabled={!!initialData} onClick={() => { setType("income"); setSelectedId(""); }} className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${type === "income" ? "bg-green-500/20 text-green-400 border-green-500" : "bg-gray-700 border-transparent text-gray-400 hover:bg-gray-600 disabled:opacity-50"}`}>Entrada</button>
        </div>

        <MoneyInput value={amount} onChange={setAmount} />

        <div className="flex gap-2">
            {/* CORREÇÃO AQUI:
                1. w-40: Garante largura suficiente para a data.
                2. [&::-webkit-calendar-picker-indicator]:hidden: Some com o ícone feio do navegador.
                3. onClick={showPicker}: Garante que clicar no texto abre o calendário.
            */}
            <div className="relative w-40 shrink-0">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <Calendar size={16} />
                </div>
                <input 
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    onClick={(e) => e.target.showPicker && e.target.showPicker()} // Abre o calendário ao clicar
                    className="w-full bg-gray-700 text-white rounded-lg p-3 pl-10 outline-none focus:ring-2 focus:ring-blue-500 text-sm h-full [&::-webkit-calendar-picker-indicator]:hidden cursor-pointer"
                    required
                />
            </div>

            <input
                type="text"
                placeholder="Descrição (Opcional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 text-sm"
            />
        </div>

        <div>
          {type === 'investment' ? (
             assets.length > 0 ? (
                <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="w-full bg-gray-700 text-white rounded-lg p-3 outline-none focus:ring-2 focus:ring-purple-500 border border-purple-500/30">
                  <option value="" disabled>Selecione o Ativo</option>
                  {assets.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
                </select>
             ) : (
                <button type="button" onClick={() => navigate("/investments")} className="w-full py-3 border-2 border-dashed border-purple-500/50 text-purple-400 rounded-lg hover:bg-purple-500/10 flex items-center justify-center gap-2">
                  <TrendingUp size={16}/> + Cadastrar Novo Ativo
                </button>
             )
          ) : (
             availableCategories.length > 0 ? (
                <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="w-full bg-gray-700 text-white rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="" disabled>Selecione a Categoria</option>
                  {availableCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name} ({cat.macro})</option>)}
                </select>
              ) : (
                <button type="button" onClick={() => navigate("/categories")} className="w-full py-3 border-2 border-dashed border-gray-600 text-gray-400 rounded-lg hover:border-blue-500">
                  + Criar Categoria
                </button>
              )
          )}
        </div>

        {!initialData && (
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center gap-2 bg-gray-700/50 p-3 rounded-lg border border-gray-600">
              <input type="checkbox" id="subCheck" checked={isSubscription} onChange={(e) => { setIsSubscription(e.target.checked); if(e.target.checked) setIsDebt(false); }} className="w-5 h-5 rounded text-blue-600 bg-gray-700 border-gray-500 cursor-pointer" />
              <label htmlFor="subCheck" className="text-sm text-gray-300 flex items-center gap-2 cursor-pointer select-none w-full">
                <RefreshCw size={14} /> Repetir mensalmente
              </label>
            </div>

            {type === 'expense' && !isSubscription && (
               <div className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${isDebt ? 'bg-orange-500/20 border-orange-500' : 'bg-gray-700/50 border-gray-600'}`}>
               <input type="checkbox" id="debtCheck" checked={isDebt} onChange={(e) => setIsDebt(e.target.checked)} className="w-5 h-5 rounded text-orange-500 bg-gray-700 border-gray-500 cursor-pointer accent-orange-500" />
               <label htmlFor="debtCheck" className={`text-sm flex items-center gap-2 cursor-pointer select-none w-full ${isDebt ? 'text-orange-200' : 'text-gray-300'}`}>
                 <User size={14} /> Reembolsável
               </label>
             </div>
            )}
          </div>
        )}

        <button type="submit" className={`w-full py-3 rounded-lg text-white font-bold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${type === 'expense' ? 'bg-red-600 hover:bg-red-700' : type === 'investment' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-green-600 hover:bg-green-700'}`}>
          {initialData ? <><Pencil size={18}/> Salvar</> : "Registrar"}
        </button>
      </form>
    </div>
  );
}