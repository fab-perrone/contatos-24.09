import React from 'react';
import {
  Star,
  Mail,
  Phone,
  MessageCircle,
  Building2,
  MapPin,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
} from 'lucide-react';
import { Contact } from '../types/contact';
import {
  formatPhoneNumber,
  getWhatsAppUrl,
  getInitials,
  getAvatarPalette,
  CATEGORY_LABELS,
} from '../utils/formatters';

interface ContactCardProps {
  contact: Contact;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onToggleFavorite: (id: string, current: boolean) => void;
  onViewDetails: (contact: Contact) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
}

export const ContactCard: React.FC<ContactCardProps> = ({
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
    <div
      className={`group relative rounded-xl border bg-white p-5 transition-all duration-150 flex flex-col justify-between ${
        isSelected
          ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      <div>
        {/* Top bar: Checkbox, Category, Favorite, Menu */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(contact.id)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 transition-colors cursor-pointer"
            />
            {/* Category indicator (clean unboxed text with dot) */}
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${categoryInfo.textClass}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${categoryInfo.dotClass}`} />
              {categoryInfo.label}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onToggleFavorite(contact.id, contact.favorite)}
              className="p-1 rounded-md text-slate-400 hover:text-amber-500 transition-colors"
              title={contact.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <Star
                className={`w-4 h-4 ${
                  contact.favorite ? 'fill-amber-400 text-amber-400' : 'text-slate-300 hover:text-amber-400'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Avatar & Main Info */}
        <div className="flex items-start gap-3.5 mb-3.5">
          {contact.avatar_url ? (
            <img
              src={contact.avatar_url}
              alt={contact.name}
              className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
            />
          ) : (
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm border shrink-0 ${palette.bg}`}
            >
              {initials}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h3
              onClick={() => onViewDetails(contact)}
              className="font-semibold text-slate-900 text-sm leading-tight hover:text-emerald-700 cursor-pointer truncate transition-colors"
            >
              {contact.name}
            </h3>

            {(contact.job_title || contact.company) && (
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {contact.job_title && <span>{contact.job_title}</span>}
                {contact.job_title && contact.company && <span className="mx-1">·</span>}
                {contact.company && <span>{contact.company}</span>}
              </p>
            )}

            {contact.city && (
              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                <MapPin className="w-3 h-3 shrink-0" />
                <span>
                  {contact.city}
                  {contact.state ? `, ${contact.state}` : ''}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Contact communication details */}
        <div className="space-y-1.5 py-2 border-y border-slate-100 text-xs">
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className="flex items-center gap-2 text-slate-600 hover:text-emerald-700 truncate transition-colors"
              title={contact.email}
            >
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{contact.email}</span>
            </a>
          )}

          {contact.phone && (
            <div className="flex items-center justify-between gap-2">
              <a
                href={`tel:${contact.phone}`}
                className="flex items-center gap-2 text-slate-600 hover:text-emerald-700 font-mono text-xs transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{formatPhoneNumber(contact.phone)}</span>
              </a>

              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 p-1 rounded transition-colors"
                  title="Conversar no WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Tags */}
        {contact.tags && contact.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {contact.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded"
              >
                #{tag}
              </span>
            ))}
            {contact.tags.length > 3 && (
              <span className="text-[10px] text-slate-400">
                +{contact.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Action footer */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs">
        <button
          onClick={() => onViewDetails(contact)}
          className="text-xs font-semibold text-slate-700 hover:text-emerald-700 flex items-center gap-1 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          Ver Detalhes
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(contact)}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Editar contato"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(contact.id)}
            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Excluir contato"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
