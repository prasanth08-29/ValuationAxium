const fs = require('fs');
try {
  let text = fs.readFileSync('dump.json', 'utf8');
  if (text.includes('dotenv')) {
    text = text.replace(/.*\[dotenv@.*?\][^\n]*\n/g, '');
  }
  // Remove BOM if present
  text = text.replace(/^\uFEFF/, '');
  const data = JSON.parse(text);
  
  const fields = data.flatMap(t => t.fields || []).filter(f => f && (f.label || '').includes('Name of the Floor'));
  console.log('FIELDS:', JSON.stringify(fields, null, 2));
} catch (e) {
  // If utf8 fails or parse fails, try utf16le
  try {
    let text = fs.readFileSync('dump.json', 'utf16le');
    if (text.includes('dotenv')) {
      text = text.replace(/.*\[dotenv@.*?\][^\n]*\n/g, '');
    }
    text = text.replace(/^\uFEFF/, '');
    const data = JSON.parse(text);
    const fields = data.flatMap(t => t.fields || []).filter(f => f && (f.label || '').includes('Name of the Floor'));
    console.log('FIELDS (utf16):', JSON.stringify(fields, null, 2));
  } catch(e2) {
    console.error('Error parsing:', e2);
  }
}
