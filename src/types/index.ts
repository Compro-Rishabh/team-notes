export interface Member {
  id: string;
  name: string;
  email: string;
  active: boolean;
  createdAt: string;
}

export interface BulletItem {
  id: string;
  text: string;
  order: number;
}

export interface ChecklistItem extends BulletItem {
  done: boolean;
}

export interface StandupEntry {
  id: string;
  date: string;
  memberId: string;
  section: StandupSection;
  bulletText: string;
  order: number;
  updatedAt: string;
}

export type StandupSection = 'todo' | 'yesterday' | 'today' | 'blockers' | 'notes';

export interface MemberStandup {
  memberId: string;
  memberName: string;
  memberEmail: string;
  tasks: ChecklistItem[];
  updatedAt?: string;
}

export interface User {
  email: string;
  name: string;
  picture: string;
}
