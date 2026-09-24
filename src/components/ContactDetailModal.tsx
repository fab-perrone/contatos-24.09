import React, { useState } from 'react';
import {
  X,
  Mail,
  Phone,
  MessageCircle,
  Building2,
  MapPin,
  Calendar,
  Tag,
  Star,
  Edit2,
  Trash2,
  Copy,
  Check,
  Share2,
  ExternalLink,
  Download,
} from 'lucide-react';
import { Contact } from '../types/contact';
import {
  formatPhoneNumber,
  getWhatsAppUrl,
  getInitials,
  getAvatarPalette,
  CATEGORY_LABELS,
  formatDate,
  generateVCard,
  triggerDownload,
} from '../utils/formatters';
import { useToast } from '../context/ToastContext';

interface ContactDetailModalProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, current: boolean) => void;
}

export const ContactDetailModal: React.FC<ContactDetailModalProps> = ({
  contact,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onToggleFavorite,
}) => {
  const { showToast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen || !contact) return null;

  const palette = getAvatarPalette(contact.name);
  const initials = getInitials(contact.name);
  const categoryInfo = CATEGORY_LABELS[contact.category] || CATEGORY_LABELS.outro;
  const whatsappUrl = contact.phone ? getWhatsAppUrl(contact.phone, contact.name) : null;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    showToast('Copiado!', `${fieldName} copiado para a área de transferência.`, 'success');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleExportVCard = () => {
    const vcard = generateVCard(contact);
    const filename = `${contact.name.replace(/\s+/g, '_')}.vcf`;
    triggerDownload(vcard, filename, 'text/vcard');
    showToast('vCard baixado!', 'Você pode abrir este arquivo no celular ou e-mail.', 'success');
  };

  const addressString = [contact.street, contact.city, contact.state, contact.postal_code]
    .filter(Boolean)
    .join(', ');

  const mapsUrl = addressString
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressString)}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${categoryInfo.textClass}`}>
              <span className={`w-2 h-2 rounded-full ${categoryInfo.dotClass}`} />
              {categoryInfo.label}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onToggleFavorite(contact.id, contact.favorite)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-100 transition-colors"
              title={contact.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <Star
                className={`w-5 h-5 ${
                  contact.favorite ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
                }`}
              />
            </button>
            <button
              onClick={handleExportVCard}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Baixar Cartão vCard (.vcf)"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                onEdit(contact);
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Editar Contato"
            >
              <Edit2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                if (confirm(`Deseja excluir o contato de ${contact.name}?`)) {
                  onDelete(contact.id);
                  onClose();
                }
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Excluir Contato"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contact Hero Area */}
        <div className="p-6 border-b border-slate-100 bg-linear-to-b from-slate-50/50 to-white flex items-start gap-4">
          {contact.avatar_url ? (
            <img
              src={contact.avatar_url}
              alt={contact.name}
              className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-xs"
            />
          ) : (
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl border shadow-xs ${palette.bg}`}
            >
              {initials}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-slate-900 leading-snug">{contact.name}</h2>
            {(contact.job_title || contact.company) && (
              <p className="text-xs text-slate-600 mt-0.5">
                {contact.job_title && <span className="font-medium">{contact.job_title}</span>}
                {contact.job_title && contact.company && <span className="mx-1.5 text-slate-400">·</span>}
                {contact.company && <span>{contact.company}</span>}
              </p>
            )}

            {/* Quick action buttons */}
            <div className="flex flex-wrap items-center gap-2 mt-3.5">
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  WhatsApp
                </a>
              )}

              {contact.phone && (
                <a
                  href={`tel:${contact.phone}`}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  Ligar
                </a>
              )}

              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  Enviar E-mail
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Details Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Contact Details */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              Canais de Contato
            </h4>
            <div className="space-y-2">
              {contact.phone && (
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-400">Celular / WhatsApp</p>
                      <p className="text-xs font-mono font-medium text-slate-800">
                        {formatPhoneNumber(contact.phone)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(contact.phone, 'Telefone')}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded transition-colors"
                    title="Copiar telefone"
                  >
                    {copiedField === 'Telefone' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}

              {contact.secondary_phone && (
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-400">Telefone Secundário / Fixo</p>
                      <p className="text-xs font-mono font-medium text-slate-800">
                        {formatPhoneNumber(contact.secondary_phone)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(contact.secondary_phone!, 'Telefone secundário')}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded transition-colors"
                  >
                    {copiedField === 'Telefone secundário' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}

              {contact.email && (
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-400">E-mail</p>
                      <p className="text-xs font-medium text-slate-800">{contact.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(contact.email, 'E-mail')}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded transition-colors"
                    title="Copiar e-mail"
                  >
                    {copiedField === 'E-mail' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}

              {contact.birthdate && (
                <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400">Aniversário</p>
                    <p className="text-xs font-medium text-slate-800">{formatDate(contact.birthdate)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Location / Address */}
          {addressString && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Endereço
                </h4>
                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-emerald-700 hover:text-emerald-900 font-medium inline-flex items-center gap-1"
                  >
                    Ver no Google Maps <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  {contact.street && <p className="font-medium text-slate-900">{contact.street}</p>}
                  <p className="text-slate-600">
                    {[contact.city, contact.state, contact.postal_code, contact.country]
                      .filter(Boolean)
                      .join(' - ')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {contact.notes && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Anotações
              </h4>
              <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                {contact.notes}
              </div>
            </div>
          )}

          {/* Tags */}
          {contact.tags && contact.tags.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Tags
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {contact.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Criado em: {formatDate(contact.created_at)}</span>
            <span>Atualizado em: {formatDate(contact.updated_at)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
