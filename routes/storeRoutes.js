const storeRoutes = require('express').Router();

const { fetchAllFiles, fetchFiles } = require('../controllers/storeController');

storeRoutes.get("/fetchall",fetchAllFiles);
storeRoutes.post("/fetchFiles", fetchFiles);

module.exports = storeRoutes;