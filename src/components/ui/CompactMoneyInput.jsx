import { useState, useEffect, useRef } from "react";
import { formatCurrency } from "../../utils/formatters"; 

export function CompactMoneyInput({ value, onChange, placeholder, autoFocus }) {
  const [displayValue, setDisplayValue] = useState("0,00");
  const inputRef = useRef(null);

  // Inicialização
  useEffect(() => {
    if (value === 0 || value === "" || value === null || value === undefined) {
      setDisplayValue("0,00");
    } else {
      setDisplayValue(formatCurrency(value));
    }
  }, [value]);

  // Lógica de Cursor Travado no Final (Igual ao seu MoneyInput)
  useEffect(() => {
    if (inputRef.current) {
        const len = inputRef.current.value.length;
        requestAnimationFrame(() => {
            inputRef.current.setSelectionRange(len, len);
        });
    }
  }, [displayValue]);

  const handleChange = (e) => {
    // Remove tudo que não é dígito
    const rawValue = e.target.value.replace(/\D/g, ""); 
    
    if (!rawValue) {
        setDisplayValue("0,00");
        onChange("");
        return;
    }

    // Divide por 100 para centavos
    const floatValue = parseInt(rawValue) / 100;
    
    setDisplayValue(formatCurrency(floatValue));
    onChange(floatValue);
  };

  const forceCursorEnd = () => {
      if (inputRef.current) {
          const len = inputRef.current.value.length;
          requestAnimationFrame(() => {
              inputRef.current.setSelectionRange(len, len);
          });
      }
  };

  return (
    <div className="flex items-center gap-1 border-b border-gray-600 focus-within:border-blue-500 transition-colors py-1 w-full">
      <span className="text-gray-500 text-xs font-bold pointer-events-none">R$</span>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoFocus={autoFocus}
        placeholder={placeholder || "0,00"}
        value={displayValue}
        onChange={handleChange}
        onClick={forceCursorEnd}
        onFocus={forceCursorEnd}
        // caret-transparent para não mostrar o cursor piscando no meio
        className="w-full bg-transparent text-white text-sm font-bold outline-none text-right placeholder-gray-600 caret-transparent" 
      />
    </div>
  );
}