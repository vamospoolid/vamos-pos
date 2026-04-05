import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Initialize the uploads public directory
const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Config Multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `avatar-${uniqueSuffix}${ext || '.jpg'}`);
    }
});

// Configure Multer
export const uploadAvatar = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Format file tidak didukung! Gunakan JPEG/JPG/PNG atau WEBP.'));
        }
    }
});
