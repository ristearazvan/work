// Agenda — opportunistic client-side .mov → .mp4 remux.
// We accept .mov from iPhones/cameras only when the video track is H.264;
// then we stream-copy the bitstream into an MP4 container (no transcode).
// HEVC inputs are rejected so the user re-exports as MP4 — wasm transcoding
// HEVC→H.264 in the browser is too slow on phones to promise.
//
// Errors thrown by remuxMovToMp4:
//   code 'mov_hevc_unsupported' — track is HEVC; ask the user to re-export
//   code 'mov_codec_unknown'    — couldn't find a known codec atom
//   code 'mov_remux_failed'     — ffmpeg ran but produced no output

(function () {
  // Scan a buffer for the codec FOURCC inside the 'stsd' atom. Faster and
  // 31 MB lighter than booting ffmpeg just to read codec info — and lets us
  // reject HEVC without ever downloading the wasm core.
  function scanForCodec(view) {
    const b = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
    let stsd = -1;
    for (let i = 0; i < b.length - 3; i++) {
      if (b[i] === 0x73 && b[i+1] === 0x74 && b[i+2] === 0x73 && b[i+3] === 0x64) { stsd = i; break; }
    }
    if (stsd < 0) return null;
    const end = Math.min(b.length - 3, stsd + 256);
    for (let i = stsd + 4; i < end; i++) {
      const a = b[i], c = b[i+1], d = b[i+2], e = b[i+3];
      if (a === 0x68 && c === 0x76 && d === 0x63 && e === 0x31) return 'hevc'; // hvc1
      if (a === 0x68 && c === 0x65 && d === 0x76 && e === 0x31) return 'hevc'; // hev1
      if (a === 0x61 && c === 0x76 && d === 0x63 && e === 0x31) return 'h264'; // avc1
      if (a === 0x61 && c === 0x76 && d === 0x63 && e === 0x33) return 'h264'; // avc3
    }
    return null;
  }

  async function detectMovCodec(file) {
    // moov can sit at the start (faststart) or the end of the file. Read both
    // ends; 2 MB each is enough to hit the stsd table in any normal recording.
    const window = 2 * 1024 * 1024;
    const head = await file.slice(0, window).arrayBuffer();
    let codec = scanForCodec(new DataView(head));
    if (!codec && file.size > window) {
      const tail = await file.slice(Math.max(0, file.size - window)).arrayBuffer();
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
    const codec = await detectMovCodec(file);
    if (codec === 'hevc') throw makeError('mov_hevc_unsupported');
    if (codec !== 'h264') throw makeError('mov_codec_unknown');

    const { ff, fetchFile } = await loadFFmpeg();
    await ff.writeFile('in.mov', await fetchFile(file));
    try {
      await ff.exec(['-i', 'in.mov', '-c', 'copy', '-movflags', '+faststart', 'out.mp4']);
      const data = await ff.readFile('out.mp4');
      if (!data || !data.byteLength) throw makeError('mov_remux_failed');
      const base = (file.name || 'video.mov').replace(/\.[^.]+$/, '') || 'video';
      return new File([data], base + '.mp4', { type: 'video/mp4' });
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
