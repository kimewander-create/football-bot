const Tesseract = require('tesseract.js');

class ImageAnalyzer {
  static async analyze(imagePath) {
    try {
      console.log('🔍 Analyzing image:', imagePath);
      
      const result = await Tesseract.recognize(imagePath, 'amh+eng');
      const text = result.data.text;
      
      console.log('📝 Extracted text:', text);
      
      // Extract amount (look for numbers + ETB/Birr)
      const amountMatch = text.match(/(\d+)\s*(?:ETB|Birr|BR|ETB|birr)/i);
      const amount = amountMatch ? parseInt(amountMatch[1]) : null;
      
      // Extract date (YYYY-MM-DD or DD/MM/YYYY)
      const dateMatch = text.match(/(\d{4}-\d{2}-\d{2})|(\d{2}\/\d{2}\/\d{4})/);
      const date = dateMatch ? dateMatch[0] : null;
      
      // Extract sender name
      const nameMatch = text.match(/(?:Sender|From|Name|ከ|ስም)\s*[:]*\s*([A-Za-z\u1200-\u137F\s]+)/i);
      const sender = nameMatch ? nameMatch[1].trim() : null;
      
      // Extract reference
      const refMatch = text.match(/(?:Ref|TXN|Reference|ጣሪያ)\s*[:]*\s*([A-Z0-9]+)/i);
      const reference = refMatch ? refMatch[1] : null;
      
      return {
        success: true,
        scraped: {
          amount,
          date,
          sender,
          reference,
          rawText: text
        }
      };
      
    } catch (error) {
      console.error('❌ Image analysis error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = ImageAnalyzer;
