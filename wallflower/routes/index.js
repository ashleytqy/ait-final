const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', (req, res) => {
    const prompts = ['write a poem with 3 words', 'write a poem with rhymes', 'write a poem without a noun'];
    res.render('index', { 'prompts': prompts});
});

/* GET login page. */
router.get('/signin', (req, res) => {
  res.render('login', { title: 'Express' });
});

/* GET signup page. */
router.get('/signup', (req, res) => {
  res.render('signup', { title: 'Express' });
});

/* GET stats page. */
router.get('/stats', (req, res) => {
  res.render('stats', { title: 'Express' });
});

/* GET stats page. */
router.get('/create', (req, res) => {
  res.render('create', { title: 'Express' });
});

router.post('/create', (req, res) => {
    console.log(req.body);
  res.redirect('/create');
});


/* GET indiivdual prompt page. */
router.get('/:prompt', (req, res) => {
    const poems = [{
        user: 'ashley',
        body: 'this is a poem.',
        likes: 5
    }, {
        user: 'ashley2',
        body: 'this is a poem.2',
        likes: 10
    }];
    res.render('poem', { 'poems': poems});
});

module.exports = router;
