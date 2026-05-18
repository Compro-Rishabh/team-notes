import { Member, StandupEntry, MemberStandup, BulletItem, StandupSection } from '@/types';
import { generateId } from '@/utils';

const API_URL = import.meta.env.VITE_API_URL;
// Domain-restricted GAS URLs (/a/macros/) require Workspace auth — use local fallback
const USE_LOCAL = !API_URL || API_URL.includes('your-deployment-id') || API_URL.includes('/a/macros/');

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

// ─── Remote helpers ─────────────────────────────────────────────────────────
async function apiCall<T>(action: string, params: Record<string, unknown> = {}): Promise<T> {
  const url = new URL(API_URL);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
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

  duplicatePreviousDay: (date: string, previousDate: string): Promise<{ success: boolean }> => {
    if (USE_LOCAL) {
      const all = lsGet<StandupEntry[]>(LS_STANDUPS, []);
      const prev = all.filter((e) => e.date === previousDate);
      if (prev.length === 0) {
        return Promise.reject(new Error('No entries found for previous day'));
      }
      const duped = prev.map((e) => ({ ...e, id: generateId(), date, updatedAt: new Date().toISOString() }));
      lsSet(LS_STANDUPS, [...all, ...duped]);
      return Promise.resolve({ success: true });
    }
    return apiPost<{ success: boolean }>('duplicateDay', { date, previousDate });
  },
};

// Transform raw standup entries into organized member standups
export function organizeStandups(
  entries: StandupEntry[],
  members: Member[]
): MemberStandup[] {
  const activeMembers = members.filter((m) => m.active);

  return activeMembers.map((member) => {
    const memberEntries = entries.filter((e) => e.memberId === member.id);

    const getSectionBullets = (section: StandupSection): BulletItem[] => {
      const sectionEntries = memberEntries
        .filter((e) => e.section === section)
        .sort((a, b) => a.order - b.order);

      if (sectionEntries.length === 0) {
        return [{ id: generateId(), text: '', order: 0 }];
      }

      return sectionEntries.map((e) => ({
        id: e.id,
        text: e.bulletText,
        order: e.order,
      }));
    };

    const latestUpdate = memberEntries.reduce(
      (latest, e) => (e.updatedAt > latest ? e.updatedAt : latest),
      ''
    );

    return {
      memberId: member.id,
      memberName: member.name,
      memberEmail: member.email,
      yesterday: getSectionBullets('yesterday'),
      today: getSectionBullets('today'),
      blockers: getSectionBullets('blockers'),
      notes: getSectionBullets('notes'),
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
    const sections: StandupSection[] = ['yesterday', 'today', 'blockers', 'notes'];
    sections.forEach((section) => {
      const bullets = standup[section];
      bullets.forEach((bullet, index) => {
        if (bullet.text.trim()) {
          entries.push({
            id: bullet.id,
            date,
            memberId: standup.memberId,
            section,
            bulletText: bullet.text,
            order: index,
            updatedAt: now,
          });
        }
      });
    });
  });

  return entries;
}
