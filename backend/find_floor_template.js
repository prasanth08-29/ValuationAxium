require('dotenv').config();
const mongoose = require('mongoose');
const Template = require('./models/Template');

async function findFloorTemplate() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/axium_valuation');
        const templates = await Template.find({});
        console.log(`Found ${templates.length} templates.`);
        for (const t of templates) {
            console.log(`Checking Template: ${t.name} (${t._id})`);
            const hasFloor = JSON.stringify(t.sections || t.fields).includes("FLOORS");
            if (hasFloor) {
                console.log(`  MATCH: Contains "FLOORS"`);
                // Find fields with conditions
                const fieldsWithCond = (t.fields || []).filter(f => f.conditions?.length > 0 || f.dependsOn);
                console.log(`  Fields with conditions: ${fieldsWithCond.length}`);
                fieldsWithCond.forEach(f => {
                    console.log(`    - ${f.label} (${f.id}): depends on ${f.dependsOn || f.conditions[0]?.fieldId}`);
                });
            }
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

findFloorTemplate();
