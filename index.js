const mongoose = require('mongoose');
const Models = require('./models.js');

mongoose.connect( process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const Movies = Models.Movie;
const Users = Models.User;

const bodyParser = require('body-parser');
//Requiring EXPRESS and UUID
const express = require('express'),
  morgan = require('morgan'),
  uuid = require('uuid');

const app = express();

//CORS
const cors = require('cors');
app.use(cors());

let auth = require('./auth.js')(app);

//PASSPORT
const passport = require('passport');
require('./passport.js');

const { check, validationResult } = require('express-validator');
app.use(morgan('common'));

app.use(express.static('public'));

app.use(bodyParser.json());

      //CREATE

      //CREATE or POST - Create a new account/ Registration
      app.post('/users',
        //Validation logic
        [
          check('Username', 'Username is required').isLength({min: 5}),
          check('Username', 'Username contains non alphanumeric characters - Not allowed.').isAlphanumeric(),
          check('Password', 'Password is required').not().isEmpty(),
          check('Email', 'Email appears to be invalid').isEmail()
        ],  async (req, res) => {

          //Checks for validation errors
          let errors = validationResult(req);

          if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
          }

        let hashedPassword = Users.hashPassword(req.body.Password);
        await Users.findOne({ Username: req.body.Username })
          .then((user) => {
            if (user) {
              return res.status(400).send(req.body.Username + 'already exists');
            } else {
              Users
                .create({
                  Username: req.body.Username,
                  Password: hashedPassword,
                  Email: req.body.Email,
                  Birthday: req.body.Birthday
                })
                .then((user) =>{res.status(201).json(user) })
              .catch((error) => {
                console.error(error);
                res.status(500).send('Error: ' + error);
              });
            }
          })
          .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
          });
      });

      //READ

      //GET requests
      app.get('/', (req, res) => {
        res.send("<h1>Welcome to myFlix!</h1>")
      });

      app.get('/documentation', (req, res) => {
        res.sendFile('public/documentation.html', {root: __dirname});
      });

      //GET a list of all users
      app.get('/users', passport.authenticate('jwt', {session: false}), async (req, res) => {
        await Users.find()
          .then((users) => {
            res.status(201).json(users);
          })
          .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
          });
      });

      // Get a user by username
      app.get('/users/:Username', passport.authenticate('jwt', {session: false}), async (req, res) => {
        await Users.findOne({ Username: req.params.Username })
          .then((user) => {
            res.json(user);
          })
          .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
          });
      });

      //GET a list of all movies
      app.get('/movies', passport.authenticate('jwt', {session: false}), (req, res) => {
        Movies.find()
          .then((movies) => {
            res.status(201).json(movies);
          })
          .catch((err) => {
            console.error(err);
            res.status(500).send('Error ' + err);
          });
      });

      //GET a movie by movie title
      app.get('/movies/:Title', passport.authenticate('jwt', {session: false}), (req, res) => {
        Movies.findOne({ Title: req.params.Title })
          .then((movies) => {
            res.json(movies);
          })
          .catch((err) => {
            console.error(err);
            res.status(500).send('Error ' + err);
          });
      });

      //GET a description of specific genre
      app.get('/movies/genre/:genreName', passport.authenticate('jwt', {session: false}), (req, res) => {
        Movies.findOne({ "Genre.Name": req.params.genreName })
          .then((movie) => {
            res.json(movie.Genre);
          })
          .catch((err) => {
            console.error(err);
            res.status(500).send('Error ' + err);
          });
      });

      //GET information on a Director 
      app.get('/movies/directors/:directorName', passport.authenticate('jwt', {session: false}), (req, res) => {
        Movies.findOne({ "Director.Name": req.params.directorName })
          .then((movie) => {
            res.json(movie.Director);
          })
          .catch((err) => {
            console.error(err);
            res.status(500).send('Error ' + err);
          });
      });

      //UPDATE

      //Update or change the username
        app.put('/users/:Username', passport.authenticate('jwt', {session: false}),

        [
          check('Username', 'Username is required').isLength({min: 5}),
          check('Username', 'Username contains non alphanumeric characters - Not allowed.').isAlphanumeric(),
          check('Password', 'Password is required').not().isEmpty(),
          check('Email', 'Email appears to be invalid').isEmail()
        ],  async (req, res) => {

          //Checks for validation errors
          let errors = validationResult(req);

          if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
          }
        
          //Condition to check if same user is making the put request
          if(req.user.Username !== req.params.Username){
            return res.status(400).send('Permission denied');
        }

      await Users.findOneAndUpdate({ Username: req.params.Username }, { $set:
          {
            Username: req.body.Username,
            Password: req.body.Password,
            Email: req.body.Email,
            Birthday: req.body.Birthday
          }
        },
        { new: true }) // This line makes sure that the updated document is returned
        .then((updatedUser) => {
          res.json(updatedUser);
        })
        .catch((err) => {
          console.error(err);
          res.status(500).send('Error: ' + err);
        })

      });

      //Adds a new movie to user's favorites array
      app.post('/users/:Username/movies/:MovieID', passport.authenticate('jwt', {session: false}), async (req, res) => {
        await Users.findOneAndUpdate({ Username: req.params.Username }, {
           $push: { FavoriteMovies: req.params.MovieID }
         },
         { new: true }) // This line makes sure that the updated document is returned
        .then((updatedUser) => {
          res.json(updatedUser);
        })
        .catch((err) => {
          console.error(err);
          res.status(500).send('Error: ' + err);
        });
      });

      //DELETE

      //Deletes or removes a movie from user's favorites array
      app.delete('/users/:Username/movies/:MovieID', passport.authenticate('jwt', {session: false}), async (req, res) => {
        await Users.findOneAndUpdate({ Username: req.params.Username }, {
           $pull: { FavoriteMovies: req.params.MovieID }
         },
         { new: true }) // This line makes sure that the updated document is returned
        .then((updatedUser) => {
          res.json(updatedUser);
        })
        .catch((err) => {
          console.error(err);
          res.status(500).send('Error: ' + err);
        });
      });

      // Delete a user by username / Deregister
      app.delete('/users/:Username', passport.authenticate('jwt', {session: false}), (req, res) => {
        Users.findOneAndDelete({ Username: req.params.Username })
        .then((user) => {
          if (!user) {
            res.status(400).send(req.params.Username + ' was not found');
          } else {
            res.status(200).send(req.params.Username + ' was deleted.');
          }
        })
        .catch((err) => {
          console.error(err);
          res.status(500).send('Error: ' + err);
        });
    });

            //Error handler
      app.use((err, req, res, next) => {
        console.log(err.stack);
        res.status(500).send('Something went wrong!');
      });

//port that listens for requests
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0',() => {
 console.log('Listening on Port ' + port);
});