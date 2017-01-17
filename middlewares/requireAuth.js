module.exports = function(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    req.flash('warn_msg', 'Not logged in.')
    res.redirect('/login');
  }
}
