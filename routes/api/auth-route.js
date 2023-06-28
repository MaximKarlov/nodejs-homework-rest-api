const express = require('express');

const authController = require('../../controllers/auth-controller');
const schema = require('../../schemas/users');
const { validateBody } = require('../../decorators');
const { authenticate, upload } = require('../../middlewares');

const router = express.Router();

router.post('/register', validateBody(schema.UserRegisterSchema), authController.signup);

router.get('/verify/:verificationToken', authController.verify);

router.post('/verify', validateBody(schema.UserEmailSchema), authController.resendVerify);

router.post('/login', validateBody(schema.UserLoginSchema), authController.signin);

router.get('/current', authenticate, authController.getCurrent);

router.post('/logout', authenticate, authController.logout);

router.patch('/avatars', authenticate, upload.single('avatar'), authController.changeAvatar);

module.exports = router;
