var router = require('express').Router();
var validator = require('validator');
var db = require('../models/index');
 
// NEEDS TESTING
router.route('/')
  // Creates new moves for a workout
  .post(function (req, res) {
    db.Move.findOrCreate({
      where: {
        WorkoutId: req.body.workoutid,
        name: req.body.name,
        category: req.body.category,
        weight: req.body.weight,
        reps: req.body.reps
      }
    }).spread(function (move, created) {
      if (!created) {
        console.log('Move already exists!');
        // Handle sending error about move not existing
      } else {
        console.log('Move created!');
      }
      res.json(workout);
    });
  });

module.exports = router;