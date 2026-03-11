require('dotenv').config();
const mongoose = require('mongoose');
const Template = require('./models/Template');

async function findFloorFields() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/axium_valuation');
        const t = await Template.findOne({ name: /individual/i });
        if (t) {
            console.log(`Checking Template: ${t.name}`);
            t.fields.forEach((f, i) => {
                const label = (f.label || '').toUpperCase();
                if (label.includes("FLOOR") || f.label === "1" || f.label === "2" || f.label === "3" || f.label === "4") {
                    console.log(`[${i}] ID: ${f.id} | Label: ${f.label} | Type: ${f.type} | Cond: ${JSON.stringify(f.conditions)} | Dep: ${f.dependsOn}`);
                }
            });
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

findFloorFields();
