const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testUpload() {
  const filePath = '../frontend/public/BuildManager_Project_Import_Template.xlsx';
  
  if (!fs.existsSync(filePath)) {
    console.error('File not found');
    return;
  }

  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));

  try {
    const res = await axios.post('http://localhost:3001/api/import/project', formData, {
      headers: formData.getHeaders(),
    });
    console.log('SUCCESS:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('FAILED:', err.response?.data?.message || err.message);
    console.log('RESULT OBJECT:', JSON.stringify(err.response?.data?.result, null, 2));
  }
}

testUpload();
