const bodyParser = require('body-parser');
const express = require('express'),
  morgan = require('morgan'),
  uuid = require('uuid');

const app = express();

//Middleware
app.use(morgan('common'));

//Express static function
app.use(express.static('public'));

app.use(bodyParser.json());

//Test users
let users = [
  {
    id: 1,
    name: "Bonnie",
    favoriteMovies: []
  },
  {
    id: 2,
    name: "Clyde",
    favoriteMovies: ["Cars"]
  }
]


    //json movie list
    let movies = [
        {
          'Title': 'The Last Airbender',
          'Description': 'The series is centered around the journey of twelve-year-old Aang, the current Avatar and last survivor of his nation, the Air Nomads, along with his friends Katara, Sokka, and later Toph, as they strive to end the Fire Nation war against the other nations of the world.',
          'Genre': {
            'Name': 'Fantasy adventure',
            'Description': "This genre more often than not contains at least one fantastic element; something that it's not 'grown up' to believe is real.",
          },
          'Director': {
            'Name': "M. Night Shyamalan",
            'Bio': "Born in Puducherry, India, and raised in the suburban Penn Valley area of Philadelphia, Pennsylvania, M. Night Shyamalan is a film director, screenwriter, producer, and occasional actor, known for making movies with contemporary supernatural plots.",
          }
        },

        {
          'Title': "Amy",
          'Description': "The film covers British singer-songwriter Amy Winehouse's life and her struggle with substance abuse, both before and after her career blossomed, and which eventually caused her death.",
          'Genre': {
            'Name': "Documentary",
            'Description': "A documentary is a film or video examining an event or person based on facts.",
          },
          'Director': {
            'Name': "Asif Kapadia",
            'Bio': "Born in Hackney, London in 1972, Kapadia studied filmmaking at the Royal College of Art where he first gained recognition with his short film THE SHEEP THIEF (1997) shot in Rajasthan, India, the film won many international awards including one in the Cinefondation section of the 1998 Cannes International Film Festival and the Grand Prix at the European Film Festival in Brest...",
          }
        },

        {
          'Title': "Bad Boys",
          'Description': "Detectives Mike Lowrey and Marcus Burnett have 72 hours to find $100 million worth of heroin before Internal Affairs shuts them down. Mike becomes more involved after a friend is murdered by the drug dealers.",
          'Genre': {
            'Name': "Crime",
            'Description': 'Films of this genre generally involve various aspects of crime and its detection.',
          },
          'Director': {
            'Name': "Michael Bay",
            'Bio': "A graduate of Wesleyan University, Michael Bay spent his 20s working on advertisements and music videos.  In 1995, Bay was honored by the Directors Guild of America as Commercial Director of the Year. That same year, he also directed his first feature film, Bad Boys (1995), starring Will Smith and Martin Lawrence, which grossed more than $160 million, worldwide. His follow-up film, The Rock (1996), starring Sean Connery and Nicolas Cage, was also hugely successful, making Bay the director du jour.",
          }
        },
        
        {
          'Title': "Cars",
          'Description': "follows Lightning McQueen, a hotshot race car, stranded in Radiator Springs, a forgotten town along Route 66. To leave, he must fix the town's road, but along the way, he discovers the value of friendship and community.",
          'Genre': {
            'Name': "Animation",
            'Description': 'Animation is a filmmaking technique by which still images are manipulated to create moving images.',
          },
          'Director': {
            'Name': "John Lasseter",
            'Bio': "As Head of Skydance Animation, John Lasseter is responsible for setting the overall strategy and creative direction for the studio. In this role, he drives the division's artistic growth, overseeing production and operations, to ensure a robust slate of animated entertainment across all media. Previously, John was the Chief Creative Officer, Walt Disney and Pixar Animation Studios and Principal Creative Advisor, Walt Disney Imagineering. John made his directorial debut in 1995 with Toy Story, the world's first feature-length computer-animated film, for which he received a Special Achievement Academy Award®. He also directed A Bug's Life, Toy Story 2, Cars and Cars 2.",
          }
        },
        
      ];

      //CREATE or POST - Create a new account/ Registration
      app.post('/users', (req, res) => {
        const newUser = req.body;

        if (newUser.name) {
          newUser.id = uuid.v4();
          users.push(newUser);
          res.status(201).json(newUser)
        } else {
          res.status(400).send("User needs a name property")
        }
      });

      //UPDATE or PATCH - Update or change the username
      app.put('/users/:id', (req, res) => {
        const { id } = req.params;
        const updatedUser = req.body;

        let user = users.find( user => user.id == id );

        if (user) {
          user.name = updatedUser.name;
          res.status(200).json(user);
        } else {
          res.status(400).send("No such user found!");
        }
      });

      //CREATE or POST - Adds a new movie to user's favorites array
      app.post('/users/:id/:movieTitle', (req, res) => {
        const { id, movieTitle } = req.params;

        let user = users.find( user => user.id == id );

        if (user) {
          user.favoriteMovies.push(movieTitle);
          res.status(200).send(`${movieTitle} has been added to user ${id}'s array`);
        } else {
          res.status(400).send("No such user found!");
        }
      });

      //DELETE - Deletes or menoves a movie from user's favorites array
      app.delete('/users/:id/:movieTitle', (req, res) => {
        const { id, movieTitle } = req.params;

        let user = users.find( user => user.id == id );

        if (user) {
          user.favoriteMovies = user.favoriteMovies.filter( title => title !== movieTitle );
          res.status(200).send(`${movieTitle} has been removed from user ${id}'s array`);
        } else {
          res.status(400).send("No such user found!");
        }
      });

      //DELETE - Deletes an account 
      app.delete('/users/:id', (req, res) => {
        const { id } = req.params;

        let user = users.find( user => user.id == id );

        if (user) {
          users = users.filter( user => user.id != id );
          res.status(200).send(`User ${id} has been deleted`);
        } else {
          res.status(400).send("No such user found!");
        }
      });

      //GET requests
      app.get('/', (req, res) => {
        res.send("<h1>Welcome to myFlix!</h1>")
      });

      app.get('/documentation', (req, res) => {
        res.sendFile('public/documentation.html', {root: __dirname});
      });

      //Read
      app.get('/movies', (req, res) => {
        res.status(200).json(movies);
      });

      //GET a movie by movie title
      app.get('/movies/:title', (req, res) => {
        const { title } = req.params;
        const movie = movies.find( movie => movie.Title === title );

        if (movie) {
          res.status(200).json(movie);
        } else {
          res.status(400).send("No such movie found!")
        }
      });

      //GET a movie by movie genre
      app.get('/movies/genre/:genreName', (req, res) => {
        const { genreName } = req.params;
        const genre = movies.find( movie => movie.Genre.Name === genreName ).Genre;

        if (genre) {
          res.status(200).json(genre);
        } else {
          res.status(400).send("No such genre found!")
        }
      });

      //GET a movie by Director name
      app.get('/movies/directors/:directorName', (req, res) => {
        const { directorName } = req.params;
        const director = movies.find( movie => movie.Director.Name === directorName ).Director;

        if (director) {
          res.status(200).json(director);
        } else {
          res.status(400).send("No such director found!")
        }
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