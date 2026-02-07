import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#6366F1", "#14B8A6", "#F97316"];

export function CategoryChart({ transactions, mode, type }) {
  
  // 1. Agrupa os dados
  const dataMap = transactions.reduce((acc, t) => {
    // CORREÇÃO AQUI: Usar 't.category' em vez de 't.categoryName'
    const key = mode === 'macro' ? t.macro : t.category; 
    
    // Fallback se o nome estiver vazio
    const label = key || "Outros";
    
    if (!acc[label]) acc[label] = 0;
    acc[label] += t.amount;
    return acc;
  }, {});

  // Converte para array e ordena
  const data = Object.entries(dataMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // 2. ESTADO VAZIO
  if (data.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500">
        <PieChart width={100} height={100}>
           <Pie data={[{ value: 1 }]} innerRadius={35} outerRadius={45} fill="#374151" dataKey="value" stroke="none" />
        </PieChart>
        <p className="text-sm mt-2">
            {type === 'income' ? "Sem entradas a exibir" : "Sem despesas a exibir"}
        </p>
      </div>
    );
  }

  // 3. RENDERIZAÇÃO (Agora sempre em Disco/Pizza)
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60} // Deixa com furo no meio (Rosca). Se quiser pizza cheia, ponha 0.
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.2)" />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '8px', color: '#F3F4F6' }}
          itemStyle={{ color: '#F3F4F6' }}
        />
        <Legend 
          layout="vertical" 
          verticalAlign="middle" 
          align="right" 
          wrapperStyle={{ fontSize: '12px', color: '#9CA3AF' }} 
        />
      </PieChart>
    </ResponsiveContainer>
  );
}