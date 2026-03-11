require('dotenv').config();
const mongoose = require('mongoose');
const Template = require('./models/Template');
const fs = require('fs');

async function dumpFullTemplates() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/axium_valuation');
        const templates = await Template.find({});
        fs.writeFileSync('full_templates_dump.json', JSON.stringify(templates, null, 2));
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

dumpFullTemplates();
