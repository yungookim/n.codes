const express = require('express');
const path = require('node:path');
const {
  handleGenerateForProject,
  handleGetJobForProject,
  handleStreamGenerateForProject,
} = require('../../shared/real-backend');

const router = express.Router();
const projectRoot = path.resolve(__dirname, '..');

router.post('/generate', (req, res) => handleGenerateForProject(projectRoot, req, res));
router.get('/jobs/:jobId', (req, res) => handleGetJobForProject(projectRoot, req, res));
router.post('/generate/stream', (req, res) => handleStreamGenerateForProject(projectRoot, req, res));

module.exports = router;
