const fs = require('fs');
const path = require('path');
const { flatten, group, filter, aggregate, sort, deduplicate, validate } = require('./processor');

function main() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error('Usage: node cli.js <command> <filepath> [options]');
        return;
    }

    const command = args[0];
    const filepath = path.resolve(args[1]);
    const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

    let result;
    switch (command) {
        case 'flatten':
            result = flatten(data);
            break;
        case 'group':
            result = group(data, args[2]);
            break;
        case 'filter':
            const conditions = JSON.parse(args[2]);
            result = filter(data, conditions);
            break;
        case 'aggregate':
            result = aggregate(data, args[2], args[3]);
            break;
        case 'sort':
            const criteria = JSON.parse(args[2]);
            result = sort(data, criteria);
            break;
        case 'deduplicate':
            result = deduplicate(data, args[2]);
            break;
        default:
            console.error(`Unknown command: ${command}`);
            return;
    }

    console.log(JSON.stringify(result, null, 2));
}

main();
