const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");


router.get("/auth", passport.authenticate(['jwt'], { session: false }), async (req, res, next) => {
    res.send("you are authenticated!");
});

router.get("/", passport.authenticate(['jwt'], { session: false }), async (req, res, next) => {
    res.send("get request successful!");
});

router.post("/", passport.authenticate(['jwt'], { session: false }), async (req, res, next) => {
    res.send("post request successful!");
});

router.delete("/", passport.authenticate(['jwt'], { session: false }), async (req, res, next) => {
    res.send("delete request successful!");
});

module.exports = router;