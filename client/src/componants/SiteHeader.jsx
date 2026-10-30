import { useEffect, useLayoutEffect, useRef, useState } from "react";
import DecryptNavLink from "./DecryptNavLink.jsx";
import DecryptText from "./DecryptText.jsx";
import usePortfolioContent from "./usePortfolioContent.js";

function SiteHeader() {
  const { navigation } = usePortfolioContent();
  const brandName = navigation.brandName;
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [typedName, setTypedName] = useState("");
  const scrolledRef = useRef(false);
  const contactRef = useRef(null);
  const previousContactRect = useRef(null);

  useEffect(() => {
    let frameId;
    const updateScrollState = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        const nextScrolled = window.scrollY > 48;
        if (nextScrolled === scrolledRef.current) return;
        previousContactRect.current = contactRef.current?.getBoundingClientRect() ?? null;
        scrolledRef.current = nextScrolled;
        setScrolled(nextScrolled);
      });
    };
    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", updateScrollState);
    };
  }, []);

  useLayoutEffect(() => {
    const fromRect = previousContactRect.current;
    const contact = contactRef.current;
    previousContactRect.current = null;
    if (!fromRect || !contact || fromRect.width === 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const toRect = contact.getBoundingClientRect();
    const deltaX = fromRect.left - toRect.left;
    const deltaY = fromRect.top - toRect.top;
    if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return;

    contact.animate(
      [
        { transform: `translate(${deltaX}px, ${deltaY}px)` },
        { transform: "translate(0, 0)" },
      ],
      { duration: 900, easing: "cubic-bezier(.22,.78,.2,1)" }
    );
  }, [scrolled]);

  useEffect(() => {
    let index = 0;
    let direction = 1;
    let timeoutId;
    const typeNext = () => {
      if (direction > 0) {
        index += 1;
        setTypedName(brandName.slice(0, index));
        if (index === brandName.length) direction = -1;
        timeoutId = window.setTimeout(typeNext, index === brandName.length ? 1400 : 82);
        return;
      }
      index -= 1;
      setTypedName(brandName.slice(0, index));
      if (index === 0) direction = 1;
      timeoutId = window.setTimeout(typeNext, index === 0 ? 450 : 38);
    };
    timeoutId = window.setTimeout(typeNext, 350);
    return () => window.clearTimeout(timeoutId);
  }, [brandName]);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
      <a className="wordmark" href="#home" aria-label="Jeet Chalthanwala home">
        <span className="wordmark-mark">JC</span>
        <span className="wordmark-name" aria-label={brandName}>
          <span aria-hidden="true">{typedName}</span><span className="wordmark-caret" aria-hidden="true" />
        </span>
      </a>

      <button
        className="menu-toggle"
        type="button"
        aria-expanded={menuOpen}
        aria-controls="primary-nav"
        aria-label={menuOpen ? "Close navigation" : "Open navigation"}
        onClick={() => setMenuOpen((isOpen) => !isOpen)}
      >
        <span />
        <span />
      </button>

      <nav
        className={`primary-nav${menuOpen ? " is-open" : ""}`}
        id="primary-nav"
        aria-label="Main navigation"
      >
        {navigation.items.map(({ label, href }) => <DecryptNavLink href={href} label={label} onClick={closeMenu} key={`${label}-${href}`} />)}
        <a ref={contactRef} href={navigation.ctaHref} className="nav-contact" onClick={closeMenu} aria-label={navigation.ctaLabel}>
          <DecryptText text={navigation.ctaLabel} className="nav-contact-label" /><span className="nav-contact-arrow" aria-hidden="true">↗</span>
        </a>
      </nav>
    </header>
  );
}

export default SiteHeader;
