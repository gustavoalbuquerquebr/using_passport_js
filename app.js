"use strict";

const express = require("express"),
  mongoose = require("mongoose"),
  bodyParser = require("body-parser"),
  passport = require("passport"),
  LocalStrategy = require("passport-local"),
  passportLocalMongoose = require("passport-local-mongoose");

// NOTE: options are passed to avoid deprecations warnings
mongoose.connect("mongodb://localhost/auth", {
  useNewUrlParser: true,
  useCreateIndex: true,
});

// passport-Local Mongoose will add a username, hash and salt field automatically
const UserSchema = new mongoose.Schema({});
// TOPIC: adding passport-local-mongoose to the user schema
UserSchema.plugin(passportLocalMongoose);
const User = mongoose.model("User", UserSchema);

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

// TOPIC: passport settings
app.use(
  require("express-session")({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
  }),
);
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// TOPIC: writing a middleware to check if user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/login");
  }
}

app.get("/", (req, res) => {
  res.render("home");
});

// TOPIC: using wrote middleware to check if user is logged in
app.get("/secret", isLoggedIn, (req, res) => {
  res.render("secret");
});

app.get("/register", (req, res) => {
  res.render("register");
});

// TOPIC: creating new user
app.post("/register", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  User.register(new User({ username: username }), password, (err, user) => {
    if (err) {
      res.send("Error");
    } else {
      passport.authenticate("local")(req, res, () => {
        res.redirect("/secret");
      });
    }
  });
});

app.get("/login", (req, res) => {
  res.render("login");
});

// TOPIC: log in user
app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/secret",
    failureRedirect: "/login",
  }),
  (req, res) => {},
);

// TOPIC: log out user
app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

app.listen(3000, console.log("..."));
