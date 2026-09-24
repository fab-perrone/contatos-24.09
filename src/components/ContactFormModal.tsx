import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  Building2,
  MapPin,
  FileText,
  Tag,
  Star,
  Plus,
  Trash2,
  Sparkles,
  Camera,
  UploadCloud,
  Loader2,
  Check,
} from 'lucide-react';
import { Contact, ContactCategory, NewContact } from '../types/contact';
import { CATEGORY_LABELS } from '../utils/formatters';
import { uploadAvatarFile } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contact: NewContact) => void;
  initialContact?: Contact | null;
}

export const ContactFormModal: React.FC<ContactFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialContact,
}) => {
  const [formData, setFormData] = useState<NewContact>({
    name: '',
    email: '',
    phone: '',
    secondary_phone: '',
    company: '',
    job_title: '',
    category: 'cliente',
    street: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Brasil',
    notes: '',
    tags: [],
    favorite: false,
    avatar_url: '',
    birthdate: '',
  });

  const { showToast } = useToast();
  const [tagInput, setTagInput] = useState('');
  const [activeTab, setActiveTab] = useState<'geral' | 'endereco' | 'notas'>('geral');
  const [errorName, setErrorName] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleAvatarFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    const res = await uploadAvatarFile(file);
    setIsUploadingAvatar(false);

    if (res.error) {
      showToast('Erro no upload', res.error, 'error');
    } else if (res.url) {
      setFormData((prev) => ({ ...prev, avatar_url: res.url }));
      showToast('Foto adicionada!', 'A imagem foi associada ao contato.', 'success');
    }
  };

  useEffect(() => {
    if (initialContact) {
      setFormData({
        ...initialContact,
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        secondary_phone: '',
        company: '',
        job_title: '',
        category: 'cliente',
        street: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'Brasil',
        notes: '',
        tags: [],
        favorite: false,
        avatar_url: '',
        birthdate: '',
      });
    }
    setErrorName(false);
    setActiveTab('geral');
  }, [initialContact, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorName(true);
      setActiveTab('geral');
      return;
    }

    onSave(formData);
    onClose();
  };

  const handleAddTag = () => {
    const clean = tagInput.trim().replace(/^#/, '');
    if (clean && !formData.tags.includes(clean)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, clean],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
  };

  const commonTagSuggestions = ['VIP', 'Parceiro', 'WhatsApp', 'Contrato', 'Reunião', 'Lead', 'Fornecedor'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {initialContact ? 'Editar Contato' : 'Novo Contato'}
            </h2>
            <p className="text-xs text-slate-500">
              {initialContact
                ? 'Atualize as informações do contato'
                : 'Preencha os campos para salvar no banco de dados'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('geral')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'geral'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Dados Principais & Empresa
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('endereco')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'endereco'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Endereço & Localização
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notas')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'notas'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Notas & Tags
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'geral' && (
            <div className="space-y-4">
              {/* Name & Favorite toggle */}
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome Completo <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (errorName) setErrorName(false);
                      }}
                      placeholder="Ex: Dra. Mariana Costa"
                      className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 ${
                        errorName
                          ? 'border-rose-400 focus:border-rose-500'
                          : 'border-slate-300 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                  {errorName && (
                    <span className="text-xs text-rose-600 mt-1 block">O nome é obrigatório.</span>
                  )}
                </div>

                <div className="pt-6">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, favorite: !formData.favorite })}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                      formData.favorite
                        ? 'bg-amber-50 border-amber-300 text-amber-900'
                        : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        formData.favorite ? 'fill-amber-400 text-amber-500' : 'text-slate-400'
                      }`}
                    />
                    <span>{formData.favorite ? 'Favorito' : 'Favoritar'}</span>
                  </button>
                </div>
              </div>

              {/* Category & Birthday */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as ContactCategory })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 bg-white"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([key, info]) => (
                      <option key={key} value={key}>
                        {info.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data de Nascimento (Opcional)
                  </label>
                  <input
                    type="date"
                    value={formData.birthdate || ''}
                    onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                  />
                </div>
              </div>

              {/* Email & Phones */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    E-mail
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="mariana@exemplo.com.br"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefone Celular / WhatsApp
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+55 11 98452-3310"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Secondary Phone & Avatar URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefone Secundário / Fixo
                  </label>
                  <input
                    type="text"
                    value={formData.secondary_phone || ''}
                    onChange={(e) => setFormData({ ...formData, secondary_phone: e.target.value })}
                    placeholder="+55 11 3244-1100"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Foto de Perfil (Supabase Storage / URL)
                  </label>
                  <div className="flex items-center gap-2">
                    {formData.avatar_url ? (
                      <div className="relative group shrink-0">
                        <img
                          src={formData.avatar_url}
                          alt="Avatar preview"
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, avatar_url: '' })}
                          className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remover foto"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                        <Camera className="w-4 h-4" />
                      </div>
                    )}

                    <div className="flex-1 flex gap-1.5">
                      <input
                        type="url"
                        value={formData.avatar_url || ''}
                        onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                        placeholder="Cole a URL ou envie uma foto..."
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                      />

                      <label className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors flex items-center gap-1.5 shrink-0">
                        {isUploadingAvatar ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                        ) : (
                          <UploadCloud className="w-3.5 h-3.5" />
                        )}
                        <span>{isUploadingAvatar ? 'Enviando...' : 'Upload'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarFileSelected}
                          disabled={isUploadingAvatar}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Company & Job Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Empresa / Organização
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={formData.company || ''}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="TechMed Soluções"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cargo / Função
                  </label>
                  <input
                    type="text"
                    value={formData.job_title || ''}
                    onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                    placeholder="Diretora Médica & Inovação"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'endereco' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Logradouro (Rua, Avenida, Número, Complemento)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={formData.street || ''}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    placeholder="Av. Paulista, 1578, Cj 1204 - Bela Vista"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="São Paulo"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estado (UF)
                  </label>
                  <input
                    type="text"
                    value={formData.state || ''}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="SP"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 uppercase"
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CEP
                  </label>
                  <input
                    type="text"
                    value={formData.postal_code || ''}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    placeholder="01310-200"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    País
                  </label>
                  <input
                    type="text"
                    value={formData.country || 'Brasil'}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="Brasil"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notas' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações & Anotações
                </label>
                <textarea
                  rows={4}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Anotações importantes sobre preferências, reuniões, histórico de atendimento..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tags & Marcadores
                </label>
                <div className="flex gap-2 mb-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="Digite uma tag e pressione Adicionar..."
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar
                  </button>
                </div>

                {/* Suggestions */}
                <div className="flex flex-wrap items-center gap-1.5 mb-3 text-xs text-slate-500">
                  <span className="text-[11px] text-slate-400">Sugestões:</span>
                  {commonTagSuggestions.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => {
                        if (!formData.tags.includes(sug)) {
                          setFormData((prev) => ({ ...prev, tags: [...prev.tags, sug] }));
                        }
                      }}
                      className="text-[11px] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded hover:bg-slate-100 transition-colors"
                    >
                      +{sug}
                    </button>
                  ))}
                </div>

                {/* Selected Tags list */}
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-lg border border-slate-200">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-xs bg-white border border-slate-300 text-slate-700 px-2 py-1 rounded-md shadow-2xs"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
            >
              {initialContact ? 'Salvar Alterações' : 'Cadastrar Contato'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
