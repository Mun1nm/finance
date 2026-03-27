import { useState, useEffect } from "react";
import { useWallets } from "../../hooks/useWallets";
import { useTransactions } from "../../hooks/useTransactions";
import { InvoiceModal } from "./InvoiceModal"; 
import { WalletHeader } from "./wallet/WalletHeader";
import { WalletList } from "./wallet/WalletList";
import { CreateWalletModal } from "./wallet/CreateWalletModal";
import { TransferModal } from "./wallet/TransferModal";
import { DeleteWalletModal } from "./wallet/DeleteWalletModal";
import { InstallmentsModal } from "./wallet/InstallmentsModal";
import { WalletEditModal } from "./wallet/WalletEditModal";
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";

export function WalletManager({
  wallets,
  walletBalances,
  overallBalance,
  futureBalance,
  transactions,
  onOpenFutureModal,
  onAddWallet,
  onSetDefault,
  onDeleteWallet,
  onUpdateWallet,
  onTransfer,
  onAddTransaction,
  setNotification,
  onReorderWallets
}) {
  const { payInvoice } = useTransactions();

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletDeleteData, setWalletDeleteData] = useState(null);
  const [invoiceModalWallet, setInvoiceModalWallet] = useState(null);
  const [isInstallmentsModalOpen, setIsInstallmentsModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
      if (invoiceModalWallet) {
          const updatedWallet = walletBalances.find(w => w.id === invoiceModalWallet.id);
          if (updatedWallet) {
              setInvoiceModalWallet(updatedWallet);
          }
      }
  }, [walletBalances]);

  // ... (handleCreateWallet, handleTransfer, handleConfirmDelete ficam iguais) ...
  const handleCreateWallet = async (name, hasCredit, closingDay, dueDay, creditLimit) => {
    try {
        setIsSubmitting(true);
        await onAddWallet(name, hasCredit, closingDay, dueDay, creditLimit); 
        setNotification({ msg: "Carteira criada!", type: "success" });
    } catch (error) {
        console.error("Erro", error);
        setNotification({ msg: "Erro ao criar carteira.", type: "error" });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleTransfer = async (amount, from, to, date) => {
    const fromWallet = wallets.find(w => w.id === from);
    const toWallet = wallets.find(w => w.id === to);
    if (!fromWallet || !toWallet) {
        setNotification({ msg: "Selecione origem e destino.", type: "error" });
        return;
    }
    try {
        setIsSubmitting(true);
        await onTransfer(amount, from, to, date, fromWallet.name, toWallet.name);
        setNotification({ msg: "Transferência realizada!", type: "success" });
    } catch (error) {
        console.error("Erro", error);
        setNotification({ msg: "Erro na transferência.", type: "error" });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async (id, destinyId) => {
    const wallet = walletDeleteData;
    const { name, balance } = wallet;
    try {
        setIsSubmitting(true);
        if (Math.abs(balance) > 0.01) {
            if (destinyId) {
                const destinyWallet = wallets.find(w => w.id === destinyId);
                const destinyName = destinyWallet ? destinyWallet.name : "Desconhecida";
                await onTransfer(Math.abs(balance), balance > 0 ? id : destinyId, balance > 0 ? destinyId : id, new Date().toISOString().split('T')[0], balance > 0 ? name : destinyName, balance > 0 ? destinyName : name);
            } else {
                const type = balance > 0 ? 'expense' : 'income';
                await onAddTransaction(Math.abs(balance), "Ajuste de Saldo", "Outros", type, false, `Encerramento da carteira: ${name}`, new Date().toISOString().split('T')[0], id);
            }
        }
        await onDeleteWallet(id);
        setWalletDeleteData(null);
        setNotification({ msg: "Carteira excluída.", type: "success" });
    } catch (error) {
        console.error("Erro", error);
        setNotification({ msg: "Erro ao excluir carteira.", type: "error" });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handlePayInvoice = async (walletId, amount, invoiceDate, transactionIds) => {
      const wallet = walletBalances.find(w => w.id === walletId);
      if (wallet.balance < amount) {
          setNotification({ msg: "Saldo insuficiente nesta carteira!", type: "error" });
          throw new Error("Saldo insuficiente");
      }
      await payInvoice(walletId, amount, invoiceDate, transactionIds);
      setNotification({ msg: "Fatura paga com sucesso!", type: "success" });
  };

  const handleSaveWalletEdit = async (walletId, newInitialBalance) => {
    try {
        setIsSubmitting(true);
        await onUpdateWallet(walletId, { initialBalance: newInitialBalance });
        setEditingWallet(null);
        setNotification({ msg: "Saldo ajustado!", type: "success" });
    } catch (error) {
        console.error("Erro ao ajustar saldo:", error);
        setNotification({ msg: "Erro ao ajustar saldo.", type: "error" });
    } finally {
        setIsSubmitting(false);
    }
  };

  const totalInvoices = walletBalances.reduce((acc, w) => acc + (w.allUnpaidInvoices || 0), 0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = walletBalances.findIndex(w => w.id === active.id);
    const newIndex = walletBalances.findIndex(w => w.id === over.id);
    const reordered = arrayMove(walletBalances, oldIndex, newIndex);
    onReorderWallets(reordered);
  };

  return (
    <div id="tutorial-wallet-section" className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <WalletHeader 
            overallBalance={overallBalance}
            futureBalance={futureBalance}
            totalInvoices={totalInvoices}
            onOpenFutureModal={onOpenFutureModal}
            onOpenTransferModal={() => setIsTransferModalOpen(true)}
            onOpenCreateModal={() => setIsWalletModalOpen(true)}
            onOpenInstallmentsModal={() => setIsInstallmentsModalOpen(true)} // <-- Passando a função
        />

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={walletBalances.map(w => w.id)} strategy={horizontalListSortingStrategy}>
            <WalletList
                wallets={walletBalances}
                onSetDefault={onSetDefault}
                onDeleteClick={setWalletDeleteData}
                onWalletClick={setInvoiceModalWallet}
                onEditWallet={setEditingWallet}
            />
          </SortableContext>
        </DndContext>

        <CreateWalletModal isOpen={isWalletModalOpen} onClose={() => setIsWalletModalOpen(false)} onAddWallet={handleCreateWallet} isSubmitting={isSubmitting} />
        <TransferModal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} onTransfer={handleTransfer} wallets={wallets} isSubmitting={isSubmitting} />
        <DeleteWalletModal wallet={walletDeleteData} onClose={() => setWalletDeleteData(null)} onConfirm={handleConfirmDelete} wallets={wallets} isSubmitting={isSubmitting} />

        {invoiceModalWallet && (
            <InvoiceModal wallet={invoiceModalWallet} transactions={transactions} onClose={() => setInvoiceModalWallet(null)} onPayInvoice={handlePayInvoice} />
        )}

        <WalletEditModal
            wallet={editingWallet}
            onClose={() => setEditingWallet(null)}
            onSave={handleSaveWalletEdit}
            isSubmitting={isSubmitting}
        />

        {/* MODAL GLOBAL DE PARCELAS */}
        <InstallmentsModal
            isOpen={isInstallmentsModalOpen}
            transactions={transactions}
            wallets={wallets}
            onClose={() => setIsInstallmentsModalOpen(false)}
        />
    </div>
  );
}