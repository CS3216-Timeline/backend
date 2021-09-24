const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const xss = require("xss-clean");
const passport = require("passport");
const { jwtStrategy, facebookStrategy } = require("./config/passport");

const routes = require("./routes/");
const { HTTPError } = require("./errors/errors");
const morgan = require("morgan");

const app = express();

app.use(helmet());

app.use(morgan('combined'));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(xss());

app.use(
  cors({
    origin: "*",
  })
);

app.use(passport.initialize());
passport.use("jwt", jwtStrategy);
passport.use(facebookStrategy);

app.use("/api", routes);

app.use((err, req, res, next) => {
  if (err instanceof HTTPError) {
    res.status(err.status).json({
      error: err.message,
    });
    return;
  }
  next(err);
});

app.use((err, req, res, next) => {
  res.status(500).json({
    error: err.message,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
