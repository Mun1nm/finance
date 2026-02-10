import { Pencil, Trash2, User, Check, Wallet, TrendingUp, TrendingDown, CreditCard, ArrowRightLeft } from "lucide-react";
import { SwipeableItem } from "./SwipeableItem";

export function TransactionCard({ t, wallets, onEdit, onDelete, onToggleDebt, editingId, groupBy }) {
    let colorClass = 'text-red-400';
    let bgClass = 'bg-red-500/10';
    let sign = '-';
    let Icon = TrendingDown;

    if (t.isTransfer) {
        colorClass = 'text-yellow-400';
        bgClass = 'bg-yellow-500/10';
        sign = t.type === 'income' ? '+' : '-';
        Icon = ArrowRightLeft;
    } 
    else if (t.type === 'income') {
      colorClass = 'text-green-400';
      bgClass = 'bg-green-500/10';
      sign = '+';
      Icon = TrendingUp;
    } 
    else if (t.type === 'investment') {
      colorClass = 'text-purple-400';
      bgClass = 'bg-purple-500/10';
      sign = '';
      Icon = TrendingUp;
    }

    const isDebtItem = t.isDebt === true;
    const isPaidDebt = isDebtItem && t.debtPaid;
    const isCredit = t.paymentMethod === 'credit';

    // Classes do Container (Borda e Fundo)
    const cardClasses = `rounded-xl border transition-colors group ${
        editingId === t.id 
        ? 'border-blue-500 bg-blue-500/5' 
        : 'border-gray-700 hover:bg-gray-750'
    }`;

    return (
      <SwipeableItem 
        key={t.id} 
        onDelete={() => onDelete(t.id)} 
        className={cardClasses}
      >
          <div className="flex justify-between items-center p-4">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className={`p-2 rounded-full shrink-0 ${bgClass} ${colorClass}`}>
                <Icon size={16} />
              </div>
              <div className="flex flex-col overflow-hidden">
                <div className="flex items-center gap-2">
                  <p className={`font-medium truncate ${isPaidDebt ? 'text-gray-500 line-through' : 'text-white'}`}>{t.category}</p>
                  
                  {isDebtItem && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 border shrink-0 ${isPaidDebt ? 'bg-green-900/30 text-green-500 border-green-800' : 'bg-orange-900/30 text-orange-400 border-orange-800'}`}>
                      {isPaidDebt ? <Check size={10} /> : <User size={10} />}
                      {isPaidDebt ? (t.type === 'expense' ? 'Devolvido' : 'Pago') : (t.type === 'expense' ? 'A receber' : 'A pagar')}
                    </span>
                  )}

                  {isCredit && (
                      <span className="text-[10px] bg-purple-900/30 text-purple-400 border border-purple-800 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                          <CreditCard size={10} /> Crédito
                      </span>
                  )}
                </div>
                {t.description && (
                  <p className="text-xs text-gray-300 italic mb-0.5 truncate">{t.description}</p>
                )}
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  {groupBy !== 'wallet' && t.walletId && (
                    <span className="flex items-center gap-0.5 mr-2 text-gray-400"><Wallet size={10}/> {wallets.find(w => w.id === t.walletId)?.name || 'Carteira'}</span>
                  )}
                  {new Date(t.date?.seconds * 1000).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 shrink-0 ml-2">
              <div className="text-right">
                <span className={`font-bold block ${isPaidDebt ? 'text-gray-500 line-through decoration-gray-500' : colorClass}`}>
                    {sign} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                
                {isDebtItem && !isPaidDebt && (
                    <button onClick={() => onToggleDebt(t.id, t.debtPaid)} className="text-[10px] text-orange-400 hover:text-orange-300 underline mt-1">
                        {t.type === 'expense' ? 'Marcar Recebido' : 'Marcar Pago'}
                    </button>
                )}
                
                {isPaidDebt && (
                    <button onClick={() => onToggleDebt(t.id, t.debtPaid)} className="text-[10px] text-gray-500 hover:text-gray-400 underline mt-1">Desfazer</button>
                )}
              </div>
              
              <div className="hidden sm:flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEdit(t)} className="p-2 text-gray-400 hover:text-blue-400 rounded-lg hover:bg-gray-700"><Pencil size={16} /></button>
                <button onClick={() => onDelete(t.id)} className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-700"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
      </SwipeableItem>
    );
}