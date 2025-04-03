const storeRoutes = require('express').Router();

const { fetchAllFiles, fetchDirectory } = require('../controllers/storeController');

storeRoutes.get("/fetchall",fetchAllFiles);
storeRoutes.post("/fetchdir",fetchDirectory);

module.exports = storeRoutes;