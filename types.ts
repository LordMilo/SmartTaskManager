export enum Priority {
  URGENT = 'URGENT',
  MEDIUM = 'MEDIUM',
  NORMAL = 'NORMAL',
}

export enum Status {
  TODO = 'TODO',
  DOING = 'DOING',
  DONE = 'DONE',
}

export interface Member {
  id: string;
  name: string;
  avatar: string; // URL to avatar image
  role: string; // Job title e.g. Gardener
  phoneNumber: string; // New field for auth
  isAdmin?: boolean; // New field for permissions
}

export interface Attachment {
  id: string;
  type: 'image' | 'video';
  url: string;
  name: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assigneeId?: string;
  priority: Priority;
  status: Status;
  dueDate: string; // ISO date string
  photoProof?: string; // Legacy field, kept for compatibility
  attachments: Attachment[]; // New field for multiple media
}

export interface Routine {
  id: string;
  title: string;
  defaultPriority: Priority;
  description: string;
}

export type ViewState = 'KANBAN' | 'CALENDAR' | 'TEAM' | 'ROUTINES';

export type Language = 'en' | 'th';