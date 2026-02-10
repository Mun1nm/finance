import { Shapes, Wallet, ChevronUp, ChevronDown } from "lucide-react";
import { TransactionCard } from "./TransactionCard";

export function TransactionGroup({ group, isExpanded, onToggle, groupBy, wallets, onEdit, onDelete, onToggleDebt, editingId }) {
  let headerColor = "text-gray-300";
  if (group.type === 'expense') headerColor = "text-red-400";
  if (group.type === 'income') headerColor = "text-green-400";
  if (group.type === 'investment') headerColor = "text-purple-400";
  if (groupBy === 'wallet') headerColor = group.total >= 0 ? "text-green-400" : "text-red-400";

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-4 hover:bg-gray-800 transition-colors">
        <div className="flex items-center gap-3">
          <span className="bg-gray-700 p-1.5 rounded-lg text-gray-300">
            {groupBy === 'macro' ? <Shapes size={16} /> : <Wallet size={16} />}
          </span>
          <div className="text-left">
            <p className="font-bold text-sm text-white">{group.name}</p>
            <p className="text-[10px] text-gray-500">{group.items.length} itens</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`font-bold text-sm ${headerColor}`}>
            {groupBy === 'wallet' && group.total > 0 ? '+ ' : ''}
            R$ {Math.abs(group.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          {isExpanded ? <ChevronUp size={16} className="text-gray-500"/> : <ChevronDown size={16} className="text-gray-500"/>}
        </div>
      </button>
      
      {isExpanded && (
        <div className="border-t border-gray-700 bg-gray-900/30 p-2 space-y-2">
          {group.items.map(t => (
            <TransactionCard 
                key={t.id} 
                t={t} 
                wallets={wallets} 
                onEdit={onEdit} 
                onDelete={onDelete} 
                onToggleDebt={onToggleDebt} 
                editingId={editingId} 
                groupBy={groupBy} 
            />
          ))}
        </div>
      )}
    </div>
  );
}