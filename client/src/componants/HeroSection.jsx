import { lazy, Suspense } from "react";
import HeroTitleRotator from "./HeroTitleRotator.jsx";
import DecryptText from "./DecryptText.jsx";
import usePortfolioContent from "./usePortfolioContent.js";

const VoxelCoder = lazy(() => import("./VoxelCoder.jsx"));

function getChipOrbitPosition(index, count) {
  const angle = ((-90 + (360 * index) / count) * Math.PI) / 180;
  const horizontalRadius = 40;
  const verticalRadius = 46;

  return {
    "--chip-x": `${Math.cos(angle) * horizontalRadius}%`,
    "--chip-y": `${Math.sin(angle) * verticalRadius}%`,
  };
}

function HeroSection() {
  const { hero } = usePortfolioContent();
  const chips = Array.isArray(hero.chips) ? hero.chips : [];
  return (
    <section className="hero section-shell" id="home">
      <div className="hero-copy">
        <p className="eyebrow hero-eyebrow-reveal">
          <span className="status-dot" />
          {hero.availability}
          <span className="eyebrow-line" />
          {hero.location}
        </p>
        <HeroTitleRotator titles={hero.titles} />
        <p className="hero-intro hero-intro-reveal">{hero.intro}</p>
        <div className="hero-actions hero-actions-reveal">
          <a
            className="button button-primary"
            href={hero.primaryHref || "#work"}
            aria-label={hero.primaryAction}
          >
            <DecryptText
              text={hero.primaryAction}
              className="decrypt-button-label"
            />
            <span aria-hidden="true">↘</span>
          </a>
          <a className="text-link" href={hero.secondaryHref || "#about"}>
            {hero.secondaryAction} <span>↓</span>
          </a>
        </div>
      </div>

      <div className="hero-art" aria-label="Interactive 3D voxel coder artwork">
        <div className="art-grid" />
        <div className="aurora aurora-one" />
        <div className="aurora aurora-two" />
        <Suspense
          fallback={
            <span
              className="voxel-loading"
              role="status"
              aria-label="Loading 3D character"
            >
              <i />
              <i />
              <i />
            </span>
          }
        >
          <VoxelCoder />
        </Suspense>
        <div
          className="hero-chips"
          aria-label="Technologies used"
        >
          {chips.map((chip, index) => (
            <span
              className="float-chip"
              style={{
                ...getChipOrbitPosition(index, chips.length),
                "--chip-delay": `${-((index % 4) * 1.2)}s`,
              }}
              role="img"
              aria-label={chip}
              data-cursor-hover
              key={`${chip}-${index}`}
            >
              <span className="chip-icon" aria-hidden="true">
                {["✳", "⌘", "{ }"][index % 3]}
              </span>
              <DecryptText text={chip} className="chip-label" />
            </span>
          ))}
        </div>
        <span className="art-caption">
          {hero.artCaption.split("\n").map((line, index) => (
            <span key={line}>
              {index > 0 && <br />}
              {line}
            </span>
          ))}
        </span>
      </div>

      <a className="scroll-cue" href="#about">
        <span className="scroll-cue-line" /> SCROLL TO EXPLORE
      </a>
      <span className="hero-index">01 / 05</span>
    </section>
  );
}

export default HeroSection;
