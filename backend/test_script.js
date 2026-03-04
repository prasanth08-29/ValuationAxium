const sizeOf = require('image-size');
const docx = require('docx');
const { Document, Packer, Paragraph, ImageRun } = docx;

const test = async () => {
    try {
        const imgBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
        const children = [];
        const base64DataIndex = imgBase64.indexOf('base64,');
        const base64Data = imgBase64.substring(base64DataIndex + 7);
        const buffer = Buffer.from(base64Data, 'base64');
        const dimensions = sizeOf(buffer);
        console.log('Dims', dimensions);

        children.push(new Paragraph({
            children: [
                new ImageRun({
                    data: buffer,
                    transformation: { width: 100, height: 100 },
                    type: 'png'
                })
            ]
        }));

        const doc = new Document({ sections: [{ children }] });
        const res = await Packer.toBuffer(doc);
        console.log('success', res.length);
    } catch (e) {
        console.error('err', e);
    }
}
test();
