import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTransactions } from "../hooks/useTransactions";
import { useCategories } from "../hooks/useCategories";
import { useSubscriptions } from "../hooks/useSubscriptions";
import { useInvestments } from "../hooks/useInvestments"; // NOVO IMPORT
import { LogOut, Settings, ChevronLeft, ChevronRight, BarChart3, PieChart, TrendingUp } from "lucide-react";
import { Summary } from "../components/Summary";
import { CategoryChart } from "../components/CategoryChart";
import { ConfirmModal } from "../components/ConfirmModal";
import { Notification } from "../components/Notification";
import { TransactionForm } from "../components/TransactionForm";
import { TransactionList } from "../components/TransactionList";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { logout } = useAuth();
  const { transactions, addTransaction, deleteTransaction, updateTransaction, toggleDebtStatus } = useTransactions();
  const { categories } = useCategories();
  const { assets, addContribution } = useInvestments(); // USANDO O HOOK AQUI
  const { createSubscription, processSubscriptions } = useSubscriptions();
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [chartMode, setChartMode] = useState("macro");
  const [editingData, setEditingData] = useState(null);
  const [notification, setNotification] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });

  useEffect(() => {
    processSubscriptions((val, cat, mac, typ) => {
      addTransaction(val, cat, mac, typ);
      setNotification({ msg: "Recorrências processadas!", type: "info" });
    });
  }, []);

  const filteredTransactions = transactions.filter(t => {
    if (!t.date) return false;
    const tDate = new Date(t.date.seconds * 1000);
    return tDate.getMonth() === currentDate.getMonth() && 
           tDate.getFullYear() === currentDate.getFullYear();
  });

  const handleFormSubmit = async (formData) => {
    // Adicione 'date' na extração
    const { amount, categoryName, macro, type, isSubscription, isDebt, description, assetId, date } = formData;

    if (editingData) {
      // Repasse 'date' no update
      await updateTransaction(editingData.id, amount, categoryName, macro, type, isDebt, description, date);
      setNotification({ msg: "Atualizado com sucesso!", type: "success" });
      setEditingData(null);
    } else {
      if (type === 'investment' && assetId) {
         await addContribution(assetId, amount);
      }
      
      // Repasse 'date' no add
      await addTransaction(amount, categoryName, macro, type, isDebt, description, date);
      
      if (isSubscription) {
        await createSubscription(amount, categoryName, macro, categoryName, type);
        setNotification({ msg: "Recorrência configurada!", type: "info" });
      } else {
        const msg = type === 'investment' ? "Aporte realizado e registrado!" : "Salvo com sucesso!";
        setNotification({ msg, type: "success" });
      }
    }
  };

  const handleDelete = async () => {
    if (deleteModal.id) {
      await deleteTransaction(deleteModal.id);
      setNotification({ msg: "Removido.", type: "success" });
      setDeleteModal({ isOpen: false, id: null });
      if (editingData?.id === deleteModal.id) setEditingData(null);
    }
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
  const nextMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 pb-24">
      <Notification message={notification?.msg} type={notification?.type} onClose={() => setNotification(null)} />
      <ConfirmModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, id: null })} onConfirm={handleDelete} title="Excluir" message="Confirma a exclusão?" />

      {/* HEADER */}
      <header className="p-4 flex justify-between items-center bg-gray-800 border-b border-gray-700 sticky top-0 z-50 shadow-md">
        <h1 className="font-bold text-xl text-white tracking-tight">Finance</h1>
        <div className="flex gap-2">
          <button onClick={() => navigate("/investments")} className="p-2 text-gray-400 hover:text-purple-400" title="Meus Investimentos">
            <TrendingUp size={20} />
          </button>
          <button onClick={() => navigate("/categories")} className="p-2 text-gray-400 hover:text-blue-400"><Settings size={20} /></button>
          <button onClick={logout} className="p-2 text-gray-400 hover:text-white"><LogOut size={20} /></button>
        </div>
      </header>

      {/* NAV MÊS */}
      <div className="flex items-center justify-center gap-4 py-4 bg-gray-900/95 backdrop-blur-md sticky top-[60px] z-40 border-b border-gray-800 shadow-sm">
        <button onClick={prevMonth} className="p-1 hover:bg-gray-800 rounded"><ChevronLeft /></button>
        <span className="font-bold text-lg capitalize">{currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</span>
        <button onClick={nextMonth} className="p-1 hover:bg-gray-800 rounded"><ChevronRight /></button>
      </div>

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        <Summary transactions={filteredTransactions} assets={assets} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-5 relative lg:sticky lg:top-40 z-0">
            <TransactionForm 
              onSubmit={handleFormSubmit}
              categories={categories}
              assets={assets} // Passando Assets para o formulário
              initialData={editingData}
              onCancelEdit={() => setEditingData(null)}
            />
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="bg-gray-800 rounded-2xl border border-gray-700 p-4 relative z-0">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-gray-400 text-sm font-bold uppercase">Análise</h3>
                    <div className="flex bg-gray-700 rounded-lg p-1">
                        <button onClick={() => setChartMode("macro")} className={`p-1 rounded ${chartMode === 'macro' ? 'bg-gray-600' : ''}`}><PieChart size={16}/></button>
                        <button onClick={() => setChartMode("category")} className={`p-1 rounded ${chartMode === 'category' ? 'bg-gray-600' : ''}`}><BarChart3 size={16}/></button>
                    </div>
                </div>
                <CategoryChart transactions={filteredTransactions} mode={chartMode} />
            </div>

            <TransactionList 
              transactions={filteredTransactions} 
              onEdit={setEditingData} 
              onDelete={(id) => setDeleteModal({ isOpen: true, id })} 
              onToggleDebt={toggleDebtStatus}
              editingId={editingData?.id}
            />
          </div>
        </div>
      </main>
    </div>
  );
}