const fs = require('fs');
const path = require('path');
const { flatten, group, filter, aggregate, sort, deduplicate, validate } = require('./processor');

function main() {
    const args = process.argv.slice(2);
    if (args.length < 3) {
        console.error("Usage: node cli.js <command> <inputFile> <outputFile> [options]");
        console.error("Commands: flatten, group, filter, aggregate, sort, deduplicate, validate");
        return;
    }

    const [command, inputFile, outputFile, ...options] = args;
    const inputPath = path.resolve(inputFile);
    const outputPath = path.resolve(outputFile);

    let data;
    try {
        const rawData = fs.readFileSync(inputPath, 'utf8');
        data = JSON.parse(rawData);
    } catch (error) {
        console.error(`Error reading or parsing input file: ${error.message}`);
        return;
    }

    let result;
    try {
        switch (command) {
            case 'flatten':
                result = data.map(item => flatten(item));
                break;
            case 'group':
                const groupKey = options[0];
                if (!groupKey) throw new Error("Group key is required.");
                result = group(data, groupKey);
                break;
            case 'filter':
                const filterCondition = JSON.parse(options[0]);
                result = filter(data, filterCondition);
                break;
            case 'aggregate':
                const [aggField, aggType] = options;
                if (!aggField || !aggType) throw new Error("Aggregate field and type are required.");
                result = aggregate(data, aggField, aggType);
                break;
            case 'sort':
                const sortKeys = JSON.parse(options[0]);
                result = sort(data, sortKeys);
                break;
            case 'deduplicate':
                const dedupKey = options[0];
                if (!dedupKey) throw new Error("Deduplicate key is required.");
                result = deduplicate(data, dedupKey);
                break;
            case 'validate':
                const schema = JSON.parse(fs.readFileSync(options[0], 'utf8'));
                result = data.map(item => ({ ...item, isValid: validate(item, schema) }));
                break;
            default:
                console.error(`Unknown command: ${command}`);
                return;
        }
    } catch (error) {
        console.error(`Error processing data: ${error.message}`);
        return;
    }


    try {
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
        console.log(`Processing complete. Output saved to ${outputPath}`);
    } catch (error) {
        console.error(`Error writing output file: ${error.message}`);
    }
}

main();
