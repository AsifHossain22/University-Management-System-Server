import multer from 'multer';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_SUPPORTING_DOCUMENTS = 5;

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const fileFilter: multer.Options['fileFilter'] = (req, file, callback) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    callback(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
    return;
  }

  callback(null, true);
};

export const instructorApplicationUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 2 + MAX_SUPPORTING_DOCUMENTS,
    fields: 20,
    parts: 30,
  },
});

export const instructorApplicationUploadFields = [
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'cv', maxCount: 1 },
  {
    name: 'supportingDocuments',
    maxCount: MAX_SUPPORTING_DOCUMENTS,
  },
];
