require('dotenv').config();
const mongoose = require('mongoose');
const Template = require('./models/Template');

async function dumpTemplates() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/axium_valuation');
        const templates = await Template.find({});
        console.log(JSON.stringify(templates, null, 2));
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

dumpTemplates();
