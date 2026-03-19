import { Readable } from "stream";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

const storage = multer.memoryStorage();

export const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "text/plain",
            "application/zip",
            "application/x-zip-compressed",
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(
                new Error(
                    "Only images, PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, and ZIP files are allowed",
                ),
            );
        }
    },
});

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

const uploadBufferToCloudinary = (buffer, options = {}) =>
    new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { resource_type: "auto", ...options },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            },
        );

        Readable.from(buffer).pipe(stream);
    });

export const uploadToCloudinary = async (req, res, next) => {
    try {
        if (!req.files || req.files.length === 0) {
            return next();
        }

        const folder = process.env.CLOUDINARY_FOLDER || "task-attachments";

        const uploadPromises = req.files.map((file) =>
            uploadBufferToCloudinary(file.buffer, { folder }),
        );

        const results = await Promise.all(uploadPromises);

        req.uploadedFiles = results.map((result, index) => ({
            public_id: result.public_id,
            url: result.secure_url,
            resource_type: result.resource_type,
            mimetype: req.files[index].mimetype,
            size: result.bytes,
            originalname: req.files[index].originalname,
        }));


        return next();
    } catch (error) {
        console.error("Cloudinary upload middleware error:", error);
        return next(error);
    }
};
