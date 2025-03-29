const express = require('express');
const app = express();

const usermodel = require('./models/user');
const postmodel = require('./models/post');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieparser = require('cookie-parser');
app.use(cookieparser());
// console.log('Cookies: ', req.cookies)

app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({extended: true}));

const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
	res.render('index');
})

app.post('/create' , async (req, res) => {
	const {name, username, email, password} = req.body;
	const existing_user = await usermodel.findOne({email});
	if(existing_user) {
		return res.status(500).send("user already exists with specified email");
	}
	bcrypt.hash(password, 10, async (err, hash) => {
		const cuser = await usermodel.create({
			name, username, email, password: hash,
		});
		res.redirect('/login');
		return;
	})
})

function isLoggedin(req, res, next) {
	let _token = req.cookies._token;
	if(!_token) return res.status(401).send("You must be Logged in");
	else {
		const data = jwt.verify(_token, 'shh');
		// console.log(data);
		req.user = data;
	}
	next();
}

app.get('/profile', isLoggedin, (req, res) => {
	// res.send(`Welcome Loggedin User ${req.user.username}`);
	res.render('profile', {user : req.user});
})

app.get('/login', (req, res) => {
	res.render('login');
})
app.post('/login', async (req, res) => {
	const {email, password} = req.body;
	let user = await usermodel.findOne({email});
	if(!user) {
		res.send("something_went_wrong");
		return;
	}
	bcrypt.compare(password, user.password, (err, result) => {
		if(result) {
			jwt.sign({username: user.username,email: email,}, 'shh', (err, token) =>{
					res.cookie("_token", token);
					res.redirect('/profile');
			})
			// const token = jwt.sign(payload, 'shh');
			// res.cookie('_token', token); 
		}
		else {
			res.status(500).send('something_went_wrong');
			return;
		}
	})
})
app.get('/logout', (req, res) => {
	res.cookie('_token', "");
	res.redirect('/login');
})

app.listen(3000, (err) => {
	if(err) 
		throw err;
})