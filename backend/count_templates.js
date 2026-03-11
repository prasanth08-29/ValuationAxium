require('dotenv').config();
const mongoose = require('mongoose');
const Template = require('./models/Template');

async function countTemplates() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/axium_valuation');
        const count = await Template.countDocuments({});
        console.log(`Total Templates: ${count}`);
        const allNames = await Template.find({}, { name: 1 });
        console.log(JSON.stringify(allNames, null, 2));
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

countTemplates();
