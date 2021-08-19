const express = require('express');

const { body } = require('express-validator');

const feedController = require('../controllers/feed');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

// GET /feed/posts
router.get('/posts', isAuth, feedController.getPosts);

// POST /feed/post
router.post(
	'/post',
	[
		body('title', 'Title length invalid').trim().isLength({
			min: 5,
		}),
		body('image').custom((value, { req }) => {
			if (req.file.size > 2 * 1024 * 1024) {
				clearImage({
					Bucket: 'messages-feed',
					Key: req.imageUrl,
				});
				const error = new Error('Image size must be under 2 MB');
				error.statusCode = 413;
				throw error;
			}
			return true;
		}),
		body('content', 'Content length invalid').trim().isLength({
			min: 5,
		}),
	],
	isAuth,
	feedController.createPost
);

router.get('/post/:postId', isAuth, feedController.getPost);

router.put(
	'/post/:postId',
	[
		body('title').trim().isLength({
			min: 5,
		}),
		body('image').custom((value, { req }) => {
			if (req.file) {
				if (req.file.size > 2 * 1024 * 1024) {
					clearImage({
						Bucket: 'messages-feed',
						Key: req.imageUrl,
					});
					const error = new Error('Image size must be under 2 MB');
					error.statusCode = 413;
					throw error;
				}
				return true;
			}
			return true;
		}),
		body('content').trim().isLength({
			min: 5,
		}),
	],
	isAuth,
	feedController.updatePost
);

router.delete('/post/:postId', isAuth, feedController.deletePost);

const clearImage = (params) => {
	console.log('Deleting image');
	s3.deleteObject(params, (err, data) => {
		console.log('Error deleting image' + err);
	});
};

module.exports = router;
