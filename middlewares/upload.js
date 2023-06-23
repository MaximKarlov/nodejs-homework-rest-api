const multer = require('multer');
const path = require('path');

const destination = path.resolve('tmp');

const storage = multer.diskStorage({
  destination,
  filename: function (req, file, cb) {
    const uniquePreffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const { originalname } = file;
    const fileName = `${uniquePreffix}_${originalname}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage });

module.exports = upload;
