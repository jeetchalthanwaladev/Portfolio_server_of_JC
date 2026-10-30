import usePortfolioContent from "./usePortfolioContent.js";

function ProcessSection() {
  const { process } = usePortfolioContent();
  return (
    <section className="approach-section section-shell">
      <div className="section-kicker reveal">{process.kicker}</div>

      <div className="approach-head reveal">
        <h2>{process.heading}<br /><span className="muted-heading">{process.headingAccent}</span></h2>
        <p>{process.description}</p>
      </div>

      <div className="steps">
        {process.steps.map((step, index) => (
          <article className="step reveal" key={step.title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div className="step-icon">{step.icon === "</>" ? <>&lt;/&gt;</> : step.icon}</div>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default ProcessSection;
