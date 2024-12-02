const multer = require('multer');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const webp = require('webp-converter');

// Disablle sharp cache //
sharp.cache(false);

// Definition of MIMI types //
const MIME_TYPES = {
    'image/jpg': 'jpg',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp'
};

// Configuring multer to manage image storage //
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, 'images');
    },
    filename: (req, file, callback) => {
        const name = file.originalname.split(' ').join('_');
        const extension = MIME_TYPES[file.mimetype];
        callback(null, name + Date.now() + '.' + extension);
    }
});

// Middleware : optimization images
const optimizeImage = async (req, res, next) => {
    if (!req.file) return next();

    const originalImagePath = req.file.path;
    const ext = path.extname(originalImagePath).toLowerCase();
    const isWebP = ext === '.webp';
    let optimizedImageName, optimizedImagePath;

    try {
        if (isWebP) {
            optimizedImageName = path.basename(originalImagePath);
            optimizedImagePath = originalImagePath;
        } else {
            optimizedImageName = `optimized_${path.basename(originalImagePath, ext)}.webp`;
            optimizedImagePath = path.join('images', optimizedImageName);

            await sharp(originalImagePath)
                .resize({ fit: 'contain' })
                .webp({ quality: 80 })
                .toFile(optimizedImagePath);

            fs.unlink(originalImagePath, (error) => {
                if (error) {
                    console.error("Impossible de supprimer l'image originale :", error);
                    return next(error);
                }
            });
        }
        req.file.path = optimizedImagePath;
        req.file.filename = optimizedImageName;
        next();
    } catch (error) {
        return next(error);
    }
};

// Middleware Multer : upload
const upload = multer({ storage }).single('image');

module.exports = {
    upload,
    optimizeImage,
};