const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { securityConfig } = require('../config/security');
const { securityLogger } = require('../config/logger');

// File type validation
const allowedMimeTypes = securityConfig.fileUpload.allowedMimeTypes;
const allowedExtensions = securityConfig.fileUpload.allowedExtensions;

// File size limits
const maxFileSize = securityConfig.fileUpload.maxFileSize;

// Storage configuration
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  try {
    // Check MIME type
    if (!allowedMimeTypes.includes(file.mimetype)) {
      securityLogger.logSuspiciousActivity(
        req.user?.userId || 'anonymous',
        'invalid_file_type_upload',
        { 
          filename: file.originalname,
          mimetype: file.mimetype,
          allowedTypes: allowedMimeTypes
        },
        req.ip
      );
      
      return cb(new Error(`File type ${file.mimetype} is not allowed`), false);
    }

    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      securityLogger.logSuspiciousActivity(
        req.user?.userId || 'anonymous',
        'invalid_file_extension_upload',
        { 
          filename: file.originalname,
          extension: ext,
          allowedExtensions
        },
        req.ip
      );
      
      return cb(new Error(`File extension ${ext} is not allowed`), false);
    }

    // Check for suspicious filenames
    const suspiciousPatterns = [
      /\.(exe|bat|cmd|com|scr|pif|vbs|js|jar|php|asp|aspx|jsp)$/i,
      /\.(sh|bash|zsh|fish|ps1|psm1)$/i,
      /\.(sql|db|sqlite|mdb|accdb)$/i,
      /\.(zip|rar|7z|tar|gz|bz2)$/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(file.originalname)) {
        securityLogger.logSuspiciousActivity(
          req.user?.userId || 'anonymous',
          'suspicious_file_upload',
          { 
            filename: file.originalname,
            pattern: pattern.toString()
          },
          req.ip
        );
        
        return cb(new Error(`Suspicious file type detected: ${file.originalname}`), false);
      }
    }

    // Check filename length
    if (file.originalname.length > 255) {
      return cb(new Error('Filename too long'), false);
    }

    // Check for path traversal attempts
    if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
      securityLogger.logSuspiciousActivity(
        req.user?.userId || 'anonymous',
        'path_traversal_attempt',
        { filename: file.originalname },
        req.ip
      );
      
      return cb(new Error('Invalid filename'), false);
    }

    cb(null, true);
  } catch (error) {
    console.error('File filter error:', error);
    cb(new Error('File validation failed'), false);
  }
};

// Multer configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxFileSize,
    files: 5, // Maximum 5 files per request
    fieldSize: 1024 * 1024, // 1MB for field values
    fieldNameSize: 100,
    fieldValueSize: 1024 * 1024
  }
});

// File content validation
const validateFileContent = (file) => {
  return new Promise((resolve, reject) => {
    try {
      const buffer = file.buffer;
      const mimeType = file.mimetype;

      // Check file header (magic numbers)
      const fileHeader = buffer.slice(0, 10).toString('hex');

      const magicNumbers = {
        'image/jpeg': ['ffd8ff'],
        'image/png': ['89504e47'],
        'image/gif': ['47494638'],
        'image/webp': ['52494646'],
        'application/pdf': ['25504446'],
        'text/plain': [''] // Plain text doesn't have a specific header
      };

      const expectedHeaders = magicNumbers[mimeType];
      if (expectedHeaders && expectedHeaders.length > 0) {
        const isValidHeader = expectedHeaders.some(header => 
          fileHeader.toLowerCase().startsWith(header.toLowerCase())
        );

        if (!isValidHeader) {
          securityLogger.logSuspiciousActivity(
            'unknown',
            'file_header_mismatch',
            { 
              filename: file.originalname,
              declaredMimeType: mimeType,
              actualHeader: fileHeader
            },
            'unknown'
          );
          
          return reject(new Error('File content does not match declared type'));
        }
      }

      // Check for embedded scripts in images
      if (mimeType.startsWith('image/')) {
        const bufferString = buffer.toString('utf8', 0, Math.min(buffer.length, 1024));
        const scriptPatterns = [
          /<script/i,
          /javascript:/i,
          /vbscript:/i,
          /onload=/i,
          /onerror=/i,
          /onclick=/i
        ];

        for (const pattern of scriptPatterns) {
          if (pattern.test(bufferString)) {
            securityLogger.logSuspiciousActivity(
              'unknown',
              'embedded_script_in_image',
              { 
                filename: file.originalname,
                pattern: pattern.toString()
              },
              'unknown'
            );
            
            return reject(new Error('Suspicious content detected in image file'));
          }
        }
      }

      // Check file size against declared type
      if (mimeType.startsWith('image/') && buffer.length > 10 * 1024 * 1024) { // 10MB for images
        return reject(new Error('Image file too large'));
      }

      if (mimeType === 'application/pdf' && buffer.length > 50 * 1024 * 1024) { // 50MB for PDFs
        return reject(new Error('PDF file too large'));
      }

      resolve(true);
    } catch (error) {
      console.error('File content validation error:', error);
      reject(new Error('File content validation failed'));
    }
  });
};

// Generate secure filename
const generateSecureFilename = (originalName) => {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(16).toString('hex');
  return `${timestamp}_${randomString}${ext}`;
};

// Sanitize filename
const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special characters with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .toLowerCase();
};

// Main file upload middleware
const fileUploadMiddleware = (fieldName = 'file', options = {}) => {
  const uploadMiddleware = upload.single(fieldName);
  
  return async (req, res, next) => {
    try {
      // Log file upload attempt
      if (req.user) {
        securityLogger.logFileUpload(
          req.user.userId,
          req.body.filename || 'unknown',
          0, // Will be updated after file is processed
          req.ip
        );
      }

      // Apply multer middleware
      uploadMiddleware(req, res, async (err) => {
        if (err) {
          console.error('File upload error:', err);
          
          if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
              return res.status(400).json({
                message: 'File too large',
                code: 'FILE_TOO_LARGE',
                maxSize: maxFileSize
              });
            }
            if (err.code === 'LIMIT_FILE_COUNT') {
              return res.status(400).json({
                message: 'Too many files',
                code: 'TOO_MANY_FILES',
                maxFiles: 5
              });
            }
          }

          return res.status(400).json({
            message: err.message,
            code: 'FILE_UPLOAD_ERROR'
          });
        }

        if (!req.file) {
          return res.status(400).json({
            message: 'No file provided',
            code: 'NO_FILE'
          });
        }

        try {
          // Validate file content
          await validateFileContent(req.file);

          // Generate secure filename
          const secureFilename = generateSecureFilename(req.file.originalname);
          const sanitizedFilename = sanitizeFilename(secureFilename);

          // Add file metadata to request
          req.file.secureFilename = sanitizedFilename;
          req.file.uploadedAt = new Date();
          req.file.uploadedBy = req.user?.userId;

          // Log successful file upload
          if (req.user) {
            securityLogger.logFileUpload(
              req.user.userId,
              sanitizedFilename,
              req.file.size,
              req.ip
            );
          }

          next();
        } catch (validationError) {
          console.error('File validation error:', validationError);
          
          securityLogger.logSuspiciousActivity(
            req.user?.userId || 'anonymous',
            'file_validation_failed',
            { 
              filename: req.file.originalname,
              error: validationError.message
            },
            req.ip
          );

          return res.status(400).json({
            message: validationError.message,
            code: 'FILE_VALIDATION_FAILED'
          });
        }
      });
    } catch (error) {
      console.error('File upload middleware error:', error);
      res.status(500).json({
        message: 'File upload processing failed',
        code: 'UPLOAD_PROCESSING_FAILED'
      });
    }
  };
};

// Multiple file upload middleware
const multipleFileUploadMiddleware = (fieldName = 'files', maxCount = 5) => {
  const uploadMiddleware = upload.array(fieldName, maxCount);
  
  return async (req, res, next) => {
    try {
      uploadMiddleware(req, res, async (err) => {
        if (err) {
          console.error('Multiple file upload error:', err);
          return res.status(400).json({
            message: err.message,
            code: 'MULTIPLE_FILE_UPLOAD_ERROR'
          });
        }

        if (!req.files || req.files.length === 0) {
          return res.status(400).json({
            message: 'No files provided',
            code: 'NO_FILES'
          });
        }

        try {
          // Validate each file
          for (const file of req.files) {
            await validateFileContent(file);
            
            // Generate secure filename
            const secureFilename = generateSecureFilename(file.originalname);
            const sanitizedFilename = sanitizeFilename(secureFilename);
            
            file.secureFilename = sanitizedFilename;
            file.uploadedAt = new Date();
            file.uploadedBy = req.user?.userId;
          }

          // Log successful uploads
          if (req.user) {
            req.files.forEach(file => {
              securityLogger.logFileUpload(
                req.user.userId,
                file.secureFilename,
                file.size,
                req.ip
              );
            });
          }

          next();
        } catch (validationError) {
          console.error('Multiple file validation error:', validationError);
          return res.status(400).json({
            message: validationError.message,
            code: 'MULTIPLE_FILE_VALIDATION_FAILED'
          });
        }
      });
    } catch (error) {
      console.error('Multiple file upload middleware error:', error);
      res.status(500).json({
        message: 'Multiple file upload processing failed',
        code: 'MULTIPLE_UPLOAD_PROCESSING_FAILED'
      });
    }
  };
};

// Clean up uploaded files (for temporary storage)
const cleanupUploadedFiles = (files) => {
  if (!files) return;
  
  const fileArray = Array.isArray(files) ? files : [files];
  
  fileArray.forEach(file => {
    // In memory storage, no cleanup needed
    // In file system storage, you would delete the files here
    console.log(`Cleaning up file: ${file.originalname}`);
  });
};

module.exports = {
  fileUploadMiddleware,
  multipleFileUploadMiddleware,
  validateFileContent,
  generateSecureFilename,
  sanitizeFilename,
  cleanupUploadedFiles
};

