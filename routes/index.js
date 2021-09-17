const express = require('express');

const userRoutes = require("./user.routes");
const authRoutes = require("./auth.routes");
const lineRoutes = require("./line.routes");
const memoryRoutes = require("./memory.routes");
const debugRoutes = require("./debug.routes");
const geolocationRoutes = require("./geolocation.routes");

const router = express.Router();

const routes = [
    {
        path: '/auth',
        route: authRoutes,
    },
    {
        path: '/users',
        route: userRoutes,
    },
    {
        path: '/lines',
        route: lineRoutes,
    },
    {
        path: '/memories',
        route: memoryRoutes,
    },
    {
        path: '/geolocation',
        route: geolocationRoutes,
    },
    {
        path: '/debug',
        route: debugRoutes,
    }
  ];
  
  routes.forEach(r => router.use(r.path, r.route));
  module.exports = router;
  