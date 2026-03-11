require('dotenv').config();
const mongoose = require('mongoose');
const Template = require('./models/Template');

async function findTemplate() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/axium_valuation');
        const templates = await Template.find({});
        for (const t of templates) {
            const json = JSON.stringify(t);
            if (json.includes("SELECT THE FLOORS REQUIRED")) {
                console.log(`FOUND IN TEMPLATE: ${t.name} (${t._id})`);
                // Dump the fields around that string
                const fields = t.fields || [];
                const index = fields.findIndex(f => f.label && f.label.includes("SELECT THE FLOORS REQUIRED"));
                console.log(`Index of heading: ${index}`);
                if (index !== -1) {
                    console.log("Fields in this section:");
                    const sectionFields = fields.slice(index, index + 20);
                    sectionFields.forEach((f, i) => {
                        console.log(`  [${index + i}] ID: ${f.id}, Label: ${f.label}, Type: ${f.type}, Conditions: ${JSON.stringify(f.conditions)}, DependsOn: ${f.dependsOn}`);
                    });
                }
            }
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

findTemplate();
