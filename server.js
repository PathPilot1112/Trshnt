import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
dotenv.config();


const app = express();


connectDB();

app.use(cors());
app.use(express.json());

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});