import express from 'express';
import {
  submitInterestForm,
  showInterestForm,
  uploadPhoto,
  getOnboardingDetails,
  completeOnboardingPayment
} from '../controllers/interestForm.js';
import multer from 'multer';

const interestRouter = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Test route to verify router is working
interestRouter.get('/test', (req, res) => {
  res.json({ message: 'Interest router is working' });
});

// Public routes
interestRouter.get('/', showInterestForm);
interestRouter.post('/upload-photo', upload.single('photo'), uploadPhoto);
interestRouter.post('/submit', upload.array('photos', 5), submitInterestForm);

// Onboarding Routes
interestRouter.get('/onboarding/:token', getOnboardingDetails);
interestRouter.post('/onboarding/complete', completeOnboardingPayment);

export default interestRouter;