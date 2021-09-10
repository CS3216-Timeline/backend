const express = require("express");
const helmet = require('helmet');
const cors = require("cors");
const xss = require('xss-clean');
// const passport = require('passport'); // TODO: Replace current bcrypt solution with passport

const routes = require('./routes/');
const HTTPError = require("./errors/errors");

const app = express();

app.use(helmet());
app.use(express.json({extended: true})); // TODO: Check if this should be T/F
app.use(express.urlencoded({extended: true})); // TODO: Check if this shoud be T/F
app.use(xss());
app.use(cors());
app.use('/api', routes);

// TODO: This thing crashes if there's an error (can try replicating by changing DB name in .env)
// app.use((err, req, res, next) => {
//   if (err instanceof HTTPError) {
//     res.status(err.status).json({
//       error: err.message
//     });
//     return;
//   }
//   next(err);
// });

app.use((err, req, res, next) => {
  res.status(500).json({
    error: err.message
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));