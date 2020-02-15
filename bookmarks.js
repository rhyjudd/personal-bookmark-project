const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//Create Schema for bookmarks



const BookmarkSchema = new Schema({
  url:{ type: String, required: true},
  description: {type: String, required: true},
  createdBy:{type: String, required: true},
  date: {type: Date},
  
  
    
});

//create collection and add Schema
mongoose.model('bookmarks', BookmarkSchema);