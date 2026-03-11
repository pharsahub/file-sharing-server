const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');
const authMiddleware = require('../middleware/auth');
const prisma = require('../utils/db');
const storageService = require('../services/storage');

// Configure multer for temp storage before processing
const upload = multer({ dest: '/tmp/' });

// Upload a single file
router.post('/upload', authMiddleware, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { originalname, size, mimetype, path: tempPath } = req.file;

    // Save using abstract storage service
    const { filename, path: finalPath } = await storageService.saveFile(tempPath, originalname);

    // Map file in DB
    const fileRecord = await prisma.file.create({
      data: {
        filename,
        original_name: originalname,
        file_size: size,
        mime_type: mimetype,
        path: finalPath,
        ownerId: req.user.userId,
      }
    });

    res.status(201).json(fileRecord);
  } catch (error) {
    next(error);
  }
});

// Upload a file chunk
router.post('/upload/chunk', authMiddleware, upload.single('file'), async (req, res, next) => {
  try {
    const { chunkIndex, totalChunks, uploadId, originalname } = req.body;
    
    const chunkDir = path.join('/tmp', `upload_${uploadId}`);
    if (!fs.existsSync(chunkDir)) fs.mkdirSync(chunkDir, { recursive: true });
    
    const chunkPath = path.join(chunkDir, chunkIndex);
    fs.renameSync(req.file.path, chunkPath);

    // If last chunk, merge them
    if (parseInt(chunkIndex) === parseInt(totalChunks) - 1) {
      const mergedPath = path.join(chunkDir, 'merged');
      const writeStream = fs.createWriteStream(mergedPath);
      
      for (let i = 0; i < parseInt(totalChunks); i++) {
        const data = fs.readFileSync(path.join(chunkDir, String(i)));
        writeStream.write(data);
        fs.unlinkSync(path.join(chunkDir, String(i)));
      }
      writeStream.end();

      writeStream.on('finish', async () => {
        const stats = fs.statSync(mergedPath);
        const { filename, path: finalPath } = await storageService.saveFile(mergedPath, originalname);
        
        fs.rmdirSync(chunkDir, { recursive: true }); // cleanup

        const fileRecord = await prisma.file.create({
          data: {
            filename,
            original_name: originalname,
            file_size: stats.size,
            mime_type: 'application/octet-stream', // Can refine this
            path: finalPath,
            ownerId: req.user.userId,
          }
        });

        return res.status(201).json(fileRecord);
      });
    } else {
      res.json({ message: `Chunk ${chunkIndex} received` });
    }

  } catch (error) {
    next(error);
  }
});

// List files for user
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const files = await prisma.file.findMany({
      where: { ownerId: req.user.userId },
      orderBy: { upload_date: 'desc' }
    });
    res.json(files);
  } catch (error) {
    next(error);
  }
});

// Download/Get a file (Requires auth and ownership, share links hit different route)
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const file = await prisma.file.findUnique({
      where: { id: req.params.id }
    });

    if (!file) return res.status(404).json({ error: 'File not found' });
    if (file.ownerId !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });

    res.download(file.path, file.original_name);
  } catch (error) {
    next(error);
  }
});

// Stream a file
router.get('/stream/:id', authMiddleware, async (req, res, next) => {
  try {
    const file = await prisma.file.findUnique({
      where: { id: req.params.id }
    });

    if (!file || file.ownerId !== req.user.userId) return res.status(404).send();

    const stat = fs.statSync(file.path);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const fileStream = fs.createReadStream(file.path, { start, end });
      
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': file.mime_type
      });
      fileStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': file.mime_type
      });
      fs.createReadStream(file.path).pipe(res);
    }
  } catch (error) {
    next(error);
  }
});

// Delete file
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const file = await prisma.file.findUnique({
      where: { id: req.params.id }
    });

    if (!file) return res.status(404).json({ error: 'File not found' });
    if (file.ownerId !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });

    await storageService.deleteFile(file.path);
    await prisma.file.delete({ where: { id: req.params.id } });

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
