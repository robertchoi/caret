const fs = require('fs');
const path = require('path');
const processor = require('./processor');

const [,, inputFile, outputFile, ...args] = process.argv;

if (!inputFile || !outputFile) {
    console.error("Usage: node cli.js <inputFile> <outputFile> <operations...>");
    console.error("Example: node cli.js input.json output.json flatten 'group:department'");
    process.exit(1);
}

const inputPath = path.resolve(inputFile);
const outputPath = path.resolve(outputFile);

let data;
try {
    const rawData = fs.readFileSync(inputPath, 'utf8');
    if (inputPath.endsWith('.csv')) {
        // Basic CSV to JSON conversion
        const [header, ...rows] = rawData.trim().split('\n').map(r => r.split(','));
        data = rows.map(row => header.reduce((acc, h, i) => ({ ...acc,
            [h]: row[i]
        }), {}));
    } else {
        data = JSON.parse(rawData);
    }
} catch (error) {
    console.error(`Error reading or parsing input file: ${error.message}`);
    process.exit(1);
}


let processedData = data;
for (const arg of args) {
    const [operation, param] = arg.split(':');
    console.log(`Applying operation: ${operation}` + (param ? ` with param: ${param}` : ''));

    switch (operation) {
        case 'flatten':
            processedData = Array.isArray(processedData) ? processedData.map(processor.flatten) : processor.flatten(processedData);
            break;
        case 'group':
            processedData = processor.group(processedData, param);
            break;
        case 'filter':
            try {
                const conditions = JSON.parse(param);
                processedData = processor.filter(processedData, conditions);
            } catch (e) {
                console.error(`Invalid filter condition: ${param}. Must be a valid JSON string.`);
            }
            break;
        case 'aggregate':
            const [field, ...ops] = param.split(',');
            processedData = processor.aggregate(processedData, field, ops);
            break;
        case 'sort':
            const fields = JSON.parse(param);
            processedData = processor.sort(processedData, fields);
            break;
        case 'removeDuplicates':
            processedData = processor.removeDuplicates(processedData, param);
            break;
        default:
            console.warn(`Unknown operation: ${operation}`);
    }
}

try {
    let outputData;
    if (outputPath.endsWith('.csv')) {
        if (typeof processedData !== 'object' || processedData === null) {
            outputData = String(processedData);
        } else if (Array.isArray(processedData) && processedData.length > 0) {
            const header = Object.keys(processedData[0]).join(',');
            const rows = processedData.map(obj => Object.values(obj).join(','));
            outputData = [header, ...rows].join('\n');
        } else {
            outputData = JSON.stringify(processedData); // Fallback for non-array objects
        }
    } else {
        outputData = JSON.stringify(processedData, null, 2);
    }
    fs.writeFileSync(outputPath, outputData, 'utf8');
    console.log(`Processing complete. Output saved to ${outputPath}`);
} catch (error) {
    console.error(`Error writing output file: ${error.message}`);
    process.exit(1);
}
