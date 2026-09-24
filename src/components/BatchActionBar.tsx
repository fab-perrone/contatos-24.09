import React from 'react';
import {
  Trash2,
  Star,
  Download,
  X,
  FolderInput,
} from 'lucide-react';
import { Contact, ContactCategory } from '../types/contact';
import { CATEGORY_LABELS, exportContactsToCSV, triggerDownload } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

interface BatchActionBarProps {
  selectedIds: string[];
  contacts: Contact[];
  onClearSelection: () => void;
  onBatchDelete: (ids: string[]) => void;
  onBatchFavorite: (ids: string[], fav: boolean) => void;
  onBatchChangeCategory: (ids: string[], cat: ContactCategory) => void;
}

export const BatchActionBar: React.FC<BatchActionBarProps> = ({
  selectedIds,
  contacts,
  onClearSelection,
  onBatchDelete,
  onBatchFavorite,
  onBatchChangeCategory,
}) => {
  const { showToast } = useToast();

  if (selectedIds.length === 0) return null;

  const selectedContacts = contacts.filter((c) => selectedIds.includes(c.id));

  const handleExportSelected = () => {
    const csv = exportContactsToCSV(selectedContacts);
    triggerDownload(csv, `contatos_selecionados_${selectedContacts.length}.csv`, 'text/csv');
    showToast('Exportado com sucesso', `${selectedContacts.length} contatos exportados em CSV.`, 'success');
  };

  const handleDelete = () => {
    if (confirm(`Tem certeza que deseja excluir os ${selectedIds.length} contatos selecionados?`)) {
      onBatchDelete(selectedIds);
      showToast('Contatos excluídos', `${selectedIds.length} contatos foram removidos.`, 'success');
      onClearSelection();
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-800 flex items-center gap-3 sm:gap-4 animate-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center gap-2 pl-1 pr-2 border-r border-slate-700">
        <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center font-mono">
          {selectedIds.length}
        </span>
        <span className="text-xs font-medium hidden sm:inline">selecionado(s)</span>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Favorite all */}
        <button
          onClick={() => onBatchFavorite(selectedIds, true)}
          className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 transition-colors flex items-center gap-1.5"
          title="Marcar como favoritos"
        >
          <Star className="w-3.5 h-3.5 fill-amber-400" />
          <span className="hidden md:inline">Favoritar</span>
        </button>

        {/* Change category */}
        <div className="relative group">
          <button
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1.5"
          >
            <FolderInput className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Categoria</span>
          </button>
          <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-1.5 min-w-[140px] space-y-1">
            {Object.entries(CATEGORY_LABELS).map(([catKey, info]) => (
              <button
                key={catKey}
                onClick={() => {
                  onBatchChangeCategory(selectedIds, catKey as ContactCategory);
                  showToast('Categoria atualizada', `Definido como ${info.label} para os contatos selecionados.`, 'success');
                }}
                className="w-full text-left px-2.5 py-1.5 text-xs rounded hover:bg-slate-800 text-slate-200 flex items-center gap-2"
              >
                <span className={`w-2 h-2 rounded-full ${info.dotClass}`} />
                <span>{info.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Export selected */}
        <button
          onClick={handleExportSelected}
          className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1.5"
          title="Exportar selecionados em CSV"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Exportar CSV</span>
        </button>

        {/* Delete selected */}
        <button
          onClick={handleDelete}
          className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white transition-colors flex items-center gap-1.5"
          title="Excluir selecionados"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Excluir</span>
        </button>
      </div>

      {/* Clear button */}
      <button
        onClick={onClearSelection}
        className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
        title="Cancelar seleção"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
