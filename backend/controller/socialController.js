const SocialEvent = require('../models/socialEventModel');

function getEnv(name, fallback = undefined) {
  return process.env[name] || fallback;
}

async function httpGet(url) {
  try {
    if (typeof fetch === 'function') {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    }
    const { default: fetchPoly } = await import('node-fetch');
    const res = await fetchPoly(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    throw e;
  }
}

const socialController = {
  // GET /api/social/facebook/latest
  getFacebookLatest: async (_req, res) => {
    try {
      const PAGE_ID = getEnv('FACEBOOK_PAGE_ID');
      const TOKEN = getEnv('FACEBOOK_PAGE_TOKEN');
      if (!PAGE_ID || !TOKEN) return res.status(400).json({ success: false, error: 'Missing FACEBOOK_PAGE_ID or FACEBOOK_PAGE_TOKEN' });

      const fields = ['id','message','created_time','permalink_url','full_picture'].join(',');
      const url = `https://graph.facebook.com/v20.0/${PAGE_ID}/feed?fields=${fields}&access_token=${encodeURIComponent(TOKEN)}`;
      const data = await httpGet(url);
      res.json({ success: true, data: data.data || [] });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // Webhook verify (GET)
  verifyFacebookWebhook: (req, res) => {
    try {
      const VERIFY_TOKEN = getEnv('FACEBOOK_VERIFY_TOKEN', 'verify_me');
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];
      if (mode === 'subscribe' && token === VERIFY_TOKEN) return res.status(200).send(challenge);
      return res.sendStatus(403);
    } catch (_) {
      return res.sendStatus(500);
    }
  },

  // Webhook events (POST)
  receiveFacebookWebhook: async (req, res) => {
    try {
      const body = req.body;
      await SocialEvent.create({ provider: 'facebook', type: 'webhook', payload: body });
      // Optional: map to local posts if needed (example: first entry/message)
      res.sendStatus(200);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};

module.exports = socialController;

