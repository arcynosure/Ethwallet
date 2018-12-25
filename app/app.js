const express = require("express");
const Web3 = require("web3");
let util = require('./utils/contract');
const bip39 = require("bip39");
const hdkey = require("hdkey");
const hdkeys = require("ethereumjs-wallet/hdkey");
const ethUtil = require("ethereumjs-util");
let fs = require("fs");
let cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const session = require("express-session");
const url = require("url");
const request = require("request");
const passport = require("passport");
const mongoose = require("mongoose");
let flash = require("connect-flash-plus");
const UserW = require("./models/registermodel");
// const fileUpload = require('express-fileupload');
const multer = require('multer');

var upload = multer({ dest: 'uploads/' })

//Controllers;

const user = require("./controllers/user");
const home = require("./controllers/home");

const app = express();


// app.use(fileUpload());


app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.static("./public"));
app.use(express.static("./js"));
app.use("/public", express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// SESSION;;

app.use(session({ secret: "anything" }));

/*
=================================================
    Initialising The Passport Middleware Required
=================================================
*/
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  done(null, user);
});

/*
=================================================
    Importing Various Passport login Strategies
=================================================
*/
const local = require("./auth/local_login");
const google = require("./auth/google");

app.use("/auth", local);
app.use("/auth", google);

/*
=================================================
    Configuring MongoDB
=================================================
*/

mongoose.Promise = global.Promise;
// Connect to mongoose
mongoose.set("useCreateIndex", true);
mongoose
  .connect(
    process.env.mongodbLink,
    { useNewUrlParser: true }
  )
  .then(() => console.log("MongoDB Connected..."));
// load up the user model

//routes to various controllers
app.use("/", user);
app.use("/", home);

app.get("/", function(req, res) {
  res.render("home");
});

// port setting
app.set("port", process.env.PORT);
app.listen(app.get("port"), () => {
  console.log(`Server started on port ` + app.get("port"));
});

//session cookie
app.use(
  session({
    key: "user_sid",
    secret: "somerandonstuffs",
    resave: false,
    secure: false,
    saveUninitialized: false,
    cookie: {
      expires: 1000000000
    }
  })
);
app.use(cookieParser());
app.use(flash());

let checkMiddleWare = (req, res, next) => {
  if (!req.session.username) {
    res.redirect("/");
  }

  next();
};

//Infura HttpProvider Endpoint
const web3 = new Web3(
  new Web3.providers.HttpProvider(
    "https://ropsten.infura.io/v3/909d734d85f0460a92f50996e7aa2eb0"
  )
);

// app.get('/', function(req, res) {
//   res.render('login');
// });

app.post("/login", upload.single('avatar'), async (req, res, next) => {
  let posts = req.body;
  let password = posts.passwords;
  // let key =req.file.originalname;
  //file = req.files.upload;
  console.log(req.body);
  console.log(req.file);
  console.log(password);
  //file.mv('./img/key.json', (err) => {
    // if(err)
    // return res.status(500).send(err);
    var file =fs.readFileSync('./uploads/'+req.file.filename, "utf8");
    console.log(file);
    const store = web3.eth.accounts.decrypt(file, password);
    console.log(store);
  

  let user = await UserW.findOne({ username: username, password: password });
  if (!user) {
    res.redirect("/");
  } else {
    req.session.username = username;
    res.redirect("/dashboard");
  }
});

app.post('/register', function(req, res) {
  let posts = req.body;
  let username = posts.username;
  let password = posts.password;
  let confirm_pwd = posts.confirm_password;

  if (password !== confirm_pwd) {
    res.redirect("/");
  } else {
    /* create new hd wallet */
    const mnemonic = bip39.generateMnemonic(); //generates string
    console.log("Mnemonic:", mnemonic);

    const seed = bip39.mnemonicToSeed(mnemonic); //creates seed buffer

    const root = hdkey.fromMasterSeed(seed);

    const masterPrivateKey = root.privateKey.toString("hex");
    console.log("Master private Key:", masterPrivateKey);

    const masterPubKey = root.publicKey.toString("hex");
    console.log("Master Public Key: ", masterPubKey);

    let path = "m/44'/60'/0'/0/0";

    const addrNode = root.derive(path);
    console.log("path: ", path);

    const pubKey = ethUtil.privateToPublic(addrNode._privateKey);
    console.log("Pubkey as hex:", pubKey.toString("hex"));

    const addr = ethUtil.publicToAddress(pubKey).toString("hex");
    console.log("pubkey to Addr:", addr);

    let privateKeys = addrNode._privateKey.toString("hex");

    let keystore = JSON.stringify(
      web3.eth.accounts.encrypt(privateKeys, password)
    );
     /* save user */
     let newUser = new UserW({
      username: username,
      password: password,
      keystore: keystore,
      mnemonic: mnemonic,
      privatekey: privateKeys,
      publickey: masterPubKey,
      address: '0x' + addr
  });

  newUser.save(function(err) {
      console.log(err)
  });

  req.session.username = username;
  res.redirect('/inside');
  }
});

app.get('/inside', async (req, res) => {
  let username = req.session.username;
  let user = await UserW.findOne({ username: username });

  res.render('inside',{message: username, mnemonic: user.mnemonic});
  console.log(user.address);
});

//Check Balance
app.get("/checkbalance", async (req, res) => {
  let balance = await web3.eth.getBalance(user.address);
  res.render("pages/checkbalance", {
    balance: web3.utils.fromWei(balance, "ether")
  });
});


app.post('/download', async (req, res) => {
  let username = req.session.username;
  let user = await UserW.findOne({ username: username });

  fs.writeFile('keystore/keystore-' + user._id + '.json', user.keystore, function(err){
      if (err) console.log(err);
      console.log("Successfully Written to File.");
      let file = __dirname + '/keystore/keystore-' + user._id + '.json';
      res.download(file);
      console.log(user.address);
  });

});


let contract;
let token_contract_addr;


app.post('/add-new-token', async (req, res) => {
  let posts = req.body;
  token_contract_addr = posts.token_contract_addr;

  contract = new web3.eth.Contract(util.abi, token_contract_addr);

  let name = await contract.methods.name().call();
  let symbol = await contract.methods.symbol().call();

  res.render('adtoken', { name: name, symbol: symbol });
});


app.get('/exchange', async (req, res) => {
  res.render('exchange');
  let username = req.session.username;
  let user = await UserW.findOne({ username: username });
  console.log(user.address);
});



app.post('/view-balance', async (req, res) => {
  let username = req.session.username;
  let user = await UserW.findOne({ username: username });
  let balance = await contract.methods
    .balanceOf(user.address)
    .call();

  res.render('view_balance', { balance: balance });
});