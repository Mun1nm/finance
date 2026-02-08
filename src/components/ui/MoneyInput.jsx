import { useState, useEffect } from "react";
import { formatCurrency, parseCurrency } from "../../utils/formatters"; // Usando o utils

export function MoneyInput({ value, onChange, placeholder }) {
  const [displayValue, setDisplayValue] = useState(formatCurrency(value));

  const handleChange = (e) => {
    let raw = e.target.value.replace(/\D/g, "");
    if (raw === "") raw = "0";
    const floatValue = parseFloat(raw) / 100;
    
    setDisplayValue(formatCurrency(floatValue));
    onChange(floatValue);
  };

  useEffect(() => {
    if (value === 0 || value === "") {
      setDisplayValue("0,00");
    }
  }, [value]);

  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg font-bold">R$</span>
      <input
        type="text"
        inputMode="numeric"
        placeholder={placeholder || "0,00"}
        value={displayValue}
        onChange={handleChange}
        className="w-full bg-gray-700/50 border border-gray-600 rounded-lg p-3 pl-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right font-mono"
      />
    </div>
  );
}