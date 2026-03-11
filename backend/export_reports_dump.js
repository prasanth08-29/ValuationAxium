require('dotenv').config();
const mongoose = require('mongoose');
const Report = require('./models/Report');
const fs = require('fs');

async function exportReports() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/axium_valuation');
        const r = await Report.find({});
        fs.writeFileSync('all_reports_dump.json', JSON.stringify(r, null, 2));
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

exportReports();
