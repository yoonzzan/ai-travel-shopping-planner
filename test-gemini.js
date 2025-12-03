import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.error('Error: VITE_GEMINI_API_KEY not found in environment variables.');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

async function testModel(modelName) {
    console.log(`\nTesting ${modelName}...`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Hello, are you working?');
        const response = await result.response;
        console.log(`Success! Response: ${response.text()}`);
        return true;
    } catch (error) {
        console.error(`Error with ${modelName}:`, error.message);
        return false;
    }
}

async function runTests() {
    await testModel('gemini-flash-latest');
    await testModel('gemini-2.0-flash');
    await testModel('gemini-2.0-flash-001');
    await testModel('gemini-2.5-flash');
}

runTests();
