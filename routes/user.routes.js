const express = require("express");
const router = express.Router();

const UserService = require('../services/UserService');
const userService = new UserService();

module.exports = router;