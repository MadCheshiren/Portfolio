export const MAX_RECORDING_SECONDS = 30;

/**
 * Encodes mono Float32 PCM samples [-1, 1] into a standard PCM WAV Blob for local playback preview.
 */
function encodeWavBlob(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // Mono channel
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function mergeChunks(chunks) {
  let totalLength = 0;
  for (const chunk of chunks) {
    totalLength += chunk.length;
  }
  const merged = new Float32Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return merged;
}

/**
 * Checks if captured PCM contains audible signal rather than dead silence or muted mic.
 */
function computeRms(samples) {
  if (!samples.length) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i] * samples[i];
  }
  return Math.sqrt(sum / samples.length);
}

async function getMicPermissionState() {
  try {
    if (!navigator.permissions?.query) return null;
    const status = await navigator.permissions.query({ name: 'microphone' });
    return status.state; // 'granted' | 'prompt' | 'denied'
  } catch {
    return null;
  }
}

/**
 * Decodes an uploaded local audio file (.wav, .mp3, .webm, .ogg, .m4a) into
 * mono Float32 PCM capped at 30 seconds for local Whistle transcription.
 */
export async function decodeAudioFileToClip(file) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    throw new Error('Web Audio API is unavailable in this browser.');
  }

  const audioCtx = new AudioCtx();
  try {
    const rawBuffer = await file.arrayBuffer();
    const decoded = await audioCtx.decodeAudioData(rawBuffer);
    const sampleRate = decoded.sampleRate;
    const maxFrames = Math.min(decoded.length, sampleRate * MAX_RECORDING_SECONDS);
    const numChannels = decoded.numberOfChannels || 1;
    const samples = new Float32Array(maxFrames);

    for (let ch = 0; ch < numChannels; ch++) {
      const chData = decoded.getChannelData(ch);
      for (let i = 0; i < maxFrames; i++) {
        samples[i] += chData[i] / numChannels;
      }
    }
    for (let i = 0; i < maxFrames; i++) {
      const v = samples[i];
      samples[i] = Number.isFinite(v) ? Math.max(-1, Math.min(1, v)) : 0;
    }

    const durationSec = samples.length / sampleRate;
    const rms = computeRms(samples);
    const wavBlob = encodeWavBlob(samples, sampleRate);

    return {
      samples,
      sampleRate,
      durationSec,
      rms,
      isSilent: rms < 0.0015 || durationSec < 0.25,
      wavBlob,
    };
  } catch {
    throw new Error('Could not decode that audio file. Try a short .wav, .mp3, .m4a, or .webm clip.');
  } finally {
    await audioCtx.close().catch(() => {});
  }
}

/**
 * Starts cross-browser mono PCM microphone recording via Web Audio API so Whistle
 * never depends on browser-specific MediaRecorder codec decoding (WebM vs Safari MP4).
 */
export async function startMicRecorder({ onLevel, onTick, onMaxReached } = {}) {
  if (typeof window === 'undefined' || !window.isSecureContext) {
    throw new Error('Microphone recording requires HTTPS or localhost.');
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('This browser does not support microphone capture.');
  }

  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
  } catch (err) {
    if (err?.name === 'OverconstrainedError' || err?.name === 'ConstraintNotSatisfiedError') {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } else if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
      const permState = await getMicPermissionState();
      const rawMsg = (err?.message || '').toLowerCase();
      if (permState === 'granted' || rawMsg.includes('system')) {
        throw new Error(
          `Your browser allowed the site, but the OS/system blocked microphone access (${err?.message || err?.name}). Check Windows Settings -> Privacy & security -> Microphone -> "Let desktop apps access your microphone".`
        );
      }
      throw new Error(
        `Microphone access was blocked (${err?.message || err?.name}). Check the site lock/mic icon in the address bar or Windows Microphone privacy settings.`
      );
    } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
      throw new Error('No microphone was detected on this device.');
    } else if (err?.name === 'NotReadableError' || err?.name === 'TrackStartError') {
      throw new Error('Microphone is busy or held exclusively by another app.');
    } else {
      throw new Error(err?.message || 'Unable to access microphone.');
    }
  }

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    stream.getTracks().forEach((t) => t.stop());
    throw new Error('Web Audio API is unavailable in this browser.');
  }

  const audioCtx = new AudioCtx();
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }

  const source = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;

  // Keep sink muted so user does not hear mic feedback
  const silentGain = audioCtx.createGain();
  silentGain.gain.value = 0;

  const pcmChunks = [];
  const sampleRate = audioCtx.sampleRate;
  const maxSamples = sampleRate * MAX_RECORDING_SECONDS;
  let totalSamples = 0;
  let stopped = false;

  let workletNode = null;
  let scriptNode = null;
  let workletBlobUrl = null;

  const pushSamples = (channelData) => {
    if (stopped || totalSamples >= maxSamples) return;
    const remaining = maxSamples - totalSamples;
    const len = Math.min(channelData.length, remaining);
    const copy = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      const v = channelData[i];
      copy[i] = Number.isFinite(v) ? Math.max(-1, Math.min(1, v)) : 0;
    }
    pcmChunks.push(copy);
    totalSamples += len;
    if (totalSamples >= maxSamples && !stopped) {
      onMaxReached?.();
    }
  };

  if (audioCtx.audioWorklet && typeof Blob !== 'undefined') {
    try {
      const workletCode = `
        class PcmCaptureProcessor extends AudioWorkletProcessor {
          process(inputs) {
            const input = inputs[0];
            if (input && input[0] && input[0].length > 0) {
              this.port.postMessage(new Float32Array(input[0]));
            }
            return true;
          }
        }
        registerProcessor('pcm-capture-processor', PcmCaptureProcessor);
      `;
      workletBlobUrl = URL.createObjectURL(
        new Blob([workletCode], { type: 'application/javascript' })
      );
      await audioCtx.audioWorklet.addModule(workletBlobUrl);
      workletNode = new AudioWorkletNode(audioCtx, 'pcm-capture-processor');
      workletNode.port.onmessage = (event) => {
        if (event.data instanceof Float32Array) {
          pushSamples(event.data);
        }
      };
      source.connect(analyser);
      analyser.connect(workletNode);
      workletNode.connect(silentGain);
      silentGain.connect(audioCtx.destination);
    } catch {
      workletNode = null;
    }
  }

  if (!workletNode) {
    scriptNode = audioCtx.createScriptProcessor(4096, 1, 1);
    scriptNode.onaudioprocess = (event) => {
      const channel = event.inputBuffer.getChannelData(0);
      pushSamples(channel);
    };
    source.connect(analyser);
    analyser.connect(scriptNode);
    scriptNode.connect(silentGain);
    silentGain.connect(audioCtx.destination);
  }

  const startedAt = performance.now();
  const timeDomain = new Uint8Array(analyser.fftSize);
  let rafId = 0;

  const tick = () => {
    if (stopped) return;
    const elapsedSec = Math.min(MAX_RECORDING_SECONDS, (performance.now() - startedAt) / 1000);
    onTick?.(elapsedSec);

    if (onLevel) {
      analyser.getByteTimeDomainData(timeDomain);
      onLevel(timeDomain);
    }

    if (elapsedSec >= MAX_RECORDING_SECONDS) {
      onMaxReached?.();
      return;
    }
    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);

  const stop = async () => {
    if (stopped) return null;
    stopped = true;
    cancelAnimationFrame(rafId);

    try {
      source.disconnect();
      analyser.disconnect();
      workletNode?.disconnect();
      scriptNode?.disconnect();
      silentGain.disconnect();
    } catch {
      // Ignore already-disconnected node cleanup
    }

    if (workletBlobUrl) {
      URL.revokeObjectURL(workletBlobUrl);
      workletBlobUrl = null;
    }

    stream.getTracks().forEach((track) => track.stop());
    await audioCtx.close().catch(() => {});

    const samples = mergeChunks(pcmChunks);
    const durationSec = samples.length / sampleRate;
    const rms = computeRms(samples);
    const wavBlob = encodeWavBlob(samples, sampleRate);

    return {
      samples,
      sampleRate,
      durationSec,
      rms,
      isSilent: rms < 0.0025 || durationSec < 0.35,
      wavBlob,
    };
  };

  const cancel = async () => {
    await stop();
  };

  return { stop, cancel };
}
