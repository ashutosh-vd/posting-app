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

const { upload } = require('./configs/multer'); // multer config

const path = require('path');
const { runInNewContext } = require('vm');
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
	if(!_token) return res.redirect('/login');
	else {
		const data = jwt.verify(_token, 'shh');
		// console.log(data);
		req.user = data;
	}
	next();
}

app.get('/profile', isLoggedin, async (req, res) => {
	// res.send(`Welcome Loggedin User ${req.user.username}`);
	let current_user = await usermodel.findOne({email : req.user.email});
	let all_posts = await postmodel.find().populate('user');
	res.render('profile', {user : current_user, posts: all_posts});
})

app.get('/login', (req, res) => {
	res.render('login');
})
app.post('/login', async (req, res) => {
	const {email, password} = req.body;
	let user = await usermodel.findOne({email});
	if(!user) {
		res.status(500).send("something_went_wrong");
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

app.post('/post/:id', isLoggedin, async (req, res) => {
	const content = req.body.content;
	const id = req.params.id;

	const created_post = await postmodel.create({
			user: id,
			content,
	});

	const user = await usermodel.findOne({_id : id});
	user.posts.push(created_post._id);
	user.save();
	// await usermodel.findOneAndUpdate(
	// 	{ _id: id },
	// 	{ $push: { posts: created_post._id } },
	// 	{ new: true });
	res.redirect('/profile');
})

app.get('/delete/:id', isLoggedin, async (req, res) => {
	const user = await usermodel.findOne({email : req.user.email});
	if(user.posts.indexOf(req.params.id) !== -1) {
		user.posts.splice(user.posts.indexOf(req.params.id), 1);
		await postmodel.findOneAndDelete({_id : req.params.id});
	}
	user.save();
	res.redirect('/profile');
})

app.get('/edit/:id', isLoggedin, async (req, res) => {
	let post = await postmodel.findOne({_id : req.params.id});
	res.render('edit', {user: req.user, post : post});
})

app.post('/edit/:id', isLoggedin, async (req, res) => {
	const user = await usermodel.findOne({email : req.user.email});
	if(user.posts.indexOf(req.params.id) !== -1) {
		await postmodel.findOneAndUpdate(
			{_id : req.params.id},
			{content : req.body.content},
			{new : true}
		)
	}
	res.redirect('/profile');
})

app.get('/like/:id', isLoggedin, async (req, res) => {
	let post = await postmodel.findOne({_id : req.params.id});
	let likeduser = await usermodel.findOne({email : req.user.email});
	if(post.likes.indexOf(likeduser._id) === -1) {
		post.likes.push(likeduser._id);
	}
	else {
		post.likes.splice(post.likes.indexOf(likeduser._id), 1);
	}
	post.save();
	res.redirect('/profile');
})

app.listen(3000, (err) => {
	if(err) 
		throw err;
})

