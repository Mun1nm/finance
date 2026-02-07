import { CheckCircle, Info, X } from "lucide-react";
import { useEffect } from "react";

export function Notification({ message, type = "success", onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // Some sozinho após 3 segundos
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!message) return null;

  const styles = type === "success" 
    ? "bg-green-500/10 border-green-500 text-green-400" 
    : "bg-blue-500/10 border-blue-500 text-blue-400";

  return (
    <div className={`fixed top-4 right-4 z-[70] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md animate-slide-in ${styles}`}>
      {type === "success" ? <CheckCircle size={20} /> : <Info size={20} />}
      <span className="font-medium text-sm">{message}</span>
      <button onClick={onClose} className="hover:opacity-70 ml-2">
        <X size={16} />
      </button>
    </div>
  );
}