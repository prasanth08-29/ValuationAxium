require('dotenv').config();
const mongoose = require('mongoose');
const Template = require('./models/Template');

async function dumpTemplate(name) {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/axium_valuation');
        const t = await Template.findOne({ name: new RegExp(name, 'i') });
        if (!t) {
            console.log("Template not found");
            return;
        }
        console.log(`Template: ${t.name}`);
        t.fields.forEach((f, i) => {
            console.log(`[${i}] ID: ${f.id} | Label: ${f.label} | Type: ${f.type} | Cond: ${JSON.stringify(f.conditions)} | Dep: ${f.dependsOn}`);
        });
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

dumpTemplate("individual Property");
