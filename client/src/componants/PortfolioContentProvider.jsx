import { useCallback, useEffect, useMemo, useState } from 'react';
import defaultPortfolioContent from '../data/defaultPortfolioContent.js';
import PortfolioContentContext from './PortfolioContentContext.js';
import { apiFetch } from '../lib/api.js';

export function PortfolioContentProvider({ children }) {
  const [content, setContent] = useState(defaultPortfolioContent);
  const [unavailableImageUrls, setUnavailableImageUrls] = useState(() => new Set());

  const refresh = useCallback(async () => {
    try {
      const response = await apiFetch('/api/portfolio', { cache: 'no-store' });
      if (!response.ok) return;
      const latestContent = await response.json();
      if (latestContent && typeof latestContent === 'object') setContent(latestContent);
    } catch {
      // Keep the bundled portfolio visible if the database is not configured or available.
    }
  }, []);

  useEffect(() => {
    refresh();
    const refreshInterval = window.setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, 15000);
    const channel = 'BroadcastChannel' in window ? new BroadcastChannel('portfolio-content') : null;
    if (channel) channel.onmessage = (event) => {
      if (event.data?.type === 'refresh') refresh();
      if (event.data?.type === 'asset-deleted') {
        const deletedUrls = [
          ...(Array.isArray(event.data.urls) ? event.data.urls : []),
          ...(typeof event.data.url === 'string' ? [event.data.url] : []),
        ].filter((url) => typeof url === 'string' && url);
        if (deletedUrls.length) {
          setUnavailableImageUrls((current) => new Set([...current, ...deletedUrls]));
        }
      }
    };
    return () => {
      window.clearInterval(refreshInterval);
      channel?.close();
    };
  }, [refresh]);

  useEffect(() => {
    const seo = content.seo;
    if (!seo) return;
    document.title = seo.title;
    const updateMeta = (selector, attribute, value) => {
      let meta = document.head.querySelector(selector);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute.split('=')[0], attribute.split('=')[1].replaceAll(/[\[\]'"]/g, ''));
        document.head.append(meta);
      }
      meta.content = value || '';
    };
    updateMeta('meta[name="description"]', 'name="description"', seo.description);
    updateMeta('meta[name="keywords"]', 'name="keywords"', seo.keywords);
    updateMeta('meta[property="og:title"]', 'property="og:title"', seo.title);
    updateMeta('meta[property="og:description"]', 'property="og:description"', seo.description);
    updateMeta('meta[name="twitter:title"]', 'name="twitter:title"', seo.title);
    updateMeta('meta[name="twitter:description"]', 'name="twitter:description"', seo.description);
    updateMeta('meta[property="og:image"]', 'property="og:image"', seo.socialImage);
    updateMeta('meta[name="twitter:image"]', 'name="twitter:image"', seo.socialImage);
  }, [content.seo]);

  const contextValue = useMemo(
    () => ({ ...content, unavailableImageUrls }),
    [content, unavailableImageUrls]
  );

  return (
    <PortfolioContentContext.Provider value={contextValue}>
      {children}
    </PortfolioContentContext.Provider>
  );
}

export default PortfolioContentProvider;
