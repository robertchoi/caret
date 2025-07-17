const fs = require('fs');
const path = require('path');
const processor = require('./processor');

const [,, inputFile, outputFile, ...args] = process.argv;

if (!inputFile || !outputFile) {
    console.error('Usage: node cli.js <inputFile> <outputFile> <operations...>');
    process.exit(1);
}

const inputFilePath = path.resolve(inputFile);
const outputFilePath = path.resolve(outputFile);

let data;
try {
    const rawData = fs.readFileSync(inputFilePath, 'utf8');
    if (inputFilePath.endsWith('.csv')) {
        const lines = rawData.trim().split('\n');
        const header = lines.shift().split(',');
        data = lines.map(line => {
            const values = line.split(',');
            return header.reduce((obj, key, index) => {
                obj[key] = isNaN(values[index]) ? values[index] : Number(values[index]);
                return obj;
            }, {});
        });
    } else {
        data = JSON.parse(rawData);
    }
} catch (error) {
    console.error(`Error reading or parsing input file: ${error.message}`);
    process.exit(1);
}

let processedData = data;
// This is a simplified CLI for demonstration.
// A real implementation would have more robust argument parsing.
if (args.includes('flatten')) {
    processedData = processedData.map(processor.flatten);
}
if (args.includes('deduplicate')) {
    processedData = processor.deduplicate(processedData);
}
// Add more operations based on args as needed

try {
    let outputData;
    if (outputFilePath.endsWith('.csv')) {
        if (processedData.length === 0) {
            outputData = '';
        } else {
            const header = Object.keys(processedData[0]).join(',');
            const rows = processedData.map(item => Object.values(item).join(','));
            outputData = [header, ...rows].join('\n');
        }
    } else {
        outputData = JSON.stringify(processedData, null, 2);
    }
    fs.writeFileSync(outputFilePath, outputData, 'utf8');
    console.log(`Processed data saved to ${outputFilePath}`);
} catch (error) {
    console.error(`Error writing output file: ${error.message}`);
    process.exit(1);
}
