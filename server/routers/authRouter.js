var querystring = require('querystring');
var router = require('express').Router();
var authenticator = require('../authenticator');
var db = require('../models/index');
var https = require('https');

//Fitbit API Clients
var fitbitApiClient = require("fitbit-client-oauth2"),
  client = new fitbitApiClient("229WNK", "dba81a2c03e8d54b816455d91c5e76ee");   //Refactor to not be hardcoded in the future

var redirect_uri = 'https://penguin-banana-fitness-api.herokuapp.com/auth/fitbit/callback';
var scope =  [ 'activity', 'profile', 'heartrate'];

var loadedToken = {};

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
    var authorization_uri = client.getAuthorizationUrl(redirect_uri, scope);
    res.redirect(authorization_uri);

    // res.redirect("https://www.fitbit.com/oauth2/authorize?response_type=token&client_id=229WNK&scope=activity%20heartrate%20profile&expires_in=604800");
    // res.redirect("http://localhost:8080/auth/fitbit/callback#scope=heartrate+activity+profile+settings+nutrition+social+sleep+weight&user_id=3S2LJJ&token_type=Bearer&expires_in=603182&access_token=eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE0NDQ4NTM1MzQsInNjb3BlcyI6Indwcm8gd251dCB3c2xlIHdzZXQgd3dlaSB3aHIgd2FjdCB3c29jIiwic3ViIjoiM1MyTEpKIiwiYXVkIjoiMjI5V05LIiwiaXNzIjoiRml0Yml0IiwidHlwIjoiYWNjZXNzX3Rva2VuIiwiaWF0IjoxNDQ0MjUwMzUyfQ.ANYK1H1uiLtVqVJ0ACWzotBv6hwnNrgP34m6Uzlh3HA");
  });

router.route("/fitbit/callback")
  .get(function (req, res) {
  var code = req.query.code;
  client.getToken(code, redirect_uri)
    .then(function(token) {
      var credentials = {
        fitbitAccessToken : token.access_token,
        fitbitRefreshToken : token.refresh_token
      };
      loadedToken = token;
      res.cookie('fitbitAuth', credentials, {maxAge: 900000});
      res.send(token);
  });
});

router.route('/fitbit/activities')
  .get(function(req, res) {
    // Issue post request to fitbit api server
        //?startTime=12%3A20&durationMillis=600000&date=2015-03-01&distance=1.5',
    var post_data = querystring.stringify({
      'activityName': 'test',
      'manualCalories': '100',
      'startTime': '00:00:00',
      'durationMillis': '1000',
      'date': '2015-10-08'
    });
    var post_options = {
      hostname: 'api.fitbit.com',
      path: '1/user/-/activities.json',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + loadedToken.token.access_token,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': post_data.length
      }
    };
    res.send('ok');
    /*var post_req = https.request(options, function(fitbitRes) {
      var body = '';
      fitbitRes.on('data', function(d) {
        body += data;
      });
      fitbitRes.on('end', function() {
        res.send(body);
      });
    });

    post_req.write(post_data);
    post_req.end();*/
  }
  );

router.route('/fitbit/request/')
  .get(function(req, res) {
    var options = {
      hostname: 'api.fitbit.com',
      path: '/1/user/-/activities/heart/date/today/1d.json',
      headers: {
        'Authorization': 'Bearer ' + loadedToken.token.access_token
      }
    };

    https.get(options, function(fitbitRes) {
      var body = '';
      fitbitRes.on('data', function (chunk) {
          body += chunk;
        });
      fitbitRes.on('end', function() {
        console.log('Making https request!');
        res.send(body);  
      });
    }).on('error', function(e) {
        console.error(e);
      });
  });

module.exports = router;
