const router = require("express").Router();
const { getUsers } = require("../../app/controllers/api/UserController");

const {authAdmin } = require("../../app/middleware/auth")

router.get('/users',authAdmin, getUsers);

module.exports = router;