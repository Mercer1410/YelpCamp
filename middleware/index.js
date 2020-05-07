var Campground = require("../models/campground");
var Comment = require("../models/comment");

//all middlewares
var middlewareObj = {};

middlewareObj.checkOwnership = function(req,res,next){
    if(req.isAuthenticated()){
		Campground.findById(req.params.id, function(err, foundCampground){
			if(err){
                req.flash("error", "Campground Not Found");
				res.redirect("back");
			}else{
				//does the user own the campground
				if(foundCampground.author.id.equals(req.user._id) || req.user.isAdmin){
					next();
				}else{
                    req.flash("error", "You don't Own this Campground.");
					res.redirect("back");
				}
			}
		});
	}else{
        req.flash("error", "You need to be Logged In to do that");
		res.redirect("back");
	}
}

middlewareObj.checkCommentOwnership = function(req,res,next){
    if(req.isAuthenticated()){
		Comment.findById(req.params.comment_id, function(err, foundComment){
			if(err){
				res.redirect("back");
			}else{
				//does the user own the comment
				if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin){
					next();
				}else{
                    req.flash("error", "You don't own this comment.");
					res.redirect("back");
				}
			}
		});
	}else{
        req.flash("error", "You need to be Logged In to do that.");
		res.redirect("back");
	}
}
middlewareObj.isLoggedIn = function(req,res,next){
    if(req.isAuthenticated()){
		return next();
    }
    req.flash("error", "You need to be Logged In to do that");
	res.redirect("/login");
}


module.exports = middlewareObj;