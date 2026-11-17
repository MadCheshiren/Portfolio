export const VOICEMAIL_ROLES = ['Visitor', 'Developer', 'Recruiter', 'Designer'];
export const VOICEMAIL_MODES = ['whistle', 'text'];

export const TRANSCRIPT_MIN_LENGTH = 3;
export const TRANSCRIPT_MAX_LENGTH = 400;
export const AUTHOR_MAX_LENGTH = 40;
export const POST_COOLDOWN_MS = 20_000;

const COOLDOWN_STORAGE_KEY = 'kirren_vm_last_post_at';

// Word-boundary profanity / abuse filter for immediate public posting
const BLOCKED_TERMS = [
  'fuck',
  'fucking',
  'shit',
  'bitch',
  'asshole',
  'bastard',
  'cunt',
  'dick',
  'pussy',
  'whore',
  'slut',
  'nigger',
  'nigga',
  'faggot',
  'retard',
  'kys',
];

const BLOCKED_PATTERN = new RegExp(`\\b(${BLOCKED_TERMS.join('|')})\\b`, 'i');
const URL_PATTERN = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|gg|ru|xyz|top|click|info)\b)/i;
const REPEATED_CHAR_PATTERN = /(.)\1{7,}/;

/**
 * Collapses repeated whitespace and strips non-printable control characters.
 */
export function normalizeText(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/\p{Cc}/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getRemainingCooldownSeconds() {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem(COOLDOWN_STORAGE_KEY);
    const last = raw ? Number(raw) : 0;
    if (!Number.isFinite(last) || last <= 0) return 0;
    const remaining = POST_COOLDOWN_MS - (Date.now() - last);
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  } catch {
    return 0;
  }
}

export function markPostTimestamp() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(COOLDOWN_STORAGE_KEY, String(Date.now()));
  } catch {
    // Ignore storage quota / privacy mode errors
  }
}

/**
 * Validates and sanitizes an incoming voicemail/note submission before persistence.
 * Mirrors the Postgres CHECK constraints in supabase/schema.sql.
 */
export function validateVoicemailSubmission({
  authorName,
  roleTag,
  inputMode,
  transcript,
  durationSec = null,
  inferenceMs = null,
  language = 'en',
  honeypot = '',
  enforceCooldown = true,
}) {
  if (honeypot && honeypot.trim().length > 0) {
    return { ok: false, error: 'Submission rejected by spam check.' };
  }

  if (enforceCooldown) {
    const waitSeconds = getRemainingCooldownSeconds();
    if (waitSeconds > 0) {
      return {
        ok: false,
        error: `Please wait ${waitSeconds}s before posting another entry.`,
      };
    }
  }

  const cleanTranscript = normalizeText(transcript);
  if (cleanTranscript.length < TRANSCRIPT_MIN_LENGTH) {
    return {
      ok: false,
      error: `Message must be at least ${TRANSCRIPT_MIN_LENGTH} characters.`,
    };
  }
  if (cleanTranscript.length > TRANSCRIPT_MAX_LENGTH) {
    return {
      ok: false,
      error: `Message must stay within ${TRANSCRIPT_MAX_LENGTH} characters.`,
    };
  }

  if (!/[a-zA-Z0-9\p{L}]/u.test(cleanTranscript)) {
    return {
      ok: false,
      error: 'Message must include readable text, not just symbols.',
    };
  }

  if (URL_PATTERN.test(cleanTranscript)) {
    return {
      ok: false,
      error: 'Links and domain URLs are blocked on the public voicemail wall.',
    };
  }

  if (BLOCKED_PATTERN.test(cleanTranscript)) {
    return {
      ok: false,
      error: 'Message triggered the profanity filter. Please keep the wall clean.',
    };
  }

  if (REPEATED_CHAR_PATTERN.test(cleanTranscript)) {
    return {
      ok: false,
      error: 'Message looks like repeated-character spam.',
    };
  }

  const cleanAuthor = normalizeText(authorName) || 'Anonymous Visitor';
  if (cleanAuthor.length > AUTHOR_MAX_LENGTH) {
    return {
      ok: false,
      error: `Name must be ${AUTHOR_MAX_LENGTH} characters or fewer.`,
    };
  }
  if (URL_PATTERN.test(cleanAuthor) || BLOCKED_PATTERN.test(cleanAuthor)) {
    return {
      ok: false,
      error: 'Please enter a valid display name without links or blocked words.',
    };
  }

  const safeRole = VOICEMAIL_ROLES.includes(roleTag) ? roleTag : 'Visitor';
  const safeMode = VOICEMAIL_MODES.includes(inputMode) ? inputMode : 'text';

  let safeDuration = null;
  if (safeMode === 'whistle' && durationSec !== null && durationSec !== undefined) {
    const rounded = Math.max(1, Math.min(30, Math.round(Number(durationSec) || 1)));
    safeDuration = rounded;
  }

  let safeInference = null;
  if (safeMode === 'whistle' && inferenceMs !== null && inferenceMs !== undefined) {
    const val = Math.round(Number(inferenceMs));
    if (Number.isFinite(val) && val >= 0 && val <= 60_000) {
      safeInference = val;
    }
  }

  const safeLanguage = normalizeText(language).slice(0, 12) || (safeMode === 'whistle' ? 'en' : null);

  return {
    ok: true,
    data: {
      author_name: cleanAuthor,
      role_tag: safeRole,
      input_mode: safeMode,
      transcript: cleanTranscript,
      duration_sec: safeDuration,
      inference_ms: safeInference,
      language: safeLanguage,
    },
  };
}

/**
 * Filters public wall entries by mode, role tag, and search text.
 */
export function filterVoicemails(entries, { mode = 'all', role = 'ALL', query = '' } = {}) {
  const q = normalizeText(query).toLowerCase();

  return entries.filter((entry) => {
    if (mode !== 'all' && entry.input_mode !== mode) return false;
    if (role !== 'ALL' && entry.role_tag !== role) return false;
    if (!q) return true;

    const haystack = `${entry.author_name} ${entry.role_tag} ${entry.transcript}`.toLowerCase();
    return haystack.includes(q);
  });
}
