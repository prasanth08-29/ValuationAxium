require('dotenv').config();
const mongoose = require('mongoose');
const Template = require('./models/Template');

async function searchAll() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/axium_valuation');
        const templates = await Template.find({});
        console.log(`Searching ${templates.length} templates...`);
        templates.forEach(t => {
            console.log(`Template: ${t.name}`);
            t.fields.forEach((f, i) => {
                if (f.label && f.label.toUpperCase().includes("FLOOR")) {
                    console.log(`  [${i}] Label: ${f.label}, ID: ${f.id}`);
                }
            });
        });
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

searchAll();
