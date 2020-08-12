//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const md5 = require('md5');

const app = express();


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

// connect mongoDB 
mongoose.connect('mongodb://localhost/userDB', {useNewUrlParser: true,useUnifiedTopology: true});

//user Schema 
const userSchema = new mongoose.Schema({
    email:String,
    password:String
});


//user Model
const User = new mongoose.model("User",userSchema);

app.get("/",function(req,res){
    res.render("home");
});

app.get("/login",function(req,res){
    res.render("login");
});

app.get("/register",function(req,res){
    res.render("register");
});

// register user using post route
app.post("/register",function(req,res){
    const username = req.body.username;
    const password = md5(req.body.password);//turn into hash
    const newUser = new User({
        email:username,
        password:password
    });
    newUser.save(function(err){
        if (!err) {
            res.render("secrets");
        } else {
            console.log(err);
        }
    });
});

//login user using post route
app.post("/login",function(req,res){
    const username = req.body.username;
    const password = md5(req.body.password);//turn the password into hash
        
    User.findOne(
    {
        email:username
    },
    function(err,foundUser){
        if (!err) {
            if (foundUser.password === password) {
                res.render("secrets");
            }else{
                res.redirect("/login");
            }
        } else {
           console.log(err); 
        }
    });
});



//open 3000 port for access
app.listen(3000, function() {
  console.log("Server started on port 3000");
});