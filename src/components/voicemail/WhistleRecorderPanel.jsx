import { useEffect, useRef, useState } from 'react';
import { Mic, Square, Play, RotateCcw, Sparkles, Loader2, Trash2, Upload } from 'lucide-react';
import {
  MAX_RECORDING_SECONDS,
  decodeAudioFileToClip,
  startMicRecorder,
} from '../../lib/audioRecorder';
import {
  PORTFOLIO_KEYWORDS,
  ensureWhistleSession,
  transcribeWithWhistle,
} from '../../lib/whistleEngine';

const LANGUAGES = [
  { code: 'auto', label: 'Auto Detect' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'nl', label: 'Dutch' },
  { code: 'pl', label: 'Polish' },
];

function formatTimer(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return `00:${String(s).padStart(2, '0')}`;
}

function computeWaveformPeaks(samples, barCount = 105) {
  const peaks = new Float32Array(barCount);
  if (!samples?.length) return peaks;

  const bucketSize = Math.max(1, Math.floor(samples.length / barCount));
  let globalMax = 0;

  for (let b = 0; b < barCount; b++) {
    const start = b * bucketSize;
    const end = Math.min(samples.length, start + bucketSize);
    let maxAmp = 0;
    for (let i = start; i < end; i++) {
      const a = Math.abs(samples[i]);
      if (a > maxAmp) maxAmp = a;
    }
    peaks[b] = maxAmp;
    if (maxAmp > globalMax) globalMax = maxAmp;
  }

  const norm = Math.max(0.08, globalMax);
  for (let b = 0; b < barCount; b++) {
    peaks[b] = Math.min(1, peaks[b] / norm);
  }
  return peaks;
}

export default function WhistleRecorderPanel({ onTranscriptReady, onSwitchToPlain }) {
  const waveformCanvasRef = useRef(null);
  const recorderRef = useRef(null);
  const audioElRef = useRef(null);
  const fileInputRef = useRef(null);

  const [modelStatus, setModelStatus] = useState('idle'); // 'idle' | 'loading' | 'ready' | 'error'
  const [downloadPct, setDownloadPct] = useState(0);
  const [recordingState, setRecordingState] = useState('idle'); // 'idle' | 'recording' | 'transcribing' | 'done'
  const [elapsedSec, setElapsedSec] = useState(0);
  const [language, setLanguage] = useState('en');
  const [useKeywordBias, setUseKeywordBias] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [clipData, setClipData] = useState(null); // { samples, sampleRate, durationSec, wavUrl, peaks }
  const [asrMeta, setAsrMeta] = useState(null); // { words, inferenceMs, language, tokensPerSecond }

  const drawIdleWave = () => {
    const canvas = waveformCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = '#E3D6BF';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(170, 186, 174, 0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
  };

  const drawClipWaveform = (peaks, progress = 0) => {
    const canvas = waveformCanvasRef.current;
    if (!canvas || !peaks?.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const midY = h / 2;

    ctx.fillStyle = '#E3D6BF';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(170, 186, 174, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(w, midY);
    ctx.stroke();

    const stepX = w / peaks.length;
    const barW = Math.max(1.5, stepX * 0.56);
    const playheadX = Math.max(0, Math.min(1, progress)) * w;

    for (let i = 0; i < peaks.length; i++) {
      const x = i * stepX + (stepX - barW) * 0.5;
      const barHalfH = Math.max(2, peaks[i] * (h * 0.42));
      const isPlayed = progress > 0 && x <= playheadX;
      ctx.fillStyle = isPlayed ? '#933B5B' : 'rgba(147, 59, 91, 0.38)';
      ctx.fillRect(x, midY - barHalfH, barW, barHalfH * 2);
    }

    if (progress > 0 && progress < 1) {
      ctx.strokeStyle = '#933B5B';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(playheadX, 4);
      ctx.lineTo(playheadX, h - 4);
      ctx.stroke();
    }
  };

  const drawLiveWave = (timeDomain) => {
    const canvas = waveformCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#E3D6BF';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(170, 186, 174, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    ctx.strokeStyle = '#933B5B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const sliceW = w / timeDomain.length;
    for (let i = 0; i < timeDomain.length; i++) {
      const v = timeDomain[i] / 128.0;
      const y = (v * h) / 2;
      if (i === 0) ctx.moveTo(0, y);
      else ctx.lineTo(i * sliceW, y);
    }
    ctx.stroke();
  };

  useEffect(() => {
    drawIdleWave();
    return () => {
      recorderRef.current?.cancel().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (!clipData?.peaks) return undefined;
    drawClipWaveform(clipData.peaks, 0);

    const audio = audioElRef.current;
    if (!audio) return undefined;

    let rafId = 0;
    const syncPlayhead = () => {
      const dur = audio.duration || clipData.durationSec || 1;
      const ratio = dur > 0 ? Math.min(1, audio.currentTime / dur) : 0;
      drawClipWaveform(clipData.peaks, ratio);
      if (!audio.paused && !audio.ended) {
        rafId = requestAnimationFrame(syncPlayhead);
      }
    };

    const onPlay = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(syncPlayhead);
    };
    const onPauseOrSeek = () => {
      cancelAnimationFrame(rafId);
      const dur = audio.duration || clipData.durationSec || 1;
      const ratio = dur > 0 ? Math.min(1, audio.currentTime / dur) : 0;
      drawClipWaveform(clipData.peaks, ratio);
    };
    const onEnded = () => {
      cancelAnimationFrame(rafId);
      drawClipWaveform(clipData.peaks, 0);
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPauseOrSeek);
    audio.addEventListener('seeked', onPauseOrSeek);
    audio.addEventListener('ended', onEnded);

    return () => {
      cancelAnimationFrame(rafId);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPauseOrSeek);
      audio.removeEventListener('seeked', onPauseOrSeek);
      audio.removeEventListener('ended', onEnded);
    };
  }, [clipData]);

  useEffect(() => {
    return () => {
      if (clipData?.wavUrl) {
        URL.revokeObjectURL(clipData.wavUrl);
      }
    };
  }, [clipData]);

  const loadModel = async () => {
    setErrorMsg('');
    setModelStatus('loading');
    try {
      await ensureWhistleSession({
        onProgress: (p) => {
          if (typeof p?.percentage === 'number') {
            setDownloadPct(Math.round(p.percentage));
          } else if (typeof p?.loaded === 'number') {
            setDownloadPct(Math.min(99, Math.round((p.loaded / 16_919_407) * 100)));
          }
        },
      });
      setDownloadPct(100);
      setModelStatus('ready');
      return true;
    } catch (err) {
      setModelStatus('error');
      const detail = err?.code ? `[${err.code}] ${err.message}` : err?.message;
      setErrorMsg(
        detail ||
          'Could not initialize Whistle WASM in this browser. You can switch to Plain Text mode.'
      );
      return false;
    }
  };

  const runTranscription = async (captured, opts = {}) => {
    const langChoice = opts.language ?? language;
    const biasChoice = opts.useKeywordBias ?? useKeywordBias;
    setRecordingState('transcribing');
    setErrorMsg('');
    const wasReady = modelStatus === 'ready';

    try {
      if (!wasReady) {
        setModelStatus('loading');
      }
      const result = await transcribeWithWhistle({
        samples: captured.samples,
        sampleRate: captured.sampleRate,
        language: langChoice,
        useKeywordBias: biasChoice,
        onProgress: (p) => {
          if (typeof p?.percentage === 'number') {
            setDownloadPct(Math.round(p.percentage));
          }
        },
      });
      setModelStatus('ready');
      setDownloadPct(100);

      const cleanText = (result.text || '').trim();
      const durationSec = Math.max(1, Math.round(captured.durationSec));
      const inferenceMs = Math.round(result.timeToFirstTokenMs || 0);

      setAsrMeta({
        words: result.words || [],
        inferenceMs,
        language: result.language || (langChoice === 'auto' ? 'en' : langChoice),
        tokensPerSecond: Math.round(result.tokensPerSecond || 0),
      });
      setRecordingState('done');

      onTranscriptReady?.({
        text: cleanText,
        durationSec,
        inferenceMs,
        language: result.language || (langChoice === 'auto' ? 'en' : langChoice),
      });

      if (!cleanText) {
        setErrorMsg('Whistle heard silence or unclear speech. Try speaking closer or type directly below.');
      }
    } catch (err) {
      if (!wasReady) {
        setModelStatus('error');
      }
      setRecordingState('done');
      const detail = err?.code ? `[${err.code}] ${err.message}` : err?.message;
      setErrorMsg(detail || 'Local transcription failed.');
    }
  };

  const handleStartRecording = async () => {
    setErrorMsg('');
    if (clipData?.wavUrl) {
      URL.revokeObjectURL(clipData.wavUrl);
      setClipData(null);
    }
    setAsrMeta(null);
    setElapsedSec(0);

    try {
      const recorder = await startMicRecorder({
        onLevel: drawLiveWave,
        onTick: setElapsedSec,
        onMaxReached: () => {
          handleStopRecording();
        },
      });
      recorderRef.current = recorder;
      setRecordingState('recording');

      if (modelStatus === 'idle') {
        loadModel();
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Microphone failed to start.');
      setRecordingState('idle');
    }
  };

  const handleStopRecording = async () => {
    const active = recorderRef.current;
    if (!active) return;
    recorderRef.current = null;

    const captured = await active.stop();
    drawIdleWave();

    if (!captured) {
      setRecordingState('idle');
      return;
    }

    if (captured.isSilent) {
      setRecordingState('idle');
      setErrorMsg('Recording was silent or under 0.4s. Record a bit longer and speak clearly.');
      return;
    }

    const wavUrl = URL.createObjectURL(captured.wavBlob);
    const nextClip = {
      samples: captured.samples,
      sampleRate: captured.sampleRate,
      durationSec: captured.durationSec,
      wavUrl,
      peaks: computeWaveformPeaks(captured.samples),
    };
    setElapsedSec(Math.max(1, Math.floor(captured.durationSec)));
    setClipData(nextClip);
    await runTranscription(nextClip);
  };

  const handleDiscardClip = () => {
    if (clipData?.wavUrl) {
      URL.revokeObjectURL(clipData.wavUrl);
    }
    setClipData(null);
    setAsrMeta(null);
    setElapsedSec(0);
    setRecordingState('idle');
    setErrorMsg('');
    drawIdleWave();
  };

  const handleSeekWord = (startSec) => {
    const audio = audioElRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, startSec);
    audio.play().catch(() => {});
  };

  const handleWaveformClick = (e) => {
    const audio = audioElRef.current;
    const canvas = waveformCanvasRef.current;
    if (!clipData || !audio || !canvas || recordingState === 'recording') return;

    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const dur = audio.duration || clipData.durationSec;
    if (Number.isFinite(dur) && dur > 0) {
      audio.currentTime = ratio * dur;
      drawClipWaveform(clipData.peaks, ratio);
      if (audio.paused) {
        audio.play().catch(() => {});
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setErrorMsg('');
    if (clipData?.wavUrl) {
      URL.revokeObjectURL(clipData.wavUrl);
      setClipData(null);
    }
    setAsrMeta(null);

    try {
      const captured = await decodeAudioFileToClip(file);
      if (captured.isSilent) {
        setErrorMsg('That audio clip is silent or shorter than 0.25s.');
        return;
      }
      const wavUrl = URL.createObjectURL(captured.wavBlob);
      const nextClip = {
        samples: captured.samples,
        sampleRate: captured.sampleRate,
        durationSec: captured.durationSec,
        wavUrl,
        peaks: computeWaveformPeaks(captured.samples),
      };
      setElapsedSec(Math.max(1, Math.floor(captured.durationSec)));
      setClipData(nextClip);
      await runTranscription(nextClip);
    } catch (err) {
      setErrorMsg(err?.message || 'Unable to decode selected audio file.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Whistle WASM Status Strip */}
      <div className="pb-3 border-b border-[#AABAAE]/55 flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#933B5B] font-semibold block">
            {modelStatus === 'ready'
              ? 'Whistle Ready (Local WASM)'
              : modelStatus === 'loading'
                ? `Loading Whistle (${downloadPct}%)`
                : modelStatus === 'error'
                  ? 'Model Load Error'
                  : 'Whistle On-Demand (16.9 MB)'}
          </span>
          <span className="text-[11px] font-sans text-[#5a523e]">
            Audio stays in your browser; only the text is saved.
          </span>
        </div>

        {modelStatus === 'idle' && (
          <button
            type="button"
            onClick={loadModel}
            className="px-3 py-1.5 rounded-md border border-[#933B5B]/45 bg-[#E3D6BF]/50 hover:bg-[#933B5B] hover:text-[#E3D6BF] text-[#933B5B] font-mono text-[10px] uppercase tracking-wider transition-colors cursor-pointer shrink-0"
          >
            Preload Model
          </button>
        )}
      </div>

      {modelStatus === 'loading' && (
        <div className="w-full h-1 bg-[#AABAAE]/35 overflow-hidden">
          <div
            className="h-full bg-[#933B5B] transition-all duration-200"
            style={{ width: `${Math.max(6, downloadPct)}%` }}
          />
        </div>
      )}

      {/* Waveform Deck & Controls */}
      <div className="space-y-3 pb-4 border-b border-[#AABAAE]/55">
        <div className="flex items-center justify-between text-[11px] font-mono text-[#9F9679]">
          <span className="uppercase tracking-wider">
            {recordingState === 'recording'
              ? 'Capturing 16-bit PCM...'
              : recordingState === 'transcribing'
                ? 'Decoding in WASM worker...'
                : clipData
                  ? 'Clip ready (local only)'
                  : 'Ready to record'}
          </span>
          <span className="text-[#933B5B] font-semibold">
            {formatTimer(elapsedSec)} / {formatTimer(MAX_RECORDING_SECONDS)}
          </span>
        </div>

        <canvas
          ref={waveformCanvasRef}
          width={420}
          height={64}
          onClick={handleWaveformClick}
          title={clipData ? 'Click waveform to seek audio' : undefined}
          className={`w-full h-16 rounded-md border border-[#AABAAE]/70 bg-[#E3D6BF] block ${
            clipData && recordingState !== 'recording' ? 'cursor-pointer' : ''
          }`}
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#5a523e]">
            <span className="uppercase text-[#9F9679]">Lang:</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={recordingState === 'recording' || recordingState === 'transcribing'}
              className="bg-[#E3D6BF]/45 border border-[#AABAAE]/80 rounded-md px-2 py-1 text-[11px] font-mono text-[#2b2520] focus:outline-none focus:border-[#933B5B]"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => setUseKeywordBias((prev) => !prev)}
            disabled={recordingState === 'recording' || recordingState === 'transcribing'}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${
              useKeywordBias
                ? 'border-[#933B5B] bg-[#933B5B]/10 text-[#933B5B]'
                : 'border-[#AABAAE]/80 bg-transparent text-[#9F9679]'
            }`}
            title={`Boost terms: ${PORTFOLIO_KEYWORDS.join(', ')}`}
          >
            <Sparkles size={11} />
            <span>Bias Terms: {useKeywordBias ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {recordingState === 'recording' ? (
            <button
              type="button"
              onClick={handleStopRecording}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-md bg-[#B5728A] hover:bg-[#933B5B] text-[#F5EFE0] font-mono text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
            >
              <Square size={14} className="fill-current" />
              <span>Stop &amp; Transcribe</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartRecording}
              disabled={recordingState === 'transcribing'}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-md bg-[#933B5B] hover:bg-[#7d304c] disabled:opacity-60 text-[#E3D6BF] font-mono text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
            >
              {recordingState === 'transcribing' ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Transcribing Locally...</span>
                </>
              ) : (
                <>
                  <Mic size={15} />
                  <span>{clipData ? 'Record New Clip' : 'Start Mic Recording'}</span>
                </>
              )}
            </button>
          )}

          {clipData && recordingState !== 'recording' && (
            <>
              <button
                type="button"
                onClick={() => runTranscription(clipData)}
                disabled={recordingState === 'transcribing'}
                className="p-2.5 rounded-md border border-[#AABAAE] bg-transparent hover:border-[#933B5B] text-[#933B5B] transition-colors cursor-pointer"
                title="Re-run Whistle with current language and keyword bias"
                aria-label="Re-transcribe clip"
              >
                <RotateCcw size={15} />
              </button>
              <button
                type="button"
                onClick={handleDiscardClip}
                disabled={recordingState === 'transcribing'}
                className="p-2.5 rounded-md border border-[#AABAAE] bg-transparent hover:border-[#933B5B] text-[#9F9679] hover:text-[#933B5B] transition-colors cursor-pointer"
                title="Discard clip"
                aria-label="Discard clip"
              >
                <Trash2 size={15} />
              </button>
            </>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-[#9F9679] pt-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            disabled={recordingState === 'recording' || recordingState === 'transcribing'}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 text-[#5a523e] hover:text-[#933B5B] disabled:opacity-50 underline underline-offset-4 transition-colors cursor-pointer"
          >
            <Upload size={11} />
            <span>Or upload an audio clip (max 30s)</span>
          </button>
        </div>
      </div>

      {/* Local Playback + Clickable Word Timestamps */}
      {clipData && (
        <div className="space-y-2.5 pb-4 border-b border-[#AABAAE]/55">
          <div className="flex items-center justify-between text-[10px] font-mono text-[#9F9679] uppercase tracking-wider">
            <span className="inline-flex items-center gap-1 text-[#933B5B]">
              <Play size={10} /> Local Audio Preview
            </span>
            {asrMeta && (
              <span>
                TTFT {asrMeta.inferenceMs}ms
                {asrMeta.tokensPerSecond ? ` · ${asrMeta.tokensPerSecond} tok/s` : ''}
              </span>
            )}
          </div>

          <audio
            ref={audioElRef}
            src={clipData.wavUrl}
            controls
            className="w-full h-9"
          />

          {asrMeta?.words?.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] font-mono text-[#9F9679] uppercase tracking-wider">
                Word Timestamps (click a word to jump audio):
              </div>
              <div className="flex flex-wrap gap-1">
                {asrMeta.words.map((w, idx) => {
                  const lowConf = typeof w.probability === 'number' && w.probability < 0.55;
                  return (
                    <button
                      key={`${w.word}-${idx}`}
                      type="button"
                      onClick={() => handleSeekWord(w.start)}
                      title={`${w.start.toFixed(2)}s to ${w.end.toFixed(2)}s (${Math.round((w.probability || 0) * 100)}% conf)`}
                      className={`px-1.5 py-0.5 rounded text-xs font-sans transition-colors cursor-pointer border ${
                        lowConf
                          ? 'bg-[#B5728A]/18 border-[#B5728A]/60 text-[#933B5B] underline decoration-dotted'
                          : 'bg-[#E3D6BF]/45 border-[#AABAAE]/70 text-[#2b2520] hover:border-[#933B5B]'
                      }`}
                    >
                      {w.word}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="rounded-md border border-[#933B5B]/45 bg-[#B5728A]/12 p-3 text-xs font-sans text-[#933B5B] flex flex-col gap-2">
          <p>{errorMsg}</p>
          {onSwitchToPlain && (
            <button
              type="button"
              onClick={onSwitchToPlain}
              className="self-start text-[11px] font-mono uppercase underline underline-offset-4 cursor-pointer"
            >
              Switch to Plain Text →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
