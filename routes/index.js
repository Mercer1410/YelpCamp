var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Campground = require("../models/campground");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
var middleware = require("../middleware");

router.get("/",function(req,res){
	res.render("landing");
});
//==================
//Auth Routes
//==================

//show reg form
router.get("/register", function(req,res){
	res.render("register", {page: "register"});
});
//Sign Up Logic
router.post("/register", function(req, res){
    var newUser = new User({
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        avatar: req.body.avatar,
        email: req.body.email
    });
    if(req.body.adminCode === "secretCode123"){
        newUser.isAdmin = true;
    }
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render("register", {error: err.message});
        }
        passport.authenticate("local")(req, res, function(){
           req.flash("success", "Successfully Signed Up! Nice to meet you " + req.body.username);
           res.redirect("/campgrounds"); 
        });
    });
});
//show login form
router.get("/login", function(req,res){
	res.render("login", {page: "login	"});
});
//login logic
router.post("/login", passport.authenticate("local", {
	successRedirect: "/campgrounds",
	failureRedirect: "/login"
}), function(req,res){});

router.get("/logout", function(req,res){
	req.logout();
	req.flash("success", "You Have Logged Out.");
	res.redirect("/campgrounds");
});

//User Profile
router.get("/users/:id", function(req,res){
    User.findById(req.params.id, function(err,foundUser){
        if(err){
            req.flash("error", "Something Went Wrong");
            res.redirect("/");
        }else{
            Campground.find().where("author.id").equals(foundUser._id).exec(function(err, campgrounds){
                if(err){
                    req.flash("error", "Something Went Wrong");
                    res.redirect("/");
                }else{
                    res.render("users/show", {user: foundUser, campground: campgrounds});
                }
            });
        }
    })
});

// forgot password
router.get('/forgot', function(req, res) {
    res.render('forgot');
});

router.post('/forgot', function(req, res, next) {
    async.waterfall([
      function(done) {
        crypto.randomBytes(20, function(err, buf) {
          var token = buf.toString('hex');
          done(err, token);
        });
      },
      function(token, done) {
        User.findOne({ email: req.body.email }, function(err, user) {
          if (!user) {
            req.flash('error', 'No account with that email address exists.');
            return res.redirect('/forgot');
          }
  
          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  
          user.save(function(err) {
            done(err, token, user);
          });
        });
      },
      function(token, user, done) {
        res.redirect("/reset/"+token);
      }
    ], function(err) {
      if (err) return next(err);
      res.redirect('/forgot');
    });
  });
  
  router.get('/reset/:token', function(req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
      if (!user) {
        req.flash('error', 'Password reset token is invalid or has expired.');
        return res.redirect('/forgot');
      }
      res.render('reset', {token: req.params.token});
    });
  });
  
  router.post('/reset/:token', function(req, res) {
    async.waterfall([
      function(done) {
        User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
          if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('back');
          }
          if(req.body.password === req.body.confirm) {
            user.setPassword(req.body.password, function(err) {
              user.resetPasswordToken = undefined;
              user.resetPasswordExpires = undefined;
  
              user.save(function(err) {
                req.flash("success", "PAssword has been successfully changed.");
                res.redirect("/campgrounds");
              });
            })
          } else {
              req.flash("error", "Passwords do not match.");
              return res.redirect('back');
          }
        });
      }
    ], function(err) {
      res.redirect('/campgrounds');
    });
  });

module.exports = router;