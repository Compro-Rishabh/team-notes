import { Member, StandupEntry, MemberStandup, ChecklistItem } from '@/types';
import { generateId } from '@/utils';

const API_URL = import.meta.env.VITE_API_URL;
// Domain-restricted GAS URLs (/a/macros/) require Workspace auth — use local fallback
let FALLBACK_REASON = '';

if (API_URL === undefined || API_URL === '') {
  FALLBACK_REASON = 'VITE_API_URL is missing.';
} else if (API_URL.includes('your-deployment-id')) {
  FALLBACK_REASON = 'VITE_API_URL still has the placeholder deployment id.';
} else if (API_URL.includes('/a/macros/')) {
  FALLBACK_REASON = 'Domain-restricted Apps Script URL detected (/a/macros/).';
}
const USE_LOCAL = Boolean(FALLBACK_REASON);

if (USE_LOCAL && import.meta.env.DEV) {
  console.warn(`[Team Notes] Using localStorage backend. ${FALLBACK_REASON}`);
}

// ─── LocalStorage helpers (fallback when no backend) ───────────────────────
const LS_MEMBERS = 'standup_members';
const LS_STANDUPS = 'standup_standups';

function lsGet<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}
function lsSet(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function serializeQueryValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return `${value}`;
  }
  return JSON.stringify(value);
}

// ─── Remote helpers ─────────────────────────────────────────────────────────
async function apiCall<T>(action: string, params: Record<string, unknown> = {}): Promise<T> {
  const url = new URL(API_URL);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, serializeQueryValue(value));
    }
  });

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data;
}

async function apiPost<T>(action: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action, ...body }),
  });
  if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data;
}

// ─── Members API ─────────────────────────────────────────────────────────────
export const membersApi = {
  getAll: (): Promise<{ members: Member[] }> => {
    if (USE_LOCAL) {
      return Promise.resolve({ members: lsGet<Member[]>(LS_MEMBERS, []) });
    }
    return apiCall<{ members: Member[] }>('getMembers');
  },

  add: (memberData: Omit<Member, 'id' | 'createdAt'>): Promise<{ member: Member }> => {
    if (USE_LOCAL) {
      const members = lsGet<Member[]>(LS_MEMBERS, []);
      const member: Member = { ...memberData, id: generateId(), createdAt: new Date().toISOString() };
      lsSet(LS_MEMBERS, [...members, member]);
      return Promise.resolve({ member });
    }
    return apiPost<{ member: Member }>('addMember', { member: memberData });
  },

  update: (member: Member): Promise<{ member: Member }> => {
    if (USE_LOCAL) {
      const members = lsGet<Member[]>(LS_MEMBERS, []);
      lsSet(LS_MEMBERS, members.map((m) => (m.id === member.id ? member : m)));
      return Promise.resolve({ member });
    }
    return apiPost<{ member: Member }>('updateMember', { member });
  },

  delete: (id: string): Promise<{ success: boolean }> => {
    if (USE_LOCAL) {
      const members = lsGet<Member[]>(LS_MEMBERS, []);
      lsSet(LS_MEMBERS, members.filter((m) => m.id !== id));
      return Promise.resolve({ success: true });
    }
    return apiPost<{ success: boolean }>('deleteMember', { id });
  },
};

// ─── Standups API ─────────────────────────────────────────────────────────────
export const standupsApi = {
  getByDate: (date: string): Promise<{ standups: StandupEntry[] }> => {
    if (USE_LOCAL) {
      const all = lsGet<StandupEntry[]>(LS_STANDUPS, []);
      return Promise.resolve({ standups: all.filter((e) => e.date === date) });
    }
    return apiCall<{ standups: StandupEntry[] }>('getStandups', { date });
  },

  save: (date: string, entries: StandupEntry[]): Promise<{ success: boolean }> => {
    if (USE_LOCAL) {
      const all = lsGet<StandupEntry[]>(LS_STANDUPS, []);
      const without = all.filter((e) => e.date !== date);
      lsSet(LS_STANDUPS, [...without, ...entries]);
      return Promise.resolve({ success: true });
    }
    return apiPost<{ success: boolean }>('saveStandups', { date, entries });
  },

};

function decodeChecklistText(raw: string): { text: string; done: boolean } {
  if (raw.startsWith('[x] ')) {
    return { text: raw.slice(4), done: true };
  }
  if (raw.startsWith('[ ] ')) {
    return { text: raw.slice(4), done: false };
  }
  return { text: raw, done: false };
}

function encodeChecklistText(item: ChecklistItem): string {
  const prefix = item.done ? '[x] ' : '[ ] ';
  return `${prefix}${item.text}`;
}

// Transform raw standup entries into organized member standups
export function organizeStandups(
  entries: StandupEntry[],
  members: Member[]
): MemberStandup[] {
  const activeMembers = members.filter((m) => m.active);

  return activeMembers.map((member) => {
    const memberEntries = entries.filter((e) => e.memberId === member.id);
    const checklistEntries = [...memberEntries].sort((a, b) => a.order - b.order);

    const tasks: ChecklistItem[] = checklistEntries.length === 0
      ? [{ id: generateId(), text: '', order: 0, done: false }]
      : checklistEntries.map((e) => {
        const parsed = decodeChecklistText(e.bulletText);
        return {
          id: e.id,
          text: parsed.text,
          order: e.order,
          done: parsed.done,
        };
      });

    let latestUpdate = '';
    memberEntries.forEach((entry) => {
      if (entry.updatedAt > latestUpdate) {
        latestUpdate = entry.updatedAt;
      }
    });

    return {
      memberId: member.id,
      memberName: member.name,
      memberEmail: member.email,
      tasks,
      updatedAt: latestUpdate || undefined,
    };
  });
}

// Convert member standups back to flat entries for saving
export function flattenStandups(
  standups: MemberStandup[],
  date: string
): StandupEntry[] {
  const entries: StandupEntry[] = [];
  const now = new Date().toISOString();

  standups.forEach((standup) => {
    standup.tasks.forEach((task, index) => {
      if (task.text.trim()) {
        entries.push({
          id: task.id,
          date,
          memberId: standup.memberId,
          section: 'todo',
          bulletText: encodeChecklistText(task),
          order: index,
          updatedAt: now,
        });
      }
    });
  });

  return entries;
}
