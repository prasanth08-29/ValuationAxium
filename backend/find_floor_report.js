require('dotenv').config();
const mongoose = require('mongoose');
const Report = require('./models/Report');

async function findFloorReport() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/axium_valuation');
        const reports = await Report.find({});
        console.log(`Found ${reports.length} reports total.`);
        for (const r of reports) {
            const hasFloor = JSON.stringify(r.sections).includes("FLOORS");
            if (hasFloor) {
                console.log(`MATCH: ${r.updatedAt.toISOString()} | ${r._id} | ${r.title}`);
            }
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

findFloorReport();
