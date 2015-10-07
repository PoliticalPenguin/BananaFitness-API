var router = require('express').Router();
var authenticator = require('../authenticator');
var db = require('../models/index');

//Fitbit API Clients
var fitbitApiClient = require("fitbit-client-oauth2"),
  client = new fitbitApiClient("02e31ec9a3edea9b7587189546963420", "dba81a2c03e8d54b816455d91c5e76ee");   //Refactor to not be hardcoded in the future

//Local Signin route
router.route('/signin')
  .post( authenticator.authenticate('local', 
    { failureRedirect: '/signin' }),
    function(req,res) {
      req.session.userid = req.user.id;
      res.end();
  });

//Local Signup Route
router.route('/signup')
  .post(function (req, res) {
    db.User.findOrCreate({
      where: {
        username: req.body.username,
        password: req.body.password
      }
    }).spread(function (user, created) {
      if (!created) {
        console.log('User already exists!');
        // Handle sending error about user not existing
      } else {
        console.log('User created');
      }
      res.json(user);
    });
  });

router.route('/signout')
  .get(function (req, res) {
    req.logout();
    res.send("logged out", 401);
  });

//Fitbit Oauth Routes
router.route("/fitbit/authorize")
  .get(function (req, res) {
    res.redirect("https://www.fitbit.com/oauth2/authorize?response_type=token&client_id=229WNK&scope=activity%20heartrate%20profile&expires_in=604800");
  });

router.route("/fitbit/callback")
  .get(function (req, res) {
    console.log(req);
    res.json(req);
});

router.route('/fitbit/request/')
  .get(function(req, res) {
    client.get('/activities/heart/date/today/1d.json',  req.cookies.fitbitAuth.fitbitToken, req.cookies.fitbitAuth.fitbitSecret).then(function(results) {
      var response = results[0];
      res.send(response);
    })
    .catch(function(err) {
      res.status(200).send(err);
    });
  });

module.exports = router;
