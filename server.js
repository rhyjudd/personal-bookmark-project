// server.js
// where your node app starts

// init project
const express      = require("express");
const cookieParser = require("cookie-parser");
const app          = express();
const bodyParser   = require("body-parser");
const mongoose     = require("mongoose");
const dns          = require("dns");
const ejs          = require("ejs");
const passport     = require("passport");
const session      = require("express-session");
const flash        = require("express-flash");
const sessionStore = new session.MemoryStore;







//set view engine
app.set('view engine', 'ejs');


//set cookie parser settings
app.use(cookieParser('secret'));
app.use(session({
    cookie: { maxAge: 60000 },
    store: sessionStore,
    saveUninitialized: true,
    resave: 'true',
    secret: 'secret'
}));
app.use(flash());


// Custom flash middleware -- from Ethan Brown's book, 'Web Development with Node & Express'
app.use(function(req, res, next){
    // if there's a flash message in the session request, make it available in the response, then delete it
    res.locals.sessionFlash = req.session.sessionFlash;
    delete req.session.sessionFlash;
    next();
});


//Load mongoose models
require('./bookmarks.js');
require('./user.js');
const Bookmark   = mongoose.model('bookmarks');
const User       = mongoose.model('users');


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




// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(require('morgan')('combined'));
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));



//Body parser
app.use(bodyParser.json());


// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));



// Route that creates a flash message using the express-flash module
app.all('/express-flash', function( req, res ) {
    req.flash('success', 'This is a flash message using the express-flash module.');
    req.flash('failure', 'This is a failure message');
    res.redirect('/');
});



// http://expressjs.com/en/starter/basic-routing.html
//Default route
app.get("/", (req, res)=>{
  Bookmark.find({}).then( (bookmarks)=>{ 
    let jsonObj = bookmarks; 
    console.log(`first breakpoint: user has loaded or re-loaded the main page`)
    res.render('./pages/index', {bookmarks: jsonObj, expressFlash: req.flash('success'), flashFailure: req.flash('failure')});
  });
  
});


//login route
app.get("/login", (req,res)=>{
  res.render("./pages/login");
});

//New Bookmark route
app.get("/newbookmark",(req,res)=>{
  res.render("pages/newbookmark");
})

//New User rouote
app.get("/adduser", (req, res)=>{
  res.render("pages/adduser");
})

//Add user 
app.post("/adduser",(req,res)=>{
  console.log(req.body);
  let today = new Date(); 
  const newUser = {
    firstName   : req.body.firstName,
    lastName    : req.body.lastName,
    phoneNumber : req.body.phoneNumber,
    userName    : req.body.userName,
    emailAddress: req.body.emailAddress, 
    password    : req.body.password,
    date        : today,
  }
  
  new User(newUser).save().then(()=>{
    console.log(newUser)
  })
  res.redirect("/");
});


//Bookmark page
app.get('/Bookmark/:id', (req,res)=>{  
  let id = req.params.id;
  console.log(`Bookmark page breakpoint, req.params: ${id}`);
  Bookmark.findById(id).then( (bookmark)=>{
    let jsonObj = bookmark;
    console.log(`Bookmark page breakpoint, bookmark object: ${jsonObj}`);
    //res.send("ok");
    res.render('./pages/bookmark', {bookmark: jsonObj});    
  })
});


//Add bookmark
app.post("/addBookmark",(req,res)=>{
    console.log(req.body);
  
    let today = new Date();  
    const newBookmark = {
      url        : req.body.url,
      description: req.body.description,
      date       : today,    
    };  
  
    new Bookmark(newBookmark).save((err, newBookmark)=>{
      if(err){
        console.log(err.message);
        req.flash('failure', `${err.message}`);
        res.redirect('/');
      } else {
        req.flash('success', 'New bookmark added to the library');
        res.redirect('/'); 
      }
    
    });
       
    
    
  
  
})


//Edit bookmark
app.get('/editBookmark/:bookmarkId',(req, res)=>{
  console.log(req.params);
  let id = req.params.bookmarkId;
  console.log(`Edit bookmark breakpoint, req.params.id ${id}`);
  Bookmark.findById(id).then( (bookmark)=>{
    let jsonObj = bookmark;
    console.log(jsonObj);
    res.render('./pages/editBookmark', {bookmark: jsonObj});    
  })  
});


//Delete bookmark
app.post('/deleteBookmark/:id',(req, res)=>{
  console.log(req.params);
  let id = req.params.id;
  console.log(id);
  Bookmark.findByIdAndDelete(id, (err)=>{
      if(err) console.log(err);
      console.log("successul delete");
    });
  res.redirect("/");
})


//Update bookmark
app.post("/updateBookmark/:id", (req, res)=>{
  let updateId = req.params.id;
  console.log(`Update route breakpoint: ${updateId}`);  
});


//login
app.post('/login', (req,res)=> {
  console.log("login successful")
    res.redirect('/');
  });




// listen for requests :)
const listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});
