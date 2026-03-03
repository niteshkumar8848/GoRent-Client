const ImageKit = require("imagekit");

// Check if ImageKit credentials are configured
const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

let imagekit = null;

// Only initialize ImageKit if all credentials are provided
if (publicKey && privateKey && urlEndpoint) {
  imagekit = new ImageKit({
    publicKey: publicKey,
    privateKey: privateKey,
    urlEndpoint: urlEndpoint
  });
  console.log("ImageKit initialized successfully");
} else {
  console.warn("ImageKit credentials not configured. Image upload features will be disabled.");
}

// Helper function to safely use ImageKit
const uploadToImageKit = async (file, folder) => {
  if (!imagekit) {
    throw new Error("ImageKit is not configured. Please set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT in .env file.");
  }
  
  return new Promise((resolve, reject) => {
    imagekit.upload({
      file: file,
      folder: folder,
      fileName: `gorent_${Date.now()}`
    }, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

module.exports = {
  imagekit,
  uploadToImageKit,
  isImageKitConfigured: () => !!imagekit
};
