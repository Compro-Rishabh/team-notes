import { Member, StandupEntry, MemberStandup, ChecklistItem } from '@/types';
import { generateId } from '@/utils';
import { db } from './firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';

// ─── Firestore collections ──────────────────────────────────────────────────
const membersCol = collection(db, 'members');
const standupsCol = collection(db, 'standups');

// ─── Members API ─────────────────────────────────────────────────────────────
export const membersApi = {
  getAll: async (): Promise<{ members: Member[] }> => {
    const snapshot = await getDocs(membersCol);
    const members = snapshot.docs.map((d) => d.data() as Member);
    return { members };
  },

  add: async (memberData: Omit<Member, 'id' | 'createdAt'>): Promise<{ member: Member }> => {
    const member: Member = { ...memberData, id: generateId(), createdAt: new Date().toISOString() };
    await setDoc(doc(membersCol, member.id), member);
    return { member };
  },

  update: async (member: Member): Promise<{ member: Member }> => {
    await setDoc(doc(membersCol, member.id), member);
    return { member };
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    await deleteDoc(doc(membersCol, id));
    return { success: true };
  },
};

// ─── Standups API ─────────────────────────────────────────────────────────────
export const standupsApi = {
  getByDate: async (date: string): Promise<{ standups: StandupEntry[] }> => {
    const q = query(standupsCol, where('date', '==', date));
    const snapshot = await getDocs(q);
    const standups = snapshot.docs.map((d) => d.data() as StandupEntry);
    return { standups };
  },

  save: async (
    date: string,
    entries: StandupEntry[],
    memberIds: string[]
  ): Promise<{ success: boolean }> => {
    // Replace only the edited members for the selected date.
    // This avoids wiping unrelated members' standups in concurrent sessions.
    const memberIdSet = new Set(memberIds);

    if (memberIdSet.size === 0) {
      return { success: true };
    }

    const q = query(standupsCol, where('date', '==', date));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => {
      const data = d.data() as StandupEntry;
      if (memberIdSet.has(data.memberId)) {
        batch.delete(d.ref);
      }
    });

    // Add new entries for edited members
    entries.forEach((entry) => {
      batch.set(doc(standupsCol, entry.id), entry);
    });

    await batch.commit();
    return { success: true };
  },
};



// Transform raw standup entries into organized member standups
export function organizeStandups(
  entries: StandupEntry[],
  members: Member[]
): MemberStandup[] {
  const activeMembers = members
    .filter((m) => m.active)
    .sort((a, b) => a.name.localeCompare(b.name));

  return activeMembers.map((member) => {
    const memberEntries = entries.filter((e) => e.memberId === member.id);
    const checklistEntries = [...memberEntries].sort((a, b) => a.order - b.order);

    const tasks: ChecklistItem[] = checklistEntries.length === 0
      ? [{ id: generateId(), text: '', order: 0, done: false }]
      : checklistEntries.map((e) => {
          // Handle legacy data with [x]/[ ] prefixes
          let text = e.bulletText;
          let done = e.isMarked ?? false;
          if (text.startsWith('[x] ')) { text = text.slice(4); done = true; }
          else if (text.startsWith('[ ] ')) { text = text.slice(4); }
          return { id: e.id, text, order: e.order, done };
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
        const expiresAt = task.done
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          : undefined;
        entries.push({
          id: task.id,
          date,
          memberId: standup.memberId,
          section: 'todo',
          bulletText: task.text,
          isMarked: task.done,
          order: index,
          updatedAt: now,
          ...(expiresAt && { expiresAt }),
        });
      }
    });
  });

  return entries;
}
