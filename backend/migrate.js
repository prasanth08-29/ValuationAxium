require('dotenv').config();
const fs = require('fs');
const mongoose = require('mongoose');

const Template = require('./models/Template');
const Report = require('./models/Report');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/axium_valuation';

async function migrateData() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected.');

        // Migrate Templates
        console.log('Migrating Templates...');
        if (fs.existsSync('./templates.json')) {
            const templatesData = JSON.parse(fs.readFileSync('./templates.json', 'utf8'));
            for (const t of templatesData) {
                const exists = await Template.findOne({ name: t.name });
                if (!exists) {
                    const newTemplate = new Template({
                        name: t.name,
                        entity: t.entity,
                        fields: t.fields
                    });
                    await newTemplate.save();
                    console.log(`Migrated Template: ${t.name}`);
                } else {
                    console.log(`Template already exists: ${t.name}`);
                }
            }
        }

        // Migrate Reports
        console.log('Migrating Reports...');
        if (fs.existsSync('./reports.json')) {
            const reportsData = JSON.parse(fs.readFileSync('./reports.json', 'utf8'));
            for (const r of reportsData) {
                // simple check
                const exists = await Report.findOne({ title: r.title, date: r.date });
                if (!exists) {
                    const newReport = new Report({
                        title: r.title,
                        entity: r.entity,
                        template: r.template,
                        date: r.date,
                        status: r.status,
                        value: r.value,
                        data: r.data,
                        sections: r.sections,
                        userId: r.userId || null
                    });
                    await newReport.save();
                    console.log(`Migrated Report: ${r.title}`);
                } else {
                    console.log(`Report already exists: ${r.title}`);
                }
            }
        }

        console.log('Migration Complete.');
        process.exit(0);

    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrateData();
