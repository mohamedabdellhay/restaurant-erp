import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const logosDir = path.join(__dirname, "../../uploads/logos");
if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
}

const imagesDir = path.join(__dirname, "../../uploads/images");
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

const gatewaysDir = path.join(__dirname, "../../uploads/gateways");
if (!fs.existsSync(gatewaysDir)) {
  fs.mkdirSync(gatewaysDir, { recursive: true });
}

const adsDir = path.join(__dirname, "../../uploads/ads");
if (!fs.existsSync(adsDir)) {
  fs.mkdirSync(adsDir, { recursive: true });
}

// Configure storage
const createStorage = (dest) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, dest);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      const nameWithoutExt = path.basename(file.originalname, ext).replace(/\s+/g, "_");
      cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
    },
  });

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
  }
};

// Configure multer
export const uploadLogo = multer({
  storage: createStorage(logosDir),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

export const uploadImage = multer({
  storage: createStorage(imagesDir),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter,
});

const adFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExt = [".jpeg", ".jpg", ".png", ".gif", ".mp4"];
  const type = String(file.mimetype || "").toLowerCase();
  const typedOk = /^(image\/(jpeg|jpg|png|gif)|video\/mp4)$/.test(type);
  const generic = type === "" || type === "application/octet-stream";
  if (allowedExt.includes(ext) && (typedOk || generic)) {
    return cb(null, true);
  }
  cb(new Error("Use a JPEG, PNG, GIF, or MP4 file."));
};

export const uploadAd = multer({
  storage: createStorage(adsDir),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: adFileFilter,
});

export const uploadGatewayLogo = multer({
  storage: createStorage(gatewaysDir),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit for gateway icons
  },
  fileFilter: fileFilter,
});
