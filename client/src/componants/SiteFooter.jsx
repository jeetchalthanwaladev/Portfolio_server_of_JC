import usePortfolioContent from "./usePortfolioContent.js";

function SiteFooter() {
  const { navigation, footer } = usePortfolioContent();
  return (
    <footer className="site-footer section-shell">
      <a className="wordmark" href="#home">
        <span className="wordmark-mark">JC</span>
        <span>{navigation.brandName}</span>
      </a>
      <span>{footer.builtWith} <span className="footer-heart">✳</span> © {new Date().getFullYear()}</span>
      <a href="#home" className="back-top">{footer.backToTop} ↑</a>
    </footer>
  );
}

export default SiteFooter;
