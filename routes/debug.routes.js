const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");


router.get("/auth", auth, async (req, res, next) => {
    res.send("you are authenticated!");
});

router.get("/", auth, async (req, res, next) => {
    res.send("get request successful!");
});

router.post("/", auth, async (req, res, next) => {
    res.send("post request successful!");
});

router.delete("/", auth, async (req, res, next) => {
    res.send("delete request successful!");
});

module.exports = router;