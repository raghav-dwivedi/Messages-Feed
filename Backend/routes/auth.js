const express = require('express');
const { body } = require('express-validator');

const router = express.Router();

const User = require('../models/user');
const authController = require('../controllers/auth');

const isAuth = require('../middleware/is-auth');

router.put(
	'/signup',
	[
		body('email')
			.isEmail()
			.withMessage('Please enter a valid email address')
			.custom((value, { req }) => {
				return User.findOne({ email: value }).then((userDoc) => {
					if (userDoc) {
						return Promise.reject('Email already exists');
					}
				});
			})
			.normalizeEmail({ gmail_remove_dots: false }),

		body('password').trim().isLength({ min: 5 }),
		body('name').trim().not().isEmpty(),
	],
	authController.signup
);

router.post('/login', authController.login);

router.get('/status', isAuth, authController.getUserStatus);

router.patch(
	'/status/update',
	[body('status').trim().not().isEmpty()],
	isAuth,
	authController.updateUserStatus
);

module.exports = router;
