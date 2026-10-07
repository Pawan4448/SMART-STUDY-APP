const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

/**
 * POST /api/upload/file
 * Upload a file (PDF, txt, doc) and extract text
 */
router.post('/file', async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.files.file;
    const allowedTypes = ['.pdf', '.txt', '.md', '.rtf'];
    const ext = path.extname(file.name).toLowerCase();

    if (!allowedTypes.includes(ext)) {
      return res.status(400).json({
        error: `Unsupported file type. Allowed: ${allowedTypes.join(', ')}`
      });
    }

    let extractedText = '';

    if (ext === '.pdf') {
      try {
        const pdfParse = require('pdf-parse');
        const buffer = fs.readFileSync(file.tempFilePath);
        const data = await pdfParse(buffer);
        extractedText = data.text;
      } catch (pdfError) {
        return res.status(500).json({ error: 'Failed to parse PDF', details: pdfError.message });
      }
    } else {
      // For text-based files
      extractedText = fs.readFileSync(file.tempFilePath, 'utf-8');
    }

    // Clean up temp file
    if (file.tempFilePath && fs.existsSync(file.tempFilePath)) {
      fs.unlinkSync(file.tempFilePath);
    }

    // Truncate if too large (max 8000 chars for AI processing)
    const truncated = extractedText.length > 8000;
    const text = truncated ? extractedText.substring(0, 8000) + '...' : extractedText;

    res.json({
      success: true,
      filename: file.name,
      fileType: ext,
      text,
      wordCount: text.split(/\s+/).length,
      truncated,
      originalLength: extractedText.length
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed', details: error.message });
  }
});

/**
 * POST /api/upload/text
 * Receive plain text input directly
 */
router.post('/text', (req, res) => {
  const { text, source = 'manual' } = req.body;

  if (!text || text.trim().length < 10) {
    return res.status(400).json({ error: 'Text content is required (min 10 characters)' });
  }

  const truncated = text.length > 8000;
  const processedText = truncated ? text.substring(0, 8000) + '...' : text;

  res.json({
    success: true,
    text: processedText,
    wordCount: processedText.split(/\s+/).length,
    source,
    truncated
  });
});

module.exports = router;
