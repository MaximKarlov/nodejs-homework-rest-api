const multer = require('multer');
const path = require('path');

const destination = path.resolve('tmp');

const storage = multer.diskStorage({
  destination,
  filename: function (req, file, cb) {
    const { _id } = req.user;
    const uniquePreffix = _id + '_avatar.jpg';
    cb(null, uniquePreffix);
  },
});

const upload = multer({ storage });

module.exports = upload;
