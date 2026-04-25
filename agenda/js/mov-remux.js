// Agenda — opportunistic client-side .mov → .mp4 remux.
// We accept .mov from iPhones/cameras only when the video track is H.264;
// then we stream-copy the video bitstream into an MP4 container and
// re-encode audio to AAC (cheap) so cameras emitting PCM/ALAC don't break
// playback. HEVC inputs are rejected so the user re-exports as MP4 — wasm
// transcoding HEVC→H.264 in the browser is too slow on phones to promise.
//
// Errors thrown by remuxMovToMp4:
//   code 'mov_too_large'        — input exceeds the server's video size cap
//   code 'mov_hevc_unsupported' — track is HEVC; ask the user to re-export
//   code 'mov_codec_unknown'    — couldn't find a known codec atom
//   code 'mov_remux_failed'     — ffmpeg load failed, exec failed, or no output
//
// Version pinning note: @ffmpeg/ffmpeg, @ffmpeg/util, and @ffmpeg/core are
// independently versioned packages. The triple below is the matched set
// from the official getting-started guide; keep them aligned together.

(function () {
  // Mirror of worker.js ALLOWED_MEDIA['video/*'].max — remux output is ~same
  // size as input (video stream-copied), so over this we'd just waste a
  // conversion before the server rejects the upload.
  const MAX_INPUT_BYTES = 50 * 1024 * 1024;

  // Walk every 'stsd' atom in the buffer (audio and video tracks each have
  // their own) and return the first video codec we recognise. Stopping at
  // the first stsd would mis-reject H.264 MOVs whose audio stsd appears
  // earlier in the byte stream.
  function scanForCodec(view) {
    const b = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
    for (let i = 0; i < b.length - 3; i++) {
      if (b[i] !== 0x73 || b[i+1] !== 0x74 || b[i+2] !== 0x73 || b[i+3] !== 0x64) continue;
      const end = Math.min(b.length - 3, i + 256);
      for (let j = i + 4; j < end; j++) {
        const a = b[j], c = b[j+1], d = b[j+2], e = b[j+3];
        if (a === 0x68 && c === 0x76 && d === 0x63 && e === 0x31) return 'hevc'; // hvc1
        if (a === 0x68 && c === 0x65 && d === 0x76 && e === 0x31) return 'hevc'; // hev1
        if (a === 0x61 && c === 0x76 && d === 0x63 && e === 0x31) return 'h264'; // avc1
        if (a === 0x61 && c === 0x76 && d === 0x63 && e === 0x33) return 'h264'; // avc3
      }
    }
    return null;
  }

  async function detectMovCodec(file) {
    // moov can sit at the start (faststart) or the end of the file. Read both
    // ends; 2 MB each is enough to hit the stsd tables in any normal recording.
    const w = 2 * 1024 * 1024;
    const head = await file.slice(0, w).arrayBuffer();
    let codec = scanForCodec(new DataView(head));
    if (!codec && file.size > w) {
      const tail = await file.slice(Math.max(0, file.size - w)).arrayBuffer();
      codec = scanForCodec(new DataView(tail));
    }
    return codec;
  }

  let ffmpegPromise = null;
  function loadFFmpeg() {
    if (ffmpegPromise) return ffmpegPromise;
    ffmpegPromise = (async () => {
      const ffmpegMod = await import('https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/esm/index.js');
      const utilMod = await import('https://unpkg.com/@ffmpeg/util@0.12.1/dist/esm/index.js');
      const ff = new ffmpegMod.FFmpeg();
      await ff.load({
        coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
        wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm',
      });
      return { ff, fetchFile: utilMod.fetchFile };
    })().catch((err) => { ffmpegPromise = null; throw err; });
    return ffmpegPromise;
  }

  function makeError(code) {
    const err = new Error(code);
    err.code = code;
    return err;
  }

  async function remuxMovToMp4(file) {
    if (file.size > MAX_INPUT_BYTES) throw makeError('mov_too_large');

    const codec = await detectMovCodec(file);
    if (codec === 'hevc') throw makeError('mov_hevc_unsupported');
    if (codec !== 'h264') throw makeError('mov_codec_unknown');

    let ff, fetchFile;
    try {
      ({ ff, fetchFile } = await loadFFmpeg());
    } catch {
      throw makeError('mov_remux_failed');
    }

    try {
      await ff.writeFile('in.mov', await fetchFile(file));
      // Copy the video bitstream as-is; transcode audio to AAC so PCM/ALAC
      // (common from screen recordings and DSLRs) plays in every browser.
      // The '?' makes the audio mapping optional — silent clips still convert.
      await ff.exec([
        '-i', 'in.mov',
        '-map', '0:v:0',
        '-map', '0:a:0?',
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-movflags', '+faststart',
        'out.mp4',
      ]);
      const data = await ff.readFile('out.mp4');
      if (!data || !data.byteLength) throw makeError('mov_remux_failed');
      const base = (file.name || 'video.mov').replace(/\.[^.]+$/, '') || 'video';
      return new File([data], base + '.mp4', { type: 'video/mp4' });
    } catch (err) {
      if (err && err.code) throw err;
      throw makeError('mov_remux_failed');
    } finally {
      try { await ff.deleteFile('in.mov'); } catch {}
      try { await ff.deleteFile('out.mp4'); } catch {}
    }
  }

  function isMovFile(file) {
    if (!file) return false;
    if (file.type === 'video/quicktime') return true;
    return /\.mov$/i.test(file.name || '');
  }

  window.AG_MOV = { remuxMovToMp4, isMovFile };
})();
