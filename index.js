require('dotenv').config(); // Load environment variables from .env file
const { S3Client, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const mongoose = require('mongoose');

const dbUri = process.env.DB_HOST; // Fetch the DB_HOST from environment variables

mongoose.connect(dbUri)
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch(err => {
        console.error('Error connecting to MongoDB:', err);
    });

const Models = require('./models.js');

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

const { check, validationResult } = require('express-validator');
app.use(morgan('common'));

app.use(express.static('public'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//Configuration of S3
const fs = require('fs');
const fileUpload = require('express-fileupload');
const path = require('path');

app.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 },
}));

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-central-1',
});

// Serve the static index.html file
app.get('/index', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint to list images in the S3 bucket
app.get('/images', async (req, res) => {
  const listObjectsParams = {
      Bucket: process.env.S3_BUCKET_NAME || 'aws-bucket-for-cf'
  };

  try {
      const listObjectsResponse = await s3Client.send(new ListObjectsV2Command(listObjectsParams));
      res.send(listObjectsResponse);
  } catch (error) {
      console.error(error);
      res.status(500).send('Error fetching images: ' + error.message);
  }
});

const UPLOAD_TEMP_PATH = 'C:\\Users\\paolo\\Desktop\\movie_api_aws\\temp';

app.post('/images', async (req, res) => {
  // Check if a file was uploaded
  if (!req.files || !req.files.image) {
      return res.status(400).send('No image was uploaded.');
  }

  const file = req.files.image; // The uploaded file
  const fileName = file.name; // Original name of the uploaded file

  // If you want to save it temporarily (optional), you can define a temporary path
  const tempPath = path.join(__dirname, 'temp', fileName);

  // Move the file to the temporary path
  file.mv(tempPath, async (err) => {
      if (err) {
          return res.status(500).send('Error moving file: ' + err.message);
      }

      // Prepare S3 upload parameters
      const uploadParams = {
          Bucket: process.env.S3_BUCKET_NAME || 'aws-bucket-for-cf',
          Key: fileName, // The name to save as in S3
          Body: fs.createReadStream(tempPath) // Read the file from the temp path
      };

      try {
          const command = new PutObjectCommand(uploadParams);
          await s3Client.send(command);
          res.status(201).send('File uploaded successfully.');

          // Optionally, clean up the temporary file after uploading
          fs.unlink(tempPath, (err) => {
              if (err) console.error('Error deleting temp file: ', err);
          });
      } catch (error) {
          console.error(error);
          res.status(500).send('Error uploading file to S3: ' + error.message);
      }
  });
});


let auth = require('./auth.js')(app);

//PASSPORT
const passport = require('passport');
require('./passport.js');

      //CREATE

      /**
       * Creation of a new account
       * Username must be at least 5 characters 
       * Password and email have to be valid
       * @name CreateUser
       * @function
       * @returns {Object} JSON Obj of the created user
       */
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

      /**
       * Home page of the server
       * @name /
       * @function
       * @memberof module:route
       * @returns {string} Welcome message
       */
      app.get('/', (req, res) => {
        res.send("<h1>Welcome to myFlix!</h1>")
      });

      app.get('/documentation', (req, res) => {
        res.sendFile('public/documentation.html', {root: __dirname});
      });

      /**
       * Returns a list of all the users registered and currently using the service
       * @name GetUsers
       * @function
       * @returns {Object[]} Array of registered users
       */
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

      /**
       * Returns a single user by their username
       * @name GetOneUser
       * @function
       * @returns {Object} JSON Obj of the selected user
       */
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

      /**
       * Returns a list of all the movies currently stored in the database
       * @name GetMovies
       * @function
       * @returns {Object[]} Array of the movies
       */
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

      /**
       * Return a single movie by its title
       * @name GetOneMovie
       * @function
       * @returns {Object} Movie Object pulled by title
       */
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

      /**
       * Returns a short description of the genre ( name and description )
       * @name GetGenre
       * @function
       * @returns {Object[]} Array of movies with same genre
       */
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

      /**
       * Returns information about a specific director ( name and bio )
       * @name GetDirector
       * @function
       * @returns {Object} Director Object
       */
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

      /**
       * Allows to update information about the user.
       * Just like registration,
       * username has to be at least 5 characters long and
       * password and email have to be valid
       * @name UpdateUser
       * @function
       * @returns {Object} JSON Obj of the selected user
       */
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

      /**
       * Allows the user to store a movie ( pulled by its ID )
       * to their favorite movies array
       * @name AddFavoriteMovie
       * @function
       * @returns {Object} Updated user object
       */
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

      /**
       * Allows the user to remove a movie ( pulled by its ID )
       * from their favorite movies array
       * @name RemoveFavoriteMovie
       * @function
       * @returns {Object} Updated user object
       */
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

      /**
       * Allows the user to de-register or delete their account from the service
       * @name DeleteUser
       * @function
       * @return {string} Deletion confirmation
       */
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