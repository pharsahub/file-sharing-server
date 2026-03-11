const fs = require('fs');
const path = require('path');

// Basic storage service that can be extended later for S3 etc.
class StorageService {
  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../../storage/uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(tempPath, originalName) {
    // Determine target path
    const fileId = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(originalName);
    const finalFilename = `${fileId}${ext}`;
    const targetPath = path.join(this.uploadDir, finalFilename);

    // Provide abstract upload to local disk
    return new Promise((resolve, reject) => {
      fs.copyFile(tempPath, targetPath, (err) => {
        if (err) return reject(err);
        fs.unlink(tempPath, () => {}); // cleanup temp
        resolve({
          filename: finalFilename,
          path: targetPath, // Can return S3 URL in future implementations
        });
      });
    });
  }

  async deleteFile(filePath) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

module.exports = new StorageService();
