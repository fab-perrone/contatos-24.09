import React, { useState } from 'react';
import {
  X,
  Download,
  Upload,
  FileSpreadsheet,
  FileCode,
  FileText,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Contact, NewContact } from '../types/contact';
import {
  exportContactsToCSV,
  generateVCard,
  triggerDownload,
} from '../utils/formatters';
import { useToast } from '../context/ToastContext';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  onImportContacts: (newContacts: NewContact[]) => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  contacts,
  onImportContacts,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importedPreview, setImportedPreview] = useState<NewContact[]>([]);
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportCSV = () => {
    const csv = exportContactsToCSV(contacts);
    triggerDownload(csv, `contatos_${contacts.length}_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
    showToast('Exportação concluída', `${contacts.length} contatos exportados em formato CSV.`, 'success');
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(contacts, null, 2);
    triggerDownload(json, `backup_contatos_${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
    showToast('Exportação concluída', 'Backup completo gerado em JSON.', 'success');
  };

  const handleExportVCards = () => {
    const allVCards = contacts.map(generateVCard).join('\r\n\r\n');
    triggerDownload(allVCards, `agenda_completa_${new Date().toISOString().slice(0, 10)}.vcf`, 'text/vcard');
    showToast('vCards gerados', 'Arquivo .vcf pronto para importar no celular ou e-mail.', 'success');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportedPreview([]);

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;

        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            const valid = parsed
              .filter((item) => item && typeof item.name === 'string' && item.name.trim().length > 0)
              .map((item) => ({
                name: item.name.trim(),
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
              }));

            if (valid.length === 0) {
              setImportError('Nenhum contato válido encontrado no arquivo JSON.');
            } else {
              setImportedPreview(valid);
            }
          } else {
            setImportError('O arquivo JSON deve conter um array de contatos.');
          }
        } else {
          // Parse simple CSV
          const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
          if (lines.length < 2) {
            setImportError('O arquivo CSV deve conter cabeçalho e pelo menos um contato.');
            return;
          }

          // Simple CSV line splitter
          const contactsFromCsv: NewContact[] = [];
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map((c) => c.replace(/^"|"$/g, '').trim());
            if (cols[0]) {
              contactsFromCsv.push({
                name: cols[0],
                email: cols[1] || '',
                phone: cols[2] || '',
                secondary_phone: cols[3] || '',
                company: cols[4] || '',
                job_title: cols[5] || '',
                category: (cols[6] as any) || 'outro',
                street: cols[7] || '',
                city: cols[8] || '',
                state: cols[9] || '',
                postal_code: cols[10] || '',
                country: cols[11] || 'Brasil',
                tags: cols[12] ? cols[12].split(';').map((t) => t.trim()) : [],
                favorite: cols[13]?.toUpperCase() === 'SIM',
                notes: cols[14] || '',
              });
            }
          }

          if (contactsFromCsv.length === 0) {
            setImportError('Nenhum contato válido encontrado no arquivo CSV.');
          } else {
            setImportedPreview(contactsFromCsv);
          }
        }
      } catch (err: any) {
        setImportError(`Erro ao ler arquivo: ${err.message}`);
      }
    };

    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (importedPreview.length === 0) return;
    onImportContacts(importedPreview);
    showToast('Importação concluída', `${importedPreview.length} contatos adicionados ao sistema.`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Importar & Exportar</h2>
            <p className="text-xs text-slate-500">Backup, transferência e importação em lote</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('export')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'export'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Exportar Contatos ({contacts.length})
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'import'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Importar Arquivo
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'export' && (
            <div className="space-y-3">
              <div
                onClick={handleExportCSV}
                className="p-4 border border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50/20 transition-all cursor-pointer flex items-center gap-3.5 group"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-semibold text-slate-900">Planilha CSV (.csv)</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Compatível com Excel, Google Planilhas e Numbers</p>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
              </div>

              <div
                onClick={handleExportVCards}
                className="p-4 border border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50/20 transition-all cursor-pointer flex items-center gap-3.5 group"
              >
                <div className="w-10 h-10 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-semibold text-slate-900">Cartões vCard (.vcf)</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Importa direto na agenda do iPhone, Android, Gmail ou Outlook</p>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-sky-600" />
              </div>

              <div
                onClick={handleExportJSON}
                className="p-4 border border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50/20 transition-all cursor-pointer flex items-center gap-3.5 group"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 group-hover:scale-105 transition-transform">
                  <FileCode className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-semibold text-slate-900">Backup Completo (.json)</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Estrutura técnica com todos os campos e metadados</p>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-slate-800" />
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-slate-400 transition-colors">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">Selecione um arquivo .csv ou .json</p>
                <p className="text-[11px] text-slate-400 mt-1 mb-3">Arraste ou clique para carregar</p>
                <label className="inline-block px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 cursor-pointer transition-colors">
                  Escolher Arquivo
                  <input
                    type="file"
                    accept=".csv,.json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {importError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{importError}</span>
                </div>
              )}

              {importedPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-700">
                    <span className="font-semibold flex items-center gap-1.5 text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      {importedPreview.length} contatos prontos para importar
                    </span>
                  </div>

                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50 space-y-1 text-xs">
                    {importedPreview.slice(0, 5).map((c, i) => (
                      <div key={i} className="flex justify-between py-1 px-1.5 bg-white rounded border border-slate-100">
                        <span className="font-medium text-slate-800">{c.name}</span>
                        <span className="text-slate-400">{c.phone || c.email}</span>
                      </div>
                    ))}
                    {importedPreview.length > 5 && (
                      <p className="text-[11px] text-slate-400 text-center py-1">
                        ... e mais {importedPreview.length - 5} contatos
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handleConfirmImport}
                    className="w-full py-2.5 px-4 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                  >
                    Confirmar Importação de {importedPreview.length} Contatos
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
