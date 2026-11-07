const cloudinary = require("../config/cloudinary");

const uploadBuffer = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "auctions" },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });

const uploadImages = (files = []) => Promise.all(files.map((f) => uploadBuffer(f.buffer)));

const deleteImages = (images = []) =>
  Promise.all(
    images.map((img) => cloudinary.uploader.destroy(img.publicId).catch(() => null))
  );

module.exports = { uploadImages, deleteImages };