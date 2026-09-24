import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig } from '../types/contact';

const STORAGE_KEY = 'supabase_contacts_config_v1';

export const DEFAULT_TABLE_NAME = 'contacts';

export const SUPABASE_STORAGE_BUCKET = 'contact-avatars';

export const SUPABASE_TABLE_SQL = `-- ====================================================================
-- SCRIPT COMPLETO DE BANCO DE DADOS E ARMAZENAMENTO (SUPABASE)
-- Sistema de Gestão de Contatos
-- ====================================================================

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Criação da tabela de contatos
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  secondary_phone TEXT,
  company TEXT,
  job_title TEXT,
  category TEXT DEFAULT 'outro',
  street TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Brasil',
  notes TEXT,
  tags TEXT[] DEFAULT '{}'::TEXT[],
  favorite BOOLEAN DEFAULT false,
  avatar_url TEXT,
  birthdate DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Função e Trigger para atualizar automaticamente o campo updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_contacts_updated_at ON public.contacts;
CREATE TRIGGER set_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 4. Habilitar Row Level Security (RLS) na tabela de contatos
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Limpar políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Acesso total aos contatos" ON public.contacts;
DROP POLICY IF EXISTS "Permitir leitura de contatos" ON public.contacts;
DROP POLICY IF EXISTS "Permitir insercao de contatos" ON public.contacts;
DROP POLICY IF EXISTS "Permitir atualizacao de contatos" ON public.contacts;
DROP POLICY IF EXISTS "Permitir exclusao de contatos" ON public.contacts;

-- Políticas Granulares de Acesso (RLS) da tabela contacts:
-- A) Leitura (SELECT)
CREATE POLICY "Permitir leitura de contatos"
  ON public.contacts
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- B) Inserção (INSERT)
CREATE POLICY "Permitir insercao de contatos"
  ON public.contacts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- C) Atualização (UPDATE)
CREATE POLICY "Permitir atualizacao de contatos"
  ON public.contacts
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- D) Exclusão (DELETE)
CREATE POLICY "Permitir exclusao de contatos"
  ON public.contacts
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- 5. Índices de alta performance para busca e filtros
CREATE INDEX IF NOT EXISTS idx_contacts_name ON public.contacts (name);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts (email);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON public.contacts (phone);
CREATE INDEX IF NOT EXISTS idx_contacts_category ON public.contacts (category);
CREATE INDEX IF NOT EXISTS idx_contacts_favorite ON public.contacts (favorite);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON public.contacts (created_at DESC);

-- ====================================================================
-- 6. CONFIGURAÇÃO DO SUPABASE STORAGE (BUCKET E POLÍTICAS DE FOTOS)
-- ====================================================================

-- Criação do Bucket público 'contact-avatars' para fotos de perfil
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contact-avatars',
  'contact-avatars',
  true,
  5242880, -- 5 MB máximo por imagem
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

-- Limpar políticas antigas de Storage para evitar duplicações
DROP POLICY IF EXISTS "Avatars - Leitura publica" ON storage.objects;
DROP POLICY IF EXISTS "Avatars - Upload permitido" ON storage.objects;
DROP POLICY IF EXISTS "Avatars - Atualizacao permitida" ON storage.objects;
DROP POLICY IF EXISTS "Avatars - Exclusao permitida" ON storage.objects;

-- POLÍTICAS DE ARMAZENAMENTO (storage.objects):
-- A) Leitura pública das fotos de avatar
CREATE POLICY "Avatars - Leitura publica"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'contact-avatars');

-- B) Upload de novas fotos para o bucket
CREATE POLICY "Avatars - Upload permitido"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'contact-avatars');

-- C) Atualização/substituição de imagens existentes
CREATE POLICY "Avatars - Atualizacao permitida"
  ON storage.objects
  FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'contact-avatars')
  WITH CHECK (bucket_id = 'contact-avatars');

-- D) Remoção de fotos ao excluir contatos
CREATE POLICY "Avatars - Exclusao permitida"
  ON storage.objects
  FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'contact-avatars');
`;

let cachedClient: SupabaseClient | null = null;
let currentClientKey: string = '';

export function getStoredSupabaseConfig(): SupabaseConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Erro ao ler configuração do Supabase no localStorage:', err);
  }

  // Fallback to Vite env variables if provided
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

  return {
    url: envUrl,
    anonKey: envKey,
    isConnected: false,
    tableName: DEFAULT_TABLE_NAME,
  };
}

export function saveStoredSupabaseConfig(config: Partial<SupabaseConfig>): SupabaseConfig {
  const current = getStoredSupabaseConfig();
  const updated: SupabaseConfig = {
    ...current,
    ...config,
    tableName: config.tableName || DEFAULT_TABLE_NAME,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Erro ao salvar configuração do Supabase:', err);
  }

  // Reset cached client if credentials changed
  cachedClient = null;
  currentClientKey = '';

  return updated;
}

export function clearStoredSupabaseConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Erro ao limpar configuração do Supabase:', err);
  }
  cachedClient = null;
  currentClientKey = '';
}

export function getSupabaseClient(overrideConfig?: { url: string; anonKey: string }): SupabaseClient | null {
  const config = overrideConfig || getStoredSupabaseConfig();

  if (!config.url || !config.anonKey) {
    return null;
  }

  const keySignature = `${config.url}::${config.anonKey}`;
  if (cachedClient && currentClientKey === keySignature && !overrideConfig) {
    return cachedClient;
  }

  try {
    const client = createClient(config.url.trim(), config.anonKey.trim(), {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    if (!overrideConfig) {
      cachedClient = client;
      currentClientKey = keySignature;
    }

    return client;
  } catch (error) {
    console.error('Falha ao inicializar cliente Supabase:', error);
    return null;
  }
}

export interface ConnectionTestResult {
  success: boolean;
  tableExists: boolean;
  message: string;
  details?: string;
  count?: number;
}

export async function testSupabaseConnection(
  url: string,
  anonKey: string,
  tableName = DEFAULT_TABLE_NAME
): Promise<ConnectionTestResult> {
  const cleanUrl = url.trim();
  const cleanKey = anonKey.trim();

  if (!cleanUrl || !cleanKey) {
    return {
      success: false,
      tableExists: false,
      message: 'URL e Chave Anon do Supabase são obrigatórias.',
    };
  }

  try {
    // Validate URL format
    const parsedUrl = new URL(cleanUrl);
    if (!parsedUrl.protocol.startsWith('http')) {
      return {
        success: false,
        tableExists: false,
        message: 'A URL do Supabase deve iniciar com https:// ou http://',
      };
    }
  } catch {
    return {
      success: false,
      tableExists: false,
      message: 'A URL informada não possui um formato válido.',
    };
  }

  try {
    const tempClient = createClient(cleanUrl, cleanKey, {
      auth: { persistSession: false },
    });

    // Test query on contacts table
    const { data, error, count } = await tempClient
      .from(tableName)
      .select('id', { count: 'exact', head: true });

    if (error) {
      // Check if it's table not found
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return {
          success: true, // Auth worked, but table needs creation
          tableExists: false,
          message: `Conexão bem-sucedida! Porém, a tabela "${tableName}" ainda não foi criada no banco de dados.`,
          details: 'Execute o script SQL fornecido no Editor SQL do seu painel Supabase para criar a tabela com 1 clique.',
        };
      }

      if (error.code === 'PGRST301' || error.message?.includes('JWT') || error.message?.includes('apikey')) {
        return {
          success: false,
          tableExists: false,
          message: 'Falha de autenticação: Chave Anon inválida para este projeto.',
          details: error.message,
        };
      }

      return {
        success: false,
        tableExists: false,
        message: `Erro ao consultar o Supabase: ${error.message}`,
        details: `Código: ${error.code}`,
      };
    }

    return {
      success: true,
      tableExists: true,
      message: `Conectado com sucesso ao Supabase! A tabela "${tableName}" está pronta para uso.`,
      count: count ?? (Array.isArray(data) ? data.length : 0),
    };
  } catch (err: any) {
    return {
      success: false,
      tableExists: false,
      message: `Falha na requisição ao Supabase: ${err.message || 'Verifique sua conexão ou URL'}`,
    };
  }
}

/**
 * Faz upload de imagem para o Supabase Storage no bucket 'contact-avatars'
 */
export async function uploadAvatarFile(file: File): Promise<{ url?: string; error?: string }> {
  const config = getStoredSupabaseConfig();
  const supabase = getSupabaseClient();

  // If file is larger than 5MB
  if (file.size > 5 * 1024 * 1024) {
    return { error: 'O tamanho da imagem não pode ultrapassar 5 MB.' };
  }

  // If Supabase is connected, upload to storage bucket
  if (supabase && config.isConnected) {
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(SUPABASE_STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.warn('Erro ao enviar imagem ao Supabase Storage:', uploadError);
        // If bucket is not found or policy fails, fallback to local base64
        return convertFileToBase64(file);
      }

      // Get public URL
      const { data } = supabase.storage
        .from(SUPABASE_STORAGE_BUCKET)
        .getPublicUrl(filePath);

      return { url: data.publicUrl };
    } catch (err: any) {
      console.warn('Falha no upload do Supabase Storage, caindo para local:', err);
      return convertFileToBase64(file);
    }
  }

  // Fallback to local base64
  return convertFileToBase64(file);
}

function convertFileToBase64(file: File): Promise<{ url?: string; error?: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({ url: reader.result as string });
    };
    reader.onerror = () => {
      resolve({ error: 'Erro ao processar imagem localmente.' });
    };
    reader.readAsDataURL(file);
  });
}

