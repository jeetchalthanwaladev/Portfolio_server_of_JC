import ProjectCard from "./ProjectCard.jsx";
import usePortfolioContent from "./usePortfolioContent.js";

function ProjectsSection() {
  const { projects, unavailableImageUrls } = usePortfolioContent();
  return (
    <section className="work-section section-shell" id="work">
      <div className="section-heading reveal">
        <div>
          <div className="section-kicker">{projects.kicker}</div>
          <h2>{projects.heading} <span className="gradient-text">{projects.headingAccent}</span></h2>
        </div>
        <p>{projects.summary.split("\n").map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</p>
      </div>

      {projects.items.map((project) => <ProjectCard key={project.id} project={project} unavailableImageUrls={unavailableImageUrls} />)}
    </section>
  );
}

export default ProjectsSection;
