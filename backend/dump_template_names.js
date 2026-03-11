require('dotenv').config();
const mongoose = require('mongoose');
const Template = require('./models/Template');
const fs = require('fs');

async function dumpTemplates() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/axium_valuation');
        const templates = await Template.find({}, { name: 1 });
        fs.writeFileSync('all_template_names.json', JSON.stringify(templates, null, 2));
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

dumpTemplates();
