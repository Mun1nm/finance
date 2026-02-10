import { useState } from "react";
import { Trash2 } from "lucide-react";

export function SwipeableItem({ children, onDelete, className }) {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [offset, setOffset] = useState(0); 

  const minSwipeDistance = 50;
  const maxSwipeDistance = 80; 

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
    const currentTouch = e.targetTouches[0].clientX;
    const diff = touchStart - currentTouch;

    if (diff > 0) {
        setOffset(Math.min(diff, maxSwipeDistance));
    }
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;

    if (isLeftSwipe) {
      setOffset(maxSwipeDistance); 
    } else {
      setOffset(0); 
    }
  };

  const resetSwipe = () => setOffset(0);

  return (
    <div className="relative w-full group select-none">
        {/* CAMADA DE FUNDO (LIXEIRA) */}
        <div className="absolute inset-y-0 right-0 w-1/2 bg-red-600 rounded-r-xl z-0 flex justify-end items-center pr-6">
            <button 
                onClick={() => onDelete()} 
                className="text-white flex items-center justify-center active:scale-95 transition-transform"
            >
                <Trash2 size={24} />
            </button>
        </div>

        {/* CAMADA DO CARD (FRENTE) */}
        <div 
            className={`relative z-10 bg-gray-800 transition-transform duration-200 ease-out w-full ${className}`}
            style={{ transform: `translateX(-${offset}px)` }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onClick={resetSwipe}
        >
            {children}
        </div>
    </div>
  );
}