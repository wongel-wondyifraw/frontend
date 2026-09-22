import type { ReactNode } from 'react';

export interface Permission {
  id?: string;
  slug: string;
  name: string;
  category: string;
  description?: string | null;
}

export interface Role {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  is_system: boolean;
  permissions: Permission[];
  created_at?: string;
  updated_at?: string;
}

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
  permissions?: Permission[];
}

export interface Location {
  id: string;
  name: string;
  status: string;
  parent_id?: string | null;
  created_at?: string;
}

export interface PageContent {
  page_slug: string;
  content: any;
  created_at?: string;
  updated_at?: string;
}

export interface CommunityProject {
  id: string;
  title: string;
  description: string;
  image_url?: string | null;
  status: string;
  start_date?: string | null;
  end_date?: string | null;
  created_at?: string;
  updated_at?: string;
}

export function hasPermission(
  user: User | null | undefined,
  slug: string,
): boolean {
  return user?.permissions?.some((p) => p.slug === slug) ?? false;
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
  gender?: string | null;
  baptized?: boolean | string;
  joined_date?: string;
  created_at?: string;
  ministry_members?: MinistryMemberLink[];
  visit_count?: number;
}

export interface MinisterAccount {
  id: string;
  email: string;
  role?: string;
  is_active?: boolean;
  title?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Minister {
  id: string;
  user_id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  status?: string;
  image_url?: string;
  date_of_birth?: string;
  marital_status?: string;
  gender?: string | null;
  title?: string;
  joined_date?: string;
  created_at?: string;
  temporary_password?: string;
  user?: MinisterAccount;
}

export interface MinistryMemberLink {
  ministry_id: string;
  joined_at?: string;
  ministry?: Ministry;
}

export type LeaderType = 'member' | 'minister';

export interface LeaderSummary {
  id: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  title?: string | null;
  type: LeaderType;
}

export interface Ministry {
  id: string;
  name: string;
  about?: string;
  schedule?: string;
  leader_id?: string | null;
  leader_type?: LeaderType | null;
  leader?: LeaderSummary | null;
  created_at?: string;
}

export interface MinistryMember {
  member_id: string;
  ministry_id?: string;
  joined_at?: string;
  member?: Member;
}

export interface HomeGroup {
  id: string;
  name: string;
  about?: string;
  schedule?: string;
  location: string;
  leader_id?: string | null;
  leader_type?: LeaderType | null;
  leader?: LeaderSummary | null;
  created_at?: string;
}

export interface HomeGroupMember {
  member_id: string;
  home_group_id?: string;
  joined_at?: string;
  member?: Member;
}

export type BibleStudyContentType = 'book' | 'study_material';

export interface BibleStudy {
  id: string;
  name: string;
  about?: string;
  schedule?: string;
  location: string;
  content_type: BibleStudyContentType;
  bible_book?: string | null;
  material_url?: string | null;
  leader_id?: string | null;
  leader_type?: LeaderType | null;
  leader?: LeaderSummary | null;
  created_at?: string;
}

export interface BibleStudyMember {
  member_id: string;
  bible_study_id?: string;
  joined_at?: string;
  member?: Member;
}

export type TaskStatus = 'pending' | 'completed' | 'cancelled';

export interface TaskDefinition {
  id: string;
  name: string;
  description?: string | null;
  code?: string | null;
  requires_visit_target: boolean;
  is_system: boolean;
  is_active: boolean;
  created_at?: string;
}

export interface TaskAssignment {
  id: string;
  definition_id: string;
  definition?: TaskDefinition;
  minister_id: string;
  minister?: Pick<Minister, 'id' | 'first_name' | 'middle_name' | 'last_name' | 'email'>;
  assigned_by_user_id?: string | null;
  target_member_id?: string | null;
  target_member?: Pick<Member, 'id' | 'first_name' | 'middle_name' | 'last_name' | 'email' | 'phone'>;
  start_date: string;
  end_date: string;
  status: TaskStatus;
  notes?: string | null;
  visitation_methods?: string[] | null;
  completed_at?: string | null;
  created_at?: string;
}

export interface FamilyChild {
  id: string;
  family_id: string;
  name: string;
  age?: number | null;
  date_of_birth?: string | null;
  created_at?: string;
}

export interface Family {
  id: string;
  name?: string | null;
  husband_id?: string | null;
  husband_type?: LeaderType | null;
  husband_status?: string | null;
  wife_id?: string | null;
  wife_type?: LeaderType | null;
  wife_status?: string | null;
  husband?: LeaderSummary | null;
  wife?: LeaderSummary | null;
  notes?: string | null;
  children?: FamilyChild[];
  created_at?: string;
}

export interface FamilyStats {
  familyCount: number;
  childrenCount: number;
  childrenBelow10: number;
  childrenTeenage: number;
  childrenAbove20: number;
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
  membersThisMonth: number;
  ministerCount: number;
  activeMinisters: number;
  inactiveMinisters: number;
  ministersThisMonth: number;
  ministryCount: number;
  ministriesWithLeader: number;
  ministriesWithoutLeader: number;
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

export interface ManageMinistersProps {
  initialPage?: PaginatedResponse<Minister> | null;
}

export interface ManageMinistriesProps {
  initialPage?: PaginatedResponse<Ministry> | null;
}

export interface ManageHomeGroupsProps {
  initialPage?: PaginatedResponse<HomeGroup> | null;
}

export interface ManageBibleStudiesProps {
  initialPage?: PaginatedResponse<BibleStudy> | null;
}

export interface MemberDetailProps {
  memberId?: string;
  initialMember?: Member | null;
}

export interface MinisterDetailProps {
  ministerId?: string;
  initialMinister?: Minister | null;
}

export interface MinistryDetailProps {
  ministryId?: string;
  initialMinistry?: Ministry | null;
}

export interface HomeGroupDetailProps {
  homeGroupId?: string;
  initialHomeGroup?: HomeGroup | null;
}

export interface FamilyDetailProps {
  familyId?: string;
  initialFamily?: Family | null;
}

export interface BibleStudyDetailProps {
  bibleStudyId?: string;
  initialBibleStudy?: BibleStudy | null;
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
