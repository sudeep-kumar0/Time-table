import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const validateEnv = () => {
  const missing = [];
  if (!process.env.MONGODB_URI || process.env.MONGODB_URI.trim() === '') {
    missing.push('MONGODB_URI');
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '') {
    // We can alert if missing or set fallback for testing if specifically needed, but strictly enforce in production
    console.warn('⚠️  [Config Warning]: JWT_SECRET is not set in backend/.env. Using default development secret for token verification.');
  }

  if (missing.includes('MONGODB_URI')) {
    console.error('\n' + '='.repeat(70));
    console.error('❌  [CONFIGURATION ERROR]: MONGODB_URI is missing or empty in backend/.env');
    console.error('   Please open `backend/.env` and supply your MongoDB Atlas connection string:');
    console.error('   Example: MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/smartschedule?retryWrites=true&w=majority');
    console.error('='.repeat(70) + '\n');
  }

  return {
    PORT: process.env.PORT || 5000,
    MONGODB_URI: process.env.MONGODB_URI || '',
    JWT_SECRET: process.env.JWT_SECRET || 'smartschedule-super-secure-jwt-dev-secret-key-2025',
    CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
    NODE_ENV: process.env.NODE_ENV || 'development',
    hasMongoUri: Boolean(process.env.MONGODB_URI && process.env.MONGODB_URI.trim() !== '')
  };
};

export const env = validateEnv();
