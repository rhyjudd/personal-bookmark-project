const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//Create Schema for users



const UsersSchema = new Schema({
  firstName:{ type: String},
  lastName: {type: String},
  phoneNumber: {type: String},
  userName: {type: String},
  emailAddress:{type: String},
  password: {type: String },
  date: {type: Date},
  
  
    
});

//create collection and add Schema
mongoose.model('users', UsersSchema);