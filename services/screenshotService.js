const fs = require('fs');
const path = require('path');

class ScreenshotService {
  constructor() {
    this.basePath = './screenshots';
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  async saveScreenshot(fileBuffer, userId) {
    try {
      const userFolder = path.join(this.basePath, userId);
      if (!fs.existsSync(userFolder)) {
        fs.mkdirSync(userFolder, { recursive: true });
      }

      const timestamp = Date.now();
      const filename = `${timestamp}_${userId}.jpg`;
      const filePath = path.join(userFolder, filename);

      // Save file directly without processing
      fs.writeFileSync(filePath, fileBuffer);

      return {
        success: true,
        path: filePath,
        filename: filename
      };
    } catch (error) {
      console.error('❌ Screenshot save error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new ScreenshotService();
