const express = require('express');
const router = express.Router(); // eslint-disable-line
const bcrypt = require('bcryptjs');
const config = require('config');
const nodemailer = require('nodemailer');
const requireAuth = require('../middlewares/requireAuth');
const User = require('../models/user');
const logger = require('../lib/logging');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
}, function(username, password, done) {
  User.getById(username, function(err, user) {
    if (err) {
      logger.warn('User.getById database error: ' + JSON.stringify(err));
      return done(null, false, {
        message: 'Database error',
      });
    }
    if (!user) {
      setTimeout(function() { // timeouts discourage brute force attacks
        return done(null, false, {
          message: 'Unknown user',
        });
      }, 1500);
    } else {
      if (user.validated === false)
        return done(null, false, {
          message: 'Account has not been validated yet.',
        });
      User.comparePassword(password, user.password, function(err, isMatch) {
        if (err) {
          logger.warn('User.comparePassword error: ' + JSON.stringify(err));
          return done(null, false, {
            message: 'Application error',
          });
        }
        if (isMatch) {
          user.count = user.count + 1;
          user.lastLogin = new Date();
          User.update(user, function(err, doc) {});
          return done(null, user);
        } else {
          setTimeout(function() {
            return done(null, false, {
              message: 'Invalid passsword',
            });
          }, 1500);
        }
      });
    } // else !user
  });
}));

passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  User.getPublicById(id, function(err, user) {
    done(err, user);
  });
});

// setup mailer for validation emails
const transporter = nodemailer.createTransport(config.get('mailer.url'));
const pleaseRegister = transporter.templateSender({
  bcc: config.get('mailer.admin'),
  subject: 'Please confirm your registration',
  html: 'Hello <strong>{{name}}</strong>,<br> Please click on the link to verify your email for access to The Imp.<br><a href={{link}}>Click here to verify</a>',
  from: 'sender@example.com',
});

router.get('/register', function(req, res) {
  res.render('register.jade', {
    csrfToken: req.csrfToken(),
  });
});

router.post('/register', function(req, res) {
  if (req.body.password1 !== req.body.password2)
    res.render('register.jade', {
      csrfToken: req.csrfToken(),
      error_msg: ['Passwords do not match'],
    });
  else {
    const id = req.body.email;
    const fn = req.body.firstName;
    const ln = req.body.lastName;
    const pw = req.body.password1;
    const vt = req.csrfToken(); // not really a csrfToken, just a random string for validation email

    const newUser = new User(id, fn, ln, pw, vt);
    const link = 'http://' + req.get('host') + '/verify?id=' + id + '&tk=' + vt;

    pleaseRegister({
        to: id,
      }, {
        name: fn,
        link: link,
      },
      function(error, response) {
        if (error) {
          logger.warn('Registration email error: ' + error.message);
          req.flash('error_msg', 'Failed to send registraion email.')
          res.redirect('/register')
        } else {
          User.create(newUser, function(err, id) {
            if (err) {
              res.render('register.jade', {
                csrfToken: req.csrfToken(),
                error_msg: [err.message],
              });
            } else {
              req.flash('success_msg', 'Registration email sent to ' + id);
              res.redirect('/prevalidate?email=' + id);
            }
          });
        }
      });
  }
});

router.get('/verify', function(req, res) {
  if (req.query.id) {
    User.getPublicById(req.query.id, function(err, user) {
      if (!err && typeof user._id !== 'undefined') {
        if (user.validationToken !== 'undefined' &&
          req.query.tk === user.validationToken) {
          user.validated = true;
          delete user.validationToken;
          User.update(user, function(err, u2) {
            req.flash('success_msg', 'Email ' + user._id + ' has been verified');
            res.redirect('/login');
          });
        } else {
          req.flash('error_msg', 'Validation tokens do not match.');
          res.redirect('/fatal');
        }
      } else {
        req.flash('error_msg', 'Account email id verification failed.');
        res.redirect('/fatal');
      }
    });
  } else {
    req.flash('error_msg', 'Account email id verification failed.');
    res.redirect('/fatal');
  }
});

router.get('/prevalidate', function(req, res) {
  res.render('prevalidate.jade', {
    email: req.query.email
  });
});

router.get('/login', function(req, res) {
  res.render('login.jade', {
    csrfToken: req.csrfToken(),
  });
});

router.post('/login',
  passport.authenticate('local', {
    successRedirect: '/chat',
    failureRedirect: '/login',
    failureFlash: true
  })
);

router.get('/password', requireAuth, function(req, res) {
  res.render('password.jade', {
    csrfToken: req.csrfToken()
  });
});

router.post('/password', requireAuth, function(req, res) {
  if (req.body.newpassword1 !== req.body.newpassword2)
    res.render('password.jade', {
      csrfToken: req.csrfToken(),
      error_msg: ['New passwords do not match'],
    });
  else {
    User.getById(req.user._id, function(err, usr) {
      if (!err) {
        if (bcrypt.compareSync(req.body.existingpassword, usr.password)) {
          var salt = bcrypt.genSaltSync(10);
          var hash = bcrypt.hashSync(req.body.newpassword1, salt);
          req.user.password = hash;
          User.update(req.user, function(err, id) {});
          req.flash('success_msg', 'Password updated');
          res.redirect('/chat');
        } else {
          res.render('password.jade', {
            csrfToken: req.csrfToken(),
            error_msg: ['Invalid existing password'],
          });
        }
      }
    });
  }
});

router.get('/logout', requireAuth, function(req, res) {
  req.logout();
  req.session.reset();
  res.redirect('/');
});


module.exports = router;
