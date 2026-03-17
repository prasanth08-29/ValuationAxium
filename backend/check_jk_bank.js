const fs = require('fs');
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/axium_valuation').then(async () => {
    const Template = mongoose.model('Template', new mongoose.Schema({name: String, fields: Array}, {strict: false}));
    const t = await Template.findOne({name: 'JK Bank Valuation'});
    let out = '';
    t.fields.slice(14, 25).forEach((f, i) => {
        out += `[${14+i}] Label: ${f.label}\n`;
        out += `     ID: ${f.id}\n`;
        out += `     Conds: ${JSON.stringify(f.conditions)}\n`;
        out += `     Deps: ${f.dependsOn}\n\n`;
    });
    fs.writeFileSync('jk_fields.txt', out, 'utf8');
    process.exit(0);
});
