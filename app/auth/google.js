/**
 * Nodejs Passport-Google Login Authentication Application
 *
 * @description This is a sample application which can be used for basic
 *              login authentication of using google
 *
 * @author Netobjex Inc.
 */

/*
==============================================
    Modules Required
==============================================
*/
const express = require('express');

const passport = require('passport');

const router = express.Router();

const GoogleStrategy = require('passport-google-oauth2').Strategy;



/*
==============================================
    Mongo Models Required
==============================================
*/
const User = require('../models/user');

/*
==============================================
    Passport Google Authentication Strategy
==============================================
*/


passport.use(new GoogleStrategy({
  clientID: process.env.googleClientId,
  clientSecret: process.env.googleClientSecret,
  callbackURL: `http://localhost:${process.env.PORT}/auth/google/callback`,
  passReqToCallback: true,
},

((req, token, refreshToken, profile, done) => {
  // asynchronous
  process.nextTick(() => {
    // check if the user is already logged in
    if (!req.user) {
      User.findOne({ 'google.id': profile.id }, (err, user) => {
        if (err) return done(err);

        if (user) {
        // if there is a user id already but no token (user was linked at
        // one point and then removed)
          if (!user.google.token) {
            user.google.token = token;
            user.displayName = profile.displayName;
            user.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email
            User.save((error) => {
              if (error) return done(error);
              return done(null, user);
            });
          }

          return done(null, user);
        }
        const newUser = new User();

        newUser.google.id = profile.id;
        newUser.google.token = token;
        newUser.displayName = profile.displayName;
        newUser.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email
        newUser.save((error) => {
          if (error) return done(error);

          return done(null, newUser);
        });
      });
    } else {
      // user already exists and is logged in, we have to link accounts
      const { user } = req; // pull the user out of the session
      user.google.id = profile.id;
      user.google.token = token;
      user.displayName = profile.displayName;
      user.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email

      const myquery = { id: profile.id };
      const newvalues = { token: profile.id };

      User.update(myquery, newvalues, (err) => {
        if (err) return done(err);

        return done(null, user);
      });
    }
  });
})));

/*
==============================================
    Routers to handle google authentication
==============================================
*/
router.get('/google',
  passport.authenticate('google', { scope: ['email','profile'] }));

// GET /auth/google/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
router.get('/google/callback', 
  passport.authenticate('google', { successRedirect:'/dashboard',failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

module.exports = router;
