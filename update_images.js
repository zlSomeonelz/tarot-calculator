const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\whtjs\\black tarot answer\\data_ko.js', 'utf8');

// The file looks like:
// {
//   "id": XX,
//   "name": "...",
//   "suit": "...",
//   "keywords": [ ...
// }

// Replace entries that don't have "image" field
const updated = content.replace(/{\r?\n\s+"id": (\d+),/g, (match, id) => {
    const nextPart = content.substring(content.indexOf(match) + match.length);
    if (nextPart.trim().startsWith('"name"')) {
        // Check if there is already an "image" field before the next "keywords"
        const snippet = nextPart.substring(0, 200);
        if (!snippet.includes('"image":')) {
            return `{\n    "id": ${id},\n    "image": "images/tarot_${id}.png",`;
        }
    }
    return match;
});

fs.writeFileSync('c:\\Users\\whtjs\\black tarot answer\\data_ko.js', updated);
console.log("Updated data_ko.js with missing image fields.");
