const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    title: { type: String, default: 'Untitled Report' },
    entity: { type: String, default: 'General' },
    template: { type: String, default: 'Default' },
    date: { type: String }, // Storing as string or Date. Since frontend sends YYYY-MM-DD
    status: { type: String, default: 'Completed' },
    value: { type: String, default: 'TBD' },
    data: { type: Object, default: {} },
    sections: { type: Array, default: [] },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Associate reports with the user who made them
}, { timestamps: true });

// Optionally, we could map fields closer to the front-end format so they output `id` correctly.
reportSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});

module.exports = mongoose.model('Report', reportSchema);
