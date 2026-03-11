require('dotenv').config();
const mongoose = require('mongoose');
const Template = require('./models/Template');
const fs = require('fs');

async function findFloorFields() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/axium_valuation');
        const t = await Template.findOne({ name: /jk bank/i });
        const result = [];
        if (t) {
            t.fields.forEach((f, i) => {
                const label = (f.label || '').toUpperCase();
                if (label.includes("FLOOR") || f.label === "1" || f.label === "2" || f.label === "3" || f.label === "4" || f.id === '1' || f.id === '2' || f.id === '3' || f.id === '4') {
                    result.push({
                        index: i,
                        id: f.id,
                        label: f.label,
                        type: f.type,
                        conditions: f.conditions,
                        dependsOn: f.dependsOn
                    });
                }
            });
            fs.writeFileSync('floor_fields.json', JSON.stringify(result, null, 2), 'utf8');
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

findFloorFields();
