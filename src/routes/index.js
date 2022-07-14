const routerx = require('express-promise-router');
const DashboardRoute = require('./dashboard');
const ConfigRoute = require('./config');

const router = routerx()
router.use('/dashboard', DashboardRoute);
router.use('/config', ConfigRoute);

module.exports = router;