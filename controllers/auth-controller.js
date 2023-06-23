const bcrypt = require('bcryptjs');

const fs = require('fs/promises');
const path = require('path');

const gravatar = require('gravatar');

const Jimp = require('jimp');

const jwt = require('jsonwebtoken');

const { SECRET_KEY } = process.env;

const User = require('../models/user');

const { HttpError } = require('../helpers');

const { ctrlWrapper } = require('../decorators');

const signup = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    throw HttpError(409, 'Email already in use');
  }

  const hashPassword = await bcrypt.hash(password, 10);

  const userAvatar = gravatar.url(user, { s: '100', r: 'x', d: 'retro' }, true);

  const newUser = await User.create({ ...req.body, password: hashPassword, avatarURL: userAvatar });

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

  const passwordCompare = await bcrypt.compare(password, user.password);
  if (!passwordCompare) {
    throw HttpError(401, 'Email or password is wrong');
  }

  const { _id: id, subscription } = user;

  const payload = {
    id,
  };

  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '23h' });
  await User.findByIdAndUpdate(id, { token });
  res.json({ token, user: { email, subscription } });
};

const getCurrent = async (req, res) => {
  const { name, email, subscription } = req.user;

  res.json({ name, email, subscription });
};

const logout = async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: '' });
  res.status(204).json();
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

  await User.findByIdAndUpdate(id, { avatarURL: newPath });

  res.status(200).json({ avatarURL: newPath });
};

module.exports = {
  signup: ctrlWrapper(signup),
  signin: ctrlWrapper(signin),
  getCurrent: ctrlWrapper(getCurrent),
  logout: ctrlWrapper(logout),
  changeAvatar: ctrlWrapper(changeAvatar),
};
