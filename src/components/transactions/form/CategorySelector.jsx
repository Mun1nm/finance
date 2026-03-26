import { useState, useEffect } from "react";
import { ChevronDown, TrendingUp, Plus, X, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EXPENSE_MACROS, INCOME_MACROS } from "../../../utils/constants";

export function CategorySelector({ type, selectedId, setSelectedId, assets, categories, addCategory }) {
  const navigate = useNavigate();
  const availableCategories = categories.filter(c => (c.type || 'expense') === type);

  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMacro, setNewMacro] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [pendingName, setPendingName] = useState(null);

  const macros = type === "income" ? INCOME_MACROS : EXPENSE_MACROS;

  // Reset form when type changes
  useEffect(() => {
    setIsCreating(false);
    setNewName("");
    setNewMacro("");
    setPendingName(null);
  }, [type]);

  // Auto-select newly created category after it appears in the list
  useEffect(() => {
    if (!pendingName) return;
    const created = availableCategories.find(c => c.name === pendingName);
    if (created) {
      setSelectedId(created.id);
      setPendingName(null);
    }
  }, [availableCategories, pendingName]);

  const openForm = () => {
    setNewMacro(macros[0]);
    setNewName("");
    setIsCreating(true);
  };

  const cancelForm = () => {
    setIsCreating(false);
    setNewName("");
    setNewMacro("");
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setIsSaving(true);
    try {
      await addCategory(newName.trim(), newMacro, type);
      setPendingName(newName.trim());
      setIsCreating(false);
      setNewName("");
      setNewMacro("");
    } finally {
      setIsSaving(false);
    }
  };

  if (type === 'investment') {
    return (
      <div className="relative">
        {assets.length > 0 ? (
          <>
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="w-full bg-gray-700 text-white rounded-lg p-3 pr-10 outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
              <option value="" disabled>Selecione o Ativo</option>
              {assets.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </>
        ) : (
          <button type="button" onClick={() => navigate("/investments")} className="w-full py-3 border-2 border-dashed border-purple-500/50 text-purple-400 rounded-lg hover:bg-purple-500/10 flex items-center justify-center gap-2">
            <TrendingUp size={16} /> + Cadastrar Novo Ativo
          </button>
        )}
      </div>
    );
  }

  if (isCreating) {
    return (
      <div className="bg-gray-700/50 border border-blue-500/40 rounded-lg p-3 space-y-3 animate-fade-in">
        <div className="relative">
          <select
            value={newMacro}
            onChange={(e) => setNewMacro(e.target.value)}
            className="w-full bg-gray-700 text-white rounded-lg p-2.5 pr-10 outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-sm"
          >
            {macros.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        <input
          type="text"
          placeholder="Nome da categoria..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreate(); } }}
          autoFocus
          className="w-full bg-gray-700 text-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 text-sm"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCreate}
            disabled={!newName.trim() || isSaving}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold rounded-lg flex items-center justify-center gap-1 transition-colors"
          >
            <Check size={14} /> {isSaving ? "Salvando..." : "Criar"}
          </button>
          <button
            type="button"
            onClick={cancelForm}
            className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-gray-300 text-sm rounded-lg flex items-center justify-center transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {availableCategories.length > 0 ? (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="w-full bg-gray-700 text-white rounded-lg p-3 pr-10 outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
              <option value="" disabled>Selecione a Categoria</option>
              {availableCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name} ({cat.macro})</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <button
            type="button"
            onClick={openForm}
            title="Criar nova categoria"
            className="px-3 bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white rounded-lg border border-gray-600 hover:border-gray-500 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
      ) : (
        <button type="button" onClick={openForm} className="w-full py-3 border-2 border-dashed border-gray-600 text-gray-400 rounded-lg hover:border-blue-500 hover:text-blue-400 transition-colors">
          + Criar Categoria
        </button>
      )}
    </div>
  );
}
