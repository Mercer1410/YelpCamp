var express = require("express");
var router = express.Router();


var Campground = require("../models/campground");
var middleware = require("../middleware"); 

router.get("/",function(req,res){
	Campground.find({}, function(err, allCampground){
		if(err){
			console.log(err);
		}else{
			res.render("campgrounds/index", {campgrounds: allCampground});
		}
	});
});

router.post("/", middleware.isLoggedIn, function(req,res){
	var name = req.body.name;
	var price = req.body.price;
	var image = req.body.image;
	var desc = req.body.description;
	var author = {
		id: req.user._id,
		username: req.user.username
	};
	var NewCampground = {name: name, price: price, image: image, description: desc, author: author};
	Campground.create(NewCampground, function(err, newcreated){
		if(err){
			console.log(err);
		}else{
			res.redirect("/campgrounds");
		}
	});
	
});

router.get("/new", middleware.isLoggedIn, function(req,res){
	res.render("campgrounds/new");
});

router.get("/:id", function(req,res){
	Campground.findById(req.params.id).populate("comments").exec(function(err, foundCamp){
		if(err){
			console.log(err);
		}
		else{
			res.render("campgrounds/show", {item : foundCamp});
		}
	});
});

//Edit Campground
router.get("/:id/edit", middleware.checkOwnership, function(req,res){
	Campground.findById(req.params.id, function(err, foundCampground){
		res.render("campgrounds/edit", {campground: foundCampground});
	});
});
//Update Campground
router.put("/:id", middleware.checkOwnership, function(req,res){
	//find and update
	Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground){
		if(err){
			console.log(err);
			res.redirect("/campgrounds");
		}else{
			res.redirect("/campgrounds/"+req.params.id);
		}
	});
});

//Destroy Campground Route
router.delete("/:id", middleware.checkOwnership, function(req,res){
	Campground.findByIdAndRemove(req.params.id, function(err){
		if(err){
			res.redirect("/campgrounds");
		}else{
			res.redirect("/campgrounds");
		}
	});
});

module.exports = router;