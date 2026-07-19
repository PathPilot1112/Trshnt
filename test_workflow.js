import fs from 'fs';
import FormData from 'form-data';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:8000';
// Replace this with the actual path to your image
const IMAGE_PATH = 'C:\\Users\\CHIRAG PAUL\\Downloads\\IMG_20260524_162505382.jpg'; 

async function runTest() {
  console.log("🚀 Starting End-to-End Workflow Test...");
  
  try {
    // 1. Join Game
    console.log("\n[1] Registering a new team...");
    const joinRes = await axios.post(`${BACKEND_URL}/api/teams/join`, {
      operatorName: 'TestPlayer', teamName: 'TEAM_TESTER'
    });
    const token = joinRes.data.token;
    console.log("✅ Joined game successfully! Token received.");
    
    // 2. Start Mission
    console.log("\n[2] Starting the mission...");
    const startRes = await axios.post(`${BACKEND_URL}/api/teams/start`, {}, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log("✅ Mission status:", startRes.data.message);

    // 3. Get Current Clue
    console.log("\n[3] Fetching the first clue...");
    const clueRes = await axios.get(`${BACKEND_URL}/api/clues/current`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const clueData = clueRes.data;
    console.log(`✅ Current Clue: ${clueData.title} (${clueData.hint})`);
    
    // 4. Submit Image
    console.log("\n[4] Submitting image for verification...");
    if (!fs.existsSync(IMAGE_PATH)) {
        console.log(`❌ Cannot find image at ${IMAGE_PATH}.`);
        return;
    }

    const formData = new FormData();
    formData.append('image', fs.createReadStream(IMAGE_PATH));

    const submitRes = await axios.post(`${BACKEND_URL}/api/clues/submit`, formData, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      }
    });
    
    const submitData = submitRes.data;
    console.log("✅ Verification Result:");
    console.log(submitData);
    
    if (submitData.isCorrect) {
        console.log("🎉 SUCCESS! The entire flow from Backend to FastAPI is working perfectly!");
    } else {
        console.log("⚠️ The flow worked, but the ML model rejected the image because it didn't match the clue (or confidence was too low).");
    }
  } catch (err) {
    console.error("❌ Test failed:");
    console.error(err.response ? err.response.data : err.message);
  }
}

runTest();
