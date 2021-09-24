const express = require("express");

const userRoutes = require("./user.routes");
const authRoutes = require("./auth.routes");
const lineRoutes = require("./line.routes");
const memoryRoutes = require("./memory.routes");
const debugRoutes = require("./debug.routes");
const mediaRoutes = require("./media.routes");

const router = express.Router();

const routes = [
  {
    path: "/auth",
    route: authRoutes,
  },
  {
    path: "/users",
    route: userRoutes,
  },
  {
    path: "/lines",
    route: lineRoutes,
  },
  {
    path: "/memories",
    route: memoryRoutes,
  },
  {
    path: "/media",
    route: mediaRoutes,
  },
];

if (process.env.NODE_ENV === "development") {
  routes.push({
    path: "/debug",
    route: debugRoutes,
  });
}
routes.forEach((r) => router.use(r.path, r.route));
module.exports = router;
