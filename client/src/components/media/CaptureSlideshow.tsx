import { useEffect, useState } from 'react';
import { MovieCapture } from '../../types/media.types';

export function CaptureSlideshow({ captures }: { captures: MovieCapture[] }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (captures.length <= 1) return;
    const timer = setInterval(() => setIdx((i) => (i + 1) % captures.length), 3500);
    return () => clearInterval(timer);
  }, [captures.length]);

  return (
    <div className="relative h-32 w-56 rounded-md overflow-hidden bg-slate-100 flex-shrink-0">
      {captures.map((cap, i) => (
        <img
          key={cap.id}
          src={cap.url}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            i === idx ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
    </div>
  );
}
