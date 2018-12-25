const express = require('express');
var router = express.Router();
// var mongoose = require('mongoose');

// User dashboaindexrd

router.get('/home', function (req, res) {
    res.render('home');
});

router.get('/signin', function (req, res) {
    res.render('signin');
});

router.get('/signup', function (req, res) {
    res.render('signup');
});

router.get('/forget_password', function (req, res) {
    res.render('forget_password');
});
module.exports=router;