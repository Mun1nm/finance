export const formatCurrency = (value) => {
  if (!value) return "0,00";
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const parseCurrency = (value) => {
  let val = value.replace(/\D/g, "");
  return parseFloat(val) / 100;
};

export const calculateInstallmentPreview = (amount, installments) => {
    if (!amount || !installments || installments === 0) return "0,00";
    
    // Algoritmo do Resto (Floor) para visualização
    const totalCents = Math.round(parseFloat(amount) * 100);
    const installmentCents = Math.floor(totalCents / parseInt(installments));
    
    return (installmentCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
};