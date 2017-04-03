const express = require('express');
const path = require('path');
// const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
// const passport = require('passport');
// const Strategy = require('passport-local').Strategy;
const mongoose = require('mongoose');

//database setup
const db = require('./db');
const Prompt = mongoose.model('Prompt');
const Poem = mongoose.model('Poem');
const User = mongoose.model('User');

// Configure the local strategy for use by Passport.
// passport.use(new Strategy(
//   function(username, password, cb) {
//     db.users.findByUsername(username, function(err, user) {
//       if (err) { return cb(err); }
//       if (!user) { return cb(null, false); }
//       if (user.password !== password) { return cb(null, false); }
//       return cb(null, user);
//     });
//   }));

// Configure Passport authenticated session persistence.
// passport.serializeUser(function(user, cb) {
//   cb(null, user.id);
// });

// passport.deserializeUser(function(id, cb) {
//   db.users.findById(id, function (err, user) {
//     if (err) { return cb(err); }
//     cb(null, user);
//   });
// });

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// Initialize Passport and restore authentication state
// app.use(passport.initialize());
// app.use(passport.session());
app.get('/:prompt/create', (req, res) => {
  const promptName = req.params.prompt;
  res.render('create', { title: promptName });
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
                console.log(prompt.poems);

                res.render('prompt', { 'poems': prompt.poems});   
              });
      }
    }
  })
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});


// error handler
app.use(function(err, req, res) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
