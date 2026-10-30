import usePortfolioContent from "./usePortfolioContent.js";

function getInitials(name) {
  return (typeof name === "string" ? name : "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "JC";
}

function getProfileLinks(profile) {
  const email = typeof profile.email === "string" ? profile.email : "";
  const phone = typeof profile.phone === "string" ? profile.phone : "";
  const phoneNumber = phone.replace(/[^\d+]/g, "");

  return [
    { label: "Email", mark: "@", value: email, href: `mailto:${email}` },
    { label: "Phone", mark: "+", value: phone, href: `tel:${phoneNumber}` },
    { label: "GitHub", mark: "GH", value: profile.github, href: profile.github },
    { label: "LinkedIn", mark: "in", value: profile.linkedin, href: profile.linkedin },
    { label: "Instagram", mark: "ig", value: profile.instagram, href: profile.instagram },
  ].filter((link) => typeof link.value === "string" && link.value.trim() && link.href?.trim());
}

function formatProfileLink(value) {
  try {
    const url = new URL(value);
    return `${url.hostname.replace(/^www\./, "")}${url.pathname.replace(/\/$/, "")}`;
  } catch {
    return value;
  }
}

function ProfileSection() {
  const { profile } = usePortfolioContent();
  const links = getProfileLinks(profile);

  return (
    <section className="profile-section section-shell" id="profile">
      <div className="section-heading reveal">
        <div>
          <div className="section-kicker">{profile.kicker}</div>
          <h2>{profile.heading}</h2>
        </div>
        <p>{profile.intro}</p>
      </div>

      <div className="profile-panel reveal">
        <div className="profile-introduction">
          <span className="profile-monogram" aria-hidden="true">{getInitials(profile.name)}</span>
          <p className="profile-overline">PERSONAL PROFILE</p>
          <h3>{profile.name}</h3>
          <p className="profile-role">{profile.role}</p>
          <span className="profile-status"><i /> Open to meaningful opportunities</span>
        </div>

        <ul className="profile-link-grid" aria-label="Contact and social profiles">
          {links.map(({ label, mark, value, href }) => {
            const isExternal = /^https?:\/\//i.test(href);
            return (
              <li key={label}>
                <a
                  className="profile-link-card"
                  href={href}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noreferrer" : undefined}
                >
                  <span className="profile-link-mark" aria-hidden="true">{mark}</span>
                  <span className="profile-link-label">{label}</span>
                  <strong title={value}>{isExternal ? formatProfileLink(value) : value}</strong>
                  <span className="profile-link-arrow" aria-hidden="true">↗</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export default ProfileSection;
