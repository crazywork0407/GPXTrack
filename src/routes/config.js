const routerx = require('express-promise-router');
const { getCardConfig, updateCardConfig } = require('../controllers/config');

const router = routerx();
router.post('/getCardConfig', getCardConfig);
router.post('/updateCardConfig', updateCardConfig);

module.exports = router;