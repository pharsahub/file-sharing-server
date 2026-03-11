const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const prisma = require('../utils/db');
const authMiddleware = require('../middleware/auth');

// Create a share link
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { fileId, expiresInDays, password } = req.body;

    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) return res.status(404).json({ error: 'File not found' });
    if (file.ownerId !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });

    // Generate random 10-char token
    const token = crypto.randomBytes(5).toString('hex');
    
    let expiresAt = null;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiresInDays));
    }

    let passwordHash = null;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password, salt);
    }

    const share = await prisma.share.create({
      data: {
        fileId,
        share_token: token,
        expires_at: expiresAt,
        password: passwordHash,
      }
    });

    res.status(201).json({
      link: `${process.env.PUBLIC_URL || 'http://localhost:5173'}/share/${share.share_token}`,
      token: share.share_token,
      expires_at: share.expires_at,
      hasPassword: !!password
    });
  } catch (error) {
    next(error);
  }
});

// Get share details
router.get('/:token', async (req, res, next) => {
  try {
    const share = await prisma.share.findUnique({
      where: { share_token: req.params.token },
      include: { file: true }
    });

    if (!share) return res.status(404).json({ error: 'Link not found or expired' });
    
    if (share.expires_at && new Date() > share.expires_at) {
      return res.status(410).json({ error: 'Link expired' });
    }

    // Return limited info so the frontend knows if a password is required
    res.json({
      token: share.share_token,
      filename: share.file.filename,
      original_name: share.file.original_name,
      file_size: share.file.file_size,
      mime_type: share.file.mime_type,
      requiresPassword: !!share.password
    });
  } catch (error) {
    next(error);
  }
});

// Download from share link
router.post('/:token/download', async (req, res, next) => {
  try {
    const { password } = req.body;
    
    const share = await prisma.share.findUnique({
      where: { share_token: req.params.token },
      include: { file: true }
    });

    if (!share) return res.status(404).json({ error: 'Link not found' });
    if (share.expires_at && new Date() > share.expires_at) {
      return res.status(410).json({ error: 'Link expired' });
    }

    if (share.password) {
      if (!password) return res.status(401).json({ error: 'Password required' });
      const isMatch = await bcrypt.compare(password, share.password);
      if (!isMatch) return res.status(401).json({ error: 'Invalid password' });
    }

    await prisma.share.update({
      where: { id: share.id },
      data: { download_count: { increment: 1 } }
    });

    res.download(share.file.path, share.file.original_name);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
