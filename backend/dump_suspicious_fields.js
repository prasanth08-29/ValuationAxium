require('dotenv').config();
const mongoose = require('mongoose');
const Template = require('./models/Template');
const fs = require('fs');

async function dumpSuspiciousFields() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/axium_valuation');
        const allT = await Template.find({});
        for (const t of allT) {
            console.log(`\n=== Template: ${t.name} ===`);
            let inSection = false;
            for (let i = 0; i < t.fields.length; i++) {
                const f = t.fields[i];
                if (f.label && f.label.toUpperCase().includes("SELECT THE FLOORS") || f.label === "1" || typeof f.label === 'string' && f.label.includes('FLOOR')) {
                    console.log(`[${i}] -> Label: "${f.label}", ID: "${f.id}", Type: "${f.type}", Options: ${JSON.stringify(f.options)}`);
                    inSection = true;
                } else if (inSection && i < i + 15) {
                    console.log(`[${i}] -> Label: "${f.label}", ID: "${f.id}", Type: "${f.type}", Cond: ${JSON.stringify(f.conditions)}, Dep: ${f.dependsOn}`);
                    if (!f.conditions && !f.dependsOn && f.type !== 'heading' && f.type !== 'subheading') {
                        inSection = false;
                    }
                }
            }
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

dumpSuspiciousFields();
