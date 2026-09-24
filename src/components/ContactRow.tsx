import React from 'react';
import {
  Star,
  Mail,
  Phone,
  MessageCircle,
  Edit2,
  Trash2,
  Eye,
  MapPin,
} from 'lucide-react';
import { Contact } from '../types/contact';
import {
  formatPhoneNumber,
  getWhatsAppUrl,
  getInitials,
  getAvatarPalette,
  CATEGORY_LABELS,
} from '../utils/formatters';

interface ContactRowProps {
  contact: Contact;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onToggleFavorite: (id: string, current: boolean) => void;
  onViewDetails: (contact: Contact) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
}

export const ContactRow: React.FC<ContactRowProps> = ({
  contact,
  isSelected,
  onToggleSelect,
  onToggleFavorite,
  onViewDetails,
  onEdit,
  onDelete,
}) => {
  const palette = getAvatarPalette(contact.name);
  const initials = getInitials(contact.name);
  const categoryInfo = CATEGORY_LABELS[contact.category] || CATEGORY_LABELS.outro;
  const whatsappUrl = contact.phone ? getWhatsAppUrl(contact.phone, contact.name) : null;

  return (
    <tr
      className={`border-b border-slate-100 hover:bg-slate-50/80 transition-colors ${
        isSelected ? 'bg-emerald-50/40' : ''
      }`}
    >
      {/* Checkbox & Favorite */}
      <td className="py-3 px-3 w-10 text-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(contact.id)}
          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 transition-colors cursor-pointer"
        />
      </td>

      <td className="py-3 px-2 w-8 text-center">
        <button
          onClick={() => onToggleFavorite(contact.id, contact.favorite)}
          className="p-1 rounded text-slate-300 hover:text-amber-400 transition-colors"
        >
          <Star
            className={`w-4 h-4 ${
              contact.favorite ? 'fill-amber-400 text-amber-400' : 'text-slate-300 hover:text-amber-400'
            }`}
          />
        </button>
      </td>

      {/* Name & Avatar */}
      <td className="py-3 px-3">
        <div className="flex items-center gap-3">
          {contact.avatar_url ? (
            <img
              src={contact.avatar_url}
              alt={contact.name}
              className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
            />
          ) : (
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs border shrink-0 ${palette.bg}`}
            >
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <button
              onClick={() => onViewDetails(contact)}
              className="font-semibold text-slate-900 text-sm hover:text-emerald-700 text-left truncate block max-w-xs transition-colors"
            >
              {contact.name}
            </button>
            {contact.job_title && (
              <span className="text-xs text-slate-500 truncate block max-w-xs">
                {contact.job_title}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Category */}
      <td className="py-3 px-3 whitespace-nowrap">
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${categoryInfo.textClass}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${categoryInfo.dotClass}`} />
          {categoryInfo.label}
        </span>
      </td>

      {/* Phone & WhatsApp */}
      <td className="py-3 px-3 whitespace-nowrap">
        {contact.phone ? (
          <div className="flex items-center gap-2">
            <a
              href={`tel:${contact.phone}`}
              className="text-xs font-mono text-slate-700 hover:text-emerald-700 transition-colors"
            >
              {formatPhoneNumber(contact.phone)}
            </a>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 p-1 rounded"
                title="Abrir WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )}
      </td>

      {/* Email */}
      <td className="py-3 px-3">
        {contact.email ? (
          <a
            href={`mailto:${contact.email}`}
            className="text-xs text-slate-600 hover:text-emerald-700 truncate max-w-xs block transition-colors"
          >
            {contact.email}
          </a>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )}
      </td>

      {/* Company & Location */}
      <td className="py-3 px-3 hidden md:table-cell">
        <div className="text-xs text-slate-700 truncate max-w-[180px]">
          {contact.company || '—'}
        </div>
        {contact.city && (
          <div className="text-[11px] text-slate-400 truncate flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5 shrink-0" />
            <span>
              {contact.city}
              {contact.state ? `, ${contact.state}` : ''}
            </span>
          </div>
        )}
      </td>

      {/* Actions */}
      <td className="py-3 px-3 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onViewDetails(contact)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            title="Ver Detalhes"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(contact)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            title="Editar Contato"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(contact.id)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
            title="Excluir Contato"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};
