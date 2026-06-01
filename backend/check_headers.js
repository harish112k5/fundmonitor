const XLSX = require('xlsx');
const path = require('path');

const baseFilePath = 'C:\\Users\\Ssan2\\Downloads\\BuildManager_Project_Import_Template.xlsx';
const workbook = XLSX.readFile(baseFilePath);

const billingSheet = workbook.Sheets['🧾 Billing'];
const raw = XLSX.utils.sheet_to_json(billingSheet, { header: 1, defval: '' });
console.log('Billing headers:', raw[2]);
