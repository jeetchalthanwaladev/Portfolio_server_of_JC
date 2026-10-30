import { useEffect, useState } from 'react';

function MeharPreview() {
  return (
    <div className="project-preview preview-mehar">
      <div className="preview-top">
        <span className="preview-brand">MEHAR<span>®</span></span>
        <span className="preview-menu">MENU　 ☰</span>
      </div>
      <div className="mehar-content">
        <span className="preview-label">CREATIVE PRINT & DESIGN</span>
        <h3>Make your<br />brand <em>stand out.</em></h3>
        <span className="preview-cta">EXPLORE OUR WORK　↗</span>
      </div>
      <div className="preview-shapes"><span /><span /><span /></div>
      <div className="preview-foot"><span>PRINT · DESIGN · IMPACT</span><span>01 / 02</span></div>
    </div>
  );
}

function BoteinPreview() {
  return (
    <div className="project-preview preview-botein">
      <div className="botein-top">
        <div className="botein-logo">
          <span className="botein-cross">✚</span>
          <span>BOTEIN<small>PHARMA LLP</small></span>
        </div>
        <span className="preview-menu">ABOUT　 SERVICES　 CONTACT</span>
      </div>
      <div className="botein-content">
        <span className="preview-label">CARE THAT MOVES US FORWARD</span>
        <h3>Science for<br /><em>better living.</em></h3>
        <span className="preview-cta">DISCOVER BOTEIN　↗</span>
      </div>
      <div className="botein-orb" />
      <div className="preview-foot"><span>INNOVATION · WELLBEING · TRUST</span><span>02 / 02</span></div>
    </div>
  );
}

function UploadedProjectImage({ src, alt, unavailable }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (unavailable || imageFailed) {
    return (
      <div className="project-image-fallback" role="img" aria-label={`${alt} image unavailable. JC fallback shown.`}>
        <span className="project-image-fallback-mark">JC</span>
        <span className="project-image-fallback-name">JEET CHALTHANWALA</span>
      </div>
    );
  }

  return <img src={src} alt={alt} loading="lazy" onError={() => setImageFailed(true)} />;
}

function UploadedProjectPreview({ images, alt, unavailableImageUrls }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const currentIndex = Math.min(activeIndex, images.length - 1);

  useEffect(() => {
    if (activeIndex >= images.length) setActiveIndex(0);
  }, [activeIndex, images.length]);

  function move(direction) {
    setActiveIndex((current) => (current + direction + images.length) % images.length);
  }

  return (
    <div className="project-preview project-preview-image">
      <UploadedProjectImage
        key={images[currentIndex]}
        src={images[currentIndex]}
        alt={`${alt} preview ${currentIndex + 1}`}
        unavailable={unavailableImageUrls?.has(images[currentIndex])}
      />
      {images.length > 1 && (
        <div className="project-gallery-controls" aria-label={`${alt} image gallery`}>
          <button type="button" aria-label="Previous project image" onClick={() => move(-1)}>←</button>
          <span aria-live="polite">{String(currentIndex + 1).padStart(2, '0')} <i>/</i> {String(images.length).padStart(2, '0')}</span>
          <button type="button" aria-label="Next project image" onClick={() => move(1)}>→</button>
        </div>
      )}
    </div>
  );
}

function ProjectPreview({ type, imageUrl, images = [], alt, unavailableImageUrls }) {
  const galleryImages = images.length ? images.filter(Boolean) : imageUrl ? [imageUrl] : [];
  if (galleryImages.length) return <UploadedProjectPreview images={galleryImages} alt={alt} unavailableImageUrls={unavailableImageUrls} />;
  if (type === "mehar") return <MeharPreview />;
  if (type === "botein") return <BoteinPreview />;
  return null;
}

export default ProjectPreview;

