#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const processor = require('./processor');

const args = process.argv.slice(2);

if (args.length < 2) {
    console.log('Usage: node cli.js <command> <inputFile> [options]');
    process.exit(1);
}

const [command, inputFile] = args;
const rawData = fs.readFileSync(inputFile, 'utf8');
const data = JSON.parse(rawData);

let result;

switch (command) {
    case 'flatten':
        if (Array.isArray(data)) {
            result = data.map(item => processor.flatten(item));
        } else {
            result = processor.flatten(data);
        }
        break;
    case 'group':
        const groupKey = args[2];
        if (!groupKey) {
            console.error('Error: Group key is required for group command.');
            process.exit(1);
        }
        result = processor.group(data, groupKey);
        break;
    case 'filter':
        const conditions = JSON.parse(args[2]);
        result = processor.filter(data, conditions);
        break;
    case 'aggregate':
        const aggField = args[2];
        const aggTypes = args[3].split(',');
        result = processor.aggregate(data, aggField, aggTypes);
        break;
    case 'sort':
        const sortCriteria = JSON.parse(args[2]);
        result = processor.sort(data, sortCriteria);
        break;
    case 'dedup':
        const dedupKey = args[2];
        result = processor.dedup(data, dedupKey);
        break;
    default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
}

console.log(JSON.stringify(result, null, 2));
