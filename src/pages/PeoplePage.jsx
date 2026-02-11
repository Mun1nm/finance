import { useState } from "react";
import { usePeople } from "../hooks/usePeople";
import { useTransactions } from "../hooks/useTransactions";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus, User } from "lucide-react";
import { PersonCard } from "../components/people/PersonCard"; // <--- Importando o componente

export default function PeoplePage() {
  const { people, addPerson, deletePerson } = usePeople();
  const { transactions, toggleDebtStatus } = useTransactions();
  const navigate = useNavigate();

  const [newPersonName, setNewPersonName] = useState("");

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newPersonName.trim()) return;
    await addPerson(newPersonName);
    setNewPersonName("");
  };

  // Prepara os dados globais da pessoa (Saldo Total e Histórico Completo)
  const peopleWithData = people.map(person => {
    const history = transactions
        .filter(t => t.personId === person.id)
        .sort((a, b) => b.date?.seconds - a.date?.seconds); 
    
    const balance = history.reduce((acc, t) => {
        if (t.debtPaid) return acc; 
        if (t.type === 'expense') return acc + t.amount; 
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

      {/* Input de Adicionar Pessoa */}
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

      {/* Lista de Cards */}
      <div className="space-y-4">
        {peopleWithData.length === 0 && (
            <p className="text-center text-gray-500 py-10">Nenhuma pessoa cadastrada.</p>
        )}

        {peopleWithData.map(p => (
            <PersonCard 
                key={p.id} 
                person={p} 
                deletePerson={deletePerson} 
                toggleDebtStatus={toggleDebtStatus} 
            />
        ))}
      </div>
    </div>
  );
}