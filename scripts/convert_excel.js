import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const EXCEL_FILE_PATH = path.join(__dirname, '../guide_data.xlsx'); // Expected Excel file name
const OUTPUT_JSON_PATH = path.join(__dirname, '../src/data/guide_recommendations.json');

function convertExcelToJson() {
    if (!fs.existsSync(EXCEL_FILE_PATH)) {
        console.error(`❌ Error: Excel file not found at ${EXCEL_FILE_PATH}`);
        console.log('Please place your Excel file named "guide_data.xlsx" in the project root folder.');
        return;
    }

    console.log(`📖 Reading Excel file from ${EXCEL_FILE_PATH}...`);
    const workbook = XLSX.readFile(EXCEL_FILE_PATH);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet);

    console.log(`🔍 Found ${rawData.length} rows. Processing...`);

    // Group by City
    const cityMap = new Map();

    // Helper to extract English text
    const extractEnglish = (str) => {
        if (!str) return '';
        const parts = str.split(',');
        for (const part of parts) {
            const trimmed = part.trim();
            if (/^[A-Za-z\s]+$/.test(trimmed)) return trimmed;
        }
        return str.trim(); // Fallback to original if no English found
    };

    rawData.forEach((row, index) => {
        // Expected columns: City (도시), Keywords (키워드), ItemName (상품명), etc.
        // Debug showed keys are lowercase: city, country, ItemName, Description, Shop, localPrice, currency, Category
        const cityRaw = row['City (도시)'] || row['City'] || row['도시'] || row['city'];

        if (index === 0) {
            console.log('First row raw:', row);
            console.log('City raw:', cityRaw);
        }

        if (!cityRaw) return;

        const city = extractEnglish(cityRaw);

        if (index === 0) {
            console.log('Extracted City:', city);
        }

        if (!cityMap.has(city)) {
            const keywordsRaw = row['Keywords (키워드)'] || row['Keywords'] || row['키워드'] || row['country'] || '';
            const country = extractEnglish(keywordsRaw);

            // Collect all potential search terms (English and Korean)
            const searchTerms = new Set();
            if (cityRaw) cityRaw.split(',').forEach(s => searchTerms.add(s.trim()));
            if (keywordsRaw) keywordsRaw.split(',').forEach(s => searchTerms.add(s.trim()));
            searchTerms.add(city);
            searchTerms.add(country);

            if (index === 0) {
                console.log('Keywords raw:', keywordsRaw);
                console.log('Extracted Country:', country);
                console.log('Search Terms:', Array.from(searchTerms));
            }

            cityMap.set(city, {
                city: city,
                country: country,
                searchTerms: Array.from(searchTerms).filter(s => s), // Remove empty strings
                items: []
            });
        }

        const cityData = cityMap.get(city);
        cityData.items.push({
            name: row['ItemName (상품명)'] || row['ItemName'] || row['상품명'] || row['name'],
            description: row['Description (설명)'] || row['Description'] || row['설명'] || row['description'],
            shop: row['Shop (구매처)'] || row['Shop'] || row['구매처'] || row['shop'],
            estimatedPrice: parseInt(row['Price (가격)'] || row['Price'] || row['가격'] || row['estimatedPrice'] || '0'),
            localPrice: parseInt(row['localPrice (가격)'] || row['LocalPrice'] || row['현지가격'] || row['localPrice'] || '0'),
            currency: row['currency (통화)'] || row['Currency'] || row['통화'] || row['currency'] || 'KRW',
            category: row['Category (카테고리)'] || row['Category'] || row['카테고리'] || row['category'] || '기타'
        });
    });

    const outputData = {
        recommendations: Array.from(cityMap.values())
    };

    // Write to JSON file
    fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(outputData, null, 2), 'utf-8');
    console.log(`✅ Successfully converted! JSON saved to ${OUTPUT_JSON_PATH}`);
}

convertExcelToJson();
