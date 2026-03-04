const { Document, Packer, Paragraph, ImageRun } = require('docx');
const sizeOf = require('image-size');
const fs = require('fs');

const imgBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

const test = async () => {
    try {
        const matches = imgBase64.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
        const buffer = Buffer.from(matches[2], 'base64');
        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({
                        children: [
                            new ImageRun({
                                data: buffer,
                                transformation: { width: 100, height: 100 }
                            })
                        ]
                    })
                ]
            }]
        });
        const docBuffer = await Packer.toBuffer(doc);
        console.log('SUCCESS', docBuffer.length);
    } catch (e) {
        console.error('ERROR', e);
    }
};

test();
