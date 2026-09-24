export type ContactCategory = 'trabalho' | 'pessoal' | 'cliente' | 'familia' | 'outro';

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  secondary_phone?: string;
  company?: string;
  job_title?: string;
  category: ContactCategory;
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  notes?: string;
  tags: string[];
  favorite: boolean;
  avatar_url?: string;
  birthdate?: string;
  created_at: string;
  updated_at: string;
}

export type NewContact = Omit<Contact, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  lastTested?: string;
  tableName: string;
}

export type SortField = 'name' | 'company' | 'created_at' | 'updated_at';
export type SortOrder = 'asc' | 'desc';

export interface ContactFilter {
  searchQuery: string;
  category: string;
  selectedTag: string | null;
  onlyFavorites: boolean;
  sortBy: SortField;
  sortOrder: SortOrder;
}
