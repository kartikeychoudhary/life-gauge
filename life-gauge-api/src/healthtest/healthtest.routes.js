const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/authMiddleware');
const controller = require('./healthtest.controller');

const uploadDir = path.resolve(process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 20) * 1024 * 1024 },
});

const router = Router();

// SSE stream — own token auth via ?token= (EventSource can't set headers)
router.get('/:id/stream', controller.streamStatus);

router.use(auth);
router.get('/', controller.list);
router.post('/upload', upload.single('file'), controller.upload);
router.get('/:id', controller.getOne);
router.post('/:id/reprocess', controller.reprocess);
router.delete('/:id', controller.remove);

module.exports = router;
