export const formatCurrency = (value) => {
  if (!value) return "0,00";
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const parseCurrency = (value) => {
  // Remove tudo que não é dígito
  let val = value.replace(/\D/g, "");
  // Converte para float
  return parseFloat(val) / 100;
};