const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//Create Schema



const BookmarkSchema = new Schema({
  bookmark:{ type: String},
  date: {type: Date},
  
  
    
});

//create collection and add Schema
mongoose.model('bookmarks', BookmarkSchema);