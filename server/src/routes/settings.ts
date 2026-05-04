import { Router } from 'express';
import { prisma } from '../db.js';
import { getPublicAISettings, invalidateAIConfigCache } from '../services/aiConfig.js';

const router = Router();
const SECRET_SETTING_KEYS = new Set(['aiApiKey', 'smtpPass', 'twitterApiKey']);

// 获取所有设置
router.get('/', async (req, res) => {
  try {
    const settings = await prisma.setting.findMany();
    const settingsMap = settings.reduce((acc: Record<string, string>, item: { key: string; value: string }) => {
      acc[item.key] = item.value;
      return acc;
    }, {} as Record<string, string>);

    const publicSettings = { ...settingsMap };
    for (const secretKey of SECRET_SETTING_KEYS) {
      if (secretKey in publicSettings) {
        publicSettings[secretKey] = '';
        publicSettings[`${secretKey}Configured`] = 'true';
      }
    }

    res.json({
      ...publicSettings,
      ...getPublicAISettings(settingsMap)
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// 更新设置
router.put('/', async (req, res) => {
  try {
    const settings = req.body;

    if (typeof settings !== 'object') {
      return res.status(400).json({ error: 'Invalid settings format' });
    }

    const updates = Object.entries(settings)
      .filter(([key, value]) => {
        if (SECRET_SETTING_KEYS.has(key)) {
          return value !== undefined && value !== null && String(value).trim() !== '';
        }
        return value !== undefined;
      })
      .map(([key, value]) => 
      prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) }
      })
    );

    await Promise.all(updates);
    invalidateAIConfigCache();

    res.json({ message: 'Settings updated' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// 获取单个设置
router.get('/:key', async (req, res) => {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: req.params.key }
    });

    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    const isSecret = SECRET_SETTING_KEYS.has(setting.key);
    res.json({
      key: setting.key,
      value: isSecret ? '' : setting.value,
      configured: isSecret ? true : undefined
    });
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
});

// 更新单个设置
router.put('/:key', async (req, res) => {
  try {
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({ error: 'Value is required' });
    }

    if (SECRET_SETTING_KEYS.has(req.params.key) && String(value).trim() === '') {
      return res.json({ key: req.params.key, value: '', configured: true });
    }

    const setting = await prisma.setting.upsert({
      where: { key: req.params.key },
      update: { value: String(value) },
      create: { key: req.params.key, value: String(value) }
    });
    invalidateAIConfigCache();

    res.json(setting);
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

export default router;
