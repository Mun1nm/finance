import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b", 
  "#8b5cf6", "#ec4899", "#6366f1", "#14b8a6",
  "#f97316", "#06b6d4"
];

export function CategoryChart({ transactions, mode = "macro" }) {
  
  // Filtra apenas saídas para o gráfico não ficar confuso com entradas
  const expenses = transactions.filter((t) => t.type === "expense");

  const dataMap = expenses.reduce((acc, curr) => {
    // Se o modo for 'macro', usa o campo macro. Se não, usa category.
    const key = mode === "macro" ? (curr.macro || "Outros") : curr.category;
    
    if (!acc[key]) {
      acc[key] = { name: key, value: 0 };
    }
    acc[key].value += curr.amount;
    return acc;
  }, {});

  const data = Object.values(dataMap).sort((a,b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-gray-500 border border-dashed border-gray-700 rounded-xl bg-gray-800/30">
        <p className="text-sm">Sem despesas para exibir.</p>
      </div>
    );
  }

  return (
    // ADICIONADO: style={{ minHeight: '320px' }} para garantir tamanho físico imediato
    <div className="w-full h-80" style={{ minHeight: '320px' }}>
      {/* 99% evita bug de scrollbar flutuante em alguns navegadores */}
      <ResponsiveContainer width="99%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60} // Donut Chart (anel)
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
                stroke="rgba(0,0,0,0)" // Remove borda branca feia
              />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1f2937', 
              borderColor: '#374151', 
              color: '#fff',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            itemStyle={{ color: '#e5e7eb' }}
            formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          />
          <Legend 
            layout="vertical" 
            verticalAlign="middle" 
            align="right" 
            iconType="circle"
            wrapperStyle={{
              fontSize: '11px',
              color: '#9ca3af',
              right: 0
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}