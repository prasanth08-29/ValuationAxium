const mongoose = require('mongoose');

async function check() {
    try {
        await mongoose.connect('mongodb://localhost:27017/axium_valuation');
        const db = mongoose.connection.db;
        const templates = await db.collection('templates').find({}).toArray();
        let targetFields = [];
        let dependentFields = [];
        
        templates.forEach(t => {
            if (t.fields) {
                t.fields.forEach(f => {
                    if (f.label && f.label.toLowerCase().includes('select the floors required')) {
                        targetFields.push(f);
                    }
                });
                targetFields.forEach(targetField => {
                    t.fields.forEach(f => {
                         let parentId = null;
                         if (f.dependsOn === targetField.id) parentId = targetField.id;
                         if (f.conditions && f.conditions.length > 0 && f.conditions[0].fieldId === targetField.id) parentId = targetField.id;
                         if (parentId && !dependentFields.includes(f)) {
                             dependentFields.push(f);
                         }
                    });
                });
            }
        });
        console.log("PARENT FIELD:\n", JSON.stringify(targetFields[0], null, 2));
        console.log("DEPENDENT FIELDS:\n", JSON.stringify(dependentFields, null, 2));
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
