import { useState } from "react";
import { useCategories } from "../hooks/useCategories";
import { ArrowLeft, Trash2, ArrowUpCircle, ArrowDownCircle, Pencil, X, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

const EXPENSE_MACROS = [
  "Moradia", "Alimentação", "Transporte", "Lazer", 
  "Saúde", "Educação", "Assinaturas", "Compras", "Outros"
];

const INCOME_MACROS = [
  "Salário", "Freelance", "Investimentos (Retorno)", "Presentes", 
  "Reembolso", "Vendas", "Premiação", "Outros"
];

export default function CategoriesPage() {
  const { categories, addCategory, deleteCategory, updateCategory } = useCategories();
  const navigate = useNavigate();

  const [newCat, setNewCat] = useState("");
  const [type, setType] = useState("expense"); 
  const [selectedMacro, setSelectedMacro] = useState(EXPENSE_MACROS[0]);
  const [editingId, setEditingId] = useState(null);

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

  const getTypeConfig = (t) => {
    switch(t) {
      case 'income': return { color: 'green', icon: <ArrowUpCircle size={18} />, label: 'Entradas' };
      default: return { color: 'red', icon: <ArrowDownCircle size={18} />, label: 'Saídas' };
    }
  };

  const activeConfig = getTypeConfig(type);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4">
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
          
          {/* CORREÇÃO AQUI: Estrutura Label + Div Relative para alinhamento perfeito */}
          <div>
            <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Macro Categoria</label>
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
            <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Nome da Categoria</label>
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