export function TypeSelector({ type, setType, disabled, resetFields }) {
  const handleTypeChange = (newType) => {
    setType(newType);
    resetFields();
  };

  return (
    <div className="flex gap-2 mb-4">
      <button 
        type="button" 
        disabled={disabled} 
        onClick={() => handleTypeChange("expense")} 
        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${type === "expense" ? "bg-red-500/20 text-red-400 border-red-500" : "bg-gray-700 border-transparent text-gray-400 hover:bg-gray-600 disabled:opacity-50"}`}
      >
        Saída
      </button>
      <button 
        type="button" 
        disabled={disabled} 
        onClick={() => handleTypeChange("investment")} 
        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${type === "investment" ? "bg-purple-500/20 text-purple-400 border-purple-500" : "bg-gray-700 border-transparent text-gray-400 hover:bg-gray-600 disabled:opacity-50"}`}
      >
        Invest.
      </button>
      <button 
        type="button" 
        disabled={disabled} 
        onClick={() => handleTypeChange("income")} 
        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${type === "income" ? "bg-green-500/20 text-green-400 border-green-500" : "bg-gray-700 border-transparent text-gray-400 hover:bg-gray-600 disabled:opacity-50"}`}
      >
        Entrada
      </button>
    </div>
  );
}