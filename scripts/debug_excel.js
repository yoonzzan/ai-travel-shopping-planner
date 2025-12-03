import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
const path = require('path');

const EXCEL_FILE_PATH = path.join(process.cwd(), 'guide_data.xlsx');

try {
    const workbook = XLSX.readFile(EXCEL_FILE_PATH);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet);

    console.log('Headers/First Row Keys:', rawData.length > 0 ? Object.keys(rawData[0]) : 'No data found');
    console.log('First Row Data:', rawData.length > 0 ? rawData[0] : 'No data found');
} catch (error) {
    console.error('Error reading Excel:', error);
}
