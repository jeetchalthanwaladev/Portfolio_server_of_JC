import DecryptText from './DecryptText.jsx';

export default function DecryptNavLink({ href, label, onClick }) {
  return (
    <a href={href} onClick={onClick} aria-label={label}>
      <DecryptText text={label} className="decrypt-nav-label" />
    </a>
  );
}
