const express = require('express'),
  morgan = require('morgan');

const app = express();

//Middleware
app.use(morgan('common'));

//Express static function
app.use(express.static('public'));


    //json movie list
    let topMovies = [
        {
          title: 'The Last Airbender',
          genre: 'Fantasy adventure'
        },
        {
          title: 'Dune: Part Two',
          genre: 'Action'
        },
        {
          title: 'Amy',
          genre: 'Documentary'
        },
        {
          title: 'Bad Boys',
          genre: 'Crime, Action'
        },
        {
          title: 'The Godfather',
          genre: 'Crime'
        },
        {
          title: 'Cars',
          genre: 'Kids'
        },
        {
          title: 'The Karate Kid',
          genre: 'Action, Sport'
        },
        {
          title: 'Deadpool',
          genre: 'Action, Comedy'
        },
        {
          title: 'Mad Max',
          genre: 'Adventure'
        },
        {
          title: 'Interstellar',
          genre: 'Adventure'
        }
      ];

      //GET requests
      app.get('/', (req, res) => {
        res.send("<h1>Welcome to myFlix!</h1>")
      });

      app.get('/documentation', (req, res) => {
        res.sendFile('public/documentation.html', {root: __dirname});
      });

      app.get('/movies', (req, res) => {
        res.json(topMovies);
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