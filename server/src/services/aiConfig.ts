export type AIProvider = 'openai' | 'anthropic' | 'google';

export interface AIConfig {
  provider: AIProvider;
  baseUrl: string;
  apiKey: string;
  model: string;
}

const AI_SETTING_KEYS = ['aiProvider', 'aiBaseUrl', 'aiApiKey', 'aiModel'] as const;

const DEFAULT_CONFIGS: Record<AIProvider, { baseUrl: string; model: string }> = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini'
  },
  anthropic: {
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-3-5-sonnet-20241022'
  },
  google: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-2.0-flash'
  }
};

const LEGACY_OPENROUTER_CONFIG = {
  provider: 'openai' as const,
  baseUrl: 'https://openrouter.ai/api/v1',
  model: 'deepseek/deepseek-v3.2'
};

let configCache: { value: AIConfig | null; expiresAt: number } | null = null;

function isValidProvider(value: string | undefined): value is AIProvider {
  return value === 'openai' || value === 'anthropic' || value === 'google';
}

function getNonEmpty(...values: Array<string | undefined | null>): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

function resolveProvider(value: string | undefined): AIProvider {
  return isValidProvider(value) ? value : 'openai';
}

function buildAIConfig(values: Record<string, string | undefined>): AIConfig | null {
  const hasLegacyOpenRouterKey = !!getNonEmpty(values.OPENROUTER_API_KEY);
  const provider = resolveProvider(getNonEmpty(values.aiProvider, values.AI_PROVIDER, hasLegacyOpenRouterKey ? 'openai' : undefined));
  const defaults = DEFAULT_CONFIGS[provider];

  const apiKey = getNonEmpty(values.aiApiKey, values.AI_API_KEY, values.OPENROUTER_API_KEY);
  if (!apiKey) {
    return null;
  }

  const baseUrl = normalizeBaseUrl(
    getNonEmpty(
      values.aiBaseUrl,
      values.AI_BASE_URL,
      hasLegacyOpenRouterKey ? LEGACY_OPENROUTER_CONFIG.baseUrl : defaults.baseUrl
    )!
  );

  const model = getNonEmpty(
    values.aiModel,
    values.AI_MODEL,
    hasLegacyOpenRouterKey ? LEGACY_OPENROUTER_CONFIG.model : defaults.model
  )!;

  return {
    provider,
    baseUrl,
    apiKey,
    model
  };
}

export function getPublicAISettings(values: Record<string, string | undefined> = {}): Record<string, string> {
  const config = buildAIConfig({
    ...Object.fromEntries(Object.entries(process.env).map(([key, value]) => [key, value ?? undefined])),
    ...values
  });

  const provider = config?.provider ?? resolveProvider(getNonEmpty(values.aiProvider, process.env.AI_PROVIDER));
  const defaults = DEFAULT_CONFIGS[provider];

  return {
    aiProvider: provider,
    aiBaseUrl: config?.baseUrl ?? normalizeBaseUrl(getNonEmpty(values.aiBaseUrl, process.env.AI_BASE_URL, defaults.baseUrl)!),
    aiModel: config?.model ?? getNonEmpty(values.aiModel, process.env.AI_MODEL, defaults.model)!,
    aiApiKey: '',
    aiApiKeyConfigured: config ? 'true' : 'false'
  };
}

export function invalidateAIConfigCache(): void {
  configCache = null;
}

export async function getAIConfig(): Promise<AIConfig | null> {
  const now = Date.now();
  if (configCache && configCache.expiresAt > now) {
    return configCache.value;
  }

  const values: Record<string, string | undefined> = {
    ...Object.fromEntries(Object.entries(process.env).map(([key, value]) => [key, value ?? undefined]))
  };

  try {
    const { prisma } = await import('../db.js');
    const storedSettings = await prisma.setting.findMany({
      where: {
        key: {
          in: [...AI_SETTING_KEYS]
        }
      }
    });

    for (const item of storedSettings) {
      values[item.key] = item.value;
    }
  } catch (error) {
    console.warn('Failed to load AI settings from database, falling back to environment variables:', error);
  }

  const config = buildAIConfig(values);
  configCache = {
    value: config,
    expiresAt: now + 30_000
  };

  return config;
}
