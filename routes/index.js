// routes/index.js

const express = require('express');
const AppController = require('../controllers/AppController');
const UsersController = require('../controllers/UsersController'); // Ensure this path is correct
const AuthController = require('../controllers/AuthController');

const router = express.Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.post('/users', UsersController.postNew); // Ensure `postNew` exists in UsersController

router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', UsersController.getMe);

module.exports = router;
