import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import { createWorker } from 'tesseract.js';

class OCRService {
  constructor() {
    this.worker = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      this.worker = await createWorker('eng');
      this.isInitialized = true;
      console.log('🔍 OCR service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize OCR service:', error);
    }
  }

  async processReceiptImage(imageBuffer) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Preprocess image for better OCR results
      const processedImage = await this.preprocessImage(imageBuffer);
      
      // Perform OCR
      const { data: { text } } = await this.worker.recognize(processedImage);
      
      return text;
    } catch (error) {
      console.error('OCR processing error:', error);
      throw new Error('Failed to process receipt image');
    }
  }

  async preprocessImage(imageBuffer) {
    try {
      // Enhance image for better OCR results
      const processedBuffer = await sharp(imageBuffer)
        .resize(1200, null, { withoutEnlargement: true })
        .grayscale()
        .normalize()
        .sharpen()
        .toBuffer();

      return processedBuffer;
    } catch (error) {
      console.error('Image preprocessing error:', error);
      return imageBuffer; // Return original if preprocessing fails
    }
  }

  async extractReceiptData(ocrText) {
    // Enhanced receipt parsing logic
    const lines = ocrText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    const receiptData = {
      store: null,
      date: null,
      time: null,
      items: [],
      totals: {
        subtotal: null,
        tax: null,
        total: null
      },
      paymentMethod: null
    };

    // Extract store name (usually first few lines)
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      if (lines[i] && lines[i].length > 3 && !this.isNumericLine(lines[i])) {
        receiptData.store = {
          name: lines[i],
          address: lines[i + 1] || null
        };
        break;
      }
    }

    // Extract date and time
    for (const line of lines) {
      const dateMatch = line.match(/(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        receiptData.date = this.normalizeDate(dateMatch[1]);
      }
      
      const timeMatch = line.match(/(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)/i);
      if (timeMatch) {
        receiptData.time = timeMatch[1];
      }
    }

    // Extract items and amounts
    for (const line of lines) {
      const itemMatch = this.extractItemFromLine(line);
      if (itemMatch) {
        receiptData.items.push(itemMatch);
      }
    }

    // Extract totals
    for (const line of lines) {
      const upperLine = line.toUpperCase();
      
      if (upperLine.includes('SUBTOTAL') || upperLine.includes('SUB TOTAL')) {
        const amount = this.extractAmount(line);
        if (amount) receiptData.totals.subtotal = amount;
      }
      
      if (upperLine.includes('TAX')) {
        const amount = this.extractAmount(line);
        if (amount) receiptData.totals.tax = amount;
      }
      
      if (upperLine.includes('TOTAL') && !upperLine.includes('SUBTOTAL')) {
        const amount = this.extractAmount(line);
        if (amount) receiptData.totals.total = amount;
      }
    }

    // Extract payment method
    for (const line of lines) {
      const upperLine = line.toUpperCase();
      if (upperLine.includes('CASH') || upperLine.includes('CREDIT') || 
          upperLine.includes('DEBIT') || upperLine.includes('CARD')) {
        receiptData.paymentMethod = line.trim();
        break;
      }
    }

    return receiptData;
  }

  extractItemFromLine(line) {
    // Look for patterns like "Item Name    $12.99" or "Item Name 12.99"
    const patterns = [
      /^(.+?)\s+\$?(\d+\.\d{2})$/,
      /^(.+?)\s+(\d+\.\d{2})\s*$/,
      /^(.+?)\s+\$(\d+\.\d{2})\s*$/
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        const description = match[1].trim();
        const amount = parseFloat(match[2]);
        
        // Filter out lines that are likely totals or non-items
        if (description.length > 1 && 
            !description.toUpperCase().includes('TOTAL') &&
            !description.toUpperCase().includes('TAX') &&
            !description.toUpperCase().includes('SUBTOTAL') &&
            amount > 0 && amount < 1000) { // Reasonable item price range
          
          return {
            description,
            amount,
            category_id: 1, // Default category, will be categorized by AI
            date: new Date().toISOString().split('T')[0]
          };
        }
      }
    }
    
    return null;
  }

  extractAmount(line) {
    const amountMatch = line.match(/\$?(\d+\.\d{2})/);
    return amountMatch ? parseFloat(amountMatch[1]) : null;
  }

  isNumericLine(line) {
    return /^\s*[\d\.\$\s]+\s*$/.test(line);
  }

  normalizeDate(dateString) {
    try {
      // Convert various date formats to YYYY-MM-DD
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return new Date().toISOString().split('T')[0];
      }
      return date.toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  }

  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.isInitialized = false;
    }
  }
}

export default new OCRService();
