require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');
const docx = require('docx');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sizeOf = require('image-size').imageSize;

const {
    Document, Packer, Paragraph, TextRun, HeadingLevel,
    Table, TableRow, TableCell, WidthType, BorderStyle,
    AlignmentType, PageBreak, Header, Footer, ImageRun
} = docx;

// Models
const User = require('./models/User');
const Template = require('./models/Template');
const Report = require('./models/Report');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

const upload = multer({ dest: 'uploads/' });

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/axium_valuation')
    .then(() => {
        console.log('Connected to MongoDB');
        // Ensure default admin exists
        seedAdmin();
    }).catch(err => console.error('MongoDB connection error:', err));

async function seedAdmin() {
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await User.create({
            username: 'admin',
            password: hashedPassword,
            role: 'admin',
            name: 'System Admin'
        });
        console.log('Default admin user created');
    }
}

// ---- Authentication Middleware ----
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Auth token missing' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_for_development');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// ---- Auth Routes ----
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, process.env.JWT_SECRET || 'default_secret_for_development', { expiresIn: '1d' });
        res.json({ token, user: { id: user._id, username: user.username, role: user.role, name: user.name } });
    } catch (err) {
        res.status(500).json({ error: 'Login error' });
    }
});

app.get('/api/auth/me', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ---- Template Routes ----
app.post('/api/templates/upload', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    try {
        const result = await mammoth.extractRawText({ path: req.file.path });
        const text = result.value;

        const lines = text.split('\n').filter(l => l.trim().length > 0);
        const extractedSet = new Set();

        for (let i = 0; i < lines.length; i++) {
            const t = lines[i].trim();
            const next = (i + 1 < lines.length) ? lines[i + 1].trim() : '';

            if (/^[0-9]+[a-z]?$/.test(t) && next.length > 3 && next.length < 150 && !next.startsWith(':')) {
                if (next !== 'Rs' && next !== 'Sq Ft' && next !== 'Rs per SqFt') extractedSet.add(next);
            }
            if (next === ':' || next.startsWith(':')) {
                if (t.length > 2 && t !== ':' && !/^[0-9]+[a-z]?$/.test(t)) extractedSet.add(t);
            }
            if (t.endsWith(':') && t.length > 2) {
                const label = t.replace(':', '').trim();
                if (label.length > 2 && !/^[0-9]+[a-z]?$/.test(label)) extractedSet.add(label);
            }
            if (t.includes(':') && !t.startsWith(':')) {
                const parts = t.split(':');
                const label = parts[0].trim();
                if (label.length > 3 && !/^[0-9]+[a-z]?$/.test(label)) extractedSet.add(label);
            }
            if ((next === 'Rs' || next === 'Sq Ft' || next === 'Rs per SqFt') && t.length > 3 && t.length < 80) {
                if (!/^[0-9]+[a-z]?$/.test(t)) extractedSet.add(t);
            }
            if ((t.toLowerCase().startsWith('value of ') || t.toLowerCase().includes('extent')) && t.length > 3 && t.length < 80) {
                extractedSet.add(t);
            }
            if (t.includes('____') || t.includes('....')) {
                const f = t.replace(/_+/g, '').replace(/\.+/g, '').replace(/:/g, '').trim();
                if (f.length > 2 && !/^[0-9]+[a-z]?$/.test(f)) extractedSet.add(f);
            }
        }

        const fields = Array.from(extractedSet).map(fieldName => {
            const lowerLabel = fieldName.toLowerCase();
            let fieldType = 'text';

            if (lowerLabel.includes('date') || lowerLabel.includes('year') || lowerLabel.includes('dob')) {
                fieldType = 'date';
            } else if (lowerLabel.includes('value') || lowerLabel.includes('amount') || lowerLabel.includes('price') || lowerLabel.includes('cost') || lowerLabel.includes('rate') || lowerLabel.includes('pincode')) {
                fieldType = 'number';
            } else if (lowerLabel.includes('address') || lowerLabel.includes('remarks') || lowerLabel.includes('details') || lowerLabel.includes('description') || lowerLabel.includes('notes') || lowerLabel.includes('location')) {
                fieldType = 'textarea';
            }

            return {
                id: fieldName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().substring(0, 60),
                label: fieldName.substring(0, 150),
                type: fieldType,
                placeholder: fieldType === 'date' ? 'Select Date...' : `Enter ${fieldName.substring(0, 40)}...`
            };
        });

        const validFields = fields.filter(f => f.label.length >= 3 && !/^[0-9.]+$/.test(f.label) && f.label.toLowerCase() !== 'yes' && f.label.toLowerCase() !== 'no');

        const uniqueFields = [];
        const seenLabels = new Set();
        for (const field of validFields) {
            const normalizedLabel = field.label.toLowerCase().replace(/\s+/g, ' ').trim();
            if (!seenLabels.has(normalizedLabel)) {
                seenLabels.add(normalizedLabel);
                uniqueFields.push(field);
            }
        }

        fs.unlinkSync(req.file.path);

        res.json({
            success: true,
            fields: uniqueFields,
            rawText: text
        });
    } catch (err) {
        console.error('Error parsing document:', err);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: 'Failed to process document' });
    }
});

app.post('/api/templates', async (req, res) => {
    try {
        const { name, fields, entity } = req.body;
        if (!name || !fields || !entity) return res.status(400).json({ error: 'Name, fields, and entity are required' });

        const template = new Template({ name, fields, entity });
        await template.save();
        res.json({ success: true, template });
    } catch (err) {
        console.error('Error saving template:', err);
        res.status(500).json({ error: 'Failed to save template' });
    }
});

app.get('/api/templates', async (req, res) => {
    try {
        const filter = req.query.entity ? { entity: new RegExp(`^${req.query.entity}$`, 'i') } : {};
        const templates = await Template.find(filter).lean();

        // Map _id to id for frontend
        const mappedTemplates = templates.map(t => ({ ...t, id: t._id }));
        res.json(mappedTemplates);
    } catch (err) {
        console.error('Error reading templates:', err);
        res.status(500).json({ error: err.message || 'Failed to read templates' });
    }
});

app.get('/api/templates/:id', async (req, res) => {
    try {
        const template = await Template.findById(req.params.id).lean();
        if (!template) return res.status(404).json({ error: 'Template not found' });
        res.json({ ...template, id: template._id });
    } catch (err) {
        res.status(500).json({ error: 'Template not found' });
    }
});

app.put('/api/templates/:id', async (req, res) => {
    try {
        const { name, fields, entity } = req.body;
        const template = await Template.findByIdAndUpdate(req.params.id, { name, fields, entity }, { new: true }).lean();
        if (!template) return res.status(404).json({ error: 'Template not found' });
        res.json({ success: true, template: { ...template, id: template._id } });
    } catch (err) {
        console.error('Error updating template:', err);
        res.status(500).json({ error: 'Failed to update template' });
    }
});

app.delete('/api/templates/:id', async (req, res) => {
    try {
        const template = await Template.findByIdAndDelete(req.params.id);
        if (!template) return res.status(404).json({ error: 'Template not found' });
        res.json({ success: true, message: 'Template deleted' });
    } catch (err) {
        console.error('Error deleting template:', err);
        res.status(500).json({ error: 'Failed to delete template' });
    }
});

app.patch('/api/templates/:id/unlink', async (req, res) => {
    try {
        const template = await Template.findByIdAndUpdate(req.params.id, { entity: 'unassigned' });
        if (!template) return res.status(404).json({ error: 'Template not found' });
        res.json({ success: true, message: 'Template unlinked' });
    } catch (err) {
        console.error('Error unlinking template:', err);
        res.status(500).json({ error: 'Failed to unlink template' });
    }
});

// ---- Report Routes ----
app.post('/api/reports', authenticate, async (req, res) => {
    try {
        const { title, entity, template, date, value, data, sections } = req.body;

        const newReport = new Report({
            title: title || 'Untitled Report',
            entity: entity || 'General',
            template: template || 'Default',
            date: date || new Date().toISOString().split('T')[0],
            status: req.body.status || 'Completed',
            value: value || 'TBD',
            data: data || {},
            sections: sections || [],
            userId: req.user.id
        });

        await newReport.save();
        res.json({ success: true, report: newReport });
    } catch (err) {
        console.error('Error saving report:', err);
        res.status(500).json({ error: 'Failed to save report' });
    }
});

app.get('/api/reports', authenticate, async (req, res) => {
    try {
        let query = {};
        if (req.user.role !== 'admin') {
            query.userId = req.user.id;
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const totalReports = await Report.countDocuments(query);
        const reports = await Report.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            reports,
            totalPages: Math.ceil(totalReports / limit),
            currentPage: page,
            totalReports
        });
    } catch (err) {
        console.error('Error reading reports:', err);
        res.status(500).json({ error: 'Failed to read reports' });
    }
});

app.get('/api/reports/:id', authenticate, async (req, res) => {
    try {
        const report = await Report.findOne({ _id: req.params.id, userId: req.user.role === 'admin' ? { $exists: true } : req.user.id });
        if (!report) return res.status(404).json({ error: 'Report not found' });

        // Map _id and include id for frontend
        const reportObj = report.toObject();
        reportObj.id = reportObj._id;
        res.json(reportObj);
    } catch (err) {
        console.error('Error fetching report:', err);
        res.status(500).json({ error: 'Failed to fetch report' });
    }
});

app.put('/api/reports/:id', authenticate, async (req, res) => {
    try {
        const { title, date, value, data, sections, status } = req.body;

        const report = await Report.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.role === 'admin' ? { $exists: true } : req.user.id },
            { title, date, value, data, sections, status },
            { new: true }
        );

        if (!report) return res.status(404).json({ error: 'Report not found' });
        res.json({ success: true, report });
    } catch (err) {
        console.error('Error updating report:', err);
        res.status(500).json({ error: 'Failed to update report' });
    }
});

app.delete('/api/reports/:id', authenticate, async (req, res) => {
    try {
        const report = await Report.findByIdAndDelete(req.params.id);
        if (!report) return res.status(404).json({ error: 'Report not found' });
        res.json({ success: true, message: 'Report deleted' });
    } catch (err) {
        console.error('Error deleting report:', err);
        res.status(500).json({ error: 'Failed to delete report' });
    }
});


// ---- Export Route ----
app.post('/api/export/word', async (req, res) => {
    try {
        const { title, sections, data } = req.body;

        const children = [];

        // 1. Cover Page
        children.push(new Paragraph({
            children: [
                new TextRun({ text: "AxiumValuation", bold: true, size: 56, color: "1e3a8a" }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 2000, after: 800 }
        }));

        children.push(new Paragraph({
            children: [
                new TextRun({ text: "OFFICIAL VALUATION REPORT", bold: true, size: 40, color: "374151" }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 1000 }
        }));

        children.push(new Paragraph({
            children: [
                new TextRun({ text: title || "Valuation Report", size: 32, color: "4b5563" }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 2000 }
        }));

        children.push(new Paragraph({
            children: [
                new TextRun({ text: `Date Generated: ${new Date().toLocaleDateString()}`, size: 24, color: "6b7280" }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
        }));

        children.push(new Paragraph({
            children: [new PageBreak()]
        }));

        // 2. Sections and Tables
        if (Array.isArray(sections)) {
            sections.forEach(sec => {
                if (sec.title) {
                    children.push(new Paragraph({
                        text: sec.title.toUpperCase(),
                        heading: HeadingLevel.HEADING_2,
                        spacing: { before: 400, after: 200 },
                    }));
                }

                if (Array.isArray(sec.fields) && sec.fields.length > 0) {
                    let tableRows = [];

                    // Reusable header construction
                    const createHeaderRow = () => new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph({ children: [new TextRun({ text: "Property Detail", bold: true, color: "ffffff" })], alignment: AlignmentType.LEFT })],
                                width: { size: 40, type: WidthType.PERCENTAGE },
                                shading: { fill: "1e3a8a" },
                                margins: { top: 100, bottom: 100, left: 100, right: 100 }
                            }),
                            new TableCell({
                                children: [new Paragraph({ children: [new TextRun({ text: "Assessed Value / Information", bold: true, color: "ffffff" })], alignment: AlignmentType.LEFT })],
                                width: { size: 60, type: WidthType.PERCENTAGE },
                                shading: { fill: "1e3a8a" },
                                margins: { top: 100, bottom: 100, left: 100, right: 100 }
                            })
                        ]
                    });

                    // Utility to finalize a table group
                    const flushTable = () => {
                        if (tableRows.length > 1) {
                            children.push(new Table({
                                rows: tableRows,
                                width: { size: 100, type: WidthType.PERCENTAGE },
                                borders: {
                                    top: { style: BorderStyle.SINGLE, size: 1, color: "d1d5db" },
                                    bottom: { style: BorderStyle.SINGLE, size: 1, color: "d1d5db" },
                                    left: { style: BorderStyle.SINGLE, size: 1, color: "d1d5db" },
                                    right: { style: BorderStyle.SINGLE, size: 1, color: "d1d5db" },
                                    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "e5e7eb" },
                                    insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "e5e7eb" },
                                }
                            }));
                            children.push(new Paragraph({ text: "", spacing: { after: 300 } }));
                        }
                        tableRows = [createHeaderRow()];
                    };

                    // Initialize first table header
                    tableRows.push(createHeaderRow());

                    sec.fields.forEach(field => {
                        if (field.type === 'button') return;

                        if (field.type === 'heading') {
                            flushTable();
                            children.push(new Paragraph({
                                text: field.label.toUpperCase(),
                                heading: HeadingLevel.HEADING_3,
                                spacing: { before: 400, after: 200 },
                            }));
                            return;
                        }

                        if (field.type === 'subheading') {
                            flushTable();
                            children.push(new Paragraph({
                                text: field.label.toUpperCase(),
                                heading: HeadingLevel.HEADING_4,
                                spacing: { before: 300, after: 150 },
                            }));
                            return;
                        }

                        const label = field.label || field.id;
                        let value = data[field.id];

                        let cellChildren = [];
                        if ((field.isList || field.type === 'bullets') && Array.isArray(value)) {
                            if (value.length === 0) {
                                cellChildren = [new Paragraph({ children: [new TextRun({ text: "N/A", size: 20 })] })];
                            } else {
                                cellChildren = value.map(item => new Paragraph({
                                    children: [new TextRun({ text: item, size: 20 })],
                                    bullet: { level: 0 },
                                    spacing: { after: 50 }
                                }));
                            }
                        } else {
                            cellChildren = [new Paragraph({ children: [new TextRun({ text: String(value || "N/A"), size: 20 })] })];
                        }

                        tableRows.push(new TableRow({
                            children: [
                                new TableCell({
                                    children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20 })] })],
                                    width: { size: 40, type: WidthType.PERCENTAGE },
                                    margins: { top: 100, bottom: 100, left: 100, right: 100 },
                                    shading: { fill: "f3f4f6" }
                                }),
                                new TableCell({
                                    children: cellChildren,
                                    width: { size: 60, type: WidthType.PERCENTAGE },
                                    margins: { top: 100, bottom: 100, left: 100, right: 100 }
                                })
                            ]
                        }));
                    });

                    // Final flush
                    if (tableRows.length > 1) {
                        children.push(new Table({
                            rows: tableRows,
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            borders: {
                                top: { style: BorderStyle.SINGLE, size: 1, color: "d1d5db" },
                                bottom: { style: BorderStyle.SINGLE, size: 1, color: "d1d5db" },
                                left: { style: BorderStyle.SINGLE, size: 1, color: "d1d5db" },
                                right: { style: BorderStyle.SINGLE, size: 1, color: "d1d5db" },
                                insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "e5e7eb" },
                                insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "e5e7eb" },
                            }
                        }));
                        children.push(new Paragraph({ text: "", spacing: { after: 300 } }));
                    }
                }
            });
        }

        // 3. Photos
        if (data.photos) {
            const hasPhotos = Array.isArray(data.photos)
                ? data.photos.length > 0
                : (data.photos.guideline?.length > 0 || data.photos.location?.length > 0 || data.photos.property?.length > 0);

            if (hasPhotos) {
                children.push(new Paragraph({ children: [new PageBreak()] }));
                children.push(new Paragraph({
                    text: "INSPECTION PHOTOS",
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 400, after: 400 },
                }));

                const processPhotoSection = (photoList, sectionTitle) => {
                    if (!photoList || photoList.length === 0) return;

                    children.push(new Paragraph({
                        children: [new TextRun({ text: sectionTitle, bold: true, size: 24, color: "1e3a8a" })],
                        spacing: { before: 300, after: 200 },
                    }));

                    photoList.forEach((photo, idx) => {
                        const photoBase64 = typeof photo === 'string' ? photo : (photo?.data || "");
                        if (!photoBase64) return;

                        const lat = photo?.lat;
                        const lng = photo?.lng;

                        try {
                            const base64DataIndex = photoBase64.indexOf('base64,');
                            if (base64DataIndex !== -1) {
                                const base64Data = photoBase64.substring(base64DataIndex + 7);
                                const buffer = Buffer.from(base64Data, 'base64');
                                const dimensions = sizeOf(buffer);

                                let width = dimensions.width;
                                let height = dimensions.height;
                                const maxWidth = 500;
                                if (width > maxWidth) {
                                    height = Math.round((maxWidth / width) * height);
                                    width = maxWidth;
                                }

                                let mimeExtension = 'jpeg';
                                const mimeMatch = photoBase64.substring(0, base64DataIndex).match(/data:image\/([^;]+)/);
                                if (mimeMatch) mimeExtension = mimeMatch[1].toLowerCase();
                                if (mimeExtension === 'jpg') mimeExtension = 'jpeg';

                                children.push(new Paragraph({
                                    children: [
                                        new ImageRun({
                                            data: buffer,
                                            transformation: { width: width, height: height },
                                            type: mimeExtension
                                        })
                                    ],
                                    alignment: AlignmentType.CENTER,
                                    spacing: { after: 200 }
                                }));

                                let caption = `${sectionTitle} - Photo ${idx + 1}`;
                                if (lat && lng) {
                                    caption += ` (Location: ${lat.toFixed(6)}, ${lng.toFixed(6)})`;
                                }

                                children.push(new Paragraph({
                                    children: [new TextRun({ text: caption, size: 18, color: "6b7280" })],
                                    alignment: AlignmentType.CENTER,
                                    spacing: { after: 400 }
                                }));
                            }
                        } catch (e) {
                            console.error("Failed to process photo for Word export:", e);
                        }
                    });
                };

                if (Array.isArray(data.photos)) {
                    processPhotoSection(data.photos, "General Photos");
                } else {
                    processPhotoSection(data.photos.guideline, "1. Guideline Value");
                    processPhotoSection(data.photos.location, "2. Location Map");
                    processPhotoSection(data.photos.property, "3. Property Images");
                }
            }
        }

        const doc = new Document({
            styles: {
                paragraphStyles: [
                    {
                        id: "Heading2",
                        name: "Heading 2",
                        basedOn: "Normal",
                        next: "Normal",
                        quickFormat: true,
                        run: {
                            color: "1e3a8a",
                            size: 28,
                            bold: true,
                        },
                    },
                    {
                        id: "Heading3",
                        name: "Heading 3",
                        basedOn: "Normal",
                        next: "Normal",
                        quickFormat: true,
                        run: {
                            color: "1e3a8a",
                            size: 24,
                            bold: true,
                        },
                    },
                    {
                        id: "Heading4",
                        name: "Heading 4",
                        basedOn: "Normal",
                        next: "Normal",
                        quickFormat: true,
                        run: {
                            color: "1e3a8a",
                            size: 20,
                            bold: true,
                        },
                    },
                ],
            },
            sections: [{
                properties: {},
                headers: {
                    default: new Header({
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({ text: "AxiumValuation", bold: true, color: "9ca3af" }),
                                    new TextRun({ text: " | Confidential Report", color: "9ca3af" }),
                                ],
                                alignment: AlignmentType.RIGHT,
                            }),
                        ],
                    }),
                },
                footers: {
                    default: new Footer({
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun("Page "),
                                    new TextRun({ children: ["PAGE_NUMBER"] }),
                                    new TextRun(" of "),
                                    new TextRun({ children: ["NUMPAGES"] }),
                                ],
                                alignment: AlignmentType.CENTER,
                            }),
                        ],
                    }),
                },
                children: children
            }]
        });

        const buffer = await Packer.toBuffer(doc);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename=Valuation_Report.docx`);
        res.send(buffer);
    } catch (err) {
        console.error('Export Error:', err);
        res.status(500).json({ error: 'Failed to generate Word document' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
