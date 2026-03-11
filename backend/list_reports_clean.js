require('dotenv').config();
const mongoose = require('mongoose');
const Report = require('./models/Report');

async function listReports() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/axium_valuation');
        const reports = await Report.find({}, { title: 1, updatedAt: 1, entity: 1, template: 1 }).sort({ updatedAt: -1 }).limit(10);
        reports.forEach(r => {
            console.log(`${r.updatedAt.toISOString()} | ${r._id} | ${r.title} | ${r.template}`);
        });
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listReports();
