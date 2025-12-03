import * as dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.error('Error: VITE_GEMINI_API_KEY not found in environment variables.');
    process.exit(1);
}

async function listModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error('API Error:', JSON.stringify(data.error, null, 2));
        } else {
            console.log('Available Models:');
            if (data.models) {
                data.models.forEach(model => {
                    console.log(`- ${model.name} (${model.supportedGenerationMethods.join(', ')})`);
                });
            } else {
                console.log('No models found.');
            }
        }
    } catch (error) {
        console.error('Fetch Error:', error);
    }
}

listModels();
