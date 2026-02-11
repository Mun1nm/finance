import { useState, useMemo } from "react";
import { Trash2, ChevronDown, ChevronUp, CheckCircle2, Clock, Calendar, ChevronLeft, ChevronRight, Wallet } from "lucide-react";

export function PersonCard({ person, deletePerson, toggleDebtStatus }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Filtra o histórico pelo mês selecionado
  const monthlyData = useMemo(() => {
    return person.history.filter(t => {
      if (!t.date) return false;
      const tDate = new Date(t.date.seconds * 1000);
      return tDate.getMonth() === currentDate.getMonth() && 
             tDate.getFullYear() === currentDate.getFullYear();
    });
  }, [person.history, currentDate]);

  // Calcula o saldo específico DO MÊS
  const monthlyBalance = useMemo(() => {
    return monthlyData.reduce((acc, t) => {
        if (t.debtPaid) return acc;
        if (t.type === 'expense') return acc + t.amount;
        if (t.type === 'income') return acc - t.amount;
        return acc;
    }, 0);
  }, [monthlyData]);

  // Navegação de Mês
  const prevMonth = (e) => {
    e.stopPropagation();
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
  };
  const nextMonth = (e) => {
    e.stopPropagation();
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
  };

  const monthLabel = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const formattedMonthLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  // Helpers de Estilo
  const getBalanceColor = (val) => {
      if (val > 0) return 'text-green-400';
      if (val < 0) return 'text-red-400';
      return 'text-gray-400';
  };

  const getStatusText = (val) => {
      if (val > 0) return "Te deve";
      if (val < 0) return "Você deve";
      return "Quitado";
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden transition-all shadow-lg animate-fade-in hover:border-gray-600">
        
        {/* === CABEÇALHO DO CARD === */}
        <div 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-750 select-none"
        >
            <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl uppercase transition-colors ${
                    person.balance > 0 ? 'bg-green-500/10 text-green-400' : 
                    person.balance < 0 ? 'bg-red-500/10 text-red-400' : 
                    'bg-gray-700 text-gray-400'
                }`}>
                    {person.name.charAt(0)}
                </div>
                
                {/* Info */}
                <div>
                    <h3 className="font-bold text-white text-lg">{person.name}</h3>
                    <p className={`text-sm font-medium flex items-center gap-1 ${getBalanceColor(person.balance)}`}>
                        {Math.abs(person.balance) > 0 && <Wallet size={12} />}
                        {getStatusText(person.balance)} (Total)
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="text-right">
                    <span className={`font-bold text-xl block ${getBalanceColor(person.balance)}`}>
                        R$ {Math.abs(person.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    {person.history.length > 0 && (
                        <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                           Global
                        </span>
                    )}
                </div>
                
                {Math.abs(person.balance) < 0.01 && person.history.length === 0 ? (
                    <button 
                        onClick={(e) => { e.stopPropagation(); deletePerson(person.id); }} 
                        className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        title="Excluir pessoa"
                    >
                        <Trash2 size={20} />
                    </button>
                ) : (
                    <div className={`text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown size={20}/>
                    </div>
                )}
            </div>
        </div>

        {/* === ÁREA EXPANDIDA === */}
        {isExpanded && (
            <div className="border-t border-gray-700 bg-gray-900/50">
                
                {/* Navegador de Meses */}
                <div className="flex items-center justify-between p-4 bg-gray-800/80 border-b border-gray-700 backdrop-blur-sm">
                    <button onClick={prevMonth} className="p-2 rounded-full bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-white transition-all hover:scale-105 active:scale-95">
                        <ChevronLeft size={20}/>
                    </button>
                    
                    <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-gray-200 uppercase tracking-widest flex items-center gap-2">
                            <Calendar size={14} className="text-blue-400"/>
                            {formattedMonthLabel}
                        </span>
                        
                        {monthlyData.length > 0 ? (
                             <span className={`text-xs font-medium mt-1 px-2 py-0.5 rounded-full border ${
                                monthlyBalance > 0 ? 'bg-green-500/10 border-green-500/30 text-green-400' : 
                                monthlyBalance < 0 ? 'bg-red-500/10 border-red-500/30 text-red-400' : 
                                'bg-gray-700/30 border-gray-600 text-gray-400'
                             }`}>
                                {monthlyBalance !== 0 
                                    ? `${monthlyBalance > 0 ? 'Te deve neste mês:' : 'Você deve neste mês:'} R$ ${Math.abs(monthlyBalance).toLocaleString('pt-BR', {minimumFractionDigits: 2})}` 
                                    : 'Tudo quitado neste mês'
                                }
                             </span>
                        ) : (
                            <span className="text-[10px] text-gray-600 mt-1">Sem registros</span>
                        )}
                    </div>

                    <button onClick={nextMonth} className="p-2 rounded-full bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-white transition-all hover:scale-105 active:scale-95">
                        <ChevronRight size={20}/>
                    </button>
                </div>

                {/* Lista de Transações */}
                <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {monthlyData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-600 opacity-60">
                            <Calendar size={32} className="mb-2 stroke-1"/>
                            <p className="text-xs">Nenhuma movimentação em {monthLabel}.</p>
                        </div>
                    ) : (
                        monthlyData.map(t => (
                            <div key={t.id} className="group flex justify-between items-center bg-gray-800 p-3 rounded-lg border border-gray-700 hover:border-gray-600 hover:bg-gray-750 transition-all">
                                
                                {/* ESQUERDA: Descrição e Data */}
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-200">
                                        {t.description || t.category}
                                    </span>
                                    <div className="flex items-center gap-3 text-[10px] text-gray-400 mt-0.5">
                                        <span className="flex items-center gap-1 bg-gray-900/50 px-1.5 py-0.5 rounded">
                                            <Calendar size={10}/> 
                                            {new Date(t.date?.seconds * 1000).getDate().toString().padStart(2, '0')}
                                        </span>
                                        {t.macro && <span className="opacity-70">• {t.macro}</span>}
                                    </div>
                                </div>

                                {/* DIREITA: Valor + Texto na MESMA LINHA */}
                                <div className="text-right flex flex-col items-end gap-1">
                                    
                                    {/* Linha Principal: Texto + Valor */}
                                    <div className="flex items-center gap-2">
                                        {/* Texto (Antes do Valor) */}
                                        {!t.debtPaid && (
                                            <span className={`text-[10px] font-bold ${t.type === 'income' ? 'text-red-400' : 'text-green-400'}`}>
                                                {t.type === 'income' ? 'Você deve' : 'Te deve'}
                                            </span>
                                        )}

                                        {/* Valor */}
                                        <span className={`block font-bold text-sm ${
                                            t.type === 'income' ? 'text-red-400' : 'text-green-400'
                                        } ${t.debtPaid ? 'line-through opacity-50' : ''}`}>
                                            R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    
                                    {/* Botão de Ação */}
                                    <button 
                                        onClick={() => toggleDebtStatus(t.id, t.debtPaid)}
                                        className={`text-[10px] flex items-center justify-center gap-1.5 px-2 py-1 rounded-md border transition-all active:scale-95 w-24 ${
                                            t.debtPaid 
                                            ? 'text-green-400 border-green-500/20 bg-green-500/5 hover:bg-green-500/10' 
                                            : 'text-orange-400 border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10 shadow-sm shadow-orange-900/10'
                                        }`}
                                    >
                                        {t.debtPaid ? <><CheckCircle2 size={12}/> Pago</> : <><Clock size={12}/> Pendente</>}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        )}
    </div>
  );
}