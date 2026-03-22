import { useState, useMemo } from "react";
import { Trash2, ChevronDown, CheckCircle2, Clock, Calendar, ChevronLeft, ChevronRight, Wallet, GripVertical, Pencil, Check, X, Layers } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export function PersonCard({ person, deletePerson, toggleDebtStatus, toggleGroupDebtStatus, updatePerson }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(person.name);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: person.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const monthlyData = useMemo(() => {
    return person.history.filter(t => {
      if (!t.date) return false;
      const tDate = new Date(t.date.seconds * 1000);
      return tDate.getMonth() === currentDate.getMonth() &&
             tDate.getFullYear() === currentDate.getFullYear();
    });
  }, [person.history, currentDate]);

  const monthlyBalance = useMemo(() => {
    return monthlyData.reduce((acc, t) => {
        if (t.debtPaid) return acc;
        if (t.type === 'expense') return acc + t.amount;
        if (t.type === 'income') return acc - t.amount;
        return acc;
    }, 0);
  }, [monthlyData]);

  const groupedData = useMemo(() => {
    const groups = new Map();
    const standalone = [];
    monthlyData.forEach(t => {
      if (t.installmentGroupId) {
        if (!groups.has(t.installmentGroupId)) groups.set(t.installmentGroupId, []);
        groups.get(t.installmentGroupId).push(t);
      } else {
        standalone.push(t);
      }
    });
    // Grupos com apenas 1 parcela no mês tratados como standalone
    const realGroups = [];
    groups.forEach((items, groupId) => {
      if (items.length > 1) realGroups.push({ groupId, items });
      else standalone.push(items[0]);
    });
    return { groups: realGroups, standalone };
  }, [monthlyData]);

  const prevMonth = (e) => { e.stopPropagation(); setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1))); };
  const nextMonth = (e) => { e.stopPropagation(); setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1))); };

  const monthLabel = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const formattedMonthLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  const getBalanceColor = (val) => val > 0 ? 'text-green-400' : val < 0 ? 'text-red-400' : 'text-gray-400';
  const getStatusText = (val) => val > 0 ? "Te deve" : val < 0 ? "Você deve" : "Quitado";
  // Verde = alguém me deve (a receber); Vermelho = eu devo (a pagar)
  const getDebtColor = (t) => (t.isBorrowed || t.type === 'income') ? 'text-red-400' : 'text-green-400';

  const handleSaveName = async () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== person.name) {
      await updatePerson(person.id, { name: trimmed });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(person.name);
    setIsEditing(false);
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') handleSaveName();
    if (e.key === 'Escape') handleCancelEdit();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group bg-gray-800 rounded-xl border border-gray-700 overflow-hidden transition-all shadow-lg animate-fade-in hover:border-gray-600"
    >
        {/* === CABEÇALHO DO CARD === */}
        <div
            onClick={() => !isEditing && setIsExpanded(!isExpanded)}
            className="p-4 cursor-pointer hover:bg-gray-750 select-none flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between"
        >
            {/* Lado Esquerdo: Grip + Avatar + Nome */}
            <div className="flex items-center gap-3">
                {/* Drag Handle */}
                <div
                    {...attributes}
                    {...listeners}
                    onClick={e => e.stopPropagation()}
                    className="touch-none cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-400 transition-colors shrink-0 p-1 -ml-1"
                >
                    <GripVertical size={18} />
                </div>

                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-lg sm:text-xl uppercase transition-colors shrink-0 ${
                    person.balance > 0 ? 'bg-green-500/10 text-green-400' :
                    person.balance < 0 ? 'bg-red-500/10 text-red-400' :
                    'bg-gray-700 text-gray-400'
                }`}>
                    {person.name.charAt(0)}
                </div>

                <div className="flex flex-col">
                    {isEditing ? (
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                            <input
                                autoFocus
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                onKeyDown={handleEditKeyDown}
                                className="bg-gray-900 text-white text-base font-bold rounded px-2 py-0.5 border border-blue-500 outline-none w-36 sm:w-48"
                            />
                            <button onClick={handleSaveName} className="p-1 text-green-400 hover:text-green-300 transition-colors">
                                <Check size={16} />
                            </button>
                            <button onClick={handleCancelEdit} className="p-1 text-red-400 hover:text-red-300 transition-colors">
                                <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-white text-base sm:text-lg leading-tight">{person.name}</h3>
                            <button
                                onClick={e => { e.stopPropagation(); setEditName(person.name); setIsEditing(true); }}
                                className="opacity-50 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-0.5 text-gray-400 hover:text-white"
                            >
                                <Pencil size={13} />
                            </button>
                        </div>
                    )}
                    <p className={`text-xs sm:text-sm font-medium flex items-center gap-1 ${getBalanceColor(person.balance)}`}>
                        {Math.abs(person.balance) > 0 && <Wallet size={12} />}
                        {getStatusText(person.balance)}
                    </p>
                </div>
            </div>

            {/* Lado Direito (ou Baixo no Mobile): Saldo + Ações */}
            <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-gray-700/50 pt-3 sm:pt-0 mt-1 sm:mt-0">
                <div className="text-left sm:text-right">
                    <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider block mb-0.5">Saldo Global</span>
                    <span className={`font-bold text-lg sm:text-xl block ${getBalanceColor(person.balance)}`}>
                        R$ {Math.abs(person.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                </div>

                {Math.abs(person.balance) < 0.01 && person.history.length === 0 ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); deletePerson(person.id); }}
                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    >
                        <Trash2 size={20} />
                    </button>
                ) : (
                    <div className={`text-gray-500 transition-transform duration-300 p-1 ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown size={20}/>
                    </div>
                )}
            </div>
        </div>

        {/* === ÁREA EXPANDIDA === */}
        {isExpanded && (
            <div className="border-t border-gray-700 bg-gray-900/50">

                {/* Navegador de Meses */}
                <div className="flex items-center justify-between p-3 bg-gray-800/80 border-b border-gray-700 backdrop-blur-sm">
                    <button onClick={prevMonth} className="p-1.5 rounded-full bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-white">
                        <ChevronLeft size={18}/>
                    </button>

                    <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
                            <Calendar size={12} className="text-blue-400"/>
                            {formattedMonthLabel}
                        </span>

                        {monthlyData.length > 0 && monthlyBalance !== 0 && (
                             <span className={`text-[10px] font-bold mt-1 ${monthlyBalance > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {monthlyBalance > 0 ? '(+)' : '(-)'} R$ {Math.abs(monthlyBalance).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                             </span>
                        )}
                    </div>

                    <button onClick={nextMonth} className="p-1.5 rounded-full bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-white">
                        <ChevronRight size={18}/>
                    </button>
                </div>

                {/* Lista de Transações */}
                <div className="p-2 space-y-2 max-h-[350px] overflow-y-auto custom-scrollbar">
                    {monthlyData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 text-gray-600 opacity-60">
                            <Calendar size={28} className="mb-2 stroke-1"/>
                            <p className="text-xs">Nada em {monthLabel}.</p>
                        </div>
                    ) : (
                        <>
                            {/* Grupos de parcelas */}
                            {groupedData.groups.map(({ groupId, items }) => {
                                const allPaid = items.every(t => t.debtPaid);
                                const totalGroup = items.reduce((s, t) => s + t.amount, 0);
                                const baseDesc = (items[0].description || items[0].category).replace(/\s*\(\d+\/\d+\)\s*$/, '');
                                return (
                                    <div key={groupId} className="rounded-lg border border-purple-500/30 bg-purple-900/10 overflow-hidden">
                                        {/* Header do grupo */}
                                        <div className="flex items-center justify-between px-3 py-2 border-b border-purple-500/20">
                                            <div className="flex items-center gap-2">
                                                <Layers size={12} className="text-purple-400 shrink-0" />
                                                <span className="text-xs font-bold text-purple-300 line-clamp-1">{baseDesc}</span>
                                                <span className="text-[10px] text-gray-500">{items.length} parcelas</span>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className={`text-xs font-bold ${allPaid ? 'line-through opacity-40 text-gray-400' : getDebtColor(items[0])}`}>
                                                    R$ {totalGroup.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </span>
                                                <button
                                                    onClick={() => toggleGroupDebtStatus(groupId)}
                                                    className={`text-[10px] font-bold px-2 py-1 rounded border transition-all active:scale-95 whitespace-nowrap ${
                                                        allPaid
                                                        ? 'text-green-400 border-green-500/20 bg-green-500/5'
                                                        : 'text-purple-400 border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20'
                                                    }`}
                                                >
                                                    {allPaid ? 'Desfazer Todas' : 'Marcar Todas'}
                                                </button>
                                            </div>
                                        </div>
                                        {/* Parcelas individuais */}
                                        <div className="divide-y divide-gray-700/30">
                                            {items.map(t => (
                                                <div key={t.id} className="flex items-center justify-between px-3 py-2 gap-3">
                                                    <span className="text-xs text-gray-400">
                                                        Dia {new Date(t.date?.seconds * 1000).getDate()} · {t.description?.match(/\(\d+\/\d+\)/)?.[0] || ''}
                                                    </span>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className={`text-xs font-bold ${getDebtColor(t)} ${t.debtPaid ? 'line-through opacity-50' : ''}`}>
                                                            R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </span>
                                                        <button
                                                            onClick={() => toggleDebtStatus(t.id, t.debtPaid)}
                                                            className={`text-[10px] font-bold px-2 py-1 rounded border transition-all active:scale-95 whitespace-nowrap ${
                                                                t.debtPaid
                                                                ? 'text-green-400 border-green-500/20 bg-green-500/5'
                                                                : 'text-orange-400 border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10'
                                                            }`}
                                                        >
                                                            {t.debtPaid ? 'Pago' : 'Pendente'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Transações standalone */}
                            {groupedData.standalone.map(t => (
                                <div key={t.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-800 p-3 rounded-lg border border-gray-700 gap-3">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm font-medium text-gray-200 line-clamp-1">
                                            {t.description || t.category}
                                        </span>
                                        <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                            <span className="bg-gray-700/50 px-1.5 py-0.5 rounded">
                                                Dia {new Date(t.date?.seconds * 1000).getDate()}
                                            </span>
                                            {t.macro && <span>{t.macro}</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-gray-700/50 pt-2 sm:pt-0">
                                        <span className={`font-bold text-sm ${getDebtColor(t)} ${t.debtPaid ? 'line-through opacity-50' : ''}`}>
                                            R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                        <button
                                            onClick={() => toggleDebtStatus(t.id, t.debtPaid)}
                                            className={`text-[10px] font-bold px-3 py-1.5 rounded-md border transition-all active:scale-95 whitespace-nowrap ${
                                                t.debtPaid
                                                ? 'text-green-400 border-green-500/20 bg-green-500/5'
                                                : 'text-orange-400 border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10'
                                            }`}
                                        >
                                            {t.debtPaid ? "Pago" : "Pendente"}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>
        )}
    </div>
  );
}
