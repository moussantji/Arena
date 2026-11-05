/** Types des données échangées avec l'API Kalanso. */

export type Role = 'direction' | 'secretariat' | 'comptable' | 'enseignant' | 'parent';

export interface UserPhoto {
  id: number;
  user_id: number;
  filename: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  is_creator?: boolean;
  photos?: UserPhoto[];
}

export interface Child {
  id: number;
  matricule: string | null;
  first_name: string;
  last_name: string;
  gender: string | null;
  school_class_id: number | null;
  status: string | null;
  is_active?: boolean;
  school_class?: SchoolClassSummary | null;
  photos?: { id: number; student_id: number; filename: string }[];
}

export interface SchoolClassSummary {
  id: number;
  name: string;
  level: string | null;
  room?: string | null;
}

export interface Subject {
  id: number;
  name: string;
  code: string | null;
  coefficient: string | number;
  department?: { id: number; name: string; code: string | null } | null;
}

export interface Term {
  id: number;
  name: string;
  starts_on: string | null;
  ends_on: string | null;
  is_current: boolean;
  locked_at?: string | null;
}

export interface ParentMeta {
  school: { id: number; name: string } | null;
  academic_year: { id: number; label: string } | null;
  term: Term | null;
  terms: Term[];
}

export interface BulletinSubject {
  subject_id: number;
  subject: string | null;
  code: string | null;
  coefficient: number;
  average: number;
  grades: {
    evaluation: string;
    score: number;
    max_score: number;
    evaluated_on: string | null;
  }[];
}

export interface Bulletin {
  student: Child & { school_class?: SchoolClassSummary | null };
  term: Term | null;
  subjects: BulletinSubject[];
  general_average: number | null;
  total_coefficients: number;
  rank: number | null;
  class_size: number;
  mention: string | null;
}

export interface ParentAbsence {
  id: number;
  date: string;
  starts_at: string | null;
  ends_at: string | null;
  reason: string | null;
  is_justified: boolean;
  justification: string | null;
  class: string | null;
  term_id: number | null;
}

export interface ParentAbsencesResponse {
  term: Term | null;
  absences: ParentAbsence[];
  summary: { total: number; justified: number; unjustified: number };
}

export interface InvoicePayment {
  id: number;
  amount: number;
  method: string | null;
  paid_on: string | null;
  reference: string | null;
  status: string;
}

export interface ParentInvoice {
  id: number;
  reference: string | null;
  fee_type: string | null;
  term: string | null;
  issued_on: string | null;
  due_on: string | null;
  amount: number;
  status: string;
  paid_total: number;
  remaining: number;
  payments: InvoicePayment[];
}

export interface ParentFinancesResponse {
  invoices: ParentInvoice[];
  summary: {
    total_due: number;
    total_paid: number;
    outstanding: number;
    pending_count: number;
  };
}

export interface GradesPage {
  data: Record<string, unknown>[];
  current_page: number;
  last_page: number;
  total: number;
}

export interface StudentListPage {
  data: StudentRow[];
  current_page: number;
  last_page: number;
  total: number;
  stats?: { total: number; unjustified: number; justified_rate: number };
}

export interface StudentRow {
  id: number;
  matricule: string | null;
  first_name: string;
  last_name: string;
  gender: string | null;
  school_class_id: number | null;
  school_class?: SchoolClassSummary | null;
  status: string | null;
  average?: number | null;
  balance?: number | null;
  photos?: { id: number; student_id: number; filename: string }[];
}

export interface DashboardResponse {
  school: { id: number; name: string } | null;
  kpis: { students: number; attendance: number; recovery: number | null; classes: number };
  recovery_series: { month: string; label: string; total: number }[];
  class_distribution: { label: string; value: number }[];
  today: {
    id: number;
    starts_at: string | null;
    ends_at: string | null;
    subject?: { id: number; name: string } | null;
    schoolClass?: { id: number; name: string; room: string | null } | null;
    staff?: { id: number; first_name: string; last_name: string } | null;
  }[];
  recent_students: {
    id: number;
    first_name: string;
    last_name: string;
    matricule: string | null;
    status: string | null;
    school_class?: { name: string } | null;
  }[];
  notifications: { id: number; title?: string; body?: string; created_at: string | null }[];
}

export interface FinanceSummary {
  invoiced: number;
  collected: number;
  outstanding: number;
  overdue: number;
  monthly: { month: string; label: string; total: number; payments: number }[];
  byMethod: { method: string; total: number; payments: number }[];
  byFeeType: { fee: string; code: string | null; invoiced: number }[];
  statusBreakdown: { status: string; count: number; total: number }[];
}

export interface ParentAccount {
  id: number;
  name: string;
  email: string;
  role: Role;
  is_creator?: boolean;
  created_at: string | null;
  children: { id: number; name: string; matricule: string | null }[];
}

export interface Message {
  id: number;
  message_thread_id: number;
  sender_type: string;
  sender_id: number | null;
  sender_name: string | null;
  body: string;
  sent_at: string | null;
  read_at: string | null;
}

export interface Thread {
  id: number;
  subject: string;
  type: 'parent' | 'internal';
  created_by: number | null;
  last_message_at: string | null;
  is_archived: boolean;
  creator?: { id: number; name: string } | null;
  latestMessage?: Message | null;
  unread_count?: number;
  messages?: Message[];
}

export interface TimetableSlot {
  id: number;
  day_of_week: number;
  starts_at: string;
  ends_at: string;
  room: string | null;
  is_live?: boolean;
  subject?: { id: number; name: string; code: string | null } | null;
  staff?: { id: number; first_name: string; last_name: string } | null;
  schoolClass?: { id: number; name: string; level: string | null; room: string | null } | null;
  term?: { id: number; name: string } | null;
}

export interface TimetableResponse {
  slots: TimetableSlot[];
  days: { day: number; label: string; slots: TimetableSlot[] }[];
}
