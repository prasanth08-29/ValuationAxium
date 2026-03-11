require('dotenv').config();
const mongoose = require('mongoose');
const Report = require('./models/Report');

async function dumpReports() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/axium_valuation');
        const reports = await Report.find({}).sort({ updatedAt: -1 }).limit(1);
        console.log(JSON.stringify(reports, null, 2));
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

dumpReports();
