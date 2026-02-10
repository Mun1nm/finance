import { ChevronLeft, ChevronRight } from "lucide-react";

export function MonthNavigator({ currentDate, onPrev, onNext }) {
  return (
    <div className="flex items-center justify-center gap-4 mb-6">
      <button onClick={onPrev} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
        <ChevronLeft />
      </button>
      <span className="font-bold text-lg capitalize">
        {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
      </span>
      <button onClick={onNext} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
        <ChevronRight />
      </button>
    </div>
  );
}