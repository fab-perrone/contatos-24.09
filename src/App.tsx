import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';
import { Contact, ContactCategory, NewContact, SortField, SortOrder } from './types/contact';
import { ContactService } from './services/contactService';
import { ToastProvider, useToast } from './context/ToastContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ContactCard } from './components/ContactCard';
import { ContactRow } from './components/ContactRow';
import { ContactFormModal } from './components/ContactFormModal';
import { ContactDetailModal } from './components/ContactDetailModal';
import { BatchActionBar } from './components/BatchActionBar';
import { ImportExportModal } from './components/ImportExportModal';

function MainApp() {
  const { showToast } = useToast();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [storageSource, setStorageSource] = useState<'supabase' | 'local'>('local');

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Multi-selection for batch actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals state
  const [isContactFormModalOpen, setIsContactFormModalOpen] = useState<boolean>(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [viewingContact, setViewingContact] = useState<Contact | null>(null);
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState<boolean>(false);

  // Load contacts
  const loadContacts = async () => {
    setIsLoading(true);
    const result = await ContactService.getAllContacts();
    setContacts(result.contacts);
    setStorageSource(result.source);
    setIsLoading(false);

    if (result.error) {
      showToast('Aviso de Armazenamento', result.error, 'info');
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  // Create contact
  const handleSaveContact = async (contactData: NewContact) => {
    if (editingContact) {
      const updated: Contact = {
        ...editingContact,
        ...contactData,
        id: editingContact.id,
      };
      const res = await ContactService.updateContact(updated);
      setContacts((prev) => prev.map((c) => (c.id === updated.id ? res.contact : c)));
      showToast('Contato atualizado!', `${res.contact.name} foi atualizado com sucesso.`, 'success');
      setEditingContact(null);
    } else {
      const res = await ContactService.createContact(contactData);
      setContacts((prev) => [res.contact, ...prev]);
      showToast('Contato cadastrado!', `${res.contact.name} foi salvo com sucesso.`, 'success');
    }
  };

  // Delete contact
  const handleDeleteContact = async (id: string) => {
    await ContactService.deleteContact(id);
    setContacts((prev) => prev.filter((c) => c.id !== id));
    setSelectedIds((prev) => prev.filter((item) => item !== id));
    showToast('Contato removido', 'O contato foi excluído do sistema.', 'info');
  };

  // Toggle favorite
  const handleToggleFavorite = async (id: string, current: boolean) => {
    const newStatus = !current;
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, favorite: newStatus } : c))
    );
    await ContactService.toggleFavorite(id, current);
  };

  // Selection toggle
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Select all visible
  const handleSelectAllVisible = (filteredList: Contact[]) => {
    if (selectedIds.length === filteredList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredList.map((c) => c.id));
    }
  };

  // Batch delete
  const handleBatchDelete = async (ids: string[]) => {
    await ContactService.deleteMultipleContacts(ids);
    setContacts((prev) => prev.filter((c) => !ids.includes(c.id)));
    setSelectedIds([]);
  };

  // Batch favorite
  const handleBatchFavorite = async (ids: string[], fav: boolean) => {
    const updatedList = contacts.map((c) =>
      ids.includes(c.id) ? { ...c, favorite: fav } : c
    );
    setContacts(updatedList);
    for (const id of ids) {
      const target = contacts.find((c) => c.id === id);
      if (target) {
        await ContactService.updateContact({ ...target, favorite: fav });
      }
    }
    showToast('Atualização em lote', `${ids.length} contatos atualizados.`, 'success');
  };

  // Batch change category
  const handleBatchChangeCategory = async (ids: string[], category: ContactCategory) => {
    const updatedList = contacts.map((c) =>
      ids.includes(c.id) ? { ...c, category } : c
    );
    setContacts(updatedList);
    for (const id of ids) {
      const target = contacts.find((c) => c.id === id);
      if (target) {
        await ContactService.updateContact({ ...target, category });
      }
    }
  };

  // Import contacts
  const handleImportContacts = async (newContacts: NewContact[]) => {
    for (const item of newContacts) {
      const res = await ContactService.createContact(item);
      setContacts((prev) => [res.contact, ...prev]);
    }
  };

  // Filtered and sorted contacts
  const filteredContacts = useMemo(() => {
    return contacts
      .filter((contact) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = contact.name.toLowerCase().includes(q);
          const matchEmail = (contact.email || '').toLowerCase().includes(q);
          const matchPhone = (contact.phone || '').replace(/\D/g, '').includes(q.replace(/\D/g, ''));
          const matchCompany = (contact.company || '').toLowerCase().includes(q);
          const matchNotes = (contact.notes || '').toLowerCase().includes(q);
          const matchTags = (contact.tags || []).some((t) => t.toLowerCase().includes(q));

          if (!matchName && !matchEmail && !matchPhone && !matchCompany && !matchNotes && !matchTags) {
            return false;
          }
        }

        // Category filter
        if (activeCategory !== 'all' && contact.category !== activeCategory) {
          return false;
        }

        // Favorites only
        if (onlyFavorites && !contact.favorite) {
          return false;
        }

        // Tag filter
        if (selectedTag && !(contact.tags || []).includes(selectedTag)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'name') {
          comparison = a.name.localeCompare(b.name, 'pt-BR');
        } else if (sortBy === 'company') {
          comparison = (a.company || '').localeCompare(b.company || '', 'pt-BR');
        } else if (sortBy === 'created_at') {
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        } else if (sortBy === 'updated_at') {
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        }

        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [contacts, searchQuery, activeCategory, onlyFavorites, selectedTag, sortBy, sortOrder]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenNewContactModal={() => {
          setEditingContact(null);
          setIsContactFormModalOpen(true);
        }}
        onOpenImportExportModal={() => setIsImportExportModalOpen(true)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        totalContacts={contacts.length}
      />

      {/* Main Workspace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <Sidebar
          contacts={contacts}
          activeCategory={activeCategory}
          onSelectCategory={(cat) => {
            setActiveCategory(cat);
            setOnlyFavorites(false);
          }}
          selectedTag={selectedTag}
          onSelectTag={setSelectedTag}
          onlyFavorites={onlyFavorites}
          onToggleOnlyFavorites={() => setOnlyFavorites(!onlyFavorites)}
        />

        {/* Content Area */}
        <main className="flex-1 min-w-0 space-y-4">
          {/* Subheader Toolbar: Counts, Select All, Sort */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-3">
              {filteredContacts.length > 0 && (
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={
                      filteredContacts.length > 0 &&
                      selectedIds.length === filteredContacts.length
                    }
                    onChange={() => handleSelectAllVisible(filteredContacts)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                  />
                  <span>Selecionar todos ({filteredContacts.length})</span>
                </label>
              )}

              {/* Active filters pill */}
              {(searchQuery || selectedTag || onlyFavorites || activeCategory !== 'all') && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 pl-2 border-l border-slate-200">
                  <span>Filtrando por:</span>
                  {onlyFavorites && <span className="font-medium text-amber-700">Favoritos</span>}
                  {activeCategory !== 'all' && <span className="font-medium text-slate-800">Categoria: {activeCategory}</span>}
                  {selectedTag && <span className="font-medium text-emerald-700">#{selectedTag}</span>}
                  {searchQuery && <span className="font-medium text-slate-800">"{searchQuery}"</span>}
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setActiveCategory('all');
                      setSelectedTag(null);
                      setOnlyFavorites(false);
                    }}
                    className="text-xs text-rose-600 hover:underline ml-1 font-medium"
                  >
                    Limpar
                  </button>
                </div>
              )}
            </div>

            {/* Sorting controls */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 hidden sm:inline flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5" />
                Ordenar por:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortField)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer"
              >
                <option value="name">Nome (Alfabético)</option>
                <option value="company">Empresa</option>
                <option value="created_at">Data de Criação</option>
                <option value="updated_at">Última Atualização</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors text-xs font-mono uppercase"
                title={sortOrder === 'asc' ? 'Crescente (A-Z)' : 'Decrescente (Z-A)'}
              >
                {sortOrder === 'asc' ? 'Asc ↑' : 'Desc ↓'}
              </button>
            </div>
          </div>

          {/* Loading state */}
          {isLoading ? (
            <div className="p-16 text-center bg-white rounded-xl border border-slate-200 space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Carregando contatos...</p>
              <p className="text-xs text-slate-400">Consultando base de dados</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            /* Empty State */
            <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-300 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">Nenhum contato encontrado</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery || activeCategory !== 'all' || selectedTag || onlyFavorites
                  ? 'Nenhum resultado corresponde aos filtros aplicados. Tente ajustar os termos de busca.'
                  : 'Sua lista de contatos está vazia. Comece cadastrando seu primeiro contato agora mesmo!'}
              </p>
              <div className="pt-2 flex justify-center gap-2">
                {searchQuery || activeCategory !== 'all' || selectedTag || onlyFavorites ? (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setActiveCategory('all');
                      setSelectedTag(null);
                      setOnlyFavorites(false);
                    }}
                    className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Limpar Filtros
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setEditingContact(null);
                      setIsContactFormModalOpen(true);
                    }}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Contato
                  </button>
                )}
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredContacts.map((contact) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  isSelected={selectedIds.includes(contact.id)}
                  onToggleSelect={handleToggleSelect}
                  onToggleFavorite={handleToggleFavorite}
                  onViewDetails={(c) => setViewingContact(c)}
                  onEdit={(c) => {
                    setEditingContact(c);
                    setIsContactFormModalOpen(true);
                  }}
                  onDelete={handleDeleteContact}
                />
              ))}
            </div>
          ) : (
            /* List/Table View */
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-3 w-10 text-center">
                        <span className="sr-only">Seleção</span>
                      </th>
                      <th className="py-3 px-2 w-8 text-center">
                        <span className="sr-only">Favorito</span>
                      </th>
                      <th className="py-3 px-3">Nome & Cargo</th>
                      <th className="py-3 px-3">Categoria</th>
                      <th className="py-3 px-3">Telefone</th>
                      <th className="py-3 px-3">E-mail</th>
                      <th className="py-3 px-3 hidden md:table-cell">Empresa & Cidade</th>
                      <th className="py-3 px-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContacts.map((contact) => (
                      <ContactRow
                        key={contact.id}
                        contact={contact}
                        isSelected={selectedIds.includes(contact.id)}
                        onToggleSelect={handleToggleSelect}
                        onToggleFavorite={handleToggleFavorite}
                        onViewDetails={(c) => setViewingContact(c)}
                        onEdit={(c) => {
                          setEditingContact(c);
                          setIsContactFormModalOpen(true);
                        }}
                        onDelete={handleDeleteContact}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Floating Batch Action Bar */}
      <BatchActionBar
        selectedIds={selectedIds}
        contacts={contacts}
        onClearSelection={() => setSelectedIds([])}
        onBatchDelete={handleBatchDelete}
        onBatchFavorite={handleBatchFavorite}
        onBatchChangeCategory={handleBatchChangeCategory}
      />

      {/* Modals */}
      <ContactFormModal
        isOpen={isContactFormModalOpen}
        onClose={() => {
          setIsContactFormModalOpen(false);
          setEditingContact(null);
        }}
        onSave={handleSaveContact}
        initialContact={editingContact}
      />

      <ContactDetailModal
        contact={viewingContact}
        isOpen={Boolean(viewingContact)}
        onClose={() => setViewingContact(null)}
        onEdit={(c) => {
          setViewingContact(null);
          setEditingContact(c);
          setIsContactFormModalOpen(true);
        }}
        onDelete={handleDeleteContact}
        onToggleFavorite={handleToggleFavorite}
      />

      <ImportExportModal
        isOpen={isImportExportModalOpen}
        onClose={() => setIsImportExportModalOpen(false)}
        contacts={contacts}
        onImportContacts={handleImportContacts}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}
