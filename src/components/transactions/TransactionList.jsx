import { useState, useMemo } from "react";
import { Clock, Check } from "lucide-react";
import { FilterBar } from "./list/FilterBar";
import { TransactionCard } from "./list/TransactionCard";
import { TransactionGroup } from "./list/TransactionGroup";

export function TransactionList({ transactions, wallets = [], onEdit, onDelete, onToggleDebt, editingId }) {
  
  const [viewMode, setViewMode] = useState("all"); 
  const [groupBy, setGroupBy] = useState("date");  
  const [expandedGroups, setExpandedGroups] = useState({});

  const pendingDebtsCount = transactions.filter(t => t.isDebt && !t.debtPaid).length;

  const filteredData = useMemo(() => {
    if (viewMode === 'debts') {
      return transactions.filter(t => t.isDebt);
    }
    return transactions;
  }, [transactions, viewMode]);

  if (transactions.length === 0) {
    return (
      <div className="text-center py-10 bg-gray-800/50 rounded-xl border border-dashed border-gray-700">
        <p className="text-gray-500 text-sm">Nenhuma movimentação neste mês.</p>
      </div>
    );
  }

  const toggleGroup = (groupKey) => {
    setExpandedGroups(prev => {
      const currentStatus = prev[groupKey] !== false; 
      return { ...prev, [groupKey]: !currentStatus };
    });
  };

  // Funções de agrupamento (Mantive aqui pois são lógica de dados, não de UI)
  const groupTransactionsByMacro = (list) => {
    const groups = list.reduce((acc, t) => {
      const macro = t.macro || "Outros";
      if (!acc[macro]) {
        acc[macro] = { name: macro, items: [], total: 0, type: t.type };
      }
      acc[macro].items.push(t);
      acc[macro].total += t.amount;
      return acc;
    }, {});
    return Object.values(groups).sort((a, b) => b.total - a.total);
  };

  const groupTransactionsByWallet = (list) => {
    const groups = list.reduce((acc, t) => {
      const wallet = wallets.find(w => w.id === t.walletId);
      const walletName = wallet ? wallet.name : "Sem Carteira";
      if (!acc[walletName]) {
        acc[walletName] = { name: walletName, items: [], total: 0 }; 
      }
      acc[walletName].items.push(t);
      if (t.type === 'income') {
        acc[walletName].total += t.amount;
      } else {
        acc[walletName].total -= t.amount;
      }
      return acc;
    }, {});
    return Object.values(groups).sort((a, b) => b.total - a.total);
  };

  const renderListOrGroups = (list, prefixKey) => {
    if (list.length === 0) return null;

    // 1. LISTA SIMPLES (POR DATA)
    if (groupBy === 'date') {
      return (
        <div className="space-y-3">
            {list.map(t => (
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
      );
    }

    // 2. AGRUPADO
    let groups = [];
    if (groupBy === 'macro') groups = groupTransactionsByMacro(list);
    else if (groupBy === 'wallet') groups = groupTransactionsByWallet(list);
    
    return (
      <div className="space-y-3">
        {groups.map((group) => {
          const uniqueGroupKey = `${prefixKey}-${group.name}`;
          const isExpanded = expandedGroups[uniqueGroupKey] !== false; 
          
          return (
            <TransactionGroup 
                key={uniqueGroupKey}
                group={group}
                isExpanded={isExpanded}
                onToggle={() => toggleGroup(uniqueGroupKey)}
                groupBy={groupBy}
                wallets={wallets}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleDebt={onToggleDebt}
                editingId={editingId}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <FilterBar 
        viewMode={viewMode}
        setViewMode={setViewMode}
        groupBy={groupBy}
        setGroupBy={setGroupBy}
        pendingDebtsCount={pendingDebtsCount}
      />

      {viewMode === 'all' && renderListOrGroups(filteredData, "all")}
      
      {viewMode === "debts" && (
        <div className="space-y-6">
           {(() => {
              const pendingDebts = filteredData.filter(t => !t.debtPaid);
              const solvedDebts = filteredData.filter(t => t.debtPaid);
              return (
                <>
                  <div>
                    <h4 className="text-orange-400 text-xs font-bold uppercase mb-2 flex items-center gap-2"><Clock size={14} /> Pendentes ({pendingDebts.length})</h4>
                    {pendingDebts.length === 0 ? <p className="text-gray-600 text-sm italic">Nenhuma pendência.</p> : renderListOrGroups(pendingDebts, "pending")}
                  </div>
                  {solvedDebts.length > 0 && (
                    <div className="pt-4 border-t border-gray-800">
                      <h4 className="text-green-500 text-xs font-bold uppercase mb-2 flex items-center gap-2"><Check size={14} /> Resolvidos / Recebidos</h4>
                      <div className="opacity-70 hover:opacity-100 transition-opacity">{renderListOrGroups(solvedDebts, "solved")}</div>
                    </div>
                  )}
                  {filteredData.length === 0 && <div className="text-center py-8 text-gray-500">Nenhum registro de reembolso neste mês.</div>}
                </>
              );
           })()}
        </div>
      )}
    </div>
  );
}