const express = require('express');
const social = require('../controller/socialController');

const router = express.Router();

// Facebook Graph
router.get('/facebook/latest', social.getFacebookLatest);
router.get('/facebook/webhook', social.verifyFacebookWebhook);  // verification handshake
router.post('/facebook/webhook', social.receiveFacebookWebhook); // events

module.exports = router;

