require('dotenv').config();
const mongoose = require('mongoose');

async function check() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/axium_valuation');
    const db = mongoose.connection.db;
    const coll = db.collection('templates');
    const templates = await coll.find({}).toArray();
    let fieldsSet = new Set();
    templates.forEach(t => {
        if (t.fields) t.fields.forEach(f => fieldsSet.add(f.label));
    });
    console.log(Array.from(fieldsSet).join('\n'));
    process.exit();
}
check();
