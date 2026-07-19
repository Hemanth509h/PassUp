import mongoose from 'mongoose';

const connectDB = async () => {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.warn('Warning: MONGODB_URI is not defined in the environment variables.');
    return;
  }
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Successfully connected to MongoDB Atlas.');
  } catch (error) {
    console.error('MongoDB Atlas connection error:', error);
  }
};

export default connectDB;
