const fs = require('fs');
const path = require('path');
const processor = require('./processor');

const [,, inputFile, outputFile, ...commands] = process.argv;

if (!inputFile || !outputFile || commands.length === 0) {
    console.error('Usage: node cli.js <inputFile> <outputFile> <command> [options]');
    console.error('Example: node cli.js sample.json output.json filter "department:Engineering" sort "salary:desc"');
    process.exit(1);
}

const inputPath = path.resolve(inputFile);
const outputPath = path.resolve(outputFile);

try {
    const rawData = fs.readFileSync(inputPath, 'utf8');
    let data = JSON.parse(rawData);

    let i = 0;
    while (i < commands.length) {
        const command = commands[i];
        switch (command) {
            case 'flatten':
                data = data.map(processor.flatten);
                i++;
                break;
            case 'group':
                const groupKey = commands[i + 1];
                data = processor.group(data, groupKey);
                i += 2;
                break;
            case 'filter':
                const filterKey = commands[i + 1];
                const filterValue = commands[i + 2];
                const filterConditions = { [filterKey]: filterValue };
                data = processor.filter(data, filterConditions);
                i += 3;
                break;
            case 'aggregate':
                const aggField = commands[i + 1];
                const aggTypes = commands[i + 2].split(',');
                data = processor.aggregate(data, aggField, aggTypes);
                i += 3;
                break;
            case 'sort':
                const sortFields = commands[i + 1].split(',');
                data = processor.sort(data, sortFields);
                i += 2;
                break;
            case 'deduplicate':
                const dedupKey = commands[i + 1];
                data = processor.deduplicate(data, dedupKey);
                i += 2;
                break;
            case 'validate':
                // Validate command needs a more robust implementation for CLI
                console.log('Validate command is not fully implemented for CLI yet.');
                i++;
                break;
            default:
                console.error(`Unknown command: ${command}`);
                process.exit(1);
        }
    }

    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`Processing complete. Output saved to ${outputFile}`);

} catch (error) {
    console.error('An error occurred:', error.message);
    process.exit(1);
}
