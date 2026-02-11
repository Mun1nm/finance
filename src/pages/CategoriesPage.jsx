import { useState } from "react";
import { useCategories } from "../hooks/useCategories";
import { ArrowLeft, Trash2, ArrowUpCircle, ArrowDownCircle, Pencil, X, ChevronDown, ChevronRight, Wallet, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EXPENSE_MACROS, INCOME_MACROS } from "../utils/constants"; 
import { CompactMoneyInput } from "../components/ui/CompactMoneyInput"; 

export default function CategoriesPage() {
  const { categories, budgets, addCategory, deleteCategory, updateCategory, saveBudget } = useCategories();
  const navigate = useNavigate();

  const [newCat, setNewCat] = useState("");
  const [type, setType] = useState("expense"); 
  const [selectedMacro, setSelectedMacro] = useState(EXPENSE_MACROS[0]);
  const [editingId, setEditingId] = useState(null);
  
  const [isBudgetsOpen, setIsBudgetsOpen] = useState(false);
  const [editingBudgetMacro, setEditingBudgetMacro] = useState(null);
  const [tempLimit, setTempLimit] = useState("");

  let currentMacros = EXPENSE_MACROS;
  if (type === "income") currentMacros = INCOME_MACROS;

  const filteredCategories = categories.filter(c => {
    const catType = c.type || 'expense';
    return catType === type;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newCat) return;
    if (editingId) {
      await updateCategory(editingId, newCat, selectedMacro, type);
      setEditingId(null);
    } else {
      await addCategory(newCat, selectedMacro, type);
    }
    setNewCat("");
  };

  const handleEditClick = (cat) => {
    setEditingId(cat.id);
    setNewCat(cat.name);
    setSelectedMacro(cat.macro);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewCat("");
    setSelectedMacro(currentMacros[0]);
  };

  const handleSaveBudget = async (macro) => {
      await saveBudget(macro, tempLimit);
      setEditingBudgetMacro(null);
  };

  // Função para CANCELAR a edição (apenas fecha)
  const handleCancelBudgetEdit = () => {
      setEditingBudgetMacro(null);
      setTempLimit("");
  };

  const activeConfig = type === 'income' 
    ? { color: 'green', icon: <ArrowUpCircle size={18} />, label: 'Entradas' }
    : { color: 'red', icon: <ArrowDownCircle size={18} />, label: 'Saídas' };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 pb-20">
      <header className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate("/")} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition">
          <ArrowLeft />
        </button>
        <h1 className="text-xl font-bold">Gerir Categorias</h1>
      </header>

      <div className="flex gap-2 mb-6">
        <button 
          disabled={!!editingId}
          onClick={() => { setType("expense"); setSelectedMacro(EXPENSE_MACROS[0]); }}
          className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 border transition-colors ${type === 'expense' ? 'bg-red-500/20 text-red-400 border-red-500' : 'bg-gray-800 border-transparent text-gray-500 disabled:opacity-50'}`}
        >
          <ArrowDownCircle size={18} /> Saídas
        </button>
        <button 
          disabled={!!editingId}
          onClick={() => { setType("income"); setSelectedMacro(INCOME_MACROS[0]); }}
          className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 border transition-colors ${type === 'income' ? 'bg-green-500/20 text-green-400 border-green-500' : 'bg-gray-800 border-transparent text-gray-500 disabled:opacity-50'}`}
        >
          <ArrowUpCircle size={18} /> Entradas
        </button>
      </div>

      {/* --- SEÇÃO DE ORÇAMENTOS --- */}
      {type === 'expense' && (
        <div className="mb-6 bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
            <div 
                onClick={() => setIsBudgetsOpen(!isBudgetsOpen)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-800 transition-colors"
            >
                <h3 className="text-gray-300 uppercase text-xs font-bold flex items-center gap-2">
                    <Wallet size={16} className="text-blue-400"/> Limites de Gastos (Mensal)
                </h3>
                {isBudgetsOpen ? <ChevronDown size={18} className="text-gray-500"/> : <ChevronRight size={18} className="text-gray-500"/>}
            </div>

            {isBudgetsOpen && (
                <div className="p-3 border-t border-gray-700/50 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-fade-in bg-gray-900/30">
                    {EXPENSE_MACROS.map(macro => {
                        const budget = budgets.find(b => b.macro === macro);
                        const limit = budget ? budget.limit : 0;
                        const isEditing = editingBudgetMacro === macro;

                        return (
                            <div key={macro} className="bg-gray-800 border border-gray-700 px-3 py-2 rounded-lg flex justify-between items-center h-14">
                                <span className="text-xs font-bold text-gray-400 uppercase">{macro}</span>
                                
                                <div className="flex items-center gap-2 justify-end min-w-[140px]">
                                    {isEditing ? (
                                        <div className="flex items-center gap-2 w-full justify-end">
                                            <div className="w-24">
                                              <CompactMoneyInput 
                                                  value={tempLimit}
                                                  onChange={setTempLimit}
                                                  placeholder="0,00"
                                                  autoFocus={true}
                                              />
                                            </div>
                                            {/* Salvar */}
                                            <button 
                                                onClick={() => handleSaveBudget(macro)}
                                                className="p-1 bg-gray-700 text-green-400 rounded hover:bg-gray-600 border border-gray-600"
                                            >
                                                <Check size={14} />
                                            </button>
                                            {/* Cancelar (X) */}
                                            <button 
                                                onClick={handleCancelBudgetEdit}
                                                className="p-1 bg-gray-700 text-gray-400 rounded hover:bg-gray-600 border border-gray-600"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div 
                                            onClick={() => { setEditingBudgetMacro(macro); setTempLimit(limit); }}
                                            className={`cursor-pointer px-3 py-1.5 rounded text-xs font-bold border transition-colors ${limit > 0 ? 'border-blue-500/30 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20' : 'border-gray-600 text-gray-500 hover:border-gray-500'}`}
                                        >
                                            {limit > 0 ? `R$ ${limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Definir'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
      )}

      {/* FORMULÁRIO DE CATEGORIA */}
      <div className={`p-4 rounded-xl mb-6 border shadow-lg transition-colors ${editingId ? 'bg-blue-900/20 border-blue-500/50' : 'bg-gray-800 border-gray-700'}`}>
        
        {editingId && (
          <div className="flex justify-between items-center mb-4 text-blue-400">
            <span className="text-sm font-bold uppercase">Editando Categoria</span>
            <button onClick={cancelEdit} className="text-xs flex items-center gap-1 hover:text-blue-300">
              <X size={14} /> Cancelar
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 uppercase font-bold mb-1 block pt-2">Macro Categoria</label>
            <div className="relative">
              <select 
                value={selectedMacro} 
                onChange={(e) => setSelectedMacro(e.target.value)}
                className="w-full bg-gray-700 text-white p-3 pr-10 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                {currentMacros.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase font-bold mb-1 block pt-2">Nome da Categoria</label>
            <input 
              type="text" 
              placeholder="Nome da categoria..."
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              className="w-full bg-gray-700 text-white p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button 
            type="submit" 
            className={`w-full py-3 rounded-lg font-bold text-white transition-transform active:scale-95 flex items-center justify-center gap-2 bg-${activeConfig.color}-600 hover:bg-${activeConfig.color}-700`}
          >
            {editingId ? <><Pencil size={18}/> Salvar</> : `Adicionar ${activeConfig.label}`}
          </button>
        </form>
      </div>

      <div className="space-y-2 pb-10">
        <h3 className="text-gray-400 uppercase text-xs font-bold mb-2">
          Categorias de {activeConfig.label}
        </h3>
        {filteredCategories.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-4">Nenhuma categoria encontrada.</p>
        )}
        {filteredCategories.map(cat => (
          <div key={cat.id} className={`flex justify-between items-center bg-gray-800 p-3 rounded-lg border transition-colors ${editingId === cat.id ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-600'}`}>
            <div>
              <p className="font-bold">{cat.name}</p>
              <p className="text-xs text-gray-400">{cat.macro}</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => handleEditClick(cat)} className="text-gray-400 hover:text-blue-400 p-2 rounded"><Pencil size={18} /></button>
              <button onClick={() => deleteCategory(cat.id)} className="text-gray-400 hover:text-red-400 p-2 rounded"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}