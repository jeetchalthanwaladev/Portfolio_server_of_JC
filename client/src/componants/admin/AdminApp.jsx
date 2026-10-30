import { useCallback, useEffect, useState } from 'react';
import defaultPortfolioContent from '../../data/defaultPortfolioContent.js';
import CloudinaryLibrary from './CloudinaryLibrary.jsx';
import { apiFetch } from '../../lib/api.js';
import '../../styles/admin.css';

const SECTION_LABELS = {
  navigation: 'Navigation', hero: 'Hero', about: 'About', projects: 'Projects',
  skills: 'Tech stack', process: 'Process', contact: 'Contact', footer: 'Footer', seo: 'SEO',
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createEmptyLike(value) {
  if (Array.isArray(value)) return [];
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, createEmptyLike(child)]));
  }
  return typeof value === 'number' ? 0 : typeof value === 'boolean' ? false : '';
}

function getDefaultValue(path) {
  let value = defaultPortfolioContent;
  for (const segment of path.split('.')) {
    value = Array.isArray(value) ? (value[Number(segment)] ?? value[0]) : value?.[segment];
  }
  return value;
}

function humanize(value) {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/^./, (character) => character.toUpperCase());
}

function ProjectImageEditor({ images, onChange, onUpload }) {
  const [uploading, setUploading] = useState(false);

  async function addImage(file) {
    setUploading(true);
    await onUpload(file, (url) => onChange([...images, url]));
    setUploading(false);
  }

  return (
    <fieldset className="editor-array project-image-editor">
      <legend>Project images</legend>
      <p className="image-editor-help">Add one or more images. Multiple images rotate in this project’s live preview after saving.</p>
      {images.length > 0 && (
        <div className="project-image-list">
          {images.map((imageUrl, index) => (
            <figure className="project-image-item" key={`${imageUrl}-${index}`}>
              <img src={imageUrl} alt={`Project preview ${index + 1}`} />
              <figcaption><span>Image {String(index + 1).padStart(2, '0')}</span><button type="button" className="admin-remove" onClick={() => onChange(images.filter((_, imageIndex) => imageIndex !== index))}>Remove</button></figcaption>
            </figure>
          ))}
        </div>
      )}
      <label className="project-image-upload">
        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploading} onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) addImage(file);
          event.target.value = '';
        }} />
        <span>{uploading ? 'Uploading image…' : '+ Add project image'}</span>
      </label>
      <small className="image-editor-help">JPG, PNG, WebP, or GIF · up to 6 MB. Removed images are deleted from Cloudinary when you save.</small>
    </fieldset>
  );
}

function ImageFieldUpload({ value, onChange, onUpload, isIcon }) {
  function selectImage(event) {
    const file = event.target.files?.[0];
    if (file) onUpload(file, onChange);
    event.target.value = '';
  }

  return (
    <span className={`editor-upload${isIcon ? ' is-icon' : ''}`}>
      <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={selectImage} />
      <small>
        {isIcon
          ? 'Upload a technology icon (PNG, JPG, WebP or GIF, up to 6 MB). Clear the URL to use the JC fallback.'
          : 'Upload an image (JPG, PNG, WebP or GIF, up to 6 MB)'}
      </small>
      {value && (
        <>
          <img src={value} alt={isIcon ? 'Current technology icon preview' : 'Current uploaded image preview'} />
          <button type="button" className="editor-image-clear" onClick={() => onChange('')}>
            {isIcon ? 'Use JC fallback' : 'Remove image'}
          </button>
        </>
      )}
    </span>
  );
}

function FieldEditor({ label, value, onChange, onUpload, depth = 0, path = label }) {
  if (Array.isArray(value) && path.endsWith('.images')) {
    return <ProjectImageEditor images={value} onChange={onChange} onUpload={onUpload} />;
  }

  if (Array.isArray(value)) {
    return (
      <fieldset className={`editor-array depth-${Math.min(depth, 3)}`}>
        <legend>{label}</legend>
        <div className="editor-array-items">
          {value.map((item, index) => (
            <div className="editor-array-item" key={`${label}-${index}`}>
              <div className="editor-array-item-head">
                <span>{typeof item === 'object' ? `${humanize(label)} ${index + 1}` : `Item ${index + 1}`}</span>
                <button type="button" className="admin-remove" onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${label} item ${index + 1}`}>Remove</button>
              </div>
              {item && typeof item === 'object' ? (
                <div className="editor-object">
                  {Object.entries(item).map(([key, child]) => (
                    <FieldEditor key={key} label={key} path={`${path}.${index}.${key}`} value={child} depth={depth + 1} onUpload={onUpload} onChange={(nextValue) => {
                      const next = [...value];
                      next[index] = { ...item, [key]: nextValue };
                      onChange(next);
                    }} />
                  ))}
                </div>
              ) : (
                <FieldEditor label={`${label} item ${index + 1}`} path={`${path}.${index}`} value={item} onUpload={onUpload} onChange={(nextValue) => onChange(value.map((entry, itemIndex) => itemIndex === index ? nextValue : entry))} depth={depth + 1} />
              )}
            </div>
          ))}
        </div>
        <button type="button" className="admin-add" onClick={() => onChange([...value, createEmptyLike(value[0] ?? getDefaultValue(path)?.[0] ?? '')])}>+ Add {humanize(label).replace(/s$/, '')}</button>
      </fieldset>
    );
  }

  if (value && typeof value === 'object') {
    return (
      <fieldset className={`editor-object-group depth-${Math.min(depth, 3)}`}>
        <legend>{humanize(label)}</legend>
        <div className="editor-object">
          {Object.entries(value).map(([key, child]) => (
            <FieldEditor key={key} label={key} path={`${path}.${key}`} value={child} depth={depth + 1} onUpload={onUpload} onChange={(nextValue) => onChange({ ...value, [key]: nextValue })} />
          ))}
        </div>
      </fieldset>
    );
  }

  const isImage = ['imageurl', 'socialimage', 'iconurl'].includes(label.toLowerCase());
  const isIcon = label.toLowerCase() === 'iconurl';
  const isLongText = !isImage && typeof value === 'string' && (value.length > 105 || value.includes('\n'));
  const inputId = `admin-field-${path.replace(/[^a-z0-9_-]/gi, '-')}`;
  return (
    <div className={`editor-field${isLongText ? ' is-wide' : ''}`}>
      <label htmlFor={inputId}>{humanize(label)}</label>
      {isLongText ? (
        <textarea id={inputId} rows={Math.min(7, Math.max(3, value.split('\n').length + 1))} value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input id={inputId} type="text" value={value ?? ''} onChange={(event) => onChange(event.target.value)} />
      )}
      {isImage && <ImageFieldUpload value={value} onChange={onChange} onUpload={onUpload} isIcon={isIcon} />}
    </div>
  );
}

function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [configured, setConfigured] = useState(null);
  const [databaseReady, setDatabaseReady] = useState(null);
  const [mongoUriHasPlaceholders, setMongoUriHasPlaceholders] = useState(false);
  const [adminAccountReady, setAdminAccountReady] = useState(null);
  const [bootstrapAdminConfigured, setBootstrapAdminConfigured] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch('/api/admin/session').then((response) => response.json()).then((result) => {
      setConfigured(result.configured);
      setDatabaseReady(result.databaseReady);
      setMongoUriHasPlaceholders(Boolean(result.mongoUriHasPlaceholders));
      setAdminAccountReady(result.adminAccountReady);
      setBootstrapAdminConfigured(result.bootstrapAdminConfigured);
    }).catch(() => {
      setConfigured(false);
      setDatabaseReady(false);
      setMongoUriHasPlaceholders(false);
      setAdminAccountReady(false);
      setBootstrapAdminConfigured(false);
    });
  }, []);

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = await apiFetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Sign in failed.');
      onLogin();
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="admin-page admin-login-page">
      <div className="admin-login-card">
        <a className="admin-brand" href="/">JC <span>PORTFOLIO CMS</span></a>
        <p className="admin-eyebrow">PRIVATE WORKSPACE</p>
        <h1>Admin sign in</h1>
        <p className="admin-muted">Sign in to update the content on your portfolio.</p>
        <form onSubmit={submit}>
          <label className="editor-field"><span>Admin ID</span><input autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} /></label>
          <label className="editor-field"><span>Password</span><input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          {error && <p className="admin-message is-error" role="alert">{error}</p>}
          {configured === false && <div className="admin-setup-hint">{databaseReady === false
            ? mongoUriHasPlaceholders
              ? <>The Atlas URI in <code>.env</code> still has placeholder database credentials. Replace the username and password with your Atlas Database Access user, URL-encode special characters, and restart the server.</>
              : <>MongoDB Atlas is not accepting this server connection. Add the server’s public IP to your Atlas project under <strong>Network Access → IP Access List</strong>, then restart the server. If it still fails, check the Atlas database user and URL-encoded password in <code>.env</code>.</>
            : adminAccountReady === false
              ? bootstrapAdminConfigured
                ? <>The server could not create the first admin in MongoDB. Check that the Atlas database user has read/write access to <code>jeet_portfolio</code>, then restart the server.</>
                : <>No admin account is in MongoDB yet. Set <code>ADMIN_USERNAME</code> and either <code>ADMIN_PASSWORD_HASH</code> or <code>ADMIN_PASSWORD</code> in <code>.env</code>, then restart the server to create the first account.</>
              : <>Admin sign in needs a session secret of at least 32 characters in <code>.env</code>. Restart the server after setting it.</>}</div>}
          <button className="admin-primary-button" type="submit" disabled={submitting || configured === false}>{submitting ? 'Signing in…' : 'Sign in securely'} <span>↗</span></button>
        </form>
        <a className="admin-back-link" href="/">← Back to portfolio</a>
      </div>
    </main>
  );
}

function AdminDashboard({ onLogout }) {
  const [content, setContent] = useState(clone(defaultPortfolioContent));
  const [selectedSection, setSelectedSection] = useState('hero');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadContent = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/admin/content', { cache: 'no-store' });
      if (response.status === 401) return onLogout();
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not load portfolio content.');
      setContent({ ...clone(defaultPortfolioContent), ...result.content });
      setError('');
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [onLogout]);

  useEffect(() => { loadContent(); }, [loadContent]);

  async function saveContent() {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const response = await apiFetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const result = await response.json();
      if (response.status === 401) return onLogout();
      if (!response.ok) throw new Error(result.error || 'Could not save changes.');
      setContent({ ...clone(defaultPortfolioContent), ...result.content });
      setMessage(result.cleanupWarningCount
        ? `Saved, but ${result.cleanupWarningCount} removed Cloudinary image(s) could not be deleted from storage.`
        : 'Saved. The live portfolio has the latest content.');
      if ('BroadcastChannel' in window) {
        const channel = new BroadcastChannel('portfolio-content');
        channel.postMessage({ type: 'refresh' });
        channel.close();
      }
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  async function uploadImage(file, updateValue) {
    setError('');
    setMessage(`Uploading ${file.name}…`);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const response = await apiFetch('/api/admin/upload', { method: 'POST', body: formData });
      const result = await response.json();
      if (response.status === 401) return onLogout();
      if (!response.ok) throw new Error(result.error || 'Image upload failed.');
      updateValue(result.url);
      setMessage('Image uploaded. Save changes to publish it.');
    } catch (uploadError) {
      setMessage('');
      setError(uploadError.message);
    }
  }

  const isCloudinaryView = selectedSection === 'cloudinary';
  const sectionLabel = isCloudinaryView ? 'Cloudinary' : SECTION_LABELS[selectedSection];
  const section = content[selectedSection] ?? {};
  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <a className="admin-brand" href="/">JC <span>PORTFOLIO CMS</span></a>
        <p className="admin-eyebrow">CONTENT</p>
        <nav aria-label="Portfolio sections">
          {Object.entries(SECTION_LABELS).map(([key, label]) => <button className={selectedSection === key ? 'is-active' : ''} type="button" key={key} onClick={() => { setSelectedSection(key); setMessage(''); setError(''); }}><span>{label}</span><span>↗</span></button>)}
          <span className="admin-sidebar-section-label">MEDIA STORAGE</span>
          <button className={isCloudinaryView ? 'is-active' : ''} type="button" onClick={() => { setSelectedSection('cloudinary'); setMessage(''); setError(''); }}><span>Cloudinary</span><span>↗</span></button>
        </nav>
        <a className="admin-preview-link" href="/" target="_blank" rel="noreferrer">View live site ↗</a>
        <button type="button" className="admin-logout" onClick={onLogout}>Sign out</button>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar"><div><p className="admin-eyebrow">PORTFOLIO MANAGER</p><h1>{sectionLabel}</h1></div>{!isCloudinaryView && <button type="button" className="admin-save-button" onClick={saveContent} disabled={saving || loading}>{saving ? 'Saving…' : 'Save changes'} <span>↗</span></button>}</header>
        <div className="admin-helper">{isCloudinaryView ? 'Review portfolio images and remove files you no longer need.' : 'Edit the fields below. Lists support adding and removing items. Changes publish when you save.'}</div>
        {message && <p className="admin-message is-success" role="status">{message}</p>}
        {error && <p className="admin-message is-error" role="alert">{error}</p>}
        {isCloudinaryView ? (
          <CloudinaryLibrary onLogout={onLogout} />
        ) : loading ? <div className="admin-loading">Loading portfolio content…</div> : (
          <section className="admin-editor-panel" aria-label={`${SECTION_LABELS[selectedSection]} content editor`}>
            {Object.entries(section).map(([key, value]) => (
              <FieldEditor key={key} label={key} path={`${selectedSection}.${key}`} value={value} onUpload={uploadImage} onChange={(nextValue) => setContent((current) => ({ ...current, [selectedSection]: { ...current[selectedSection], [key]: nextValue } }))} />
            ))}
          </section>
        )}
        {!isCloudinaryView && <footer className="admin-editor-footer"><span>Content is stored securely in MongoDB Atlas.</span><button type="button" className="admin-save-button" onClick={saveContent} disabled={saving || loading}>{saving ? 'Saving…' : 'Save changes'} <span>↗</span></button></footer>}
      </main>
    </div>
  );
}

export default function AdminApp() {
  const [authenticated, setAuthenticated] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    document.title = 'Admin Sign In | Jeet Chalthanwala';
    let robots = document.head.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement('meta');
      robots.name = 'robots';
      document.head.append(robots);
    }
    robots.content = 'noindex,nofollow';
  }, []);

  const checkSession = useCallback(async () => {
    setChecking(true);
    try {
      const response = await apiFetch('/api/admin/session', { cache: 'no-store' });
      const result = await response.json();
      setAuthenticated(Boolean(result.authenticated));
    } catch {
      setAuthenticated(false);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => { checkSession(); }, [checkSession]);

  async function logout() {
    try { await apiFetch('/api/admin/logout', { method: 'POST' }); } catch { /* The cookie expires on its own. */ }
    setAuthenticated(false);
  }

  if (checking) return <div className="admin-loading">Checking admin session…</div>;
  if (!authenticated) return <AdminLogin onLogin={() => setAuthenticated(true)} />;
  return <AdminDashboard onLogout={logout} />;
}
