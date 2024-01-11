const express = require("express");
const morgan = require("morgan");
const passport = require("passport");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const authRoutes = require("./routes/auth.js");
require("./utils/auth_token.js");

// Adjust the path to import the Sequelize model and configuration

// require("./config/config.json");
var db = require('./models');
db.sequelize.sync();

const app = express();

// Allow requests from your React front-end
const corsOptions = {
    origin: "http://localhost:3000",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true, // Enable credentials (cookies, headers)
};

app.use(cors());
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(passport.initialize());
app.use(cookieParser());
app.use("/auth", authRoutes);

app.listen(8001, () => {
    console.log(`Authentication server is listening on port 8001`);
});