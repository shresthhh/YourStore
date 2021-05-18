const multer = require('multer');

const multerStorage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'public/img/users');
  },
  filename: (req, file, callback) => {
    const ext = file.mimetype.split('/')[1];
    callback(null, `user-${req.user.id}-${Date.now()}.${ext}`);
  },
});

const multerFilter = (req, file, callback) => {
  if (file.mimetype.startsWith('image')) {
    callback(null, true);
  } else {
    return callback(new Error('Only images are allowed!'));
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

UploadUserPhoto = upload.single('photo');
module.exports = UploadUserPhoto;
