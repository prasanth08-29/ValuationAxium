const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    entity: { type: String, required: true },
    fields: { type: Array, required: true }, // Ideally this should be a proper schema, but an array of objects is fine for now
}, { timestamps: true });

module.exports = mongoose.model('Template', templateSchema);
