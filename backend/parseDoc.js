const mammoth = require("mammoth");
const fs = require("fs");

mammoth.extractRawText({ path: "../JKB- Mambalam Val Report - Copy.docx" })
    .then(function (result) {
        const text = result.value;
        fs.writeFileSync("parsed.txt", text);
        console.log("Done");
    })
    .catch(console.error)
    .done();
