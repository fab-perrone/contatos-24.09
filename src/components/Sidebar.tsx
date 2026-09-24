import React from 'react';
import {
  Users,
  Star,
  Briefcase,
  User,
  Heart,
  Building2,
  Folder,
  Tag,
} from 'lucide-react';
import { Contact, ContactCategory } from '../types/contact';

interface SidebarProps {
  contacts: Contact[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  onlyFavorites: boolean;
  onToggleOnlyFavorites: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  contacts,
  activeCategory,
  onSelectCategory,
  selectedTag,
  onSelectTag,
  onlyFavorites,
  onToggleOnlyFavorites,
}) => {
  // Compute category counts
  const totalCount = contacts.length;
  const favoritesCount = contacts.filter((c) => c.favorite).length;
  const clienteCount = contacts.filter((c) => c.category === 'cliente').length;
  const trabalhoCount = contacts.filter((c) => c.category === 'trabalho').length;
  const pessoalCount = contacts.filter((c) => c.category === 'pessoal').length;
  const familiaCount = contacts.filter((c) => c.category === 'familia').length;
  const outroCount = contacts.filter((c) => c.category === 'outro').length;

  // Extract all unique tags with count
  const tagCounts = contacts.reduce((acc, c) => {
    (c.tags || []).forEach((t) => {
      acc[t] = (acc[t] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);

  const categories = [
    { id: 'all', label: 'Todos os Contatos', icon: Users, count: totalCount },
    { id: 'cliente', label: 'Clientes', icon: Building2, count: clienteCount },
    { id: 'trabalho', label: 'Trabalho & Parceiros', icon: Briefcase, count: trabalhoCount },
    { id: 'pessoal', label: 'Pessoal', icon: User, count: pessoalCount },
    { id: 'familia', label: 'Família', icon: Heart, count: familiaCount },
    { id: 'outro', label: 'Outros', icon: Folder, count: outroCount },
  ];

  return (
    <aside className="w-full lg:w-64 shrink-0 space-y-6">
      {/* Category Navigation */}
      <div>
        <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-3">
          Categorias
        </h3>
        <nav className="space-y-0.5">
          {/* Favorites Filter button */}
          <button
            onClick={onToggleOnlyFavorites}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              onlyFavorites
                ? 'bg-amber-50 text-amber-900 font-semibold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Star className={`w-4 h-4 ${onlyFavorites ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
              <span>Favoritos</span>
            </div>
            <span className="text-slate-400 text-[11px] font-mono tabular-nums">{favoritesCount}</span>
          </button>

          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = !onlyFavorites && activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  if (onlyFavorites) onToggleOnlyFavorites();
                  onSelectCategory(cat.id);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{cat.label}</span>
                </div>
                <span className={`text-[11px] font-mono tabular-nums ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tags Filter */}
      {sortedTags.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2 px-3">
            <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3 h-3" />
              Tags
            </h3>
            {selectedTag && (
              <button
                onClick={() => onSelectTag(null)}
                className="text-[11px] text-emerald-700 hover:text-emerald-900 font-medium"
              >
                Limpar
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 px-3">
            {sortedTags.map(([tag, count]) => {
              const isSelected = selectedTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => onSelectTag(isSelected ? null : tag)}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-600 text-white font-medium shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                  }`}
                >
                  <span>#{tag}</span>
                  <span className={`text-[10px] opacity-75 font-mono`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
};
