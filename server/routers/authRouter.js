var router = require('express').Router();
var authenticator = require('../authenticator');
var db = require('../models/index');

//Fitbit API Clients
var fitbitApiClient = require("fitbit-node"),
  client = new fitbitApiClient("02e31ec9a3edea9b7587189546963420", "dba81a2c03e8d54b816455d91c5e76ee");   //Refactor to not be hardcoded in the future
var requestTokenSecrets = {};

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
    client.getRequestToken().then(function (results) {
      var token = results[0],
        secret = results[1];
      requestTokenSecrets[token] = secret;
      res.redirect("http://www.fitbit.com/oauth/authorize?oauth_token=" + token);
    }, function (error) {
      res.send(error);
    });
});

router.route("/fitbit/callback")
  .get(function (req, res) {
    var token = req.query.oauth_token,
      secret = requestTokenSecrets[token],
      verifier = req.query.oauth_verifier;

    client.getAccessToken(token, secret, verifier).then(function (results) {
      var accessToken = results[0],
        accessTokenSecret = results[1],
        userId = results[2].encoded_user_id;
      
      var credentials = {
        fitbitToken : accessToken,
        fitbitSecret : accessTokenSecret
      };

      return client.get("/profile.json", accessToken, accessTokenSecret).then(function (results) {
              var response = results[0];              
              res.cookie('fitbitAuth', credentials, { maxAge: 900000 });
              res.send(response);
            });
      }, function (error) {
          res.send(error);
    });
});

router.route('fitbit/request/')
  .get(function(req, res) {
    res.send("Test");
  });

/*router.route("/fitbit/request")
  .get(function (req, res) {
    /*return function() {
      res.send("test");
    });*/
    //res.send("Test");
      /*return client.get("/profile.json", accessToken, accessTokenSecret).then(function (results) {
              var response = results[0];              
              res.cookie('fitbitAuth', credentials, { maxAge: 900000 });
              res.send(response);
            });
      }, function (error) {
          res.send(error);
  });*/
    /*return client.get("/activities/heart/date/2015-10-06.json", req.cookies.fitbitAuth.fitBitToken, 
      req.cookies.fitbitAuth.fitBitSecret).then(function (results) {
        res.send(results);
      }); 
    }, function (error) {
      res.send(error);
});*/

module.exports = router;
