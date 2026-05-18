import { create } from 'zustand';
import { Member, MemberStandup, User } from '@/types';
import { membersApi, standupsApi, organizeStandups, flattenStandups } from '@/services/api';
import { formatDate, getPreviousBusinessDay, toBusinessDate } from '@/utils';
import toast from 'react-hot-toast';

interface AppState {
  // Auth
  user: User | null;
  setUser: (user: User | null) => void;

  // Members
  members: Member[];
  membersLoading: boolean;
  fetchMembers: () => Promise<void>;
  addMember: (member: Omit<Member, 'id' | 'createdAt'>) => Promise<void>;
  updateMember: (member: Member) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;

  // Standups
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  standups: MemberStandup[];
  standupsLoading: boolean;
  hasUnsavedChanges: boolean;
  editVersion: number;
  isSavingStandups: boolean;
  needsResave: boolean;
  isDuplicating: boolean;
  fetchStandups: (date?: string) => Promise<void>;
  updateStandup: (memberId: string, standup: Partial<MemberStandup>) => void;
  saveStandups: () => Promise<void>;
  duplicatePreviousDay: () => Promise<void>;

  // UI
  expandedMembers: Set<string>;
  toggleMember: (memberId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Auth
  user: (() => {
    try {
      const stored = localStorage.getItem('standup_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })(),
  setUser: (user) => {
    if (user) {
      localStorage.setItem('standup_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('standup_user');
    }
    set({ user });
  },

  // Members
  members: [],
  membersLoading: false,
  fetchMembers: async () => {
    set({ membersLoading: true });
    try {
      const { members } = await membersApi.getAll();
      set({ members, membersLoading: false });
    } catch (error) {
      toast.error('Failed to load members');
      set({ membersLoading: false });
      console.error(error);
    }
  },
  addMember: async (memberData) => {
    try {
      const { member } = await membersApi.add(memberData);
      set((state) => ({ members: [...state.members, member] }));
      toast.success('Member added');
    } catch (error) {
      toast.error('Failed to add member');
      console.error(error);
    }
  },
  updateMember: async (member) => {
    try {
      await membersApi.update(member);
      set((state) => ({
        members: state.members.map((m) => (m.id === member.id ? member : m)),
      }));
      toast.success('Member updated');
    } catch (error) {
      toast.error('Failed to update member');
      console.error(error);
    }
  },
  deleteMember: async (id) => {
    try {
      await membersApi.delete(id);
      set((state) => ({
        members: state.members.filter((m) => m.id !== id),
      }));
      toast.success('Member removed');
    } catch (error) {
      toast.error('Failed to remove member');
      console.error(error);
    }
  },

  // Standups
  selectedDate: toBusinessDate(formatDate(new Date())),
  setSelectedDate: (date) => {
    const businessDate = toBusinessDate(date);
    set({ selectedDate: businessDate });
    get().fetchStandups(businessDate);
  },
  standups: [],
  standupsLoading: false,
  hasUnsavedChanges: false,
  editVersion: 0,
  isSavingStandups: false,
  needsResave: false,
  isDuplicating: false,
  fetchStandups: async (date) => {
    const targetDate = date || get().selectedDate;
    set({ standupsLoading: true });
    try {
      const { standups: entries } = await standupsApi.getByDate(targetDate);
      const organized = organizeStandups(entries, get().members);
      set({
        standups: organized,
        standupsLoading: false,
        hasUnsavedChanges: false,
        editVersion: 0,
        expandedMembers: new Set(organized.map((s) => s.memberId)),
      });
    } catch (error) {
      toast.error('Failed to load standups');
      set({ standupsLoading: false });
      console.error(error);
    }
  },
  updateStandup: (memberId, updates) => {
    set((state) => ({
      standups: state.standups.map((s) =>
        s.memberId === memberId ? { ...s, ...updates } : s
      ),
      hasUnsavedChanges: true,
      editVersion: state.editVersion + 1,
    }));
  },
  saveStandups: async () => {
    if (get().isSavingStandups) {
      set({ needsResave: true });
      return;
    }

    set({ isSavingStandups: true });

    try {
      let shouldSaveAgain = true;

      while (shouldSaveAgain) {
        set({ needsResave: false });

        const { standups, selectedDate } = get();
        const entries = flattenStandups(standups, selectedDate);
        await standupsApi.save(selectedDate, entries);

        const latest = get();
        const changedDuringSave =
          latest.standups !== standups || latest.selectedDate !== selectedDate;
        shouldSaveAgain = changedDuringSave || latest.needsResave;

        if (shouldSaveAgain) {
          set({ hasUnsavedChanges: true });
        } else {
          set({ hasUnsavedChanges: false });
          toast.success('Saved!', { duration: 1500 });
        }
      }
    } catch (error) {
      toast.error('Failed to save');
      console.error(error);
    } finally {
      set({ isSavingStandups: false, needsResave: false });
    }
  },
  duplicatePreviousDay: async () => {
    const { selectedDate, isDuplicating, standups } = get();
    if (isDuplicating) return;

    // Check if current day already has content
    const hasContent = standups.some((s) =>
      [...s.yesterday, ...s.today, ...s.blockers, ...s.notes].some(
        (b) => b.text.trim() !== ''
      )
    );
    if (hasContent) {
      toast.error('Current day already has notes. Clear them first to duplicate.');
      return;
    }

    set({ isDuplicating: true });
    try {
      const previousDate = getPreviousBusinessDay(selectedDate);
      await standupsApi.duplicatePreviousDay(selectedDate, previousDate);
      await get().fetchStandups(selectedDate);
      toast.success('Previous day notes duplicated!');
    } catch (error) {
      toast.error('Failed to duplicate');
      console.error(error);
    } finally {
      set({ isDuplicating: false });
    }
  },

  // UI
  expandedMembers: new Set<string>(),
  toggleMember: (memberId) => {
    set((state) => {
      const expanded = new Set(state.expandedMembers);
      if (expanded.has(memberId)) {
        expanded.delete(memberId);
      } else {
        expanded.add(memberId);
      }
      return { expandedMembers: expanded };
    });
  },
  expandAll: () => {
    set((state) => ({
      expandedMembers: new Set(state.standups.map((s) => s.memberId)),
    }));
  },
  collapseAll: () => {
    set({ expandedMembers: new Set() });
  },
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
