const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/axium_valuation').then(async () => {
    const TemplateSchema = new mongoose.Schema({ name: String, entity: String, fields: Array });
    const Template = mongoose.model('Template', TemplateSchema);
    
    // Also need Report
    const ReportSchema = new mongoose.Schema({ title: String, template: String, data: Object, sections: Array }, {strict: false});
    const Report = mongoose.model('Report', ReportSchema);

    console.log("--- Templates ---");
    const t = await Template.findOne({name: /individual/i});
    if (t) {
        console.log("Found template:", t.name);
        const badFields = t.fields.filter(f => !f.id || typeof f.id !== 'string');
        if (badFields.length) console.log("BAD FIELDS:", badFields);
        else console.log("All fields have string IDs.");
    }
    
    console.log("--- Reports ---");
    const r = await Report.findOne({template: /individual/i}).sort({createdAt: -1});
    if (r) {
        console.log("Found recent report:", r.title);
        // check fields in report
        let bad = 0;
        r.sections.forEach(s => {
            s.fields.forEach(f => {
                if (!f.id || typeof f.id !== 'string') bad++;
            });
        });
        console.log("Report bad fields:", bad);
    }

    process.exit(0);
});
