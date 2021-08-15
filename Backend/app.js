const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');
const s3Proxy = require('s3-proxy');
const helmet = require('helmet');
const compression = require('compression');

const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');

const app = express();

s3 = new AWS.S3();

const fileStorage = multerS3({
	s3: s3,
	bucket: 'messages-feed',
	metadata: (req, file, cb) => {
		cb(null, { fieldname: file.fieldname });
	},
	key: (req, file, cb) => {
		req.imageUrl =
			'images/' + Date.now() + '.' + file.mimetype.split('/')[1];
		cb(null, req.imageUrl);
	},
	limits: {
		fileSize: 2 * 1024 * 1024,
	},
});

const fileFilter = (req, file, cb) => {
	if (
		file.mimetype === 'image/png' ||
		file.mimetype === 'image/jpg' ||
		file.mimetype === 'image/jpeg'
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

app.use(helmet());
app.use(compression());

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

app.get(
	'/images/*',
	s3Proxy({
		bucket: 'messages-feed',
		accessKeyId: `${process.env.AWS_ACCESS_KEY_ID}`,
		secretAccessKey: `${process.env.AWS_SECRET_ACCESS_KEY}`,
		overrideCacheControl: 'max-age=2592000',
	})
);

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
		`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.bhzjg.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?retryWrites=true&w=majority`,
		{
			useNewUrlParser: true,
			useUnifiedTopology: true,
		}
	)
	.then((result) => {
		const server = app.listen(process.env.PORT || 8080);
		const io = require('./socket').init(server);
	})
	.catch((err) => console.log(err));
