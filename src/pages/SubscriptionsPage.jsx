import { useSubscriptions } from "../hooks/useSubscriptions";
import { ArrowLeft, Play, Pause, Trash2, Calendar, CreditCard, CheckCircle2, XCircle, Pencil, Save, X, TrendingUp, TrendingDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Notification } from "../components/Notification";
import { ConfirmModal } from "../components/ConfirmModal";
import { useWallets } from "../hooks/useWallets";
import { MoneyInput } from "../components/MoneyInput";

export default function SubscriptionsPage() {
  const { subscriptions, toggleSubscription, deleteSubscription, updateSubscription } = useSubscriptions();
  const { wallets } = useWallets();
  const navigate = useNavigate();
  const [notification, setNotification] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });

  // State do Modal de Edição
  const [editingSub, setEditingSub] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", amount: "", day: "", walletId: "", type: "expense" });

  const activeSubs = subscriptions.filter(s => s.active).sort((a,b) => a.day - b.day);
  const inactiveSubs = subscriptions.filter(s => !s.active);

  const handleDelete = async () => {
    if (deleteModal.id) {
        await deleteSubscription(deleteModal.id);
        setNotification({ msg: "Recorrência excluída.", type: "success" });
        setDeleteModal({ isOpen: false, id: null });
    }
  };

  const handleToggle = async (sub) => {
    await toggleSubscription(sub.id, sub.active);
    const status = !sub.active ? "ativada" : "pausada";
    setNotification({ msg: `Recorrência ${status}.`, type: !sub.active ? "success" : "info" });
  };

  // Abrir modal de edição
  const openEdit = (sub) => {
    setEditingSub(sub);
    setEditForm({
        name: sub.name,
        amount: sub.amount,
        day: sub.day,
        walletId: sub.walletId || "",
        type: sub.type || "expense" // Carrega o tipo atual
    });
  };

  // Salvar edição
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingSub) return;

    await updateSubscription(editingSub.id, {
        name: editForm.name,
        amount: parseFloat(editForm.amount),
        day: parseInt(editForm.day),
        walletId: editForm.walletId,
        type: editForm.type // Salva o novo tipo
    });

    setNotification({ msg: "Recorrência atualizada!", type: "success" });
    setEditingSub(null);
  };

  const getWalletName = (id) => {
    const w = wallets.find(w => w.id === id);
    return w ? w.name : "Padrão / Indefinida";
  };

  const renderCard = (sub) => {
    const isIncome = sub.type === 'income';

    return (
      <div key={sub.id} className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${sub.active ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-gray-800/50 border-gray-700/50 opacity-60'}`}>
          <div className="flex items-center gap-4">
              {/* ÍCONE DE TIPO (Entrada vs Saída) */}
              <div className={`p-3 rounded-full ${
                  sub.active 
                    ? (isIncome ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400') 
                    : 'bg-gray-700 text-gray-500'
              }`}>
                  {isIncome ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
              </div>
              
              <div>
                  <h4 className={`font-bold ${sub.active ? 'text-white' : 'text-gray-400 line-through'}`}>{sub.name}</h4>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                      <span className="flex items-center gap-1"><CreditCard size={10}/> {getWalletName(sub.walletId)}</span>
                      <span className="bg-gray-700 px-1.5 py-0.5 rounded text-gray-300 flex items-center gap-1">
                        <Calendar size={10} /> Dia {sub.day}
                      </span>
                  </div>
              </div>
          </div>
          
          <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
              {/* VALOR COLORIDO */}
              <span className={`font-bold text-lg ${isIncome ? 'text-green-400' : 'text-white'}`}>
                  {isIncome ? '+ ' : '- '}
                  R$ {sub.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              
              <div className="flex items-center gap-1 bg-gray-900/50 p-1 rounded-lg">
                  <button onClick={() => openEdit(sub)} title="Editar" className="p-2 rounded-lg hover:bg-blue-500/20 text-gray-400 hover:text-blue-500 transition-colors">
                      <Pencil size={18} />
                  </button>
                  <button onClick={() => handleToggle(sub)} title={sub.active ? "Pausar" : "Reativar"} className={`p-2 rounded-lg transition-colors ${sub.active ? 'hover:bg-yellow-500/20 text-gray-400 hover:text-yellow-500' : 'hover:bg-green-500/20 text-gray-500 hover:text-green-500'}`}>
                      {sub.active ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                  <button onClick={() => setDeleteModal({ isOpen: true, id: sub.id })} title="Excluir" className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={18} />
                  </button>
              </div>
          </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 pb-24">
       <Notification message={notification?.msg} type={notification?.type} onClose={() => setNotification(null)} />
       <ConfirmModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, id: null })} onConfirm={handleDelete} title="Excluir Recorrência" message="Isso não apaga as cobranças passadas, apenas remove a recorrência futura." />

      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate("/")} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition">
            <ArrowLeft />
        </button>
        <h1 className="text-xl font-bold">Gerenciar Recorrências</h1>
      </header>

      <div className="max-w-3xl mx-auto space-y-8">
        <section>
            <h3 className="text-sm font-bold uppercase text-blue-400 mb-4 flex items-center gap-2"><CheckCircle2 size={16}/> Ativas ({activeSubs.length})</h3>
            <div className="space-y-3">
                {activeSubs.length === 0 && <p className="text-gray-500 text-sm italic">Nenhuma recorrência ativa.</p>}
                {activeSubs.map(renderCard)}
            </div>
        </section>

        {inactiveSubs.length > 0 && (
            <section className="pt-8 border-t border-gray-800">
                <h3 className="text-sm font-bold uppercase text-gray-500 mb-4 flex items-center gap-2"><XCircle size={16}/> Pausadas ({inactiveSubs.length})</h3>
                <div className="space-y-3">
                    {inactiveSubs.map(renderCard)}
                </div>
            </section>
        )}
      </div>

      {/* MODAL DE EDIÇÃO */}
      {editingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-sm border border-gray-700 animate-scale-up">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg text-white">Editar Recorrência</h3>
                  <button onClick={() => setEditingSub(null)}><X size={20} className="text-gray-400"/></button>
              </div>
              
              <form onSubmit={handleSaveEdit} className="space-y-4">
                 <input type="text" placeholder="Nome" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-gray-700 p-3 rounded-lg text-white outline-none focus:ring-2 focus:ring-blue-600" required />
                 
                 <MoneyInput value={editForm.amount} onChange={(val) => setEditForm({...editForm, amount: val})} />
                 
                 {/* SELETOR DE TIPO (Entrada/Saída) */}
                 <div className="flex bg-gray-700 p-1 rounded-lg">
                    <button 
                        type="button"
                        onClick={() => setEditForm({...editForm, type: 'expense'})}
                        className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${editForm.type === 'expense' ? 'bg-red-500 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                    >
                        Saída
                    </button>
                    <button 
                        type="button"
                        onClick={() => setEditForm({...editForm, type: 'income'})}
                        className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${editForm.type === 'income' ? 'bg-green-500 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                    >
                        Entrada
                    </button>
                 </div>

                 <div className="flex gap-2">
                    <div className="w-1/3">
                        <label className="text-xs text-gray-400 block mb-1">Dia Venc.</label>
                        <input type="number" min="1" max="31" value={editForm.day} onChange={e => setEditForm({...editForm, day: e.target.value})} className="w-full bg-gray-700 p-3 rounded-lg text-white text-center outline-none focus:ring-2 focus:ring-blue-600" required />
                    </div>
                    <div className="w-2/3">
                        <label className="text-xs text-gray-400 block mb-1">Carteira</label>
                        <select value={editForm.walletId} onChange={e => setEditForm({...editForm, walletId: e.target.value})} className="w-full bg-gray-700 p-3 rounded-lg text-white outline-none focus:ring-2 focus:ring-blue-600" required>
                             {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                    </div>
                 </div>

                 <button type="submit" className="w-full py-3 bg-blue-600 rounded-lg font-bold text-white hover:bg-blue-700 flex items-center justify-center gap-2 shadow-lg">
                    <Save size={18} /> Salvar Alterações
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}