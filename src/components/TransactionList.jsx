import { Pencil, Trash2, User, Check, Clock, Calendar, Shapes, ChevronDown, ChevronUp, Wallet, TrendingUp, TrendingDown, CreditCard, ArrowRightLeft } from "lucide-react";
import { useState, useMemo } from "react";

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

  const groupTransactionsByMacro = (list) => {
    const groups = list.reduce((acc, t) => {
      const macro = t.macro || "Outros";
      if (!acc[macro]) {
        acc[macro] = { name: macro, items: [], total: 0, type: t.type };
      }
      acc[macro].items.push(t);
      
      // TRANSFERÊNCIA: Somar ou subtrair? Em agrupamento, geralmente somamos volume
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

  const renderCard = (t) => {
    let colorClass = 'text-red-400';
    let bgClass = 'bg-red-500/10';
    let dotClass = 'bg-red-500';
    let sign = '-';
    let Icon = TrendingDown;

    // ESTILO PARA TRANSFERÊNCIA (Amarelo)
    if (t.isTransfer) {
        colorClass = 'text-yellow-400';
        bgClass = 'bg-yellow-500/10';
        dotClass = 'bg-yellow-500';
        // Se for "entrada" na carteira, mostra +, se "saida", mostra -
        sign = t.type === 'income' ? '+' : '-';
        Icon = ArrowRightLeft;
    } 
    else if (t.type === 'income') {
      colorClass = 'text-green-400';
      bgClass = 'bg-green-500/10';
      dotClass = 'bg-green-500';
      sign = '+';
      Icon = TrendingUp;
    } 
    else if (t.type === 'investment') {
      colorClass = 'text-purple-400';
      bgClass = 'bg-purple-500/10';
      dotClass = 'bg-purple-500';
      sign = '';
      Icon = TrendingUp;
    }

    const isDebtItem = t.isDebt === true;
    const isPaidDebt = isDebtItem && t.debtPaid;
    const isCredit = t.paymentMethod === 'credit';

    return (
      <div key={t.id} className={`flex justify-between items-center bg-gray-800 p-4 rounded-xl border transition-colors group ${editingId === t.id ? 'border-blue-500 bg-blue-500/5' : 'border-gray-700 hover:bg-gray-750'}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${bgClass} ${colorClass}`}>
             <Icon size={16} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <p className={`font-medium ${isPaidDebt ? 'text-gray-500 line-through' : 'text-white'}`}>{t.category}</p>
              
              {isDebtItem && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 border ${isPaidDebt ? 'bg-green-900/30 text-green-500 border-green-800' : 'bg-orange-900/30 text-orange-400 border-orange-800'}`}>
                  {isPaidDebt ? <Check size={10} /> : <User size={10} />}
                  {isPaidDebt 
                    ? (t.type === 'expense' ? 'Devolvido' : 'Pago') 
                    : (t.type === 'expense' ? 'A receber' : 'A pagar')
                  }
                </span>
              )}

              {isCredit && (
                  <span className="text-[10px] bg-purple-900/30 text-purple-400 border border-purple-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <CreditCard size={10} /> Crédito
                  </span>
              )}
            </div>
            {t.description && (
              <p className="text-xs text-gray-300 italic mb-0.5 max-w-[150px] sm:max-w-[200px] truncate">{t.description}</p>
            )}
            <p className="text-xs text-gray-500 flex items-center gap-1">
              {groupBy !== 'wallet' && t.walletId && (
                 <span className="flex items-center gap-0.5 mr-2 text-gray-400"><Wallet size={10}/> {wallets.find(w => w.id === t.walletId)?.name || 'Carteira'}</span>
              )}
              {new Date(t.date?.seconds * 1000).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
             <span className={`font-bold block ${isPaidDebt ? 'text-gray-500 line-through decoration-gray-500' : colorClass}`}>
                {sign} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
             </span>
             
             {isDebtItem && !isPaidDebt && (
                <button 
                    onClick={() => onToggleDebt(t.id, t.debtPaid)} 
                    className="text-[10px] text-orange-400 hover:text-orange-300 underline mt-1"
                >
                    {t.type === 'expense' ? 'Marcar Recebido' : 'Marcar Pago'}
                </button>
             )}
             
             {isPaidDebt && (
                <button onClick={() => onToggleDebt(t.id, t.debtPaid)} className="text-[10px] text-gray-500 hover:text-gray-400 underline mt-1">Desfazer</button>
             )}
          </div>
          <div className="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(t)} className="p-2 text-gray-400 hover:text-blue-400 rounded-lg hover:bg-gray-700"><Pencil size={16} /></button>
            <button onClick={() => onDelete(t.id)} className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-700"><Trash2 size={16} /></button>
          </div>
        </div>
      </div>
    );
  };

  const renderListOrGroups = (list, prefixKey) => {
    if (list.length === 0) return null;

    if (groupBy === 'date') {
      return <div className="space-y-3">{list.map(renderCard)}</div>;
    }

    let groups = [];
    if (groupBy === 'macro') {
      groups = groupTransactionsByMacro(list);
    } else if (groupBy === 'wallet') {
      groups = groupTransactionsByWallet(list);
    }
    
    return (
      <div className="space-y-3">
        {groups.map((group) => {
          const uniqueGroupKey = `${prefixKey}-${group.name}`;
          const isExpanded = expandedGroups[uniqueGroupKey] !== false; 

          let headerColor = "text-gray-300";
          
          // ESTILO DO HEADER DO GRUPO (Amarelo se for Transferência)
          // Mas como grupos misturam tipos, melhor manter neutro ou dinâmico
          if (group.type === 'expense') headerColor = "text-red-400";
          if (group.type === 'income') headerColor = "text-green-400";
          if (group.type === 'investment') headerColor = "text-purple-400";
          if (groupBy === 'wallet') headerColor = group.total >= 0 ? "text-green-400" : "text-red-400";

          return (
            <div key={uniqueGroupKey} className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
              <button 
                onClick={() => toggleGroup(uniqueGroupKey)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-800 transition-colors"
              >
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
                  {group.items.map(renderCard)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* ... (Barra de controle igual) ... */}
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex bg-gray-800 p-1 rounded-lg border border-gray-700 w-fit">
          <button 
            onClick={() => setViewMode("all")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'all' ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
          >
            Geral
          </button>
          <button 
            onClick={() => setViewMode("debts")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'debts' ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
          >
            Reembolsos {pendingDebtsCount > 0 && <span className="bg-orange-500 text-white text-[9px] px-1.5 rounded-full">{pendingDebtsCount}</span>}
          </button>
        </div>

        <div className="flex items-center gap-2 bg-gray-800 p-1 rounded-lg border border-gray-700 w-fit self-end sm:self-auto">
          <span className="text-[10px] text-gray-500 uppercase font-bold pl-2 hidden sm:block">Agrupar:</span>
          <button onClick={() => setGroupBy("date")} title="Por Data" className={`p-1.5 rounded-md transition-all ${groupBy === 'date' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50' : 'text-gray-400 hover:bg-gray-700'}`}>
            <Calendar size={16} />
          </button>
          <button onClick={() => setGroupBy("macro")} title="Por Categoria" className={`p-1.5 rounded-md transition-all ${groupBy === 'macro' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50' : 'text-gray-400 hover:bg-gray-700'}`}>
            <Shapes size={16} />
          </button>
          <button onClick={() => setGroupBy("wallet")} title="Por Carteira" className={`p-1.5 rounded-md transition-all ${groupBy === 'wallet' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50' : 'text-gray-400 hover:bg-gray-700'}`}>
            <Wallet size={16} />
          </button>
        </div>
      </div>
      
      {viewMode === 'all' && renderListOrGroups(filteredData, "all")}

      {/* MODO REEMBOLSOS (Sem alterações) */}
      {viewMode === "debts" && (
        <div className="space-y-6">
           {(() => {
              const pendingDebts = filteredData.filter(t => !t.debtPaid);
              const solvedDebts = filteredData.filter(t => t.debtPaid);
              return (
                <>
                  <div>
                    <h4 className="text-orange-400 text-xs font-bold uppercase mb-2 flex items-center gap-2">
                      <Clock size={14} /> Pendentes ({pendingDebts.length})
                    </h4>
                    {pendingDebts.length === 0 
                      ? <p className="text-gray-600 text-sm italic">Nenhuma pendência.</p> 
                      : renderListOrGroups(pendingDebts, "pending")
                    }
                  </div>
                  {solvedDebts.length > 0 && (
                    <div className="pt-4 border-t border-gray-800">
                      <h4 className="text-green-500 text-xs font-bold uppercase mb-2 flex items-center gap-2">
                        <Check size={14} /> Resolvidos / Recebidos
                      </h4>
                      <div className="opacity-70 hover:opacity-100 transition-opacity">
                        {renderListOrGroups(solvedDebts, "solved")}
                      </div>
                    </div>
                  )}
                  {filteredData.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                       Nenhum registro de reembolso neste mês.
                    </div>
                  )}
                </>
              );
           })()}
        </div>
      )}
    </div>
  );
}