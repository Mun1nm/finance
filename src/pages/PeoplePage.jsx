import { useState } from "react";
import { usePeople } from "../hooks/usePeople";
import { useTransactions } from "../hooks/useTransactions";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus, User, Loader2, ArrowDownAZ } from "lucide-react";
import { PersonCard } from "../components/people/PersonCard";
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";

export default function PeoplePage() {
  const { people, addPerson, deletePerson, updatePerson, reorderPeople, sortPeopleAlphabetically } = usePeople();
  const { transactions, toggleDebtStatus } = useTransactions();
  const navigate = useNavigate();

  const [newPersonName, setNewPersonName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newPersonName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
        await addPerson(newPersonName);
        setNewPersonName("");
    } catch (error) {
        console.error("Erro ao adicionar:", error);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = peopleWithData.findIndex(p => p.id === active.id);
    const newIndex = peopleWithData.findIndex(p => p.id === over.id);
    const reordered = arrayMove(peopleWithData, oldIndex, newIndex);
    reorderPeople(reordered);
  };

  // Prepara os dados globais da pessoa
  const peopleWithData = people.map(person => {
    const history = transactions
        .filter(t => t.personId === person.id)
        .sort((a, b) => b.date?.seconds - a.date?.seconds);

    const balance = history.reduce((acc, t) => {
        if (t.debtPaid) return acc;
        if (t.type === 'expense' && !t.isBorrowed) return acc + t.amount;  // Te deve
        if (t.type === 'expense' && t.isBorrowed)  return acc - t.amount;  // Você deve
        if (t.type === 'income')                   return acc - t.amount;  // legado: Você deve
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
         <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-lg font-bold min-w-[50px] flex items-center justify-center"
         >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
         </button>
      </form>

      {/* Lista de Cards */}
      <div className="space-y-4">
        {peopleWithData.length === 0 && (
            <p className="text-center text-gray-500 py-10">Nenhuma pessoa cadastrada.</p>
        )}

        {peopleWithData.length >= 2 && (
          <div className="flex justify-end">
            <button
              onClick={sortPeopleAlphabetically}
              title="Ordenar alfabeticamente"
              className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
            >
              <ArrowDownAZ size={18} />
            </button>
          </div>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={peopleWithData.map(p => p.id)} strategy={verticalListSortingStrategy}>
            {peopleWithData.map(p => (
              <PersonCard
                key={p.id}
                person={p}
                deletePerson={deletePerson}
                toggleDebtStatus={toggleDebtStatus}
                updatePerson={updatePerson}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
