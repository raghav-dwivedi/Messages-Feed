const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');

const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');

const app = express();

const fileStorage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'images');
	},
	filename: function (req, file, cb) {
		cb(null, Date.now() + '-' + file.originalname);
	},
});

const fileFilter = (req, file, cb) => {
	if (
		file.mimetype === 'image/jpeg' ||
		file.mimetype === 'image/png' ||
		file.mimetype === 'image/jpg'
	) {
		cb(null, true);
	} else {
		cb(null, false);
	}
};

// data format of urlencoded body parser: x-www-form-urlencoded
app.use(express.json()); // data format: application/json
app.use(
	multer({
		storage: fileStorage,
		fileFilter: fileFilter,
	}).single('image')
);
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader(
		'Access-Control-Allow-Methods',
		'GET, POST, PUT, PATCH, DELETE'
	);
	res.setHeader(
		'Access-Control-Allow-Headers',
		'Content-Type, Authorization'
	);
	next();
});

app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);

app.use((error, req, res, next) => {
	console.log(error);
	const status = error.statusCode || 500;
	const message = error.message;
	const data = error.data;
	res.status(status).json({
		message: message,
		data: data,
	});
});

mongoose
	.connect(
		'mongodb+srv://raghav:IqVmtHF4WEcDKkOJ@cluster0.bhzjg.mongodb.net/messages?retryWrites=true&w=majority',
		{
			useNewUrlParser: true,
			useUnifiedTopology: true,
		}
	)
	.then((result) => {
		const server = app.listen(8080);
		console.log('Connected');
		const io = require('./socket').init(server);
		io.on('connection', (socket) => {
			console.log('Client connected');
		});
	})
	.catch((err) => console.log(err));
