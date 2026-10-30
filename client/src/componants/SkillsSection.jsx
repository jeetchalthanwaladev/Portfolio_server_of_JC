import { useState } from "react";
import usePortfolioContent from "./usePortfolioContent.js";

function SkillIcon({ iconUrl, unavailableImageUrls }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showUploadedIcon = iconUrl && !imageFailed && !unavailableImageUrls?.has(iconUrl);

  return (
    <span className="skill-pill-icon" aria-hidden="true">
      {showUploadedIcon ? (
        <img src={iconUrl} alt="" loading="lazy" decoding="async" onError={() => setImageFailed(true)} />
      ) : (
        <span className="skill-icon-fallback">JC</span>
      )}
    </span>
  );
}

function TechnologyBadge({ technology, unavailableImageUrls }) {
  return (
    <span className="skill-pill" role="listitem" title={technology.name}>
      <SkillIcon iconUrl={technology.iconUrl} unavailableImageUrls={unavailableImageUrls} />
      <span className="skill-pill-name">{technology.name}</span>
    </span>
  );
}

function SkillMarquee({ group, unavailableImageUrls }) {
  const technologies = (Array.isArray(group.skills) ? group.skills : [])
    .map((skill) => typeof skill === "string" ? { name: skill, iconUrl: "" } : skill)
    .filter((skill) => typeof skill?.name === "string" && skill.name.trim());
  const duration = Math.max(28, technologies.length * 3.2);

  if (!technologies.length) return null;

  return (
    <div
      className="skill-marquee"
      role="group"
      aria-label={`${group.title} technologies`}
      style={{ "--marquee-duration": `${duration}s` }}
    >
      <div className="skill-marquee-track">
        <div className="skill-marquee-set" role="list">
          {technologies.map((technology, index) => (
            <TechnologyBadge key={`${technology.name}-${index}`} technology={technology} unavailableImageUrls={unavailableImageUrls} />
          ))}
        </div>
        <div className="skill-marquee-set is-duplicate" aria-hidden="true">
          {technologies.map((technology, index) => (
            <TechnologyBadge key={`duplicate-${technology.name}-${index}`} technology={technology} unavailableImageUrls={unavailableImageUrls} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SkillGroupCard({ group, index, unavailableImageUrls }) {
  const skillCount = (Array.isArray(group.skills) ? group.skills : []).filter((skill) =>
    typeof skill === "string" ? skill.trim() : skill?.name?.trim()
  ).length;

  return (
    <div className="skill-group reveal">
      <div className="skill-head">
        <span>{String(index + 1).padStart(2, "0")}</span>
        <h3>{group.title}</h3>
        <div className="skill-mark">
          <span className="skill-count">{String(skillCount).padStart(2, "0")}<small>SKILLS</small></span>
          <span aria-hidden="true">↗</span>
        </div>
      </div>
      <SkillMarquee group={group} unavailableImageUrls={unavailableImageUrls} />
      {group.description && <p className="skill-description">{group.description}</p>}
    </div>
  );
}

function SkillsSection() {
  const { skills, unavailableImageUrls } = usePortfolioContent();
  return (
    <section className="stack-section section-shell" id="stack">
      <div className="section-heading reveal">
        <div>
          <div className="section-kicker">{skills.kicker}</div>
          <h2>{skills.heading} <span className="gradient-text">{skills.headingAccent}</span></h2>
        </div>
        <p>{skills.summary.split("\n").map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</p>
      </div>

      <div className="stack-layout">
        <div className="stack-feature reveal">
          <span className="stack-feature-icon">✳</span>
          <p className="project-number">{skills.featureKicker}</p>
          <h3>{skills.featureHeading.split("\n").map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</h3>
          <p>{skills.featureDescription}</p>
          <div className="stack-orbit"><span>JS</span><i /><i /></div>
        </div>

        <div className="skill-groups">
          {skills.groups.map((group, index) => (
            <SkillGroupCard key={group.title} group={group} index={index} unavailableImageUrls={unavailableImageUrls} />
          ))}
        </div>
      </div>

      <div className="soft-skills reveal">
        <span>{skills.softSkillsLabel}</span>
        {skills.softSkills.map((skill, index) => <span className="soft-skill-item" key={`${skill}-${index}`}>{index > 0 && <i />}{skill}</span>)}
      </div>
    </section>
  );
}

export default SkillsSection;
