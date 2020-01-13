// server.js
// where your node app starts

// init project
const express      = require("express");
const app          = express();
const bodyParser   = require("body-parser");
const mongoose     = require("mongoose");
const dns          = require("dns");
const ejs          = require("ejs");

//set view engine
app.set('view engine', 'ejs');



//Load model
require('./bookmarks.js');
const Bookmark = mongoose.model('bookmarks');

// we've started you off with Express,
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

//Connecting to the database
let mongoDB = process.env.MONGODB_URI;
mongoose.connect(mongoDB, { useNewUrlParser: true });

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
  console.log(`Connected to database on ${new Date().toISOString().slice(0,10)}`);
});


//Body parser
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// http://expressjs.com/en/starter/basic-routing.html
//Default route
app.get("/", (req, res)=>{
  res.render('pages/index');
});

//Add route page
app.get("/newbookmark",(req,res)=>{
  res.render("pages/newbookmark");
})


//Add bookmark to database route
app.post("/api/newbookmark",(req,res)=>{
  console.log(req.body);
  let today = new Date();
  
  
  
  const newBookmark = {
    bookmark  : req.body.description,
    date      : today,
    
  };
  
  new Bookmark(newBookmark).save().then(()=>{
        console.log(newBookmark);
        
      }); 
  
  res.redirect("/");
})

//API endpoint to retrieve everything from the database collection
app.get("/bookmarksCollection",(req,res)=>{
  Bookmark.find({}).then( (bookmarks)=>{ res.send(bookmarks) });
});


// listen for requests :)
const listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});
