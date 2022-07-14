const routerx = require('express-promise-router');
const { verifyUid, login, getLogbook, getWindsData, getLogFile, getDownloadUrl, saveLogData } = require('../controllers/dashboard');
const multer = require('multer');

const router = routerx();
router.post('/verifyUid', verifyUid);
router.post('/login', login);
router.post('/getLogbook', getLogbook);
router.post('/getWindsData', getWindsData);
router.post('/getLogFile',multer().any() , getLogFile);
router.post('/getDownloadUrl', getDownloadUrl);
router.post('/saveLogData', saveLogData);

module.exports = router;