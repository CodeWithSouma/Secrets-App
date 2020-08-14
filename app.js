//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');



const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

//initial configuration of session
app.use(session({
    secret:"Our little secret.",
    resave:false,
    saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());

//this is need to handel error of passportLocalMongoose package
mongoose.set('useCreateIndex', true);
// connect mongoDB 
mongoose.connect('mongodb://localhost/userDB', {useNewUrlParser: true,useUnifiedTopology: true});

//user Schema 
const userSchema = new mongoose.Schema({
    email:String,
    password:String,
    googleId:String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

//user Model
const User = new mongoose.model("User",userSchema);


// set up passpot module
passport.use(User.createStrategy());
 //set up serialize and deserialize 
 passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  })

//setup oaurth config
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/",function(req,res){
    res.render("home");
});
//google aurthentication route
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] })
);

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/login",function(req,res){
    res.render("login");
});

app.get("/register",function(req,res){
    res.render("register");
});

app.get("/secrets",function(req,res){
    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
});

app.get("/logout",function(req,res){
    //here we deaurthenticate user and redirect home page
    req.logOut();
    res.redirect("/");

});

// register user using post route
app.post("/register",function(req,res){
    //register user using pasport module
  User.register({username:req.body.username},req.body.password,function(err,user){
    if (err) {
        console.log(err);
        res.redirect("/register");
    }else{
        //here we aurthenticate newly create user and redirect secret page
        //and also crate a local cookie
        passport.authenticate("local")(req,res,function(){
            res.redirect("/secrets");
        });
    }
  });
});

//login user using post route
app.post("/login",function(req,res){
//collect user login credentials 
//here we not use email because we use username key when register using pasport 
    const user = new User({
        username:req.body.username,
        password:req.body.password
    });

    //we use logIn method and pass credentials and aurthenticate user and
    //redirect secrets page and also store cookie
    req.logIn(user,function(err){
        if (err) {
            console.log(err);
            res.redirect("/login");
        } else {
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    });
   
});



//open 3000 port for access
app.listen(3000, function() {
  console.log("Server started on port 3000");
});