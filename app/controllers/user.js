const express = require('express');
var router = express.Router();
// var mongoose = require('mongoose');

// User dashboard

router.get('/dashboard', function (req, res) {
    user = Object.values(req.user);
    res.render('user/dashboard',{displayName:user[3]});
});

router.get('/transactions', function (req, res) {
    user = Object.values(req.user);
    res.render('user/transactions',{displayName:user[3]});
});

router.get('/ethereum', function (req, res) {
    user = Object.values(req.user);
    res.render('user/wallet-ethereum',{displayName:user[3]});
});

router.get('/eraswap', function (req, res) {
    user = Object.values(req.user);
    res.render('user/wallet-eraswap',{displayName:user[3]});
});

router.get('/support', function (req, res) {
    user = Object.values(req.user);
    res.render('user/support',{displayName:user[3]});
});

router.get('/settings', function (req, res) {
    user = Object.values(req.user);
    res.render('user/settings',{displayName:user[3]});
});

router.get('/signout', function (req, res) {
    user = Object.values(req.user);
    req.logout();

    res.redirect("/");
});

module.exports=router;