import { Contact } from '../types/contact';

export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');

  // Brazilian mobile: 11 digits (e.g., 11987654321)
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  // Brazilian landline: 10 digits
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  // 13 digits (with +55)
  if (digits.length === 13 && digits.startsWith('55')) {
    return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }

  return phone;
}

export function getWhatsAppUrl(phone: string, name?: string): string {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 11) {
    digits = `55${digits}`;
  }
  const text = name ? `Olá ${name}, tudo bem?` : 'Olá, tudo bem?';
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function getInitials(name: string): string {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_PALETTES = [
  { bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' },
  { bg: 'bg-teal-100 text-teal-800 border-teal-200', dot: 'bg-teal-500' },
  { bg: 'bg-sky-100 text-sky-800 border-sky-200', dot: 'bg-sky-500' },
  { bg: 'bg-indigo-100 text-indigo-800 border-indigo-200', dot: 'bg-indigo-500' },
  { bg: 'bg-amber-100 text-amber-800 border-amber-200', dot: 'bg-amber-500' },
  { bg: 'bg-rose-100 text-rose-800 border-rose-200', dot: 'bg-rose-500' },
  { bg: 'bg-violet-100 text-violet-800 border-violet-200', dot: 'bg-violet-500' },
];

export function getAvatarPalette(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}

export function formatDate(isoDate?: string): string {
  if (!isoDate) return '';
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return isoDate;
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

export const CATEGORY_LABELS: Record<string, { label: string; textClass: string; dotClass: string }> = {
  trabalho: { label: 'Trabalho', textClass: 'text-indigo-700', dotClass: 'bg-indigo-500' },
  cliente: { label: 'Cliente', textClass: 'text-emerald-700', dotClass: 'bg-emerald-500' },
  pessoal: { label: 'Pessoal', textClass: 'text-sky-700', dotClass: 'bg-sky-500' },
  familia: { label: 'Família', textClass: 'text-amber-700', dotClass: 'bg-amber-500' },
  outro: { label: 'Outro', textClass: 'text-slate-600', dotClass: 'bg-slate-400' },
};

/**
 * Gera um arquivo vCard (.vcf) para download ou compartilhamento
 */
export function generateVCard(c: Contact): string {
  const parts = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${c.name}`,
    `N:${c.name.split(' ').reverse().join(';')};;;`,
    c.email ? `EMAIL;TYPE=INTERNET:${c.email}` : '',
    c.phone ? `TEL;TYPE=CELL:${c.phone}` : '',
    c.secondary_phone ? `TEL;TYPE=WORK:${c.secondary_phone}` : '',
    c.company ? `ORG:${c.company}` : '',
    c.job_title ? `TITLE:${c.job_title}` : '',
    c.street || c.city ? `ADR;TYPE=WORK:;;${c.street || ''};${c.city || ''};${c.state || ''};${c.postal_code || ''};${c.country || 'Brasil'}` : '',
    c.notes ? `NOTE:${c.notes.replace(/\n/g, '\\n')}` : '',
    c.tags && c.tags.length ? `CATEGORIES:${c.tags.join(',')}` : '',
    'END:VCARD',
  ];
  return parts.filter(Boolean).join('\r\n');
}

/**
 * Converte contatos para CSV
 */
export function exportContactsToCSV(contacts: Contact[]): string {
  const headers = [
    'Nome',
    'E-mail',
    'Telefone',
    'Telefone Secundário',
    'Empresa',
    'Cargo',
    'Categoria',
    'Endereço',
    'Cidade',
    'Estado',
    'CEP',
    'País',
    'Tags',
    'Favorito',
    'Notas',
  ];

  const rows = contacts.map((c) => [
    `"${(c.name || '').replace(/"/g, '""')}"`,
    `"${(c.email || '').replace(/"/g, '""')}"`,
    `"${(c.phone || '').replace(/"/g, '""')}"`,
    `"${(c.secondary_phone || '').replace(/"/g, '""')}"`,
    `"${(c.company || '').replace(/"/g, '""')}"`,
    `"${(c.job_title || '').replace(/"/g, '""')}"`,
    `"${(c.category || '').replace(/"/g, '""')}"`,
    `"${(c.street || '').replace(/"/g, '""')}"`,
    `"${(c.city || '').replace(/"/g, '""')}"`,
    `"${(c.state || '').replace(/"/g, '""')}"`,
    `"${(c.postal_code || '').replace(/"/g, '""')}"`,
    `"${(c.country || '').replace(/"/g, '""')}"`,
    `"${(c.tags || []).join('; ')}"`,
    c.favorite ? 'SIM' : 'NÃO',
    `"${(c.notes || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

/**
 * Faz download de arquivo no navegador
 */
export function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
