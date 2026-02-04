import { useState, useEffect } from "react";

export function MoneyInput({ value, onChange }) {
  // Transforma o valor numérico (ex: 12.50) em string visual (ex: "12,50")
  const formatValue = (val) => {
    if (!val) return "0,00";
    return val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const [displayValue, setDisplayValue] = useState(formatValue(value));

  const handleChange = (e) => {
    // 1. Pega apenas os números digitados
    let val = e.target.value.replace(/\D/g, "");
    
    // 2. Remove zeros a esquerda
    val = Number(val).toString();

    // 3. Se estiver vazio, zera
    if (val === "") val = "0";

    // 4. Converte para float (ex: 1234 -> 12.34)
    const floatValue = parseFloat(val) / 100;

    // 5. Atualiza o visual
    setDisplayValue(formatValue(floatValue));

    // 6. Manda o número puro para o componente pai
    onChange(floatValue);
  };

  // Sincroniza se o valor vier zerado de fora (ex: após salvar)
  useEffect(() => {
    if (value === 0 || value === "") {
      setDisplayValue("0,00");
    }
  }, [value]);

  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-2xl font-bold">R$</span>
      <input
        type="text"
        inputMode="numeric" // Teclado numérico no celular
        value={displayValue}
        onChange={handleChange}
        className="w-full bg-transparent text-4xl font-bold text-white placeholder-gray-600 focus:outline-none text-right pr-4"
      />
    </div>
  );
}