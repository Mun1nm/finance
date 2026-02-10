import { ChevronDown, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function CategorySelector({ type, selectedId, setSelectedId, assets, categories }) {
  const navigate = useNavigate();
  const availableCategories = categories.filter(c => (c.type || 'expense') === type);

  return (
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
  );
}