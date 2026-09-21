import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { trackServerEvent } from './posthog.js';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';

/**
 * Sends an image to the Python ML microservice for prediction.
 * @param {Buffer|string} bufferOrPath - The image buffer (memoryStorage) or file path (legacy).
 * @param {Object} [context] - Optional metadata (teamId, clueId, targetName) for analytics.
 * @returns {Promise<{prediction: str, confidence: number}>} - The predicted label and confidence.
 */
export const predictImage = async (bufferOrPath, context = {}) => {
  const startTime = Date.now();
  const teamId = context.teamId || 'unknown_team';
  
  trackServerEvent(teamId, 'ml_predict_requested', {
    clueId: context.clueId,
    targetName: context.targetName,
    bufferSize: Buffer.isBuffer(bufferOrPath) ? bufferOrPath.length : undefined,
  });

  try {
    const formData = new FormData();

    if (Buffer.isBuffer(bufferOrPath)) {
      // memoryStorage: append buffer directly with filename option
      formData.append('image', bufferOrPath, { filename: 'scan.jpg', contentType: 'image/jpeg' });
    } else {
      // Legacy diskStorage: read from path
      formData.append('image', fs.createReadStream(bufferOrPath));
    }

    const response = await axios.post(`${ML_SERVICE_URL}/predict`, formData, {
      headers: {
        ...formData.getHeaders?.() ?? {},
      },
      timeout: 60000,
    });

    const latencyMs = Date.now() - startTime;
    console.log('🤖 ML Service prediction response:', response.data);

    trackServerEvent(teamId, 'ml_predict_success', {
      prediction: response.data?.prediction,
      confidence: response.data?.confidence,
      targetName: context.targetName,
      clueId: context.clueId,
      latencyMs,
    });

    return response.data;
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMsg = error?.response?.data?.error || error.message;
    console.error('ML Service Error [predict]:', error?.response?.data || error.message);

    trackServerEvent(teamId, 'ml_predict_failure', {
      error: errorMsg,
      statusCode: error?.response?.status,
      targetName: context.targetName,
      clueId: context.clueId,
      latencyMs,
    });

    throw new Error(errorMsg);
  }
};

/**
 * Triggers the background retraining process in the ML microservice.
 */
export const triggerTraining = async (adminId = 'admin') => {
  try {
    trackServerEvent(adminId, 'ml_training_requested');
    const response = await axios.post(`${ML_SERVICE_URL}/train`);
    trackServerEvent(adminId, 'ml_training_success', { response: response.data });
    return response.data;
  } catch (error) {
    trackServerEvent(adminId, 'ml_training_failure', { error: error?.message });
    console.error('ML Service Error [train]:', error?.response?.data || error.message);
    throw new Error(error?.response?.data?.message || 'Failed to trigger ML training');
  }
};

/**
 * Uploads an image to the ML service to add to the training dataset.
 * @param {string} imagePath - The path to the uploaded image file.
 * @param {string} label - The label/class for the image.
 */
export const addImageToDataset = async (imagePath, label) => {
  try {
    const formData = new FormData();
    formData.append('image', fs.createReadStream(imagePath));
    formData.append('label', label);

    const response = await axios.post(`${ML_SERVICE_URL}/add_image`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    return response.data;
  } catch (error) {
    console.error('ML Service Error [add_image]:', error?.response?.data || error.message);
    throw new Error(error?.response?.data?.error || 'Failed to add image to dataset');
  }
};
