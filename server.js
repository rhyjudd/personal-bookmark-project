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
//mongoose.set('useUnifiedTopology', true);
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
  Bookmark.find({}).then( (bookmarks)=>{ 
    let jsonObj = bookmarks; 
    console.log(`first breakpoint: user has loaded or re-loaded the main page`)
    res.render('./pages/index', {bookmarks: jsonObj});
  });
  
});

//New Bookmark route
app.get("/newbookmark",(req,res)=>{
  res.render("pages/newbookmark");
})


//Submit Bookmark to Database
app.post("/api/newbookmark",(req,res)=>{
  console.log(req.body);
  let today = new Date();  
  const newBookmark = {
    url  : req.body.url,
    description: req.body.description,
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


//Edit Bookmark
app.get('/bookmarkEdit/:bookmarkId',(req, res)=>{
  console.log(req.params);
  let id = req.params.bookmarkId;
  console.log(`Edit bookmark breakpoint, req.params.id ${id}`);
  Bookmark.findById(id).then( (bookmark)=>{
    let jsonObj = bookmark;
    console.log(jsonObj);
    //res.send("ok");
    res.render('./pages/editBookmark', {bookmark: jsonObj});    
  })
  //res.send("ok");
  
});


//Specific Bookmark
app.get('/:id', (req,res)=>{  
  let id = req.params.id;
  console.log(`Bookmark page breakpoint, req.params: ${id}`);
  Bookmark.findById(id).then( (bookmark)=>{
    let jsonObj = bookmark;
    console.log(`Bookmark page breakpoint, bookmark object: ${jsonObj}`);
    //res.send("ok");
    res.render('./pages/bookmark', {bookmark: jsonObj});    
  })
});


//Delete Bookmark
app.post('/bookmarkDelete/:id',(req, res)=>{
  console.log(req.params);
  let id = req.params.id;
  console.log(id);
  Bookmark.findByIdAndDelete(id, (err)=>{
      if(err) console.log(err);
      console.log("successul delete");
    });
  res.redirect("/");
})


//Update Bookmark Route
app.post("/bookmarkUpdate/:id", (req, res)=>{
  let updateId = req.params.id;
  console.log(`Update route breakpoint: ${updateId}`);
  
});




// listen for requests :)
const listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});
