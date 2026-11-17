import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Mic,
  FileText,
  Send,
  Search,
  SlidersHorizontal,
  Database,
  X,
} from 'lucide-react';
import {
  AUTHOR_MAX_LENGTH,
  TRANSCRIPT_MAX_LENGTH,
  VOICEMAIL_ROLES,
  filterVoicemails,
} from '../../lib/voicemailFilters';
import {
  createVoicemail,
  fetchVoicemails,
  getVoicemailStorageMode,
} from '../../lib/voicemailStore';
import { closeWhistleSession } from '../../lib/whistleEngine';
import WhistleRecorderPanel from './WhistleRecorderPanel';
import VoicemailPaperCard from './VoicemailPaperCard';

export default function VoicemailBoxView({ onBackToPortfolio }) {
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [storageMode, setStorageMode] = useState(getVoicemailStorageMode());

  const [inputMode, setInputMode] = useState('whistle'); // 'whistle' | 'text'
  const [authorName, setAuthorName] = useState('');
  const [roleTag, setRoleTag] = useState('Visitor');
  const [transcript, setTranscript] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [voiceMeta, setVoiceMeta] = useState(null);

  const [submitState, setSubmitState] = useState({
    submitting: false,
    error: '',
    success: '',
  });

  const [modeFilter, setModeFilter] = useState('all'); // 'all' | 'whistle' | 'text'
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoadingEntries(true);
      setLoadError('');
      try {
        const res = await fetchVoicemails({ limit: 80, signal: controller.signal });
        setEntries(res.entries);
        setStorageMode(res.source);
      } catch (err) {
        if (err?.name !== 'AbortError') {
          setLoadError(err?.message || 'Unable to load voicemail entries.');
        }
      } finally {
        setLoadingEntries(false);
      }
    }

    load();
    return () => {
      controller.abort();
      closeWhistleSession();
    };
  }, []);

  const filteredEntries = useMemo(
    () =>
      filterVoicemails(entries, {
        mode: modeFilter,
        role: roleFilter,
        query: searchQuery,
      }),
    [entries, modeFilter, roleFilter, searchQuery]
  );

  const hasActiveFilters =
    modeFilter !== 'all' || roleFilter !== 'ALL' || searchQuery.trim().length > 0;

  const handleVoiceTranscript = ({ text, durationSec, inferenceMs, language }) => {
    setTranscript(text);
    setVoiceMeta({ durationSec, inferenceMs, language });
    setSubmitState((prev) => ({ ...prev, error: '', success: '' }));
  };

  const handleModeSwitch = (nextMode) => {
    setInputMode(nextMode);
    if (nextMode === 'text') {
      setVoiceMeta(null);
    }
    setSubmitState((prev) => ({ ...prev, error: '', success: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitState({ submitting: true, error: '', success: '' });

    const effectiveMode = inputMode === 'whistle' && voiceMeta ? 'whistle' : 'text';

    const result = await createVoicemail({
      authorName,
      roleTag,
      inputMode: effectiveMode,
      transcript,
      durationSec: voiceMeta?.durationSec ?? null,
      inferenceMs: voiceMeta?.inferenceMs ?? null,
      language: voiceMeta?.language ?? null,
      honeypot,
    });

    if (!result.ok) {
      setSubmitState({
        submitting: false,
        error: result.error,
        success: '',
      });
      return;
    }

    setEntries((prev) => [result.entry, ...prev]);
    setTranscript('');
    setAuthorName('');
    setVoiceMeta(null);
    setSubmitState({
      submitting: false,
      error: '',
      success:
        result.source === 'supabase'
          ? 'Pinned to the live public voicemail wall.'
          : 'Pinned to local browser storage (connect Supabase .env keys to sync globally).',
    });
  };

  const clearFilters = () => {
    setModeFilter('all');
    setRoleFilter('ALL');
    setSearchQuery('');
  };

  const voiceCount = entries.filter((item) => item.input_mode === 'whistle').length;
  const textCount = entries.filter((item) => item.input_mode === 'text').length;

  return (
    <div className="min-h-screen bg-[#E3D6BF] text-[#2b2520] relative selection:bg-[#B5728A] selection:text-white overflow-x-clip">
      <div
        className="pointer-events-none fixed inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(170, 186, 174, 0.45) 1px, transparent 1px), linear-gradient(to bottom, rgba(170, 186, 174, 0.45) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-6 sm:py-10">
        {/* Top Return & Storage Strip */}
        <header className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-8 border-b border-[#933B5B]/25">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onBackToPortfolio}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md border border-[#933B5B]/40 bg-[#F5EFE0] hover:bg-[#933B5B] text-[#933B5B] hover:text-[#E3D6BF] font-mono text-[11px] uppercase tracking-wider transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back to Portfolio</span>
            </button>
            <span className="hidden sm:inline-block text-[11px] font-mono text-[#9F9679] uppercase tracking-widest">
              Cactus Whistle · Public Voicemail
            </span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#AABAAE] bg-[#F5EFE0] text-[11px] font-mono text-[#933B5B]">
            <Database size={12} className="text-[#B5728A]" />
            <span>
              {storageMode === 'supabase' ? 'SUPABASE LIVE' : 'LOCAL PREVIEW'}
            </span>
          </div>
        </header>

        {/* Editorial Title Block */}
        <div className="mb-8 sm:mb-10 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl sm:text-6xl font-editorial tracking-tight text-[#933B5B] leading-[0.95]">
              Public Voicemail Box
            </h1>
            <p className="mt-3 text-sm sm:text-base text-[#5a523e] max-w-[65ch] font-sans leading-relaxed">
              Record a quick voice note or type a plain message for future visitors. Voice clips
              are transcribed locally in your browser via{' '}
              <span className="font-mono text-xs text-[#933B5B]">Whistle (16.9 MB WASM)</span>{' '}
              so raw audio never leaves your device.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-[#9F9679] shrink-0">
            <span className="text-[#933B5B] font-semibold">{entries.length} TOTAL SLIPS</span>
            <span aria-hidden="true">·</span>
            <span>
              {voiceCount} VOICE · {textCount} TEXT
            </span>
          </div>
        </div>

        {/* Main 12-Column Split: Paper Sheet Composer (Left 5) + Flat Paper Wall (Right 7) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT 5 COLUMNS: Flat Dispatch Slip Sheet */}
          <section
            aria-label="Leave a voicemail or text note"
            className="lg:col-span-5 rounded-lg border border-[#933B5B]/45 bg-[#F5EFE0] overflow-hidden lg:sticky lg:top-6"
          >
            <div className="px-5 py-3 bg-[#933B5B] text-[#E3D6BF] flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-widest font-semibold">
                New Dispatch Slip
              </span>
              <span className="font-mono text-[10px] text-[#E3D6BF]/80 uppercase">
                Publishes Immediately
              </span>
            </div>

            <div className="p-5 sm:p-6 space-y-5">
              {/* Mode Switcher */}
              <div
                role="tablist"
                aria-label="Choose voicemail or plain text input"
                className="grid grid-cols-2 border border-[#AABAAE] rounded-md overflow-hidden"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={inputMode === 'whistle'}
                  onClick={() => handleModeSwitch('whistle')}
                  className={`py-2 px-3 font-mono text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    inputMode === 'whistle'
                      ? 'bg-[#933B5B] text-[#E3D6BF] font-semibold'
                      : 'bg-[#E3D6BF]/40 text-[#933B5B] hover:bg-[#E3D6BF]/70'
                  }`}
                >
                  <Mic size={13} />
                  <span>Mic (Whistle)</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={inputMode === 'text'}
                  onClick={() => handleModeSwitch('text')}
                  className={`py-2 px-3 font-mono text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 border-l border-[#AABAAE] transition-colors cursor-pointer ${
                    inputMode === 'text'
                      ? 'bg-[#933B5B] text-[#E3D6BF] font-semibold'
                      : 'bg-[#E3D6BF]/40 text-[#933B5B] hover:bg-[#E3D6BF]/70'
                  }`}
                >
                  <FileText size={13} />
                  <span>Plain Text</span>
                </button>
              </div>

              {inputMode === 'whistle' && (
                <WhistleRecorderPanel
                  onTranscriptReady={handleVoiceTranscript}
                  onSwitchToPlain={() => handleModeSwitch('text')}
                />
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="vm-transcript"
                      className="text-[11px] font-mono uppercase tracking-wider text-[#933B5B] font-semibold"
                    >
                      {inputMode === 'whistle'
                        ? 'Transcript (editable before posting)'
                        : 'Your Message'}
                    </label>
                    <span
                      className={`text-[10px] font-mono ${
                        transcript.length > TRANSCRIPT_MAX_LENGTH
                          ? 'text-[#933B5B] font-bold'
                          : 'text-[#9F9679]'
                      }`}
                    >
                      {transcript.length} / {TRANSCRIPT_MAX_LENGTH}
                    </span>
                  </div>

                  <textarea
                    id="vm-transcript"
                    rows={4}
                    maxLength={TRANSCRIPT_MAX_LENGTH}
                    value={transcript}
                    onChange={(e) => {
                      setTranscript(e.target.value);
                      setSubmitState((prev) => ({ ...prev, error: '', success: '' }));
                    }}
                    placeholder={
                      inputMode === 'whistle'
                        ? 'Record your voice above. Whistle transcribes it here so you can review or tweak before posting...'
                        : 'Leave a quick hello, feedback on the platformer, or note for other visitors...'
                    }
                    className="w-full rounded-md border border-[#AABAAE] bg-[#E3D6BF]/30 px-3.5 py-2.5 text-sm font-sans text-[#2b2520] placeholder:text-[#9F9679] focus:outline-none focus:border-[#933B5B] focus:bg-[#F5EFE0] resize-none leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="vm-author"
                      className="text-[10px] font-mono uppercase tracking-wider text-[#9F9679] block"
                    >
                      Name / Handle (Optional)
                    </label>
                    <input
                      id="vm-author"
                      type="text"
                      maxLength={AUTHOR_MAX_LENGTH}
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="Anonymous Visitor"
                      className="w-full rounded-md border border-[#AABAAE] bg-[#E3D6BF]/30 px-3 py-2 text-xs font-sans text-[#2b2520] placeholder:text-[#9F9679] focus:outline-none focus:border-[#933B5B]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#9F9679] block">
                      Visitor Tag
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {VOICEMAIL_ROLES.map((role) => {
                        const active = roleTag === role;
                        return (
                          <button
                            key={role}
                            type="button"
                            onClick={() => setRoleTag(role)}
                            className={`px-2 py-1.5 rounded-md text-[10px] font-mono uppercase border transition-colors cursor-pointer ${
                              active
                                ? 'bg-[#933B5B] text-[#E3D6BF] border-[#933B5B]'
                                : 'bg-transparent text-[#5a523e] border-[#AABAAE]/80 hover:border-[#933B5B]/60'
                            }`}
                          >
                            {role}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {submitState.error && (
                  <div
                    role="alert"
                    className="rounded-md border border-[#933B5B]/50 bg-[#B5728A]/15 px-3.5 py-2.5 text-xs font-sans text-[#933B5B] font-medium"
                  >
                    {submitState.error}
                  </div>
                )}

                {submitState.success && (
                  <div
                    role="status"
                    className="rounded-md border border-[#AABAAE] bg-[#AABAAE]/25 px-3.5 py-2.5 text-xs font-sans text-[#2b2520]"
                  >
                    {submitState.success}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitState.submitting || transcript.trim().length < 3}
                  className="w-full py-3 px-5 rounded-md bg-[#933B5B] hover:bg-[#7d304c] disabled:opacity-50 text-[#E3D6BF] font-mono text-xs uppercase tracking-wider font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Send size={14} />
                  <span>
                    {submitState.submitting ? 'Pinning to Wall...' : 'Pin Entry to Public Wall'}
                  </span>
                </button>

                <p className="text-[11px] font-sans text-[#9F9679]">
                  Links, profanity, and rapid spam are automatically filtered before posting.
                </p>

                <input
                  type="text"
                  name="hp_company"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="new-password"
                  aria-hidden="true"
                  className="sr-only"
                />
              </form>
            </div>
          </section>

          {/* RIGHT 7 COLUMNS: Flat Archival Paper Wall */}
          <section
            aria-label="Public voicemail entries"
            className="lg:col-span-7 rounded-lg border border-[#AABAAE] bg-[#F5EFE0] p-5 sm:p-7 space-y-5"
          >
            {/* Search & Filter Toolbar */}
            <div className="space-y-3 pb-4 border-b border-[#AABAAE]/65">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9F9679]"
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search messages or visitor names..."
                    aria-label="Search voicemail entries"
                    className="w-full pl-9 pr-3 py-2 rounded-md border border-[#AABAAE]/80 bg-[#E3D6BF]/30 text-xs font-sans text-[#2b2520] placeholder:text-[#9F9679] focus:outline-none focus:border-[#933B5B]"
                  />
                </div>

                <div className="flex items-center border border-[#AABAAE] rounded-md overflow-hidden shrink-0">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'whistle', label: 'Whistle' },
                    { id: 'text', label: 'Text' },
                  ].map((tab, idx) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setModeFilter(tab.id)}
                      className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors cursor-pointer ${
                        idx > 0 ? 'border-l border-[#AABAAE]' : ''
                      } ${
                        modeFilter === tab.id
                          ? 'bg-[#933B5B] text-[#E3D6BF] font-semibold'
                          : 'bg-transparent text-[#933B5B] hover:bg-[#E3D6BF]/50'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#9F9679] uppercase tracking-wider mr-1">
                    <SlidersHorizontal size={11} /> Role:
                  </span>
                  {['ALL', ...VOICEMAIL_ROLES].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setRoleFilter(role)}
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono uppercase border transition-colors cursor-pointer ${
                        roleFilter === role
                          ? 'bg-[#B5728A] text-[#F5EFE0] border-[#B5728A]'
                          : 'bg-transparent text-[#5a523e] border-[#AABAAE]/70 hover:border-[#933B5B]'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1 text-[10px] font-mono uppercase text-[#933B5B] hover:underline cursor-pointer"
                  >
                    <X size={11} /> Clear
                  </button>
                )}
              </div>
            </div>

            {loadingEntries ? (
              <div className="py-10 text-center font-mono text-xs text-[#9F9679] uppercase tracking-widest">
                Loading paper slips...
              </div>
            ) : loadError ? (
              <div className="py-6 text-sm text-[#933B5B]">{loadError}</div>
            ) : filteredEntries.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <p className="font-editorial text-2xl text-[#933B5B]">No matching paper slips</p>
                <p className="text-xs font-sans text-[#9F9679]">
                  {hasActiveFilters
                    ? 'Try clearing your search or role filters.'
                    : 'Be the first visitor to leave a voicemail or note on the wall.'}
                </p>
              </div>
            ) : (
              <div>
                {filteredEntries.map((entry, idx) => (
                  <VoicemailPaperCard
                    key={entry.id}
                    entry={entry}
                    indexNumber={filteredEntries.length - idx}
                  />
                ))}
              </div>
            )}

            {storageMode === 'local' && (
              <p className="text-[11px] font-mono text-[#9F9679] pt-3 border-t border-[#AABAAE]/55">
                Running in local browser storage preview. Add{' '}
                <code className="text-[#933B5B]">VITE_SUPABASE_URL</code> and{' '}
                <code className="text-[#933B5B]">VITE_SUPABASE_ANON_KEY</code> (plus{' '}
                <code className="text-[#933B5B]">supabase/schema.sql</code>) to share entries
                globally.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
