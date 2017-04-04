const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const URLSlugs = require('mongoose-url-slugs');

const PoemSchema = new Schema({
    authorID: {type: Schema.Types.ObjectId, ref: 'User'},
    username: {type: String, default: '', trim: true}, 
    //is username necessary?
    prompt: {},
    body: {type: String, default: '', trim: true},
    likes: {type: Number, default: 0, trim: true},
});

const PromptSchema = new Schema({
    title: {type: String, default: '', trim: true},
    poems: [{ type: Schema.Types.ObjectId, ref: 'Poem' }]
});

const UserSchema = new Schema({
    name: {type: String, default: '', trim: true},
    userID: {type: String, default: '', trim: true},
    poems: [{ type: Schema.Types.ObjectId, ref: 'Poem' }]
});


PromptSchema.plugin(URLSlugs('title'));
//will be added with the field name 'slug'

const Poem = mongoose.model('Poem', PoemSchema);
const Prompt = mongoose.model('Prompt', PromptSchema);
const User = mongoose.model('User', UserSchema);

//mongoose.connect('mongodb://localhost/fp');
mongoose.connect('mongodb://ashleytqy:password123@ds147920.mlab.com:47920/finalproject');


//create 3 prompts to test
Prompt.count({}, (err, count) => {
  if (count < 3) {
    const prompt1 = new Prompt({
      'title': 'write a poem about everything you would like to say no to.'
      });

      prompt1.save((err) => {
        if (err) {
          console.log(err);
        } else {
          console.log('sucessfully created prompt1!');
        }
    });

    const prompt2 = new Prompt({
      'title': 'write a poem that is a riddle.'
      });

      prompt2.save((err) => {
        if (err) {
          console.log(err);
        } else {
          console.log('sucessfully created prompt2!');
        }
    });

    const prompt3 = new Prompt({
      'title': 'pen a list poem documenting some things you dread.'
      });

      prompt3.save((err) => {
        if (err) {
          console.log(err);
        } else {
          console.log('sucessfully created prompt3!');
        }
    });
  } else {
    console.log('not creating any more prompts');
  }
})