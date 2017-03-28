const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const URLSlugs = require('mongoose-url-slugs');

const PoemSchema = new Schema({
    user: {type: String, default: '', trim: true},
    prompt: PromptSchema,
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
