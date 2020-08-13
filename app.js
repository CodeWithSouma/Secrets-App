//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;

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
    const password = req.body.password;

    //use bcrypt encription
    bcrypt.hash(password, saltRounds, function(err, hash) {//add salt and generate a hash 
        const newUser = new User({
            email:username,
            password:hash//we saved salted hash as a password
        });
        newUser.save(function(err){
            if (!err) {
                res.render("secrets");
            } else {
                console.log(err);
            }
        });
            
    });
  
});

//login user using post route
app.post("/login",function(req,res){
    const username = req.body.username;
    const password = req.body.password;
        
    User.findOne(
    {
        email:username
    },
    function(err,foundUser){
        if (!err) {
            if (foundUser) {
                bcrypt.compare(password, foundUser.password, function(err, result) {//compare curren password with previous hash
                    if (result) {
                        res.render("secrets");
                    }else{
                        res.redirect("/login");
                    }
                });
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