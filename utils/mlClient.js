import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';

/**
 * Sends an image to the Python ML microservice for prediction.
 * @param {string} imagePath - The path to the uploaded image file on disk.
 * @returns {Promise<{prediction: str, confidence: number}>} - The predicted label and confidence.
 */
export const predictImage = async (imagePath) => {
  try {
    const formData = new FormData();
    formData.append('image', fs.createReadStream(imagePath));

    const response = await axios.post(`${ML_SERVICE_URL}/predict`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    return response.data;
  } catch (error) {
    console.error('ML Service Error [predict]:', error?.response?.data || error.message);
    throw new Error(error?.response?.data?.error || 'Failed to get prediction from ML service');
  }
};

/**
 * Triggers the background retraining process in the ML microservice.
 */
export const triggerTraining = async () => {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/train`);
    return response.data;
  } catch (error) {
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
