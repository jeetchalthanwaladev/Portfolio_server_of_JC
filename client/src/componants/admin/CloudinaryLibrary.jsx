import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api.js';

function formatBytes(value) {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes <= 0) return 'Size unavailable';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let size = bytes / 1024;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unit]}`;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Upload date unavailable';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
}

function getAssetKey(asset) {
  return `${asset.deliveryType || 'upload'}:${asset.publicId}`;
}

function CloudinaryAssetCard({ asset, deletingPublicId, onDelete }) {
  const [imageFailed, setImageFailed] = useState(false);
  const fileName = asset.publicId.split('/').pop() || asset.publicId;
  const isDeleting = deletingPublicId === getAssetKey(asset);
  const isBusy = Boolean(deletingPublicId);

  return (
    <article className="cloudinary-asset-card">
      <div className="cloudinary-asset-preview">
        {asset.url && !imageFailed ? (
          <img src={asset.url} alt={fileName} loading="lazy" onError={() => setImageFailed(true)} />
        ) : (
          <span className="cloudinary-preview-fallback">JC</span>
        )}
        <span className="cloudinary-format">{(asset.format || 'image').toUpperCase()}</span>
      </div>
      <div className="cloudinary-asset-details">
        <h3 title={fileName}>{fileName}</h3>
        <small className="cloudinary-asset-folder">{asset.folder || 'Root'}</small>
        <small className="cloudinary-asset-type">{asset.deliveryType || 'upload'} delivery</small>
        <p>{formatBytes(asset.bytes)} <span>·</span> {asset.width || '—'} × {asset.height || '—'}</p>
        <small>{formatDate(asset.createdAt)}</small>
      </div>
      <button
        type="button"
        className="cloudinary-delete-button"
        disabled={isBusy}
        onClick={() => onDelete(asset)}
      >
        {isDeleting ? 'Deleting…' : isBusy ? 'Please wait…' : 'Delete image'}
      </button>
    </article>
  );
}

export default function CloudinaryLibrary({ onLogout }) {
  const [assets, setAssets] = useState([]);
  const [nextCursor, setNextCursor] = useState('');
  const [totalCount, setTotalCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [deletingPublicId, setDeletingPublicId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadAssets = useCallback(async ({ cursor = '', append = false } = {}) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError('');
    setMessage('');

    try {
      const query = new URLSearchParams({ limit: '36' });
      if (cursor) query.set('cursor', cursor);
      const response = await apiFetch(`/api/admin/cloudinary/assets?${query}`, {
        cache: 'no-store',
      });
      const result = await response.json();
      if (response.status === 401) return onLogout();
      if (!response.ok) throw new Error(result.error || 'Could not load Cloudinary images.');

      setAssets((current) => append ? [...current, ...(result.assets || [])] : (result.assets || []));
      setNextCursor(result.nextCursor || '');
      if (Number.isFinite(result.totalCount)) setTotalCount(result.totalCount);
      else if (!append) setTotalCount((result.assets || []).length);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [onLogout]);

  useEffect(() => { loadAssets(); }, [loadAssets]);

  async function deleteAsset(asset) {
    const confirmed = window.confirm(
        `Permanently delete “${asset.publicId}” from Cloudinary?\n\nIf the image is used on your portfolio, that spot will switch to the JC fallback.`
    );
    if (!confirmed) return;

    setDeletingPublicId(getAssetKey(asset));
    setError('');
    setMessage('');
    try {
      const response = await apiFetch('/api/admin/cloudinary/assets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId: asset.publicId, deliveryType: asset.deliveryType || 'upload' }),
      });
      const result = await response.json();
      if (response.status === 401) return onLogout();
      if (!response.ok) throw new Error(result.error || 'Cloudinary could not delete this image.');

      setAssets((current) => current.filter((entry) => getAssetKey(entry) !== getAssetKey(asset)));
      setTotalCount((current) => Number.isFinite(current) ? Math.max(0, current - 1) : current);
      setMessage('Image deleted. Any open portfolio page now shows the JC fallback where it was used.');

      const deletedUrls = [...(result.affectedUrls || []), ...(result.url ? [result.url] : [])];
      if ('BroadcastChannel' in window && deletedUrls.length) {
        const channel = new BroadcastChannel('portfolio-content');
        channel.postMessage({ type: 'asset-deleted', urls: deletedUrls });
        channel.close();
      }
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setDeletingPublicId('');
    }
  }

  return (
    <section className="cloudinary-library" aria-label="Cloudinary media library">
      <header className="cloudinary-library-header">
        <div>
          <p className="admin-eyebrow">PORTFOLIO MEDIA</p>
          <h2>Image library</h2>
          <p>Browse and manage all image assets stored in your Cloudinary account.</p>
        </div>
        <div className="cloudinary-total">
          <strong>{Math.max(totalCount ?? 0, assets.length)}</strong>
          <span>images</span>
        </div>
      </header>

      <div className="cloudinary-library-toolbar">
        <p>Showing images from every folder in your Cloudinary account.</p>
        <button type="button" className="admin-outline-button" onClick={() => loadAssets()} disabled={loading || loadingMore}>
          {loading ? 'Refreshing…' : 'Refresh library'} <span aria-hidden="true">↻</span>
        </button>
      </div>

      {message && <p className="admin-message is-success" role="status">{message}</p>}
      {error && <p className="admin-message is-error" role="alert">{error}</p>}
      {loading && assets.length === 0 ? (
        <div className="cloudinary-library-state">Loading images from Cloudinary…</div>
      ) : assets.length === 0 ? (
        <div className="cloudinary-library-state">
          <span className="cloudinary-empty-mark">JC</span>
          <h3>No Cloudinary images found</h3>
          <p>Image assets from every folder in your Cloudinary account will appear here.</p>
        </div>
      ) : (
        <div className="cloudinary-asset-grid">
          {assets.map((asset) => (
            <CloudinaryAssetCard
              key={getAssetKey(asset)}
              asset={asset}
              deletingPublicId={deletingPublicId}
              onDelete={deleteAsset}
            />
          ))}
        </div>
      )}

      {nextCursor && (
        <button type="button" className="cloudinary-load-more" onClick={() => loadAssets({ cursor: nextCursor, append: true })} disabled={loadingMore}>
          {loadingMore ? 'Loading more…' : 'Load more images'}
        </button>
      )}
    </section>
  );
}
