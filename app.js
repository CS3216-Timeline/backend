const express = require("express");
const cors = require("cors");
// importing the routes
const userRoutes = require("./routes/user");
const authRoutes = require("./routes/auth");
const todoRoutes = require("./routes/todo");

const {
  HTTPError
} = require("./errors/errors");
const { env } = require("process");
const exp = require("constants");
const path = require("path")

const app = express();

// Port
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({
  extended: false
}));

// Routes
app.use("/user", userRoutes);
app.use("/auth", authRoutes);
app.use("/todo", todoRoutes);

app.get('/debug', function (req, res) {
  res.send('get request successful')
})

app.post('/debug', function (req, res) {
  res.send('post request successful')
})

app.use((err, req, res, next) => {
  if (err instanceof HTTPError) {
    res.status(err.status).json({
      error: err.message
    });
    return;
  }
  next(err);
});

// If other error
app.use((err, req, res, next) => {
  res.status(500).json({
    error: err.message
  });
});

app.get('*', function (req, res) {
  res.status(404)
})

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
