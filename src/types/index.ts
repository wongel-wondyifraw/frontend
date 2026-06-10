import type { ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  role: string;
  avatar_url?: string | null;
  title?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Member {
  id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: string;
  image_url?: string;
  document_url?: string;
  date_of_birth?: string;
  marital_status?: string;
  baptized?: boolean | string;
  joined_date?: string;
  created_at?: string;
  ministry_members?: MinistryMemberLink[];
}

export interface MinistryMemberLink {
  ministry_id: string;
  joined_at?: string;
  ministry?: Ministry;
}

export interface Ministry {
  id: string;
  name: string;
  about?: string;
  schedule?: string;
  leader_id?: string | null;
  leader?: Pick<Member, 'id' | 'first_name' | 'middle_name' | 'last_name' | 'email' | 'phone'>;
  created_at?: string;
}

export interface MinistryMember {
  member_id: string;
  ministry_id?: string;
  joined_at?: string;
  member?: Member;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface ApiError {
  message: string;
  statusCode?: number;
  status?: number;
}

export interface DashboardStats {
  memberCount: number;
  activeMembers: number;
  inactiveMembers: number;
  ministryCount: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface ApiSearchResult {
  id: string;
  label: string;
  sublabel: string;
  category: 'Members' | 'Ministries' | 'Users';
  path: string;
}

export interface UserContextValue {
  user: User | null;
  loading: boolean;
  avatarVersion: number;
  refreshUser: () => Promise<void>;
  bumpAvatarVersion: () => void;
  logout: () => void;
}

export interface ThemeContextValue {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export interface DashboardProps {
  initialStats?: DashboardStats | null;
}

export interface ManageMembersProps {
  initialPage?: PaginatedResponse<Member> | null;
}

export interface ManageMinistriesProps {
  initialPage?: PaginatedResponse<Ministry> | null;
}

export interface MemberDetailProps {
  memberId?: string;
  initialMember?: Member | null;
}

export interface MinistryDetailProps {
  ministryId?: string;
  initialMinistry?: Ministry | null;
}

export interface DashboardWidget {
  id: string;
  type: string;
  settings?: Record<string, unknown>;
}

export interface DashboardLayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
}

export interface DashboardContextValue {
  isEditMode: boolean;
  widgets: DashboardWidget[];
  layouts: Record<string, DashboardLayoutItem[]>;
  onLayoutChange: (currentLayout: DashboardLayoutItem[], allLayouts: Record<string, DashboardLayoutItem[]>) => void;
  toggleEditMode: () => void;
  addWidget: (type: string, settings?: Record<string, unknown>) => void;
  removeWidget: (id: string) => void;
  saveLayout: () => void;
  cancelEdit: () => void;
  resetLayout: () => void;
}

export interface SearchResult {
  id: string;
  label: string;
  sublabel: string;
  category: string;
  icon: ReactNode;
  action: () => void;
}
