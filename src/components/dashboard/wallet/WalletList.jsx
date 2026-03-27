import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Star, Trash2, CreditCard, Receipt, MoreVertical, X, SlidersHorizontal, GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Menu flutuante via portal — escapa de qualquer overflow
function WalletContextMenu({ wallet, anchorRef, onClose, onSetDefault, onDeleteClick, onEditWallet }) {
  const menuRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const w = wallet;

  useEffect(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const menuWidth = 160;
    const spaceRight = window.innerWidth - rect.right;
    const left = spaceRight >= menuWidth
      ? rect.right - menuWidth
      : rect.left - menuWidth + rect.width;

    setPos({
      top: rect.bottom + 6,
      left: Math.max(8, left),
    });
  }, [anchorRef]);

  // Fecha ao clicar fora
  useEffect(() => {
    const handle = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) &&
          anchorRef.current && !anchorRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose, anchorRef]);

  return createPortal(
    <div
      ref={menuRef}
      style={{ top: pos.top, left: pos.left, width: 160 }}
      className="fixed z-[9999] bg-gray-800 border border-gray-600 rounded-xl shadow-2xl overflow-hidden animate-fade-in"
    >
      <button
        onClick={(e) => { e.stopPropagation(); onSetDefault(w.id); onClose(); }}
        className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 transition-colors ${
          w.isDefault
            ? 'text-yellow-400 bg-yellow-400/10'
            : 'text-gray-100 hover:bg-gray-700'
        }`}
      >
        <Star size={13} fill={w.isDefault ? "currentColor" : "none"} className="shrink-0" />
        {w.isDefault ? 'É Padrão' : 'Tornar Padrão'}
      </button>

      <div className="border-t border-gray-700" />

      <button
        onClick={(e) => { e.stopPropagation(); onEditWallet(w); onClose(); }}
        className="w-full text-left px-4 py-2.5 text-sm text-gray-100 hover:bg-gray-700 flex items-center gap-2.5 transition-colors"
      >
        <SlidersHorizontal size={13} className="shrink-0" /> Ajustar Saldo
      </button>

      {!w.isDefault && (
        <>
          <div className="border-t border-gray-700" />
          <button
            onClick={(e) => { e.stopPropagation(); onDeleteClick(w); onClose(); }}
            className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors"
          >
            <Trash2 size={13} className="shrink-0" /> Excluir
          </button>
        </>
      )}
    </div>,
    document.body
  );
}

function SortableWalletCard({ wallet, onSetDefault, onDeleteClick, onWalletClick, onEditWallet }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: wallet.id });
  const [menuOpen, setMenuOpen] = useState(false);
  const btnRef = useRef(null);
  const w = wallet;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`min-w-[170px] p-3 rounded-lg border flex flex-col transition-all shrink-0 group/card ${
        w.isDefault ? 'bg-blue-900/20 border-blue-500/50' : 'bg-gray-800 border-gray-700 hover:border-gray-500'
      }`}
    >
      {/* Linha do topo: grip + nome + crédito + menu */}
      <div className="flex items-center gap-1.5 mb-2 min-w-0">
        {/* Drag handle inline */}
        <div
          {...attributes}
          {...listeners}
          className="touch-none cursor-grab active:cursor-grabbing text-gray-600 opacity-0 group-hover/card:opacity-100 hover:!text-gray-300 transition-all shrink-0 -ml-0.5"
        >
          <GripVertical size={13} />
        </div>

        <span className="text-xs text-gray-400 truncate font-medium flex-1">{w.name}</span>

        {w.hasCredit && <CreditCard size={11} className="text-purple-400 shrink-0" />}

        {/* Botão do menu */}
        <button
          ref={btnRef}
          onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}
          className="p-0.5 text-gray-500 hover:text-white transition-colors shrink-0"
        >
          {menuOpen ? <X size={14} /> : <MoreVertical size={14} />}
        </button>
      </div>

      {/* Saldo */}
      <span className={`font-bold text-lg mb-2 ${w.balance >= 0 ? 'text-white' : 'text-red-400'}`}>
        R$ {w.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </span>

      {/* Fatura */}
      {w.hasCredit && (
        <div className="mt-auto pt-1">
          {w.currentInvoice > 0 ? (
            <button onClick={() => onWalletClick(w)} className="w-full text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 p-1.5 rounded flex items-center justify-between hover:bg-purple-500/30 transition-colors">
              <span title="Fatura Atual" className="flex items-center gap-1"><Receipt size={12} /> Fatura</span>
              <span className="font-bold">R$ {w.currentInvoice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </button>
          ) : (
            <button onClick={() => onWalletClick(w)} className="w-full text-[10px] text-gray-500 border border-gray-600/30 p-1.5 rounded flex items-center justify-center hover:bg-gray-700 transition-colors gap-2 cursor-default">
              <Receipt size={12} /> <span className="opacity-50">Fatura Zerada</span>
            </button>
          )}
        </div>
      )}

      {/* Menu flutuante via portal */}
      {menuOpen && (
        <WalletContextMenu
          wallet={w}
          anchorRef={btnRef}
          onClose={() => setMenuOpen(false)}
          onSetDefault={onSetDefault}
          onDeleteClick={onDeleteClick}
          onEditWallet={onEditWallet}
        />
      )}
    </div>
  );
}

export function WalletList({ wallets, onSetDefault, onDeleteClick, onWalletClick, onEditWallet }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin px-1">
      {wallets.map(w => (
        <SortableWalletCard
          key={w.id}
          wallet={w}
          onSetDefault={onSetDefault}
          onDeleteClick={onDeleteClick}
          onWalletClick={onWalletClick}
          onEditWallet={onEditWallet}
        />
      ))}
    </div>
  );
}