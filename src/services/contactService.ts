import { Contact, NewContact } from '../types/contact';
import { INITIAL_CONTACTS } from '../data/mockContacts';
import { getSupabaseClient, getStoredSupabaseConfig } from '../lib/supabase';

const LOCAL_CONTACTS_KEY = 'contacts_local_storage_v1';

export class ContactService {
  /**
   * Retorna os contatos locais armazenados no cache/localStorage
   */
  public static getLocalContacts(): Contact[] {
    try {
      const data = localStorage.getItem(LOCAL_CONTACTS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar contatos do localStorage:', err);
    }

    // Inicializa com dados de demonstração
    this.saveLocalContacts(INITIAL_CONTACTS);
    return INITIAL_CONTACTS;
  }

  /**
   * Salva contatos no cache local
   */
  public static saveLocalContacts(contacts: Contact[]): void {
    try {
      localStorage.setItem(LOCAL_CONTACTS_KEY, JSON.stringify(contacts));
    } catch (err) {
      console.warn('Erro ao salvar contatos no localStorage:', err);
    }
  }

  /**
   * Busca todos os contatos. Se o Supabase estiver conectado, busca do banco;
   * caso contrário, retorna do armazenamento local.
   */
  public static async getAllContacts(): Promise<{ contacts: Contact[]; source: 'supabase' | 'local'; error?: string }> {
    const config = getStoredSupabaseConfig();
    const supabase = getSupabaseClient();

    if (supabase && config.isConnected) {
      try {
        const { data, error } = await supabase
          .from(config.tableName || 'contacts')
          .select('*')
          .order('name', { ascending: true });

        if (error) {
          console.warn('Erro ao buscar contatos do Supabase, caindo para local:', error.message);
          return {
            contacts: this.getLocalContacts(),
            source: 'local',
            error: `Supabase: ${error.message}. Exibindo dados locais.`,
          };
        }

        if (data) {
          const mapped: Contact[] = data.map((item: any) => ({
            id: item.id,
            name: item.name || '',
            email: item.email || '',
            phone: item.phone || '',
            secondary_phone: item.secondary_phone || '',
            company: item.company || '',
            job_title: item.job_title || '',
            category: item.category || 'outro',
            street: item.street || '',
            city: item.city || '',
            state: item.state || '',
            postal_code: item.postal_code || '',
            country: item.country || 'Brasil',
            notes: item.notes || '',
            tags: Array.isArray(item.tags) ? item.tags : [],
            favorite: Boolean(item.favorite),
            avatar_url: item.avatar_url || '',
            birthdate: item.birthdate || '',
            created_at: item.created_at || new Date().toISOString(),
            updated_at: item.updated_at || new Date().toISOString(),
          }));

          // Atualiza cache local
          this.saveLocalContacts(mapped);

          return {
            contacts: mapped,
            source: 'supabase',
          };
        }
      } catch (err: any) {
        console.warn('Falha na requisição ao Supabase:', err);
        return {
          contacts: this.getLocalContacts(),
          source: 'local',
          error: `Falha de rede com o Supabase: ${err.message}`,
        };
      }
    }

    return {
      contacts: this.getLocalContacts(),
      source: 'local',
    };
  }

  /**
   * Adiciona um novo contato
   */
  public static async createContact(newContact: NewContact): Promise<{ contact: Contact; source: 'supabase' | 'local'; error?: string }> {
    const config = getStoredSupabaseConfig();
    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    const contactToInsert: Contact = {
      ...newContact,
      id: newContact.id || (crypto.randomUUID ? crypto.randomUUID() : 'c_' + Math.random().toString(36).substring(2, 9)),
      created_at: now,
      updated_at: now,
    };

    if (supabase && config.isConnected) {
      try {
        const { data, error } = await supabase
          .from(config.tableName || 'contacts')
          .insert([
            {
              id: contactToInsert.id,
              name: contactToInsert.name,
              email: contactToInsert.email,
              phone: contactToInsert.phone,
              secondary_phone: contactToInsert.secondary_phone,
              company: contactToInsert.company,
              job_title: contactToInsert.job_title,
              category: contactToInsert.category,
              street: contactToInsert.street,
              city: contactToInsert.city,
              state: contactToInsert.state,
              postal_code: contactToInsert.postal_code,
              country: contactToInsert.country,
              notes: contactToInsert.notes,
              tags: contactToInsert.tags,
              favorite: contactToInsert.favorite,
              avatar_url: contactToInsert.avatar_url,
              birthdate: contactToInsert.birthdate,
              created_at: contactToInsert.created_at,
              updated_at: contactToInsert.updated_at,
            },
          ])
          .select()
          .single();

        if (error) {
          console.warn('Erro ao inserir contato no Supabase:', error.message);
          // Salva localmente como fallback
          this.insertLocal(contactToInsert);
          return {
            contact: contactToInsert,
            source: 'local',
            error: `Erro Supabase: ${error.message}. Salvo localmente.`,
          };
        }

        const inserted = data ? { ...contactToInsert, ...data } : contactToInsert;
        this.insertLocal(inserted);
        return {
          contact: inserted,
          source: 'supabase',
        };
      } catch (err: any) {
        this.insertLocal(contactToInsert);
        return {
          contact: contactToInsert,
          source: 'local',
          error: `Falha ao salvar no Supabase: ${err.message}. Salvo localmente.`,
        };
      }
    }

    // Apenas local
    this.insertLocal(contactToInsert);
    return {
      contact: contactToInsert,
      source: 'local',
    };
  }

  /**
   * Atualiza um contato existente
   */
  public static async updateContact(contact: Contact): Promise<{ contact: Contact; source: 'supabase' | 'local'; error?: string }> {
    const config = getStoredSupabaseConfig();
    const supabase = getSupabaseClient();
    const updated: Contact = {
      ...contact,
      updated_at: new Date().toISOString(),
    };

    if (supabase && config.isConnected) {
      try {
        const { error } = await supabase
          .from(config.tableName || 'contacts')
          .update({
            name: updated.name,
            email: updated.email,
            phone: updated.phone,
            secondary_phone: updated.secondary_phone,
            company: updated.company,
            job_title: updated.job_title,
            category: updated.category,
            street: updated.street,
            city: updated.city,
            state: updated.state,
            postal_code: updated.postal_code,
            country: updated.country,
            notes: updated.notes,
            tags: updated.tags,
            favorite: updated.favorite,
            avatar_url: updated.avatar_url,
            birthdate: updated.birthdate,
            updated_at: updated.updated_at,
          })
          .eq('id', updated.id);

        if (error) {
          this.updateLocal(updated);
          return {
            contact: updated,
            source: 'local',
            error: `Erro ao atualizar no Supabase: ${error.message}. Atualizado localmente.`,
          };
        }

        this.updateLocal(updated);
        return {
          contact: updated,
          source: 'supabase',
        };
      } catch (err: any) {
        this.updateLocal(updated);
        return {
          contact: updated,
          source: 'local',
          error: `Erro de conexão: ${err.message}. Atualizado localmente.`,
        };
      }
    }

    this.updateLocal(updated);
    return {
      contact: updated,
      source: 'local',
    };
  }

  /**
   * Exclui um contato
   */
  public static async deleteContact(id: string): Promise<{ success: boolean; source: 'supabase' | 'local'; error?: string }> {
    const config = getStoredSupabaseConfig();
    const supabase = getSupabaseClient();

    if (supabase && config.isConnected) {
      try {
        const { error } = await supabase
          .from(config.tableName || 'contacts')
          .delete()
          .eq('id', id);

        if (error) {
          this.deleteLocal(id);
          return {
            success: true,
            source: 'local',
            error: `Erro ao excluir no Supabase: ${error.message}. Removido do cache local.`,
          };
        }

        this.deleteLocal(id);
        return { success: true, source: 'supabase' };
      } catch (err: any) {
        this.deleteLocal(id);
        return { success: true, source: 'local', error: err.message };
      }
    }

    this.deleteLocal(id);
    return { success: true, source: 'local' };
  }

  /**
   * Alterna status de favorito
   */
  public static async toggleFavorite(id: string, currentStatus: boolean): Promise<boolean> {
    const local = this.getLocalContacts();
    const target = local.find((c) => c.id === id);
    if (!target) return currentStatus;

    const updated = { ...target, favorite: !currentStatus, updated_at: new Date().toISOString() };
    await this.updateContact(updated);
    return !currentStatus;
  }

  /**
   * Exclui múltiplos contatos em lote
   */
  public static async deleteMultipleContacts(ids: string[]): Promise<void> {
    const config = getStoredSupabaseConfig();
    const supabase = getSupabaseClient();

    if (supabase && config.isConnected) {
      try {
        await supabase
          .from(config.tableName || 'contacts')
          .delete()
          .in('id', ids);
      } catch (err) {
        console.warn('Erro ao excluir em lote no Supabase:', err);
      }
    }

    const current = this.getLocalContacts();
    const filtered = current.filter((c) => !ids.includes(c.id));
    this.saveLocalContacts(filtered);
  }

  /**
   * Sincroniza todos os contatos do cache local para o Supabase (Upsert em lote)
   */
  public static async syncLocalToSupabase(): Promise<{ count: number; error?: string }> {
    const config = getStoredSupabaseConfig();
    const supabase = getSupabaseClient();

    if (!supabase || !config.isConnected) {
      return { count: 0, error: 'Supabase não está conectado.' };
    }

    const localContacts = this.getLocalContacts();
    if (localContacts.length === 0) {
      return { count: 0 };
    }

    try {
      const records = localContacts.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email || '',
        phone: c.phone || '',
        secondary_phone: c.secondary_phone || '',
        company: c.company || '',
        job_title: c.job_title || '',
        category: c.category || 'outro',
        street: c.street || '',
        city: c.city || '',
        state: c.state || '',
        postal_code: c.postal_code || '',
        country: c.country || 'Brasil',
        notes: c.notes || '',
        tags: c.tags || [],
        favorite: Boolean(c.favorite),
        avatar_url: c.avatar_url || '',
        birthdate: c.birthdate || null,
        created_at: c.created_at,
        updated_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from(config.tableName || 'contacts')
        .upsert(records, { onConflict: 'id' })
        .select('id');

      if (error) {
        return { count: 0, error: error.message };
      }

      return { count: data ? data.length : records.length };
    } catch (err: any) {
      return { count: 0, error: err.message };
    }
  }

  // Métodos auxiliares de sincronização local
  private static insertLocal(contact: Contact): void {
    const current = this.getLocalContacts();
    const exists = current.some((c) => c.id === contact.id);
    const updated = exists ? current.map((c) => (c.id === contact.id ? contact : c)) : [contact, ...current];
    this.saveLocalContacts(updated);
  }

  private static updateLocal(contact: Contact): void {
    const current = this.getLocalContacts();
    const updated = current.map((c) => (c.id === contact.id ? contact : c));
    this.saveLocalContacts(updated);
  }

  private static deleteLocal(id: string): void {
    const current = this.getLocalContacts();
    const updated = current.filter((c) => c.id !== id);
    this.saveLocalContacts(updated);
  }
}
