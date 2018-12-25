/**
 * Nodejs Passport-Local Login Authentication routerlication
 *
 * @description This is a sample routerlication which can be used for basic login
 *              authentication of using username and password
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

const LocalStrategy = require('passport-local').Strategy;

/*
==============================================
    Mongo Models Required
==============================================
*/

const User = require('../models/user');


/*
==============================================
    Passport Local Authentication Strategy
==============================================
*/

passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true,
},

((args, email, password, done) => {
  process.nextTick(() => {
    User.findOne({ email }, (err, user) => {
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false);
      }
      if (!user.validPassword(password)) {
        return done(null, false);
      }
      return done(null, user);
    });
  });
})));
/*
==============================================
    Routers to handle local authentication
==============================================
*/
// local  ---------------------------------
// send to local to do the authentication
router.post('/local_login', passport.authenticate('local', {
  successRedirect: '/dashboard',
  failureRedirect: '/login',
}));

// handle the callback after facebook has authenticated the user

router.get('/local/callback',
  passport.authenticate('local', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/dashboard');
  });


/*
==============================================
    Routers to handle signup
==============================================
*/
// process the signup form
router.post('/signup', passport.authenticate('local-signup', {
  successRedirect: '/', // redirect to the secure profile section
  failureRedirect: '/signup', // redirect back to the signup page if there is an error
  failureFlash: true, // allow flash messages
}));

passport.use('local-signup', new LocalStrategy({
  // by default, local strategy uses username and password, we will override with email
  usernameField: 'email',
  passwordField: 'password',
  first_name: 'displayName',
  passReqToCallback: true, // allows us to pass in the req from our route
  // (lets us check if a user is logged in or not)
},

((req, Email, password, done) => {
  let email;
  if (Email) {
    email = Email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching
  }

  // asynchronous
  process.nextTick(() => {
    // if the user is not already logged in:
    if (!req.user) {
      User.findOne({ 'local.email': email }, (err, user) => {
        // if there are any errors, return the error
        if (err) return done(err);

        // check to see if theres already a user with that email
        if (user) {
          return done(null, false);
        }

        // create the user
        const newUser = new User();
        newUser.displayName = req.body.displayName;
        newUser.email = email;
        newUser.local.password = newUser.generateHash(password);

        newUser.save((error) => {
          if (error) return done(error);

          return done(null, newUser);
        });
        // if nothing goes well
        return false;
      });
      // if the user is logged in but has no local account...
    } else if (!req.user.email) {
      // ...presumably they're trying to connect a local account
      // BUT let's check if the email used to connect a local account is being used by another user
      User.findOne({ email }, (err, user1) => {
        if (err) return done(err);

        if (user1) {
          return done(null, false);
          // Using 'loginMessage instead of signupMessage because it's used by /connect/local'
        }
        const { user } = req;
        user.displayName = req.body.first_name;
        user.email = req.body.email;
        user.local.password = user.generateHash(password);
        user.save((error) => {
          if (error) return done(err);

          return done(null, user);
        });
        // if nothing goes well
        return false;
      });
    } else {
      // user is logged in and already has a local account. Ignore signup.
      // (You should log out before trying to create a new account, user!)
      return done(null, req.user);
    }
    // if nothing goes well
    return false;
  });
})));


module.exports = router;
