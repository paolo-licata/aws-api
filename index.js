//Requiring mongoose and model.js
const mongoose = require('mongoose');
const Models = require('./models.js');

mongoose.connect('mongodb://localhost:27017/cfDB', { useNewUrlParser: true, useUnifiedTopology: true });

const Movies = Models.Movie;
const Users = Models.User;

const bodyParser = require('body-parser');
//Requiring express and uuid
const express = require('express'),
  morgan = require('morgan'),
  uuid = require('uuid');

const app = express();

//Middleware
app.use(morgan('common'));

//Express static function
app.use(express.static('public'));

app.use(bodyParser.json());

let auth = require('./auth.js')(app);

const passport = require('passport');
require('./passport.js');

      //CREATE

      //CREATE or POST - Create a new account/ Registration
      app.post('/users', async (req, res) => {
        await Users.findOne({ Username: req.body.Username })
          .then((user) => {
            if (user) {
              return res.status(400).send(req.body.Username + 'already exists');
            } else {
              Users
                .create({
                  Username: req.body.Username,
                  Password: req.body.Password,
                  Email: req.body.Email,
                  Birthday: req.body.Birthday
                })
                .then((user) =>{res.status(201).json(user) })
              .catch((error) => {
                console.error(error);
                res.status(500).send('Error: ' + error);
              })
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
        app.put('/users/:Username', passport.authenticate('jwt', {session: false}), async (req, res) => {
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
app.listen(8080, () => {
    console.log("App is listening on port 8080.")
});