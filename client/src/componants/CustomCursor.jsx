import { useEffect, useRef } from 'react';
import '../styles/custom-cursor.css';

const FINE_POINTER = '(hover: hover) and (pointer: fine)';
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';
const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], input, textarea, select, label, summary, canvas, [data-cursor-hover]';

export default function CustomCursor() {
  const cursorRef = useRef(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor || typeof window === 'undefined' || typeof document === 'undefined') return;

    const finePointer = window.matchMedia ? window.matchMedia(FINE_POINTER) : { matches: false, addEventListener() {}, removeEventListener() {} };
    const reducedMotion = window.matchMedia ? window.matchMedia(REDUCED_MOTION) : { matches: false, addEventListener() {}, removeEventListener() {} };
    const root = document.documentElement;

    const addMediaListener = (mediaQuery, callback) => {
      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', callback);
        return;
      }
      if (typeof mediaQuery.addListener === 'function') {
        mediaQuery.addListener(callback);
      }
    };

    const removeMediaListener = (mediaQuery, callback) => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', callback);
        return;
      }
      if (typeof mediaQuery.removeListener === 'function') {
        mediaQuery.removeListener(callback);
      }
    };

    let enabled = false;
    let isVisible = false;
    let targetX = -100;
    let targetY = -100;
    let rafId = null;

    const updateAvailability = () => {
      enabled = finePointer.matches && !reducedMotion.matches;
      root.classList.toggle('has-custom-cursor', enabled);
      cursor.classList.toggle('is-enabled', enabled);
      if (!enabled) {
        cursor.classList.remove('is-visible', 'is-hovering');
        isVisible = false;
      }
    };

    const renderCursor = () => {
      rafId = null;
      if (!enabled) return;
      cursor.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
      if (!isVisible) {
        cursor.classList.add('is-visible');
        isVisible = true;
      }
    };

    const onPointerMove = (event) => {
      if (!enabled || event.pointerType === 'touch') return;
      targetX = event.clientX;
      targetY = event.clientY;

      if (!rafId) {
        rafId = requestAnimationFrame(renderCursor);
      }
    };

    const onPointerOver = (event) => {
      if (!enabled) return;
      const target = event.target instanceof Element ? event.target : null;
      const isInteractive = Boolean(target?.closest(INTERACTIVE_SELECTOR));
      cursor.classList.toggle('is-hovering', isInteractive);
    };

    const hide = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      cursor.classList.remove('is-visible', 'is-hovering');
      isVisible = false;
    };

    updateAvailability();
    addMediaListener(finePointer, updateAvailability);
    addMediaListener(reducedMotion, updateAvailability);

    document.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerover', onPointerOver, { passive: true });
    document.addEventListener('pointerleave', hide);
    window.addEventListener('blur', hide);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      removeMediaListener(finePointer, updateAvailability);
      removeMediaListener(reducedMotion, updateAvailability);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerover', onPointerOver);
      document.removeEventListener('pointerleave', hide);
      window.removeEventListener('blur', hide);
      root.classList.remove('has-custom-cursor');
    };
  }, []);

  return (
    <div ref={cursorRef} className="custom-cursor" aria-hidden="true">
      <span className="custom-cursor__glow" />
      <svg className="custom-cursor__arrow" viewBox="0 0 22 28" aria-hidden="true">
        <path d="M2 1.5 20 16l-8 .2-4 8.5L2 1.5Z" />
      </svg>
    </div>
  );
}
