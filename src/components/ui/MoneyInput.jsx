import { useState, useEffect, useRef } from "react";
import { formatCurrency } from "../../utils/formatters"; 

export function MoneyInput({ value, onChange, placeholder }) {
  const [displayValue, setDisplayValue] = useState("0,00");
  const inputRef = useRef(null);

  useEffect(() => {
    if (value === 0 || value === "" || value === null) {
      setDisplayValue("0,00");
    } else {
      setDisplayValue(formatCurrency(value));
    }
  }, [value]);

  // Efeito 1: Sempre que o valor visual muda, joga o cursor pro final
  useEffect(() => {
    if (inputRef.current) {
        const len = inputRef.current.value.length;
        // O requestAnimationFrame garante que isso rode após a renderização do browser
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

    // Divide por 100 para criar o efeito de centavos (ATM)
    const floatValue = parseInt(rawValue) / 100;
    
    setDisplayValue(formatCurrency(floatValue));
    onChange(floatValue);
  };

  // Garante cursor no final ao clicar ou focar
  const forceCursorEnd = () => {
      if (inputRef.current) {
          const len = inputRef.current.value.length;
          requestAnimationFrame(() => {
              inputRef.current.setSelectionRange(len, len);
          });
      }
  };

  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg font-bold pointer-events-none">R$</span>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric" // Garante teclado numérico
        placeholder={placeholder || "0,00"}
        value={displayValue}
        onChange={handleChange}
        onClick={forceCursorEnd}
        onFocus={forceCursorEnd}
        // caret-transparent: esconde o cursor piscando para não confundir
        className="w-full bg-gray-700/50 border border-gray-600 rounded-lg p-3 pl-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right font-mono caret-transparent" 
      />
    </div>
  );
}