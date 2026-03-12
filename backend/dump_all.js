require('dotenv').config();
const mongoose = require('mongoose');

async function check() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/axium_valuation');
    const Report = mongoose.model('Report', new mongoose.Schema({}, { strict: false }));
    const reports = await Report.find({});
    console.log("Total reports:", reports.length);
    reports.forEach(r => {
        if (JSON.stringify(r).includes('SELECT THE FLOORS REQUIRED')) {
            console.log("Found in report:", r._id, r.title);
        }
    });

    const Template = mongoose.model('Template', new mongoose.Schema({}, { strict: false }));
    const templates = await Template.find({});
    console.log("Total templates:", templates.length);
    templates.forEach(t => {
        if (JSON.stringify(t).includes('SELECT THE FLOORS REQUIRED')) {
            console.log("Found in template:", t._id, t.name);
        }
    });
    process.exit();
}
check();
