import { useCallback, useEffect, useRef, useState } from 'react';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/[]{}';

export default function DecryptText({ text, className = '' }) {
  const [display, setDisplay] = useState(text);
  const intervalRef = useRef(null);
  const textRef = useRef(null);

  const decrypt = useCallback(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    window.clearInterval(intervalRef.current);
    let frame = 0;
    intervalRef.current = window.setInterval(() => {
      frame += 1;
      const resolved = Math.max(0, frame - 3);
      const next = [...text].map((character, index) => {
        if (character === ' ' || index < resolved) return character;
        return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }).join('');
      setDisplay(next);
      if (resolved >= text.length) {
        window.clearInterval(intervalRef.current);
        setDisplay(text);
      }
    }, 32);
  }, [text]);

  useEffect(() => {
    const control = textRef.current?.closest('a,button');
    control?.addEventListener('focus', decrypt);
    return () => {
      window.clearInterval(intervalRef.current);
      control?.removeEventListener('focus', decrypt);
    };
  }, [decrypt]);

  return <span ref={textRef} className={className} aria-hidden="true" onPointerEnter={decrypt}>{display}</span>;
}
