const express = require('express');
const app = express();
const path = require('path');
// const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const passport = require('passport');
const Strategy = require('passport-facebook').Strategy;
// const Strategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const session = require('express-session');
require('./env');

//database setup
const db = require('./db');
const Prompt = mongoose.model('Prompt');
const Poem = mongoose.model('Poem');
const User = mongoose.model('User');

// Configure the local strategy for use by Passport.
passport.use(new Strategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/login/facebook/return'
  },
  (accessToken, refreshToken, profile, cb) =>{
    //save profile to database
    User.findOne({'userID': profile.id}, (err, user) => {
      console.log('user is');
      console.log(user);
      //user doesn't already exist
      if (!user) {
        //create a new user
        const newUser = new User({
          'name': profile.displayName,
          'userID': profile.id,
          'poems': []
        });

        //save new user to database
        newUser.save(err => {
          if (err) {
            console.log(err);
          } else {
            console.log('new user created!');
            return cb(null, newUser);
          };
        }) 

      } else {
        //user already exists
        console.log('user exists~!');
        return cb(null, user);
      }
    })
  }));

// Configure Passport authenticated session persistence.
passport.serializeUser((user, cb) => {
  cb(null, user.userID);
});

passport.deserializeUser((id, cb) => {
  User.findOne({'userID': id}, (err, user) => {
    cb(err, user);
  });
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true
}));
app.use(express.static(path.join(__dirname, 'public')));
// Initialize Passport and restore authentication state
app.use(passport.initialize());
app.use(passport.session());


// Define Routes
app.get('/login', (req, res) => {
  res.render('login');
})

app.get('/login/facebook', passport.authenticate('facebook', {session: true}));

app.get('/login/facebook/return', 
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/');
  });


app.get('/profile',
  require('connect-ensure-login').ensureLoggedIn(),
  function(req, res){
    console.log('connect ensure login:');
    console.log(req);
    res.render('user', { user: req.user });
  });


//end passport stuff

//prompt stuff
app.get('/:prompt/create', (req, res) => {
  const slug = req.params.prompt;
  Prompt.findOne({'slug': slug}, (err, prompt, count) => {
      res.render('create', {title: prompt.title});
  });
});

app.post('/:prompt/create', (req, res) => {
    //should be /:prompt/create
    const promptSlug = req.params.prompt;
    const htmlBody = req.body.htmlBody;

    Prompt.findOne({'slug': promptSlug}, (err, prompt, count) => {
      if (err) {
        console.log(err);
      } else {
        console.log(prompt);
        console.log('found the prompt!')

        //create the poem object and save it
        const poem = new Poem({
          'user' : 'This is a test user',
          'prompt'   : 'This is a test prompt.',
          'body': htmlBody,
          'likes': 0
        });

        poem.save((err) => {
          if (err) {
            res.render('error', {message: err});
          } else {
            //save poem into prompts database
            prompt.poems.push(poem._id);
            prompt.save(err => {
              console.log('new set of poems:');
              console.log(prompt);
              console.log('successfully saved poem!');
            })
          }  
        });
      }

      //show 'success' or 'failed' message
      //should redirect to the prompt page
      res.redirect(`/${promptSlug}`);
    })
});

app.get('/:prompt/:poem/delete', (req, res) => {
    //should be /:prompt/create
    const promptSlug = req.params.prompt;
    const poemID = req.params.poem;

    Poem.findByIdAndRemove(poemID, (err, poem) => {
      if (!err) {
        console.log('success!');
      }
    });

    Prompt.findOne({'slug': promptSlug}, (err, prompt, count) => {
      if (err) {
        console.log(err);
      } else {
        console.log(prompt);
        console.log('found the prompt!');

        const index = prompt.poems.indexOf(poemID);
        if (index > -1) {
          prompt.poems.splice(index, 1);
        }

        prompt.save(err => {
          console.log('new set of poems after deleting:');
          console.log(prompt);
        })
      }
      //show 'success' or 'failed' message
      res.redirect('/' + promptSlug);
    });
});

app.get('/:prompt/:poem/edit', (req, res) => {
    //should be /:prompt/create
    const promptSlug = req.params.prompt;
    const poemID = req.params.poem;

    Poem.findOne({'_id': poemID}, (err, poem) => {
      if (err) {
        res.render(err);
      } else {
        console.log('success!');
        console.log(poem);
        res.render('edit', {'originalBody': poem.body});
      }
    });
});

app.post('/:prompt/:poem/edit', (req, res) => {
    //should be /:prompt/create
    const promptSlug = req.params.prompt;
    const poemID = req.params.poem;
    const htmlBody = req.body.htmlBody;

    Poem.findByIdAndUpdate(poemID, {'body': htmlBody }, (err, poem) => {
      console.log(err, poem);
      res.redirect(`/${promptSlug}`);
    })
});

//getting the prompt page, and populating the poems that respond to that prompt
app.get('/:prompt', (req, res) => {
  const promptSlug = req.params.prompt;
  //find prompt in database
  Prompt.findOne({'slug': promptSlug}, (err, prompt, count) => {
    if (err) {
      console.log(err);
    } else {
      //check if prompt exists
      if (prompt === null || prompt === undefined) {
        res.render('error', {message: `prompt doesn't exist.`});
      } else {
        //prompt exists!
        //find all the poems in this prompt and display it
        Prompt.findOne({'slug': promptSlug})
              .populate('poems')
              .exec((err, prompt) => {
                res.render('prompt', { 'slug': promptSlug, 'title': prompt.title, 'poems': prompt.poems});   
              });
      }
    }
  })
});

//homepage
app.get('/', (req, res) => {
  Prompt.find({}, (err, prompts) => {
    console.log('USER IS');
    console.log(req.user);
      res.render('index', {'prompts': prompts,'user': req.user});
  })
})


// handle 404 errors
app.use((req, res) => {
  res.status(400);
  res.render('error', {message: '404 error: page not found'});
});

// handle 500 errors
app.use((error, req, res) => {
  res.status(500);
  res.render('error', {message: '500 error'});
});

// error handler
app.use((err, req, res) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
