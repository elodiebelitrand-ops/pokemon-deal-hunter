import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config, hasCardmarketCredentials, hasEbayCredentials } from './config.js';
import { runHunt } from './services/hunt.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(publicDir));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    env: config.nodeEnv,
    integrations: {
      ebay: hasEbayCredentials(),
      cardmarket: hasCardmarketCredentials(),
      vinted: config.features.vinted,
      lbc: config.features.lbc,
      demoMode: config.features.demoMode
    }
  });
});

app.post('/api/hunt', async (req, res) => {
  try {
    const payload = {
      threshold: Number(req.body?.threshold || 30),
      maxResults: Number(req.body?.maxResults || 8),
      activeCats: Array.isArray(req.body?.activeCats) ? req.body.activeCats : [],
      activeKws: Array.isArray(req.body?.activeKws) ? req.body.activeKws : [],
      activePlats: Array.isArray(req.body?.activePlats) ? req.body.activePlats : []
    };

    const result = await runHunt(payload);
    res.json({ ok: true, ...result, scannedAt: new Date().toISOString() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: error.message || 'Erreur serveur' });
  }
});

app.post('/api/report', async (req, res) => {
  const deals = Array.isArray(req.body?.deals) ? req.body.deals : [];
  const threshold = Number(req.body?.threshold || 30);
  const hot = deals.filter((item) => item.hot).length;
  const best = deals[0] || null;

  const report = [
    `📊 Résumé : ${deals.length} deal(s) détecté(s) à au moins -${threshold}% sous la référence Cardmarket.`,
    hot ? `🔥 ${hot} deal(s) sont exceptionnels à -50% ou plus.` : `Aucun deal à -50%+ sur ce scan.`,
    best ? `🎯 Priorité : ${best.name} sur ${best.platform.toUpperCase()} à ${best.foundPrice}€ contre ${best.cmPrice}€ de référence, soit -${best.saving}%.` : '🎯 Priorité : aucun deal prioritaire détecté.',
    `⏱ Action : vérifie toujours photos, état, langue, numéro de carte et frais de port avant achat.`
  ].join('\n\n');

  res.json({ ok: true, report });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(config.port, () => {
  console.log(`Pokemon Deal Hunter running on http://localhost:${config.port}`);
});
