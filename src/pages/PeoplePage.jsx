import { useState } from "react";
import { usePeople } from "../hooks/usePeople";
import { useTransactions } from "../hooks/useTransactions";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus, User, Trash2, ChevronDown, ChevronUp, CheckCircle2, Clock, Calendar } from "lucide-react";

export default function PeoplePage() {
  const { people, addPerson, deletePerson } = usePeople();
  const { transactions, toggleDebtStatus } = useTransactions();
  const navigate = useNavigate();

  const [newPersonName, setNewPersonName] = useState("");
  const [expandedPersonId, setExpandedPersonId] = useState(null);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newPersonName.trim()) return;
    await addPerson(newPersonName);
    setNewPersonName("");
  };

  const toggleExpand = (id) => {
    setExpandedPersonId(prev => prev === id ? null : id);
  };

  // Processamento dos dados
  const peopleWithData = people.map(person => {
    // 1. Pega TODO o histórico com essa pessoa (Pendente ou Pago)
    const history = transactions
        .filter(t => t.personId === person.id)
        .sort((a, b) => b.date?.seconds - a.date?.seconds); // Mais recente primeiro
    
    // 2. Calcula saldo APENAS dos pendentes
    const balance = history.reduce((acc, t) => {
        if (t.debtPaid) return acc; // Ignora se já foi pago/recebido
        
        // Se for Despesa (Emprestei/Gastei por ela) -> Ela me deve (+)
        if (t.type === 'expense') return acc + t.amount; 
        
        // Se for Entrada (Ela me pagou/Emprestou) -> Eu devo (-)
        // Nota: Isso depende do fluxo. Geralmente Entrada com Debt = Empréstimo que peguei.
        if (t.type === 'income') return acc - t.amount; 
        
        return acc;
    }, 0);

    return { ...person, balance, history };
  });

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 pb-24">
      <header className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate("/")} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition">
          <ArrowLeft />
        </button>
        <h1 className="text-xl font-bold">Pessoas & Dívidas</h1>
      </header>

      {/* CARD DE ADD NOVA PESSOA */}
      <form onSubmit={handleAdd} className="bg-gray-800 p-4 rounded-xl border border-gray-700 mb-6 flex gap-2">
         <div className="relative flex-1">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
                type="text" 
                placeholder="Nome da pessoa..." 
                className="w-full bg-gray-900 text-white pl-10 p-3 rounded-lg outline-none border border-gray-700 focus:border-blue-500 transition-colors"
                value={newPersonName}
                onChange={e => setNewPersonName(e.target.value)}
            />
         </div>
         <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-bold">
            <UserPlus size={20} />
         </button>
      </form>

      {/* LISTA DE PESSOAS */}
      <div className="space-y-4">
        {peopleWithData.length === 0 && (
            <p className="text-center text-gray-500 py-10">Nenhuma pessoa cadastrada.</p>
        )}

        {peopleWithData.map(p => {
            const isExpanded = expandedPersonId === p.id;
            const hasHistory = p.history.length > 0;

            return (
                <div key={p.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden transition-all">
                    
                    {/* CABEÇALHO DO CARD (Sempre visível) */}
                    <div 
                        onClick={() => toggleExpand(p.id)}
                        className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-750"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 font-bold text-lg uppercase border border-gray-600">
                                {p.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold text-white">{p.name}</h3>
                                <p className={`text-xs font-medium ${p.balance > 0 ? 'text-green-400' : p.balance < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                                    {p.balance > 0 ? "Te deve" : p.balance < 0 ? "Você deve" : "Quitado"}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <span className={`font-bold text-lg block ${p.balance > 0 ? 'text-green-400' : p.balance < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                                    R$ {Math.abs(p.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                                {hasHistory && (
                                    <span className="text-[10px] text-gray-500 block">
                                        {p.history.length} registro{p.history.length !== 1 && 's'}
                                    </span>
                                )}
                            </div>
                            
                            {/* Botão de Excluir Pessoa (Só se não tiver histórico para segurança, ou saldo 0) */}
                            {Math.abs(p.balance) < 0.01 && p.history.length === 0 ? (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); deletePerson(p.id); }} 
                                    className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            ) : (
                                <div className="text-gray-500">
                                    {isExpanded ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* LISTA DE TRANSAÇÕES (Expandida) */}
                    {isExpanded && (
                        <div className="border-t border-gray-700 bg-gray-900/30 p-2">
                            {p.history.length === 0 ? (
                                <p className="text-center text-gray-500 text-xs py-2">Nenhum histórico.</p>
                            ) : (
                                <div className="space-y-2">
                                    {p.history.map(t => (
                                        <div key={t.id} className="flex justify-between items-center bg-gray-800 p-3 rounded-lg border border-gray-700/50">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-white">{t.description || t.category}</span>
                                                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                                    <span className="flex items-center gap-1"><Calendar size={10}/> {new Date(t.date?.seconds * 1000).toLocaleDateString('pt-BR')}</span>
                                                    {t.macro && <span>• {t.macro}</span>}
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <span className={`block font-bold text-sm ${t.type === 'income' ? 'text-green-400' : 'text-red-400'} ${t.debtPaid ? 'line-through opacity-50' : ''}`}>
                                                    R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </span>
                                                
                                                <button 
                                                    onClick={() => toggleDebtStatus(t.id, t.debtPaid)}
                                                    className={`mt-1 text-[10px] flex items-center justify-end gap-1 px-1.5 py-0.5 rounded border transition-colors ml-auto ${t.debtPaid ? 'text-green-500 border-green-500/30 bg-green-500/10' : 'text-orange-400 border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20'}`}
                                                >
                                                    {t.debtPaid ? <><CheckCircle2 size={10}/> Pago</> : <><Clock size={10}/> Pendente</>}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            );
        })}
      </div>
    </div>
  );
}