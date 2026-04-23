// Agenda — Album management: upload/list/delete/reorder per-account media.
// The grid shows images and videos scoped to the logged-in account;
// previews use the public slug-scoped GET route since <img>/<video> can't
// attach auth headers.

function AlbumScreen({ c, state, onBack, onSessionExpired }) {
  const T = window.AG_T;
  const SYNC = window.AG_SYNC;
  const settings = state.settings;

  const [items, setItems] = React.useState([]);
  const [usedBytes, setUsedBytes] = React.useState(0);
  const [limitBytes, setLimitBytes] = React.useState(500 * 1024 * 1024);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [progress, setProgress] = React.useState(null);   // 0..1 while uploading
  const [error, setError] = React.useState('');
  const fileRef = React.useRef(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await SYNC.fetchMedia(settings);
      setItems(data.items || []);
      setUsedBytes(data.used_bytes || 0);
      setLimitBytes(data.limit_bytes || 500 * 1024 * 1024);
    } catch (e) {
      if (e instanceof SYNC.SessionExpiredError) onSessionExpired();
      else setError(e.message || T.albumError);
    } finally {
      setLoading(false);
    }
  }, [SYNC, settings, onSessionExpired, T.albumError]);

  React.useEffect(() => { refresh(); }, [refresh]);

  const pickFile = () => { if (fileRef.current) fileRef.current.click(); };

  const onFileChosen = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';   // let the same file be chosen again if needed
    if (!file) return;
    setError('');
    setBusy(true);
    setProgress(0);
    try {
      await SYNC.uploadMedia(settings, file, (p) => setProgress(p));
      await refresh();
    } catch (err) {
      if (err instanceof SYNC.SessionExpiredError) { onSessionExpired(); return; }
      const code = err.body && err.body.error;
      if (err.status === 415) setError(T.albumUnsupported);
      else if (err.status === 413 && code === 'quota_exceeded') setError(T.albumQuotaExceeded);
      else if (err.status === 413) setError(T.albumTooLarge);
      else setError(err.message || T.albumError);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const moveItem = async (idx, direction) => {
    const target = idx + direction;
    if (target < 0 || target >= items.length || busy) return;
    const next = items.slice();
    const [row] = next.splice(idx, 1);
    next.splice(target, 0, row);
    setItems(next);   // optimistic
    setBusy(true);
    try {
      await SYNC.reorderMedia(settings, next.map(x => x.id));
    } catch (e) {
      if (e instanceof SYNC.SessionExpiredError) { onSessionExpired(); return; }
      setError(e.message || T.albumError);
      await refresh();   // roll back to server truth
    } finally {
      setBusy(false);
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm(T.albumDeleteConfirm) || busy) return;
    setBusy(true);
    try {
      await SYNC.deleteMedia(settings, id);
      await refresh();
    } catch (e) {
      if (e instanceof SYNC.SessionExpiredError) { onSessionExpired(); return; }
      setError(e.message || T.albumError);
    } finally {
      setBusy(false);
    }
  };

  const fmtMb = (b) => `${(b / (1024 * 1024)).toFixed(1)} MB`;
  const fmtTotal = (b) => `${Math.round(b / (1024 * 1024))} MB`;
  const usagePct = Math.min(100, Math.round((usedBytes / Math.max(1, limitBytes)) * 100));
  const isFull = usedBytes >= limitBytes;

  return (
    <div style={{ padding: '16px 0 140px', fontFamily: FONTS.ui, color: c.ink, background: c.bg, minHeight: '100%' }}>
      <div style={{ padding: '0 16px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onBack} style={{ ...iconBtn(c), width: 34, height: 34 }} aria-label="Înapoi">{I.chevL(14, c.ink2)}</button>
        <div style={{ fontSize: 12, color: c.muted, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>{T.album}</div>
        <div style={{ width: 34 }} />
      </div>

      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ fontSize: 11, color: c.muted, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 500 }}>{T.album}</div>
        <div style={{ fontFamily: FONTS.serif, fontSize: 28, marginTop: 2, letterSpacing: -0.4 }}>
          {items.length} {items.length === 1 ? 'articol' : 'articole'}
        </div>
        <div style={{ fontSize: 12, color: c.muted, marginTop: 6, lineHeight: 1.5 }}>{T.albumSub}</div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {/* Usage + upload */}
        <div style={{ background: c.surface, border: `1px solid ${c.hairline}`, borderRadius: 3, padding: '14px 16px', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: c.muted, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>
              {T.albumUsage.replace('{used}', fmtMb(usedBytes)).replace('{total}', fmtTotal(limitBytes))}
            </div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: isFull ? c.danger : c.ink2 }}>{usagePct}%</div>
          </div>
          <div style={{ height: 6, background: c.hairline, borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${usagePct}%`, height: '100%', background: isFull ? c.danger : c.accent, transition: 'width 200ms ease' }} />
          </div>
          {isFull && (
            <div style={{ fontSize: 11, color: c.danger, marginTop: 10 }}>{T.albumFull}</div>
          )}
          {progress != null && (
            <div style={{ fontSize: 11, color: c.muted, marginTop: 10, fontFamily: FONTS.mono }}>
              {T.albumUploading} {Math.round(progress * 100)}%
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                 style={{ display: 'none' }} onChange={onFileChosen} />
          <button onClick={pickFile} disabled={busy || isFull} style={{
            marginTop: 14, width: '100%', padding: '12px', border: 'none',
            background: (busy || isFull) ? c.hairline : c.accent,
            color: (busy || isFull) ? c.muted : '#fff',
            borderRadius: 3, fontFamily: FONTS.ui, fontSize: 13, fontWeight: 600,
            letterSpacing: 0.3, cursor: (busy || isFull) ? 'not-allowed' : 'pointer',
          }}>{T.albumAdd}</button>
          {error && (
            <div style={{
              fontSize: 12, color: c.danger, background: '#f8eae6',
              padding: '8px 10px', borderRadius: 2, marginTop: 10,
            }}>{error}</div>
          )}
        </div>

        {/* Items */}
        {loading ? null : items.length === 0 ? (
          <div style={{ background: c.surface, border: `1px solid ${c.hairline}`, borderRadius: 3 }}>
            <Empty c={c} title={T.albumEmpty} hint={T.albumEmptyHint} />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {items.map((it, idx) => (
              <AlbumTile
                key={it.id}
                item={it}
                c={c}
                settings={settings}
                disabled={busy}
                canUp={idx > 0}
                canDown={idx < items.length - 1}
                onUp={() => moveItem(idx, -1)}
                onDown={() => moveItem(idx, +1)}
                onDelete={() => deleteItem(it.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AlbumTile({ item, c, settings, disabled, canUp, canDown, onUp, onDown, onDelete }) {
  const T = window.AG_T;
  const url = window.AG_SYNC.mediaUrl(settings, item.id);
  return (
    <div style={{ background: c.surface, border: `1px solid ${c.hairline}`, borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ width: '100%', aspectRatio: '1 / 1', background: c.surface2, position: 'relative' }}>
        {item.kind === 'image' ? (
          <img src={url} alt=""
               style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <video src={url} muted playsInline preload="metadata"
                 style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        )}
        {item.kind === 'video' && (
          <div style={{
            position: 'absolute', bottom: 6, left: 6,
            background: 'rgba(0,0,0,0.55)', color: '#fff',
            fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase',
            padding: '2px 6px', borderRadius: 2, fontWeight: 600,
          }}>video</div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 4, padding: 6 }}>
        <button onClick={onUp} disabled={disabled || !canUp} style={tileBtn(c, disabled || !canUp)} title={T.albumMoveUp}>▲</button>
        <button onClick={onDown} disabled={disabled || !canDown} style={tileBtn(c, disabled || !canDown)} title={T.albumMoveDown}>▼</button>
        <button onClick={onDelete} disabled={disabled} style={{
          ...tileBtn(c, disabled), color: c.danger, flex: 2,
        }} title={T.albumDelete}>✕</button>
      </div>
    </div>
  );
}

function tileBtn(c, disabled) {
  return {
    flex: 1, padding: '8px 0', border: `1px solid ${c.hairline}`,
    background: disabled ? 'transparent' : c.surface,
    borderRadius: 2, fontFamily: FONTS.ui, fontSize: 11, color: c.ink2,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.35 : 1,
  };
}

Object.assign(window, { AlbumScreen });
