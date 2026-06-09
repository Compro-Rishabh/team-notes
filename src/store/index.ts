import { create } from 'zustand';
import { Member, MemberStandup, User } from '@/types';
import { membersApi, standupsApi, organizeStandups, flattenStandups } from '@/services/api';
import { formatDate, generateId, getPreviousBusinessDay, toBusinessDate } from '@/utils';
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
  dirtyMemberIds: Set<string>;
  editVersion: number;
  isSavingStandups: boolean;
  needsResave: boolean;
  fetchStandups: (date?: string) => Promise<void>;
  updateStandup: (memberId: string, standup: Partial<MemberStandup>) => void;
  saveStandups: () => Promise<void>;

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
  dirtyMemberIds: new Set<string>(),
  editVersion: 0,
  isSavingStandups: false,
  needsResave: false,
  fetchStandups: async (date) => {
    const targetDate = date || get().selectedDate;
    set({ standupsLoading: true });
    try {
      const { standups: entries } = await standupsApi.getByDate(targetDate);
      const members = get().members;
      const current = organizeStandups(entries, members);

      // Only carry over from previous day if viewing today and member has no saved entries
      const today = toBusinessDate(formatDate(new Date()));
      const shouldCarryOver = targetDate === today;

      // Track which members have actual saved data for today
      const membersWithSavedData = new Set(entries.map((e) => e.memberId));

      let organized = current;

      if (shouldCarryOver) {
        const previousDate = getPreviousBusinessDay(targetDate);
        const { standups: previousEntries } = await standupsApi.getByDate(previousDate);
        const previous = organizeStandups(previousEntries, members);
        const previousByMember = new Map(previous.map((item) => [item.memberId, item]));

        organized = current.map((item) => {
          // Skip carry-over if this member already has saved data for today
          if (membersWithSavedData.has(item.memberId)) {
            return item;
          }

          const previousForMember = previousByMember.get(item.memberId);
          if (!previousForMember) {
            return item;
        }

        const currentTasks = item.tasks.filter((task) => task.text.trim() !== '');

        const openFromPrevious = previousForMember.tasks.filter(
          (task) => task.text.trim() !== '' && !task.done
        );

        if (openFromPrevious.length === 0) {
          return item;
        }

        const currentTextSet = new Set(
          currentTasks.map((task) => task.text.trim().toLowerCase())
        );
        const carryTasks = openFromPrevious
          .filter((task) => !currentTextSet.has(task.text.trim().toLowerCase()))
          .map((task) => ({
            ...task,
            id: generateId(),
            done: false,
          }));

        const combined = [...currentTasks, ...carryTasks].map((task, index) => ({
          ...task,
          order: index,
        }));

        if (combined.length === 0) {
          return item;
        }

        return {
          ...item,
          tasks: combined,
          updatedAt: item.updatedAt || previousForMember.updatedAt,
        };
        });
      }

      set({
        standups: organized,
        standupsLoading: false,
        hasUnsavedChanges: false,
        dirtyMemberIds: new Set<string>(),
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
      dirtyMemberIds: new Set([...state.dirtyMemberIds, memberId]),
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

        const { standups, selectedDate, dirtyMemberIds } = get();
        const dirtyIds = Array.from(dirtyMemberIds);
        const dirtyStandups = standups.filter((s) => dirtyMemberIds.has(s.memberId));
        const entries = flattenStandups(dirtyStandups, selectedDate);
        await standupsApi.save(selectedDate, entries, dirtyIds);

        const latest = get();
        const changedDuringSave =
          latest.standups !== standups || latest.selectedDate !== selectedDate;
        shouldSaveAgain = changedDuringSave || latest.needsResave;

        if (shouldSaveAgain) {
          set({ hasUnsavedChanges: true });
        } else {
          set({ hasUnsavedChanges: false, dirtyMemberIds: new Set<string>() });
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
