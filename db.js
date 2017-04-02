const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const URLSlugs = require('mongoose-url-slugs');

const PoemSchema = new Schema({
    user: {type: String, default: '', trim: true},
    prompt: {},
    body: {type: String, default: '', trim: true},
    likes: {type: Number, default: 0, trim: true},
});

const PromptSchema = new Schema({
    title: {type: String, default: '', trim: true},
    poems: [PoemSchema]
});

const UserSchema = new Schema({
    name: {type: String, default: '', trim: true},
    userID: {type: String, default: '', trim: true},
    poems: [PoemSchema]
});


PromptSchema.plugin(URLSlugs('title'));
//will be added with the field name 'slug'

const Poem = mongoose.model('Poem', PoemSchema);
const Prompt = mongoose.model('Prompt', PromptSchema);
const User = mongoose.model('User', UserSchema);

mongoose.connect('mongodb://localhost/atq203-final-project');

const records = [{ id: 1, username: 'jack', password: 'secret', displayName: 'Jack', emails: [{ value: 'jack@example.com' }]},
{ id: 2, username: 'jill', password: 'birthday', displayName: 'Jill', emails: [{ value: 'jill@example.com' }] }];

exports.findById = function(id, cb) {
  process.nextTick(function() {
    const idx = id - 1;
    if (records[idx]) {
      cb(null, records[idx]);
    } else {
      cb(new Error('User ' + id + ' does not exist'));
    }
  });
};

exports.findByUsername = function(username, cb) {
  process.nextTick(function() {
    for (let i = 0, len = records.length; i < len; i++) {
      const record = records[i];
      if (record.username === username) {
        return cb(null, record);
      }
    }
    return cb(null, null);
  });
};
