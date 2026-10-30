import { useEffect, useMemo, useState } from 'react';

const DEFAULT_TITLES = [
  'Full-Stack Developer | Building Digital Experiences',
  'Software Developer | Turning Ideas Into Reality',
  'Full-Stack Engineer | Design. Develop. Deploy.',
  'Full-Stack Developer | From Concept to Creation.',
];

export default function HeroTitleRotator({ titles = DEFAULT_TITLES }) {
  const safeTitles = useMemo(() => Array.isArray(titles) && titles.length
    ? titles.filter((title) => typeof title === 'string' && title.trim())
    : DEFAULT_TITLES, [titles]);
  const validTitles = safeTitles.length ? safeTitles : DEFAULT_TITLES;
  const [progress, setProgress] = useState({ titleIndex: 0, characterIndex: 0, deleting: false });
  const activeTitle = validTitles[progress.titleIndex % validTitles.length];

  useEffect(() => {
    const phrase = validTitles[progress.titleIndex % validTitles.length];
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      setProgress((current) => current.titleIndex === 0 && current.characterIndex === phrase.length && !current.deleting
        ? current
        : { titleIndex: 0, characterIndex: phrase.length, deleting: false });
      return undefined;
    }
    const delay = progress.deleting ? 24 : progress.characterIndex === phrase.length ? 1300 : 42;
    const timeoutId = window.setTimeout(() => {
      setProgress((current) => {
        const currentPhrase = validTitles[current.titleIndex % validTitles.length];
        if (current.deleting && current.characterIndex === 0) {
          return { titleIndex: (current.titleIndex + 1) % validTitles.length, characterIndex: 0, deleting: false };
        }
        if (current.deleting) return { ...current, characterIndex: current.characterIndex - 1 };
        if (current.characterIndex === currentPhrase.length) return { ...current, deleting: true };
        return { ...current, characterIndex: current.characterIndex + 1 };
      });
    }, delay);
    return () => window.clearTimeout(timeoutId);
  }, [progress, validTitles]);

  const visiblePhrase = activeTitle.slice(0, progress.characterIndex);
  const dividerIndex = activeTitle.indexOf('|');
  const primaryLength = dividerIndex < 0 ? activeTitle.length : dividerIndex;
  const visiblePrimary = visiblePhrase.slice(0, primaryLength);
  const visibleDivider = dividerIndex < 0 ? '' : visiblePhrase.slice(primaryLength, primaryLength + 3);
  const visibleFocus = dividerIndex < 0 ? '' : visiblePhrase.slice(primaryLength + 3);

  return (
    <h1 className="hero-title-cycle" aria-live="off" aria-label={activeTitle}>
      <span aria-hidden="true" className="hero-title-cycle__typed">
        <strong>{visiblePrimary}</strong><span className="hero-title-cycle__divider">{visibleDivider}</span><span className="hero-title-cycle__focus">{visibleFocus}</span><span className="hero-title-cycle__caret" />
      </span>
    </h1>
  );
}
