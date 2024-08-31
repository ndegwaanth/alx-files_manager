const express = require('express');
const AppController = require('../controllers/AppController');
const userController = require('../controllers/UserController');


const router = express.Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

router.post('/users', userController.postNew);

module.exports = router;
