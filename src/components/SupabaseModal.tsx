import React, { useState, useEffect } from 'react';
import {
  Database,
  X,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  UploadCloud,
  DownloadCloud,
  Key,
  Globe,
  Trash2,
} from 'lucide-react';
import {
  getStoredSupabaseConfig,
  saveStoredSupabaseConfig,
  clearStoredSupabaseConfig,
  testSupabaseConnection,
  SUPABASE_TABLE_SQL,
  ConnectionTestResult,
} from '../lib/supabase';
import { ContactService } from '../services/contactService';
import { useToast } from '../context/ToastContext';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChanged: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  onConfigChanged,
}) => {
  const { showToast } = useToast();
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'sql' | 'sync'>('config');

  useEffect(() => {
    if (isOpen) {
      const config = getStoredSupabaseConfig();
      setUrl(config.url || '');
      setAnonKey(config.anonKey || '');
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    if (!url.trim() || !anonKey.trim()) {
      showToast('Campos incompletos', 'Informe a URL do Supabase e a Chave Anon.', 'error');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const result = await testSupabaseConnection(url, anonKey);
    setIsTesting(false);
    setTestResult(result);

    if (result.success && result.tableExists) {
      saveStoredSupabaseConfig({
        url: url.trim(),
        anonKey: anonKey.trim(),
        isConnected: true,
        lastTested: new Date().toISOString(),
      });
      showToast('Conectado ao Supabase!', 'O banco de dados está pronto para armazenar seus contatos.', 'success');
      onConfigChanged();
    } else if (result.success && !result.tableExists) {
      // Credenciais válidas, mas precisa criar a tabela
      saveStoredSupabaseConfig({
        url: url.trim(),
        anonKey: anonKey.trim(),
        isConnected: false,
        lastTested: new Date().toISOString(),
      });
      setActiveTab('sql');
      showToast('Conexão autorizada', 'Agora crie a tabela contacts executando o script SQL.', 'info');
      onConfigChanged();
    } else {
      showToast('Falha na conexão', result.message, 'error');
    }
  };

  const handleSave = () => {
    if (!url.trim() || !anonKey.trim()) {
      showToast('Atenção', 'Informe tanto a URL quanto a Chave Anon para salvar.', 'error');
      return;
    }

    saveStoredSupabaseConfig({
      url: url.trim(),
      anonKey: anonKey.trim(),
      isConnected: testResult ? testResult.success && testResult.tableExists : true,
      lastTested: new Date().toISOString(),
    });

    showToast('Configuração salva', 'Credenciais do Supabase atualizadas com sucesso.', 'success');
    onConfigChanged();
    onClose();
  };

  const handleDisconnect = () => {
    if (confirm('Deseja desconectar o Supabase? O sistema voltará a utilizar o armazenamento local.')) {
      clearStoredSupabaseConfig();
      setUrl('');
      setAnonKey('');
      setTestResult(null);
      showToast('Desconectado', 'O sistema agora está usando armazenamento local.', 'info');
      onConfigChanged();
    }
  };

  const copySql = () => {
    navigator.clipboard.writeText(SUPABASE_TABLE_SQL);
    setCopiedSql(true);
    showToast('Script copiado!', 'Cole no Editor SQL do seu painel Supabase.', 'success');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handlePushToSupabase = async () => {
    setIsSyncing(true);
    const res = await ContactService.syncLocalToSupabase();
    setIsSyncing(false);

    if (res.error) {
      showToast('Erro na sincronização', res.error, 'error');
    } else {
      showToast('Sincronização concluída!', `${res.count} contatos salvos no Supabase.`, 'success');
      onConfigChanged();
    }
  };

  const handlePullFromSupabase = async () => {
    setIsSyncing(true);
    const res = await ContactService.getAllContacts();
    setIsSyncing(false);

    if (res.source === 'supabase') {
      showToast('Contatos carregados!', `${res.contacts.length} contatos sincronizados do Supabase.`, 'success');
      onConfigChanged();
    } else {
      showToast('Não foi possível sincronizar', res.error || 'Verifique sua conexão', 'error');
    }
  };

  const currentConfig = getStoredSupabaseConfig();
  const isConnected = currentConfig.isConnected && Boolean(currentConfig.url && currentConfig.anonKey);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900">Banco de Dados Supabase</h2>
                {isConnected ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Conectado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Armazenamento Local
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">Conecte seu projeto Supabase PostgreSQL para persistência na nuvem</p>
            </div>
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
            onClick={() => setActiveTab('config')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'config'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Conexão & Credenciais
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'sql'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Script SQL & Políticas de Armazenamento
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono font-bold">
              RLS + Storage
            </span>
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'sync'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Sincronização
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'config' && (
            <div className="space-y-4">
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-lg p-3.5 text-xs text-emerald-950 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-emerald-900">Como obter suas credenciais:</p>
                  <p className="text-emerald-800/90 mt-0.5 leading-relaxed">
                    No painel do Supabase (<strong>Project Settings &rarr; Data API</strong>), copie o <strong>Project URL</strong> e a chave pública <strong>anon public</strong>.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Project URL do Supabase
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://xyzabcdefghijklmnop.supabase.co"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 font-mono text-xs placeholder:font-sans placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    API Anon Key (Chave Pública)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="text-[11px] text-emerald-700 hover:text-emerald-900 font-medium"
                  >
                    {showKey ? 'Ocultar chave' : 'Mostrar chave'}
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 font-mono text-xs placeholder:font-sans placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Feedback box */}
              {testResult && (
                <div
                  className={`p-3.5 rounded-lg border text-xs ${
                    testResult.success && testResult.tableExists
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : testResult.success && !testResult.tableExists
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {testResult.success && testResult.tableExists ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : testResult.success && !testResult.tableExists ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-semibold">{testResult.message}</p>
                      {testResult.details && (
                        <p className="mt-1 opacity-90 leading-relaxed">{testResult.details}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={isTesting || !url || !anonKey}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:pointer-events-none transition-colors flex items-center gap-2 shadow-xs"
                >
                  {isTesting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Testando Conexão...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Testar & Validar
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Salvar Credenciais
                </button>

                {isConnected && (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="ml-auto px-3 py-2 text-xs font-medium text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Desconectar
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Script SQL com Políticas de Armazenamento</h3>
                  <p className="text-xs text-slate-500">
                    Inclui criação da tabela <strong>contacts</strong>, políticas RLS granulares e bucket do <strong>Supabase Storage</strong> para fotos.
                  </p>
                </div>
                <button
                  onClick={copySql}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      SQL Copiado com Sucesso!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copiar Script SQL Completo
                    </>
                  )}
                </button>
              </div>

              {/* Policy summary highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Políticas da Tabela (RLS)</span>
                  </div>
                  <ul className="text-[11px] text-slate-600 space-y-0.5 list-disc list-inside">
                    <li><strong>SELECT:</strong> Leitura de contatos</li>
                    <li><strong>INSERT:</strong> Cadastro de novos contatos</li>
                    <li><strong>UPDATE:</strong> Atualização de dados</li>
                    <li><strong>DELETE:</strong> Exclusão segura de registros</li>
                  </ul>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                    <Database className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Políticas de Storage (Fotos)</span>
                  </div>
                  <ul className="text-[11px] text-slate-600 space-y-0.5 list-disc list-inside">
                    <li>Bucket público: <strong>contact-avatars</strong> (5 MB max)</li>
                    <li><strong>storage.objects:</strong> Upload de fotos (INSERT)</li>
                    <li><strong>storage.objects:</strong> Visualização pública (SELECT)</li>
                    <li><strong>storage.objects:</strong> Atualização e exclusão (UPDATE / DELETE)</li>
                  </ul>
                </div>
              </div>

              <div className="relative rounded-lg bg-slate-950 p-4 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800 max-h-64 selection:bg-emerald-500/30">
                <pre>{SUPABASE_TABLE_SQL}</pre>
              </div>

              <div className="rounded-lg bg-emerald-50/60 border border-emerald-200/70 p-3.5 text-xs text-slate-700 space-y-1.5">
                <p className="font-semibold text-emerald-950">Como aplicar no painel do Supabase:</p>
                <ol className="list-decimal list-inside space-y-1 pl-1 text-emerald-900/90">
                  <li>Acesse o <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-emerald-700 hover:underline font-bold inline-flex items-center gap-0.5">painel do Supabase <ExternalLink className="w-2.5 h-2.5" /></a> e abra o seu projeto.</li>
                  <li>No menu lateral esquerdo, clique no ícone do <strong>SQL Editor</strong>.</li>
                  <li>Clique no botão <strong>New Query</strong> (+), cole o script SQL acima e clique em <strong>Run</strong> (ou pressione Ctrl+Enter).</li>
                  <li>Pronto! Sua tabela e seu bucket com todas as políticas estarão 100% ativos.</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'sync' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Sincronização entre Local e Nuvem</h3>
                <p className="text-xs text-slate-500">
                  Transfira contatos entre o armazenamento local do navegador e o banco de dados Supabase.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors bg-white">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-900">Enviar Contatos Locais para o Supabase</h4>
                  <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
                    Envia todos os contatos que você cadastrou localmente para a sua tabela no Supabase.
                  </p>
                  <button
                    onClick={handlePushToSupabase}
                    disabled={isSyncing || !isConnected}
                    className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                  >
                    {isSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                    Enviar para o Supabase
                  </button>
                </div>

                <div className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors bg-white">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center mb-3">
                    <DownloadCloud className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-900">Puxar Contatos do Supabase</h4>
                  <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
                    Carrega e atualiza o seu aplicativo com todos os registros existentes no banco de dados Supabase.
                  </p>
                  <button
                    onClick={handlePullFromSupabase}
                    disabled={isSyncing || !isConnected}
                    className="w-full py-2 px-3 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                  >
                    {isSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <DownloadCloud className="w-3.5 h-3.5" />}
                    Carregar do Supabase
                  </button>
                </div>
              </div>

              {!isConnected && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Configure e conecte o Supabase na aba "Conexão & Credenciais" para habilitar a sincronização.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            {isConnected ? 'Sincronização em tempo real ativa' : 'Operando em modo local'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-medium text-slate-700 hover:text-slate-900"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
