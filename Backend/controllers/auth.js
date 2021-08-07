const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const { validationResult } = require('express-validator');

exports.signup = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const error = new Error('Validation failed.');
		error.statusCode = 422;
		error.data = errors.array();
		throw error;
	}
	const email = req.body.email;
	const name = req.body.name;
	const password = req.body.password;
	bcrypt
		.hash(password, 12)
		.then((hashedPassword) => {
			const user = new User({
				email: email,
				password: hashedPassword,
				name: name,
			});
			return user.save();
		})
		.then((result) => {
			res.status(201).json({
				message: 'User created!',
				userId: result._id,
			});
		})
		.catch((err) => {
			if (!err.statusCode) {
				err.statusCode = 500;
			}
			next(err);
		});
};

exports.login = (req, res, next) => {
	const email = req.body.email;
	const password = req.body.password;
	User.findOne({ email: email })
		.then((user) => {
			if (!user) {
				const error = new Error(
					'A user with this email does not exist.'
				);
				error.statusCode = 401;
				throw error;
			}
			loadedUser = user;
			return bcrypt.compare(password, user.password);
		})
		.then((isEqual) => {
			if (!isEqual) {
				const error = new Error('Wrong password');
				error.statusCode = 401;
				throw error;
			}
			const token = jwt.sign(
				{
					email: loadedUser.email,
					userId: loadedUser._id.toString(),
				},
				'enter a long secret string here',
				{ expiresIn: '1h' }
			);
			res.status(200).json({
				token: token,
				userId: loadedUser._id.toString(),
			});
		})
		.catch((err) => {
			if (!err.statusCode) {
				err.statusCode = 500;
			}
			next(err);
		});
};

exports.getUserStatus = (req, res, next) => {
	User.findById(req.userId)
		.then((user) => {
			if (!user) {
				const error = new Error('User not found');
				error.statusCode = 404;
				throw error;
			}
			res.status(200).json({ status: user.status });
		})
		.catch((error) => {
			next(error);
		});
};

exports.updateUserStatus = (req, res, next) => {
	const status = req.body.status;
	User.findById(req.userId)
		.then((user) => {
			if (!user) {
				const error = new Error('User not found');
				error.statusCode = 404;
				throw error;
			}
			user.status = status;
			return user.save();
		})
		.then((result) => {
			res.status(200).json({
				message: 'Status updated.',
				status: status,
			});
		})
		.catch((error) => {
			next(error);
		});
};
