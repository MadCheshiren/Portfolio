import { Mic, FileText } from 'lucide-react';

function formatRelativeTime(isoString) {
  const ts = new Date(isoString).getTime();
  if (!Number.isFinite(ts)) return 'just now';
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function VoicemailPaperCard({ entry, indexNumber, compact = false }) {
  const isVoice = entry.input_mode === 'whistle';
  const serial =
    typeof indexNumber === 'number'
      ? String(indexNumber).padStart(2, '0')
      : null;

  if (compact) {
    return (
      <article className="flex flex-col justify-between gap-2.5 pt-3 first:pt-0 md:pt-0 md:px-5 md:first:pl-0 md:last:pr-0">
        <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
          <span className="text-[#933B5B] font-semibold truncate">
            {entry.author_name || 'Anonymous Visitor'}
          </span>
          <span className="text-[#9F9679] shrink-0">
            {formatRelativeTime(entry.created_at)}
          </span>
        </div>

        <p className="font-sans text-xs sm:text-[13px] text-[#2b2520] leading-relaxed line-clamp-2">
          “{entry.transcript}”
        </p>

        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-[#9F9679]">
          <span className="inline-flex items-center gap-1 text-[#933B5B]">
            {isVoice ? <Mic size={10} /> : <FileText size={10} />}
            <span>
              {isVoice
                ? `Whistle${entry.duration_sec ? ` · ${entry.duration_sec}s` : ''}`
                : 'Text'}
            </span>
          </span>
          <span aria-hidden="true">·</span>
          <span>{entry.role_tag || 'Visitor'}</span>
        </div>
      </article>
    );
  }

  return (
    <article className="py-5 first:pt-1 border-b border-[#AABAAE]/60 last:border-b-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
        <div className="flex items-baseline gap-2.5 min-w-0">
          {serial && (
            <span className="text-xs font-mono text-[#9F9679]">
              {serial}
            </span>
          )}
          <span className="font-sans font-semibold text-sm text-[#2b2520] truncate">
            {entry.author_name || 'Anonymous Visitor'}
          </span>
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#9F9679]">
            {entry.role_tag || 'Visitor'}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono text-[#9F9679] shrink-0">
          <span
            className={`inline-flex items-center gap-1 uppercase ${
              isVoice ? 'text-[#933B5B] font-medium' : 'text-[#5a523e]'
            }`}
          >
            {isVoice ? <Mic size={11} /> : <FileText size={11} />}
            <span>
              {isVoice
                ? `Whistle${entry.duration_sec ? ` · ${entry.duration_sec}s` : ''}`
                : 'Text'}
            </span>
          </span>
          <span>{formatRelativeTime(entry.created_at)}</span>
        </div>
      </div>

      <p className="font-sans text-sm sm:text-[15px] text-[#2b2520] leading-relaxed max-w-[65ch]">
        “{entry.transcript}”
      </p>

      {isVoice && (entry.inference_ms || entry.language) && (
        <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] font-mono text-[#9F9679] uppercase tracking-wider">
          <span>Local WASM</span>
          {entry.language && <span>Lang: {entry.language}</span>}
          {typeof entry.inference_ms === 'number' && (
            <span className="text-[#933B5B]">TTFT: {entry.inference_ms}ms</span>
          )}
        </div>
      )}
    </article>
  );
}
