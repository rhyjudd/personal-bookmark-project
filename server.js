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
const flash        = require("connect-flash");
const sessionStore = new session.MemoryStore;
const LocalStrategy= require("passport-local").Strategy;
const bcrypt       = require("bcrypt");

//To fix depreciation warnings
mongoose.set('useUnifiedTopology', true);


//Load mongoose models
require('./bookmarks.js');
require('./user.js');
const Bookmark   = mongoose.model('bookmarks');
const User       = mongoose.model('users');




//configure passport.js local strategy
passport.use(new LocalStrategy((username, password, done)=>{
  User.findOne({userName: username}, (err,user)=>{
        if(err){ 
          console.log(`login error: ${err.message}`);
          return done(err);
        }
        if (!user) {
          console.log('No user found');
          return done(null, false, {msg:'Incorrect username'});
        } 
        bcrypt.compare(password, password,(err, result)=>{
          if(err) return done(null, false, {msg: 'Incorrect password'});
        });
    
        return done(null,user);
  });
}));


//Setup deserialize and serialize of users
passport.serializeUser(function(user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
  User.findById(id, function (err, user) {
    if (err) { return cb(err); }
    cb(null, user);
  });
});



function requireLogin(req,res,next) {
	if(!req.user) {
    return res.render('./pages/login',{message: 'login to view or edit content', loggedIn:false})
  };
	next();
}


//set view engine
app.set('view engine', 'ejs');


//set cookie parser settings
app.use(cookieParser(process.env.SECRET));
app.use(session({
    cookie: { maxAge: 60000 },
    store: sessionStore,
    saveUninitialized: true,
    resave: 'true',
    secret: process.env.SECRET
}));
app.use(flash());

app.get('/flash', function(req, res){
  // Set a flash message by passing the key, followed by the value, to req.flash().
  req.flash('info', 'Flash is back!');
  res.redirect('/');
});


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
//app.use(require('express-session')({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());

//Body parser
app.use(bodyParser.json());


// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));







// http://expressjs.com/en/starter/basic-routing.html
//Default route
app.get("/",(req, res)=>{   
    console.log(`first breakpoint: user has loaded or re-loaded the main page`)
    res.render('./pages/index', {loggedIn:false});
  });
  



//login route
app.get("/login", (req,res)=>{
  res.render("./pages/login", {message:req.flash('error'), loggedIn: false});
});


//logout route
app.get('/logout', (req,res)=>{
  req.logout();
  res.redirect('/login');
});


app.get('/dashboard', requireLogin,(req,res)=>{
  Bookmark.find({createdBy:req.user.userName}).then( (bookmarks)=>{ 
    let jsonObj = bookmarks; 
    console.log(`first breakpoint: user has loaded or re-loaded the main page`)
    res.render('./pages/dashboard', {bookmarks: jsonObj, expressFlash: req.flash('success'), message:req.flash('error'),loggedIn:true});
  });
})


//New Bookmark route
app.get("/newbookmark",requireLogin,(req,res)=>{
  console.log(req.user.userName);
  res.render("pages/newbookmark",{loggedIn:true});
})

//New User rouote
app.get("/adduser", (req, res)=>{
  res.render("pages/adduser",{loggedIn: false});
})

//Add user 
app.post("/adduser",(req,res)=>{
  console.log(req.body);
  let today = new Date();
  
  bcrypt.hash(req.body.password, 10, (err, hash)=>{
    const newUser = {
    firstName   : req.body.firstName,
    lastName    : req.body.lastName,
    phoneNumber : req.body.phoneNumber,
    userName    : req.body.userName,
    emailAddress: req.body.emailAddress, 
    password    : hash,
    date        : today,
    }  
    
    new User(newUser).save().then(()=>{
    console.log(newUser)
    })    
  });
  
  
  res.redirect("/dashboard");
});


//Bookmark page
app.get('/Bookmark/:id', requireLogin,(req,res)=>{  
  let id = req.params.id;
  console.log(`Bookmark page breakpoint, req.params: ${id}`);
  Bookmark.findById(id).then( (bookmark)=>{
    let jsonObj = bookmark;
    console.log(`Bookmark page breakpoint, bookmark object: ${jsonObj}`);
    //res.send("ok");
    res.render('./pages/bookmark', {bookmark: jsonObj,loggedIn:true});    
  })
});


//Add bookmark
app.post("/addBookmark",requireLogin, (req,res)=>{
    console.log(req.body);
    
    let today = new Date();  
    const newBookmark = {
      url        : req.body.url,
      description: req.body.description,
      createdBy  : req.user.userName,
      date       : today,    
    };  
  
    new Bookmark(newBookmark).save((err, newBookmark)=>{
      if(err){
        console.log(err.message);
        req.flash('failure', `${err.message}`);
        res.redirect('/dashboard');
      } else {
        req.flash('success', 'New bookmark added to the library');
        res.redirect('/dashboard'); 
      }
    
    });     
})


//Edit bookmark
app.get('/editBookmark/:bookmarkId',requireLogin,(req, res)=>{
  console.log(req.params);
  let id = req.params.bookmarkId;
  console.log(`Update bookmark breakpoint, req.params.id: ${id}`);
  Bookmark.findById(id).then( (bookmark)=>{
    let jsonObj = bookmark;
    console.log(jsonObj);
    res.render('./pages/editBookmark', {bookmark: jsonObj,loggedIn:true});    
  })  
});


//Update bookmark
app.post("/updateBookmark/:id", requireLogin,(req, res)=>{
  let updateId = req.params.id;
  let today    = new Date();
  
  const newBookmark = {
      url        : req.body.url,
      description: req.body.description,
      createdBy  : req.user.userName,
      date       : today,    
    }; 
  
  Bookmark.findByIdAndUpdate(updateId, newBookmark).then(
    res.redirect('/dashboard')
  );
  console.log(`Update route breakpoint: ${updateId}`);  
  
});


//Delete bookmark
app.post('/deleteBookmark/:id',requireLogin,(req, res)=>{
  console.log(req.params);
  let id = req.params.id;
  console.log(id);
  Bookmark.findByIdAndDelete(id, (err)=>{
      if(err) console.log(err);
      console.log("successul delete");
    });
  res.redirect("/dashboard");
})






//login
app.post('/login',  passport.authenticate('local', { failureRedirect: '/login', failureFlash:'Login failed'}), (req,res)=> {
    console.log("login successful")
    req.flash('success', 'You have successfully logged in');
    res.redirect('/dashboard');
  });




// listen for requests :)
const listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});
