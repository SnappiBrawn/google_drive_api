const storeRoutes = require('express').Router();

const { fetchAllFiles } = require('../controllers/storeController');

storeRoutes.get("/fetchall",fetchAllFiles);

module.exports = storeRoutes;