require('dotenv').config();
const mongoose = require('mongoose');
const Report = require('./models/Report');
const fs = require('fs');

async function dumpReports() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/axium_valuation');
        const allR = await Report.find({});
        for (const r of allR) {
            const sections = r.sections || [];
            for (const s of sections) {
                if ((s.title || '').includes("FLOOR") || s.fields.some(f => (f.label || '').toUpperCase().includes("FLOOR") || f.label === '1' || f.label === '2')) {
                    console.log(`[Report: ${r.title} | ID: ${r._id}] Contains floor fields!`);
                    s.fields.forEach(f => {
                         if ((f.label || '').toUpperCase().includes("FLOOR") || f.label === '1' || f.id === '1' || f.id === '2' || f.label === '2') {
                             console.log(`  -> Field: Label=${f.label}, ID=${f.id}`);
                         }
                    });
                }
            }
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

dumpReports();
