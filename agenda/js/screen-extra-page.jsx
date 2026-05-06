// Agenda — Extra page editor: per-account catalogue rendered on
// /book/<slug>/page. Each item carries an image (R2-backed) and a free-text
// note. Mirrors AlbumScreen for upload/reorder/delete; note edits are
// debounced and pushed per-item.

function ExtraPageScreen({ c, state, onBack, onSessionExpired }) {
  const T = window.AG_T;
  const SYNC = window.AG_SYNC;
  const settings = state.settings;

  const [items, setItems] = React.useState([]);
  const [usedBytes, setUsedBytes] = React.useState(0);
  const [limitBytes, setLimitBytes] = React.useState(500 * 1024 * 1024);
  const [itemLimit, setItemLimit] = React.useState(50);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [progress, setProgress] = React.useState(null);
  const [error, setError] = React.useState('');
  // Per-id 'saving' | 'saved' badge that fades shortly after save success.
  const [saveState, setSaveState] = React.useState({});
  const fileRef = React.useRef(null);
  const saveTimers = React.useRef({});
  const savedTimers = React.useRef({});

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await SYNC.fetchExtraPage(settings);
      setItems(data.items || []);
      setUsedBytes(data.used_bytes || 0);
      setLimitBytes(data.limit_bytes || 500 * 1024 * 1024);
      setItemLimit(data.item_limit || 50);
    } catch (e) {
      if (e instanceof SYNC.SessionExpiredError) onSessionExpired();
      else setError(e.message || T.extraPageError);
    } finally {
      setLoading(false);
    }
  }, [SYNC, settings, onSessionExpired, T.extraPageError]);

  React.useEffect(() => { refresh(); }, [refresh]);
  React.useEffect(() => () => {
    // Clean up any in-flight debounce/timer references on unmount so we
    // don't leak setTimeout handles between mounts.
    Object.values(saveTimers.current).forEach(clearTimeout);
    Object.values(savedTimers.current).forEach(clearTimeout);
  }, []);

  const flagSaving = (id) => setSaveState(s => ({ ...s, [id]: 'saving' }));
  const flagSaved = (id) => {
    setSaveState(s => ({ ...s, [id]: 'saved' }));
    if (savedTimers.current[id]) clearTimeout(savedTimers.current[id]);
    savedTimers.current[id] = setTimeout(() => {
      setSaveState(s => {
        if (s[id] !== 'saved') return s;
        const { [id]: _, ...rest } = s;
        return rest;
      });
    }, 1400);
  };

  // Ref keeps the latest items reachable from the debounced flush so the PUT
  // body always reflects every typed change, not just the last field touched.
  const itemsRef = React.useRef(items);
  React.useEffect(() => { itemsRef.current = items; }, [items]);

  const scheduleSave = React.useCallback((id) => {
    if (saveTimers.current[id]) clearTimeout(saveTimers.current[id]);
    saveTimers.current[id] = setTimeout(async () => {
      const cur = itemsRef.current.find(it => it.id === id);
      if (!cur) return;
      flagSaving(id);
      try {
        await SYNC.updateExtraPageItem(settings, id, {
          note: (cur.note || '').toString(),
        });
        flagSaved(id);
      } catch (e) {
        if (e instanceof SYNC.SessionExpiredError) { onSessionExpired(); return; }
        setError(e.message || T.extraPageError);
        setSaveState(s => { const { [id]: _, ...rest } = s; return rest; });
      }
    }, 700);
  }, [SYNC, settings, onSessionExpired, T.extraPageError]);

  const updateField = (id, field, value) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, [field]: value } : it));
    scheduleSave(id);
  };

  const pickFile = () => { if (fileRef.current) fileRef.current.click(); };

  const onFileChosen = async (e) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = '';
    if (!files.length) return;
    setError('');
    setBusy(true);
    setProgress(0);
    try {
      for (const file of files) {
        if (items.length >= itemLimit) {
          setError(T.extraPageItemLimit);
          break;
        }
        if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
          setError(T.extraPageUnsupported);
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          setError(T.extraPageTooLarge);
          continue;
        }
        setProgress(0);
        await SYNC.uploadExtraPageImage(settings, file, (p) => setProgress(p));
      }
    } catch (err) {
      if (err instanceof SYNC.SessionExpiredError) { onSessionExpired(); return; }
      const code = err.body && err.body.error;
      if (err.status === 415) setError(T.extraPageUnsupported);
      else if (err.status === 413 && code === 'quota_exceeded') setError(T.extraPageQuotaExceeded);
      else if (err.status === 413 && code === 'item_limit_exceeded') setError(T.extraPageItemLimit);
      else if (err.status === 413) setError(T.extraPageTooLarge);
      else setError(err.message || T.extraPageError);
    } finally {
      setBusy(false);
      setProgress(null);
      await refresh();
    }
  };

  const move = async (idx, direction) => {
    const target = idx + direction;
    if (target < 0 || target >= items.length || busy) return;
    const next = items.slice();
    [next[idx], next[target]] = [next[target], next[idx]];
    setItems(next);
    setBusy(true);
    try {
      await SYNC.reorderExtraPage(settings, next.map(x => x.id));
    } catch (e) {
      if (e instanceof SYNC.SessionExpiredError) { onSessionExpired(); return; }
      setError(e.message || T.extraPageError);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm(T.extraPageDeleteConfirm) || busy) return;
    setBusy(true);
    try {
      await SYNC.deleteExtraPageItem(settings, id);
      await refresh();
    } catch (e) {
      if (e instanceof SYNC.SessionExpiredError) { onSessionExpired(); return; }
      setError(e.message || T.extraPageError);
    } finally {
      setBusy(false);
    }
  };

  const fmtMb = (b) => `${(b / (1024 * 1024)).toFixed(1)} MB`;
  const fmtTotal = (b) => `${Math.round(b / (1024 * 1024))} MB`;
  const usagePct = Math.min(100, Math.round((usedBytes / Math.max(1, limitBytes)) * 100));
  const isFull = usedBytes >= limitBytes || items.length >= itemLimit;

  return (
    <div style={{ padding: '16px 0 140px', fontFamily: FONTS.ui, color: c.ink, background: c.bg, minHeight: '100%' }}>
      <div style={{ padding: '0 16px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onBack} style={{ ...iconBtn(c), width: 34, height: 34 }} aria-label="Înapoi">{I.chevL(14, c.ink2)}</button>
        <div style={{ fontSize: 12, color: c.muted, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>{T.extraPageSection}</div>
        <div style={{ width: 34 }} />
      </div>

      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ fontSize: 11, color: c.muted, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 500 }}>{T.extraPageSection}</div>
        <div style={{ fontFamily: FONTS.serif, fontSize: 28, marginTop: 2, letterSpacing: -0.4 }}>
          {items.length} {items.length === 1 ? T.extraPageItemSingular : T.extraPageItems}
        </div>
        <div style={{ fontSize: 12, color: c.muted, marginTop: 6, lineHeight: 1.5 }}>{T.extraPageEditorSub}</div>
      </div>

      <div style={{ padding: '0 16px' }}>
        <div style={{ background: c.surface, border: `1px solid ${c.hairline}`, borderRadius: 3, padding: '14px 16px', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: c.muted, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>
              {T.albumUsage.replace('{used}', fmtMb(usedBytes)).replace('{total}', fmtTotal(limitBytes))}
            </div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: usedBytes >= limitBytes ? c.danger : c.ink2 }}>{usagePct}%</div>
          </div>
          <div style={{ height: 6, background: c.hairline, borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${usagePct}%`, height: '100%', background: usedBytes >= limitBytes ? c.danger : c.accent, transition: 'width 200ms ease' }} />
          </div>
          {progress != null && (
            <div style={{ fontSize: 11, color: c.muted, marginTop: 10, fontFamily: FONTS.mono }}>
              {T.extraPageUploading} {Math.round(progress * 100)}%
            </div>
          )}
          <input ref={fileRef} type="file" multiple accept="image/jpeg,image/png,image/webp"
                 style={{ display: 'none' }} onChange={onFileChosen} />
          <button onClick={pickFile} disabled={busy || isFull} style={{
            marginTop: 14, width: '100%', padding: '12px', border: 'none',
            background: (busy || isFull) ? c.hairline : c.accent,
            color: (busy || isFull) ? c.muted : '#fff',
            borderRadius: 3, fontFamily: FONTS.ui, fontSize: 13, fontWeight: 600,
            letterSpacing: 0.3, cursor: (busy || isFull) ? 'not-allowed' : 'pointer',
          }}>{T.extraPageAdd}</button>
          {error && (
            <div style={{
              fontSize: 12, color: c.danger, background: '#f8eae6',
              padding: '8px 10px', borderRadius: 2, marginTop: 10,
            }}>{error}</div>
          )}
        </div>

        {loading ? null : items.length === 0 ? (
          <div style={{ background: c.surface, border: `1px solid ${c.hairline}`, borderRadius: 3 }}>
            <Empty c={c} title={T.extraPageEmpty} hint={T.extraPageEmptyHint} />
          </div>
        ) : (
          items.map((it, idx) => (
            <ExtraPageRow
              key={it.id}
              c={c} item={it}
              settings={settings}
              busy={busy}
              saveStatus={saveState[it.id]}
              canUp={idx > 0}
              canDown={idx < items.length - 1}
              onChange={(field, value) => updateField(it.id, field, value)}
              onUp={() => move(idx, -1)}
              onDown={() => move(idx, +1)}
              onDelete={() => remove(it.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ExtraPageRow({ c, item, settings, busy, saveStatus, canUp, canDown, onChange, onUp, onDown, onDelete }) {
  const T = window.AG_T;
  const url = window.AG_SYNC.extraPageImageUrl(settings, item.id);
  return (
    <div style={{
      background: c.surface, border: `1px solid ${c.hairline}`, borderRadius: 3,
      marginBottom: 12, overflow: 'hidden',
    }}>
      <div style={{ width: '100%', aspectRatio: '4 / 3', background: c.surface2 }}>
        <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
      <div style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ fontSize: 10, color: c.muted, letterSpacing: 0.8, textTransform: 'uppercase' }}>{T.extraPageNote}</div>
          <div style={{ fontSize: 11, color: c.muted }}>
            {saveStatus === 'saving' ? T.extraPageSaving : saveStatus === 'saved' ? `✓ ${T.extraPageSaved}` : ''}
          </div>
        </div>
        <textarea
          value={item.note || ''} maxLength={500}
          placeholder={T.extraPageNotePh} rows={3}
          onChange={e => onChange('note', e.target.value.slice(0, 500))}
          style={{ ...inp(c, FONTS.ui, 14), padding: '10px 12px', resize: 'vertical', lineHeight: 1.5, minHeight: 70 }}
        />
        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
          <button onClick={onUp} disabled={busy || !canUp} style={rowBtn(c, busy || !canUp)} title={T.extraPageMoveUp}>▲</button>
          <button onClick={onDown} disabled={busy || !canDown} style={rowBtn(c, busy || !canDown)} title={T.extraPageMoveDown}>▼</button>
          <div style={{ flex: 1 }} />
          <button onClick={onDelete} disabled={busy} style={{
            ...rowBtn(c, busy), color: c.danger, padding: '8px 14px',
          }} title={T.extraPageDelete}>{T.extraPageDelete}</button>
        </div>
      </div>
    </div>
  );
}

function rowBtn(c, disabled) {
  return {
    padding: '8px 12px', border: `1px solid ${c.hairline}`,
    background: disabled ? 'transparent' : c.surface,
    borderRadius: 2, fontFamily: FONTS.ui, fontSize: 11, color: c.ink2,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
  };
}

Object.assign(window, { ExtraPageScreen });
