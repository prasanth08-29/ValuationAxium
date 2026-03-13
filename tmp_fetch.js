require('dotenv').config({ path: 'backend/.env' });
const mongoose = require('mongoose');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/axium_valuation');
        const db = mongoose.connection.db;
        const templates = await db.collection('templates').find({}).toArray();
        let targetField = null;
        let fieldsDependsOnTarget = [];
        
        templates.forEach(t => {
            if (t.fields) {
                t.fields.forEach(f => {
                    if (f.label && f.label.toLowerCase().includes('select the floors required')) {
                        targetField = f;
                    }
                });
                if (targetField) {
                    t.fields.forEach(f => {
                         let parentId = null;
                         if (f.dependsOn === targetField.id) parentId = targetField.id;
                         if (f.conditions && f.conditions.length > 0 && f.conditions[0].fieldId === targetField.id) parentId = targetField.id;
                         if (parentId) {
                             fieldsDependsOnTarget.push(f);
                         }
                    });
                }
            }
        });
        console.log("PARENT FIELD:\n", JSON.stringify(targetField, null, 2));
        console.log("DEPENDENT FIELDS:\n", JSON.stringify(fieldsDependsOnTarget, null, 2));
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
