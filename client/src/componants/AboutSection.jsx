import usePortfolioContent from "./usePortfolioContent.js";

function AboutSection() {
  const { about } = usePortfolioContent();
  return (
    <section className="intro-section section-shell" id="about">
      <div className="section-kicker reveal">{about.kicker}</div>

      <div className="intro-layout">
        <h2 className="reveal">{about.heading}<br /><span className="muted-heading">{about.headingAccent}</span></h2>
        <div className="intro-body reveal">
          <p className="large-copy">
            {about.lead}
          </p>
          <p>
            {about.body}
          </p>
          <a className="text-link arrow-link" href={about.linkHref || "mailto:jeet.chalthanwala.dev@gmail.com"}>
            {about.linkLabel} <span>↗</span>
          </a>
        </div>
      </div>

      <div className="stats-row reveal">
        {about.stats.map((stat) => <div key={`${stat.value}-${stat.label}`}><strong>{stat.value}</strong><small>{stat.label}</small></div>)}
        <p>{about.closing.split("\n").map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</p>
      </div>
    </section>
  );
}

export default AboutSection;
