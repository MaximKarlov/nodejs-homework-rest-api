const bcrypt = require('bcryptjs');

const { nanoid } = require('nanoid');
const fs = require('fs/promises');
const path = require('path');

const gravatar = require('gravatar');

const Jimp = require('jimp');

const jwt = require('jsonwebtoken');

const { SECRET_KEY, BASE_URL } = process.env;

const User = require('../models/user');

const { HttpError, sendEmail } = require('../helpers');

const { ctrlWrapper } = require('../decorators');

const signup = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    throw HttpError(409, 'Email already in use');
  }

  const hashPassword = await bcrypt.hash(password, 10);

  const verificationCode = nanoid();

  const userAvatar = gravatar.url(user, { s: '100', r: 'x', d: 'retro' }, true);

  const newUser = await User.create({
    ...req.body,
    password: hashPassword,
    avatarURL: userAvatar,
    verificationToken: verificationCode,
  });

  const verifyEmail = {
    to: email,
    subject: 'Verification email',
    html: `<a target="_blank" href="${BASE_URL}/users/verify/${verificationCode}">Click to verificate email</a>`,
  };

  await sendEmail(verifyEmail);

  res.status(201).json({
    user: {
      email: newUser.email,
      subscription: newUser.subscription,
    },
  });
};

const signin = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(401, 'Email or password is wrong');
  }
  if (!user.verify) {
    throw HttpError(401, 'Email, not verified');
  }

  const passwordCompare = await bcrypt.compare(password, user.password);
  if (!passwordCompare) {
    throw HttpError(401, 'Email or password is wrong');
  }

  const { _id: id, subscription } = user;

  const payload = {
    id,
  };

  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });
  await User.findByIdAndUpdate(id, { token });
  res.json({ token, user: { email, subscription } });
};

const verify = async (req, res) => {
  const { verificationToken } = req.params;
  const user = await User.findOne({ verificationToken });
  if (!user) {
    throw HttpError(404, 'User not found');
  }
  await User.findByIdAndUpdate(user._id, { verify: true, verificationToken: '' });

  res.status(200).json({ message: 'Verification successful' });
};

const resendVerify = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    throw HttpError(404);
  }
  if (user.verify) {
    throw HttpError(400, 'Verification has already been passed');
  }

  const verifyEmail = {
    to: email,
    subject: 'Verification email',
    html: `<a target="_blank" href="${BASE_URL}/users/verify/${user.verificationToken}">Click to verificate email</a>`,
  };

  await sendEmail(verifyEmail);

  res.status(200).json({ message: 'Verification email sent' });
};

const getCurrent = async (req, res) => {
  const { name, email, subscription } = req.user;

  res.json({ name, email, subscription });
};

const logout = async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: '' });
  res.status(204).send();
};

const changeAvatar = async (req, res) => {
  const { id } = req.user;
  const { path: oldPath, filename } = req.file;

  const userDir = path.resolve('public', 'avatars');
  const newPath = path.join(userDir, filename);

  Jimp.read(`${oldPath}`, (err, avatar) => {
    if (err) {
      throw err;
    }
    avatar.resize(250, 250).quality(100).write(`${newPath}`);
  });

  fs.unlink(oldPath);

  const avatarURL = path.join('avatars', filename);

  await User.findByIdAndUpdate(id, { avatarURL });

  res.status(200).json({ avatarURL });
};

module.exports = {
  signup: ctrlWrapper(signup),
  signin: ctrlWrapper(signin),
  verify: ctrlWrapper(verify),
  resendVerify: ctrlWrapper(resendVerify),
  getCurrent: ctrlWrapper(getCurrent),
  logout: ctrlWrapper(logout),
  changeAvatar: ctrlWrapper(changeAvatar),
};
