import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Upload, 
  Scan, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  FileText,
  DollarSign,
  Calendar,
  Tag,
  Sparkles,
  RotateCcw,
  ArrowLeft
} from 'lucide-react';
import { useAIStore, useExpenseStore, useUIStore } from '../store';

const SmartReceiptScanner: React.FC = () => {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [receiptText, setReceiptText] = useState('');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { addNotification } = useUIStore();
  const { createExpense } = useExpenseStore();
  const { analyzeReceiptImage, analyzeReceipt: analyzeReceiptFromAIStore } = useAIStore();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // In a real app, you'd use OCR here (like Tesseract.js)
    // For demo, we'll simulate the process
    simulateOCR(file);
  };

  const simulateOCR = async (file: File) => {
    setIsScanning(true);
    
    try {
      // Convert file to base64 for sending to backend
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      // Use AI store method instead of direct API call
      const extractedData = await analyzeReceiptImage(base64);
      
      if (extractedData && extractedData.items) {
        setExtractedData(extractedData);
        
        // Also set the raw text for manual editing
        const items = extractedData.items || [];
        const mockText = `Receipt processed successfully!\n\nStore: ${extractedData.store?.name || 'Unknown'}\nDate: ${extractedData.date || new Date().toLocaleDateString()}\n\nItems:\n${items.map((item: any) => `${item.description} - $${item.amount?.toFixed(2) || '0.00'}`).join('\n')}\n\nTotal: $${extractedData.totals?.total?.toFixed(2) || '0.00'}`;
        setReceiptText(mockText);
        
        addNotification({
          type: 'success',
          title: 'Receipt Processed!',
          message: `Found ${items.length} items. Review and save expenses.`
        });
      } else {
        throw new Error('No data extracted from receipt');
      }
    } catch (error) {
      console.error('OCR processing error:', error);
      addNotification({
        type: 'error',
        title: 'Processing Failed',
        message: 'Could not process receipt image. Please try again or enter text manually.'
      });
      
      // Clear the extracted data on error
      setExtractedData(null);
    } finally {
      setIsScanning(false);
    }
  };

  const analyzeReceiptManually = async () => {
    if (!receiptText.trim()) {
      addNotification({
        type: 'error',
        title: 'No Receipt Text',
        message: 'Please scan a receipt or enter text first.'
      });
      return;
    }

    setIsScanning(true);
    
    try {
      const response = await fetch('/api/ai/analyze-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ receiptText })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze receipt');
      }

      const result = await response.json();
      setExtractedData(result.data.extractedData);
      
      addNotification({
        type: 'success',
        title: 'Analysis Complete!',
        message: 'AI has extracted expense data from your receipt.'
      });
    } catch (error) {
      console.error('Receipt analysis error:', error);
      addNotification({
        type: 'error',
        title: 'Analysis Failed',
        message: 'Could not analyze receipt. Please try again.'
      });
    } finally {
      setIsScanning(false);
    }
  };

  const saveExpense = async (expense: any) => {
    try {
      await expense({
        amount: expense.amount,
        description: expense.description,
        category_id: expense.category_id || 1,
        date: expense.date || new Date().toISOString().split('T')[0]
      });
      
      addNotification({
        type: 'success',
        title: 'Expense Saved!',
        message: `${expense.description} - $${expense.amount} added to your expenses.`
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Save Failed',
        message: 'Could not save expense. Please try again.'
      });
    }
  };

  const resetScanner = () => {
    setReceiptText('');
    setExtractedData(null);
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with Back Button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors border border-gray-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-2 bg-cyan-100 rounded-lg mr-3">
                <Scan className="w-6 h-6 text-cyan-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Smart Receipt Scanner
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Upload receipt images and let AI extract expense data automatically. 
              Save time and reduce manual entry errors.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6 rounded-2xl"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Upload Receipt
            </h2>

            {/* Upload Area */}
            <div className="mb-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="receipt-upload"
              />
              
              <label
                htmlFor="receipt-upload"
                className="block w-full p-8 border-2 border-dashed border-purple-300 dark:border-purple-600 rounded-xl cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 transition-colors text-center"
              >
                <Camera className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Click to upload receipt
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  PNG, JPG up to 10MB
                </p>
              </label>
            </div>

            {/* Preview */}
            {previewImage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6"
              >
                <img
                  src={previewImage}
                  alt="Receipt preview"
                  className="w-full max-h-64 object-contain rounded-lg border"
                />
              </motion.div>
            )}

            {/* Manual Text Entry */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Or paste receipt text manually:
              </label>
              <textarea
                value={receiptText}
                onChange={(e) => setReceiptText(e.target.value)}
                placeholder="Paste or type receipt text here..."
                className="input-field w-full h-32 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={analyzeReceiptManually}
                disabled={!receiptText.trim() || isScanning}
                className="button-primary flex-1 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze with AI
                  </>
                )}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={resetScanner}
                className="button-secondary flex items-center justify-center px-4"
              >
                <RotateCcw className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6 rounded-2xl"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Extracted Data
            </h2>

            <AnimatePresence>
              {!extractedData ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12"
                >
                  <Scan className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Upload a receipt and click "Analyze with AI" to extract expense data
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {/* Store Info */}
                  {extractedData.store && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                        Store Information
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-400">
                        {extractedData.store.name}
                      </p>
                      {extractedData.store.address && (
                        <p className="text-xs text-blue-600 dark:text-blue-500">
                          {extractedData.store.address}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Items */}
                  {extractedData.items && extractedData.items.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        Items ({extractedData.items.length})
                      </h3>
                      {extractedData.items.map((item: any, index: number) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {item.description}
                            </p>
                            {item.category && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center">
                                <Tag className="w-3 h-3 mr-1" />
                                {item.category}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              ${item.amount.toFixed(2)}
                            </p>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => saveExpense(item)}
                            className="ml-3 p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </motion.button>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Totals */}
                  {extractedData.totals && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <h3 className="font-medium text-green-900 dark:text-green-300 mb-2 flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        Totals
                      </h3>
                      <div className="space-y-1 text-sm">
                        {extractedData.totals.subtotal && (
                          <div className="flex justify-between">
                            <span className="text-green-700 dark:text-green-400">Subtotal:</span>
                            <span className="font-medium">${extractedData.totals.subtotal.toFixed(2)}</span>
                          </div>
                        )}
                        {extractedData.totals.tax && (
                          <div className="flex justify-between">
                            <span className="text-green-700 dark:text-green-400">Tax:</span>
                            <span className="font-medium">${extractedData.totals.tax.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between border-t border-green-200 dark:border-green-800 pt-1">
                          <span className="font-semibold text-green-900 dark:text-green-300">Total:</span>
                          <span className="font-bold text-lg">${extractedData.totals.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Date & Payment */}
                  <div className="grid grid-cols-2 gap-4">
                    {extractedData.date && (
                      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <p className="text-xs text-purple-600 dark:text-purple-400 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          Date
                        </p>
                        <p className="font-medium text-purple-900 dark:text-purple-300">
                          {extractedData.date}
                        </p>
                      </div>
                    )}
                    {extractedData.paymentMethod && (
                      <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <p className="text-xs text-orange-600 dark:text-orange-400">Payment</p>
                        <p className="font-medium text-orange-900 dark:text-orange-300">
                          {extractedData.paymentMethod}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Bulk Save */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      extractedData.items?.forEach((item: any) => saveExpense(item));
                    }}
                    className="w-full button-primary flex items-center justify-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Save All Items as Expenses
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 glass-card p-6 rounded-2xl"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            💡 Tips for Better Results
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Clear Images</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ensure receipt text is readable and well-lit
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Full Receipt</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Include the entire receipt for complete data extraction
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Review Data</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Always verify extracted amounts and categories
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SmartReceiptScanner;
