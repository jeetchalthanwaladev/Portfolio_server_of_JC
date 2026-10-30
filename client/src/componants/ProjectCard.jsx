import ProjectPreview from "./ProjectPreview.jsx";

function ProjectCard({ project, unavailableImageUrls }) {
  return (
    <article className={`project-card project-${project.id} reveal`}>
      <ProjectPreview type={project.preview} imageUrl={project.imageUrl} images={project.images} alt={project.name} unavailableImageUrls={unavailableImageUrls} />

      <div className="project-info">
        <div>
          <p className="project-number">{project.number} — {project.type}</p>
          <h3>{project.name}</h3>
          <p>{project.description}</p>
          <div className="tag-list">
          {(project.tags || []).map((tag, index) => <span key={`${tag}-${index}`}>{tag}</span>)}
          </div>
        </div>
        <a
          className="project-link"
          href={project.url || "#work"}
          target="_blank"
          rel="noreferrer"
          aria-label={`Visit ${project.name} website`}
        >
          ↗
        </a>
      </div>
    </article>
  );
}

export default ProjectCard;
