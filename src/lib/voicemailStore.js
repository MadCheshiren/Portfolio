import { markPostTimestamp, validateVoicemailSubmission } from './voicemailFilters';

const LOCAL_ENTRIES_KEY = 'kirren_vm_entries_v1';
export const VOICEMAILS_UPDATED_EVENT = 'voicemails:updated';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Starter entries shown only when running in local preview mode before Supabase is wired
const SEED_ENTRIES = [
  {
    id: 'seed-01',
    created_at: '2026-11-15T14:20:00.000Z',
    author_name: 'Maya Chen',
    role_tag: 'Recruiter',
    input_mode: 'whistle',
    transcript:
      'Tested the procedural jump platformer first. Love that every level solves cleanly around your jump arc instead of repeating fixed maps.',
    duration_sec: 9,
    inference_ms: 340,
    language: 'en',
  },
  {
    id: 'seed-02',
    created_at: '2026-11-14T09:45:00.000Z',
    author_name: 'Devon Reyes',
    role_tag: 'Developer',
    input_mode: 'whistle',
    transcript:
      'Running Whistle locally inside a browser worker with zero audio uploaded is such a cool way to prove edge-case engineering.',
    duration_sec: 8,
    inference_ms: 295,
    language: 'en',
  },
  {
    id: 'seed-03',
    created_at: '2026-11-12T18:10:00.000Z',
    author_name: 'Elena Santos',
    role_tag: 'Designer',
    input_mode: 'text',
    transcript:
      'The warm Chalk and Amaranth palette across the 3D bookshelf and drafting ledger feels cohesive from top to footer.',
    duration_sec: null,
    inference_ms: null,
    language: null,
  },
];

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function getVoicemailStorageMode() {
  return isSupabaseConfigured() ? 'supabase' : 'local';
}

function readLocalEntries() {
  if (typeof window === 'undefined') return [...SEED_ENTRIES];
  try {
    const raw = window.localStorage.getItem(LOCAL_ENTRIES_KEY);
    if (!raw) {
      window.localStorage.setItem(LOCAL_ENTRIES_KEY, JSON.stringify(SEED_ENTRIES));
      return [...SEED_ENTRIES];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...SEED_ENTRIES];
  } catch {
    return [...SEED_ENTRIES];
  }
}

function writeLocalEntries(entries) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCAL_ENTRIES_KEY, JSON.stringify(entries));
  } catch {
    // Ignore storage quota / privacy mode errors
  }
}

function notifyUpdated() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(VOICEMAILS_UPDATED_EVENT));
}

function buildSupabaseHeaders(extra = {}) {
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
    ...extra,
  };
  if (SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.startsWith('sb_publishable_')) {
    headers.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
  }
  return headers;
}

/**
 * Fetches approved public voicemail slips ordered newest-first.
 * Falls back to browser localStorage preview entries if Supabase env vars are not configured.
 */
export async function fetchVoicemails({ limit = 50, signal } = {}) {
  if (!isSupabaseConfigured()) {
    const items = readLocalEntries().sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return {
      entries: items.slice(0, limit),
      source: 'local',
    };
  }

  const params = new URLSearchParams({
    select: 'id,created_at,author_name,role_tag,input_mode,transcript,duration_sec,inference_ms,language',
    is_approved: 'eq.true',
    order: 'created_at.desc',
    limit: String(limit),
  });

  const response = await fetch(`${SUPABASE_URL}/rest/v1/voicemails?${params.toString()}`, {
    method: 'GET',
    headers: buildSupabaseHeaders(),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Supabase fetch failed (HTTP ${response.status}).`);
  }

  const data = await response.json();
  return {
    entries: Array.isArray(data) ? data : [],
    source: 'supabase',
  };
}

/**
 * Validates and persists a new voicemail or plain-text entry immediately.
 */
export async function createVoicemail(payload) {
  const checked = validateVoicemailSubmission(payload);
  if (!checked.ok) {
    return { ok: false, error: checked.error };
  }

  if (!isSupabaseConfigured()) {
    const newEntry = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `vm_${Date.now()}`,
      created_at: new Date().toISOString(),
      ...checked.data,
    };
    const next = [newEntry, ...readLocalEntries()];
    writeLocalEntries(next);
    markPostTimestamp();
    notifyUpdated();
    return { ok: true, entry: newEntry, source: 'local' };
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/voicemails`, {
    method: 'POST',
    headers: buildSupabaseHeaders({ Prefer: 'return=representation' }),
    body: JSON.stringify({
      ...checked.data,
      is_approved: true,
    }),
  });

  if (!response.ok) {
    let detail = `Failed to save entry (HTTP ${response.status}).`;
    try {
      const errJson = await response.json();
      if (errJson?.message) detail = errJson.message;
    } catch {
      // Keep generic HTTP error detail
    }
    return { ok: false, error: detail };
  }

  const createdRows = await response.json();
  const entry = Array.isArray(createdRows) ? createdRows[0] : createdRows;
  markPostTimestamp();
  notifyUpdated();
  return { ok: true, entry, source: 'supabase' };
}
