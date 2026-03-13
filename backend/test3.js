const mongoose = require('mongoose');
async function check() {
    try {
        await mongoose.connect('mongodb://localhost:27017/axium_valuation');
        const db = mongoose.connection.db;
        const reports = await db.collection('reports').find({}).sort({ updatedAt: -1 }).limit(5).toArray();
        reports.forEach(r => {
            console.log("Report:", r._id, "title:", r.title);
            if (r.sections) {
                r.sections.forEach(sec => {
                    if (sec.fields) {
                        sec.fields.forEach(f => {
                            if (f.label && f.label.toLowerCase().includes('name of the floor')) {
                                console.log(`  Found Field: ${f.label} | Depends: ${f.dependsOn || JSON.stringify(f.conditions)} = ${f.dependsOnValue}`);
                            }
                        });
                    }
                });
            }
        });
        await mongoose.disconnect();
    } catch(err) { console.error(err); process.exit(1); }
}
check();
