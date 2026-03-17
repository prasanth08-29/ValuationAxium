const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/axium_valuation').then(async () => {
    const Template = mongoose.model('Template', new mongoose.Schema({}, {strict: false}));
    const ts = await Template.find({});
    ts.forEach(t => {
        if (t.sections && t.sections.length > 0) {
            console.log("Template with sections:", t.name);
        } else {
            console.log("Template (flat):", t.name, "fields:", t.fields?.length);
        }
    });
    process.exit(0);
});
