const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    const prompts = ['write a poem with 3 words', 'write a poem with rhymes', 'write a poem without a noun'];
    res.render('index', { 'prompts': prompts});
});

/* GET login page. */
router.get('/login', function(req, res, next) {
  res.render('login', { title: 'Express' });
});

/* GET signup page. */
router.get('/signup', function(req, res, next) {
  res.render('signup', { title: 'Express' });
});

/* GET poem page. */
router.get('/poem', function(req, res, next) {
  res.render('poem', { title: 'Express' });
});

module.exports = router;
