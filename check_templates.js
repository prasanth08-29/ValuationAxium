const mongoose = require('mongoose');

async function checkTemplates() {
    try {
        await mongoose.connect('mongodb://localhost:27017/axium_valuation'); // Adjust if needed, but usually this is the default
        
        const TemplateSchema = new mongoose.Schema({}, { strict: false });
        const Template = mongoose.model('Template', TemplateSchema);
        
        const templates = await Template.find({});
        console.log(`Found ${templates.length} templates.`);
        
        templates.forEach(t => {
            console.log(`\nTemplate: ${t.name} (${t.entity})`);
            const ids = t.fields.map(f => f.id);
            const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
            if (duplicates.length > 0) {
                console.log(`!!! DUPLICATE IDs FOUND:`, [...new Set(duplicates)]);
                t.fields.forEach((f, i) => {
                    if (duplicates.includes(f.id)) {
                        console.log(`  [${i}] label: "${f.label}" id: "${f.id}"`);
                    }
                });
            } else {
                console.log(`No duplicates found.`);
            }
        });
        
        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkTemplates();
