const express = require('express');
const app = express();
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const passport = require('passport');
const Strategy = require('passport-facebook').Strategy;
const mongoose = require('mongoose');
const session = require('express-session');
const isLoggedIn = require('connect-ensure-login').ensureLoggedIn;
const striptags = require('striptags');

require('./env');

//database setup
const db = require('./db');
const Prompt = mongoose.model('Prompt');
const Poem = mongoose.model('Poem');
const User = mongoose.model('User');

//configure the passport facebook strategy
passport.use(new Strategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: __dirname + '/login/facebook/return'
  },
  (accessToken, refreshToken, profile, cb) => {
    //save profile to database
    User.findOne({userID: profile.id})
        .exec()
        .then((err, user) => {
          //user doesn't exist
          if (!user) {
            //create a new user
            const newUser = new User({
              'name': profile.displayName.toLowerCase(),
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
        .catch(err => console.log(err));
  }));

//configure passport authenticated session persistence.
passport.serializeUser((user, cb) => {
  cb(null, user.userID);
});

passport.deserializeUser((id, cb) => {
  User.findOne({userID: id}, (err, user) => {
    cb(err, user);
  });
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// app.use(favicon(path.join(__dirname, 'public', 'rimbaud.ico')));
app.use(logger('dev'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true,
  cookie: { maxAge: 3600000 }
}));
app.use(express.static(path.join(__dirname, 'public')));

//initialize passport and restore authentication state
app.use(passport.initialize());
app.use(passport.session());


/*
routes
*/

app.get('/example', (req, res) => {
  res.render('example');
})

app.get('/stats', (req, res) => {
  let userWithMostPoems;
  let promptWithMostPoems;
  let longestPoemLength;

  //something wrong here...
  //find the user with most poems 
  User.find({})
      .exec()
      .then(users => {
          userWithMostPoems = users.reduce((acc, user) => {
            if (user.poems.length > acc.maxNum) {
              acc.maxNum = user.poems.length;
              acc.name = user.name;
            }
            return acc;
          }, {maxNum: 0});   
      })
      .then(() => {
        //find longest poem length
        Poem.find({})
           .exec()
           .then(poems => {
            longestPoemLength = poems.reduce((acc, poem) => {
              const length = striptags(poem.body).length;
              if (length > acc.maxNum) {
                acc.maxNum = length;
              }
              return acc;
            }, {maxNum: 0});
           })
      })
      .then(() => {
          //find the prompt with the most responses
          Prompt.find({})
            .exec()
            .then(prompts => {
              promptWithMostPoems = prompts.reduce((acc, prompt) => {
                if (prompt.poems.length > acc.maxNum) {
                  acc.maxNum = prompt.poems.length;
                  acc.title = prompt.title;
                }
                return acc;
              }, {maxNum: 0});
                //render after all of these values have populated
                res.render('stats', {'user': req.user,
                      'users_most_poem': userWithMostPoems.name,
                      'prompt_most_poem': promptWithMostPoems.title,
                      'maxLength': longestPoemLength.maxNum});
          }) 
      })
      .catch(err => console.log(err));
})

app.get('/login', (req, res) => {
  if (req.user) {
    //if already logged in
    //redirect to home page
    res.redirect('/');
  } else {
    res.render('login');
  }
})

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});


app.get('/login/facebook', passport.authenticate('facebook', {session: true}));

app.get('/login/facebook/return', 
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/');
  });

app.get('/user/:id', (req, res) => {
  //find the user
  const id = req.params.id;
  User.findOne({'userID': id})
      .populate('poems')
      .exec((err, user) => {
        if (user === null || user === undefined) {
          res.render('error', {message: 'user not found'});
        } else {
          res.render('user', {name: user.name,
                              poems: user.poems,
                              total_poems: user.poems.length,
                              user: req.user});
          }   
        })
      .catch(err => console.log(err));
});


app.get('/profile', isLoggedIn(), (req, res) => {
    res.redirect('/user/' + req.user.userID);
});


app.get('/:prompt/create', isLoggedIn(),(req, res) => {
  const slug = req.params.prompt;
  Prompt.findOne({'slug': slug}, (err, prompt, count) => {
      res.render('create', {title: prompt.title, user: req.user});
  });
});

app.post('/:prompt/create', isLoggedIn(), (req, res) => {
    const promptSlug = req.params.prompt;
    const htmlBody = req.body.htmlBody;

    Prompt.findOne({'slug': promptSlug}, (err, prompt, count) => {
      //create the poem object and save it
      //use _id (created by mongo) instead of userID (via Facebook)
      const poem = new Poem({
        'authorID' : req.user._id,
        'username': req.user.name,
        'prompt'   : prompt.title,
        'body': htmlBody,
        'likes': 0
      });

      poem.save((err) => {
        //save poem into prompts database
        prompt.poems.push(poem._id);
        prompt.save(err => {
          console.log('successfully saved poem into prompts databse!');
        })

        //save poem into user's database too
        User.findOne({'userID': req.user.userID}, (err, user) => {
          user.poems.push(poem._id);
          user.save(err => {
            console.log('successfuly saved poem into user database!');
          })
        })

        //show 'success' or 'failed' message
        //should redirect to the prompt page
        //this should actually wait til the above stuff is done... ??
        res.redirect(`/${promptSlug}`); 
      });
    })
});

app.get('/:prompt/:poem/delete', isLoggedIn(), (req, res) => {
    const promptSlug = req.params.prompt;
    const poemID = req.params.poem;

    Poem.findByIdAndRemove(poemID, (err, poem) => {
      if (err) {
        res.render('error', {message: 'Unable to delete poem.'})
      }
    });

    Prompt.findOne({'slug': promptSlug}, (err, prompt, count) => {

      const index = prompt.poems.indexOf(poemID);
      if (index > -1) {
        prompt.poems.splice(index, 1);
      }

      prompt.save(err => {
        res.redirect('/' + promptSlug);
      })
    });
});

app.get('/:prompt/:poem/edit', isLoggedIn(), (req, res) => {
    const promptSlug = req.params.prompt;
    const poemID = req.params.poem;

    Poem.findOne({'_id': poemID}, (err, poem) => {
      res.render('edit', {originalBody: poem.body, user: req.user, title: poem.prompt});
    });
});

app.post('/:prompt/:poem/edit', isLoggedIn(), (req, res) => {
    const promptSlug = req.params.prompt;
    const poemID = req.params.poem;
    const htmlBody = req.body.htmlBody;

    Poem.findByIdAndUpdate(poemID, {'body': htmlBody }, (err, poem) => {
      res.redirect(`/${promptSlug}`);
    })
});

//getting the prompt page, and populating the poems that respond to that prompt
app.get('/:prompt', (req, res) => {
  const promptSlug = req.params.prompt;
  //find prompt in database
  Prompt.findOne({'slug': promptSlug}, (err, prompt, count) => {
    //check if prompt exists
    if (prompt === null || prompt === undefined) {
      res.render('error', {message: `page doesn't exist.`});
    } else {
      //find all the poems in this prompt and display it
      Prompt.findOne({'slug': promptSlug})
            .populate('poems')
            .exec((err, prompt) => {
              let poems;
              if (req.user) {
                const currentUserID = req.user._id;
                //check if is user's poems
                prompt.poems.forEach( poem => {
                  if (String(poem.authorID) === String(currentUserID)) {
                    poem.canModify = true;
                  } else {
                    poem.canModify = false;
                  }
                })
              }  
              res.render('prompt', { slug: promptSlug, title: prompt.title, 'poems': prompt.poems, user: req.user}); 
            });
    }
  })
});

//homepage
app.get('/', (req, res) => {
  Prompt.find({}, (err, prompts) => {
      res.render('index', {'prompts': prompts,'user': req.user});
  })
})


//handle 404 errors
app.use((req, res) => {
  res.status(400);
  res.render('error', {message: '404 error: page not found'});
});

//handle 500 errors
app.use((error, req, res) => {
  res.status(500);
  res.render('error', {message: '500 error'});
});

//error handler
app.use((err, req, res) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
