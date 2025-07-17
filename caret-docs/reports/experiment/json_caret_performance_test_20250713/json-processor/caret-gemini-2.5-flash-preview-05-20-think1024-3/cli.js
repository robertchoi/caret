#!/usr/bin/env node

const {
    flattenJson,
    groupData,
    filterData,
    aggregateData,
    sortData,
    removeDuplicates,
    validateData,
    readJsonFile,
    writeJsonFile,
    readCsvFile,
    writeCsvFile
} = require('./processor');
const fs = require('fs');
const path = require('path');

function displayHelp() {
    console.log(`
Usage: node cli.js [command] [options]

Commands:
  flatten <input_file> <output_file>
    Flattens a nested JSON file.
    Example: node cli.js flatten input.json output.json

  group <input_file> <output_file> <fields...>
    Groups data by one or more fields.
    Example: node cli.js group users.json grouped_users.json department region

  filter <input_file> <output_file> <field> <operator> <value> [logic_operator] [field2] [operator2] [value2]...
    Filters data based on conditions. Supports AND/OR logic.
    Operators: =, !=, >, >=, <, <=, regex, in, !in
    Example (single): node cli.js filter products.json filtered.json price > 100
    Example (AND): node cli.js filter products.json filtered.json category = Electronics AND price > 100
    Example (OR): node cli.js filter products.json filtered.json category = Furniture OR price < 50
    Example (regex): node cli.js filter products.json filtered.json name regex "^L.*p$"

  aggregate <input_file> <output_file> <field> <operation>
    Aggregates data (sum, average, max, min, frequency).
    Operations: sum, average, max, min, frequency
    Example: node cli.js aggregate sales.json sales_summary.json value sum

  sort <input_file> <output_file> <field> <order> [field2] [order2]...
    Sorts data by one or more fields.
    Orders: asc, desc
    Example: node cli.js sort products.json sorted_products.json price desc name asc

  deduplicate <input_file> <output_file> [fields...]
    Removes duplicate records. If no fields specified, compares entire objects.
    Example: node cli.js deduplicate data.json unique_data.json id name

  validate <input_file> <schema_file>
    Validates data against a schema.
    Example: node cli.js validate users.json user_schema.json

  convert <input_file> <output_file>
    Converts between JSON and CSV formats based on file extensions.
    Example: node cli.js convert data.json data.csv
    Example: node cli.js convert data.csv data.json

  help
    Displays this help message.
`);
}

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (!command || command === 'help') {
        displayHelp();
        return;
    }

    const inputFilePath = args[1];
    const outputFilePath = args[2];

    let data;
    if (inputFilePath && fs.existsSync(inputFilePath)) {
        const inputFileExt = path.extname(inputFilePath).toLowerCase();
        if (inputFileExt === '.json') {
            data = readJsonFile(inputFilePath);
        } else if (inputFileExt === '.csv') {
            data = readCsvFile(inputFilePath);
        } else {
            console.error(`Error: Unsupported input file type for ${inputFilePath}. Only .json and .csv are supported.`);
            process.exit(1);
        }
    } else if (command !== 'validate' && command !== 'convert') { // validate and convert might not need input file to exist initially for schema/conversion
        console.error(`Error: Input file not found or not specified: ${inputFilePath}`);
        process.exit(1);
    }

    let result;
    let outputExt;

    try {
        switch (command) {
            case 'flatten':
                if (!inputFilePath || !outputFilePath) {
                    console.error("Usage: node cli.js flatten <input_file> <output_file>");
                    process.exit(1);
                }
                result = data.map(item => flattenJson(item));
                break;

            case 'group':
                if (!inputFilePath || !outputFilePath || args.length < 4) {
                    console.error("Usage: node cli.js group <input_file> <output_file> <fields...>");
                    process.exit(1);
                }
                const groupFields = args.slice(3);
                result = groupData(data, groupFields);
                break;

            case 'filter':
                if (!inputFilePath || !outputFilePath || args.length < 5) {
                    console.error("Usage: node cli.js filter <input_file> <output_file> <field> <operator> <value> [logic_operator] [field2] [operator2] [value2]...");
                    process.exit(1);
                }
                const filterArgs = args.slice(3);
                let condition;
                if (filterArgs.length === 3) { // Single condition
                    condition = { field: filterArgs[0], operator: filterArgs[1], value: parseValue(filterArgs[2]) };
                } else { // Complex conditions
                    const conditions = [];
                    let currentLogicOperator = null;
                    for (let i = 0; i < filterArgs.length; i++) {
                        const arg = filterArgs[i];
                        if (arg.toUpperCase() === 'AND' || arg.toUpperCase() === 'OR') {
                            currentLogicOperator = arg.toUpperCase();
                        } else {
                            if (i + 2 < filterArgs.length) {
                                conditions.push({
                                    field: arg,
                                    operator: filterArgs[i + 1],
                                    value: parseValue(filterArgs[i + 2])
                                });
                                i += 2;
                            }
                        }
                    }
                    if (conditions.length === 1 && !currentLogicOperator) {
                        condition = conditions[0];
                    } else if (conditions.length > 0 && currentLogicOperator) {
                        condition = { operator: currentLogicOperator, conditions: conditions };
                    } else {
                        console.error("Error: Invalid filter conditions provided.");
                        process.exit(1);
                    }
                }
                result = filterData(data, condition);
                break;

            case 'aggregate':
                if (!inputFilePath || !outputFilePath || args.length !== 5) {
                    console.error("Usage: node cli.js aggregate <input_file> <output_file> <field> <operation>");
                    process.exit(1);
                }
                const aggField = args[3];
                const aggOperation = args[4];
                result = aggregateData(data, aggField, aggOperation);
                // For aggregation, the output might not be an array of objects, so handle separately
                if (typeof result === 'object' && result !== null) {
                    // If frequency, write as JSON
                    outputExt = '.json';
                    writeJsonFile(outputFilePath, result);
                } else {
                    // For sum, avg, max, min, write as a simple JSON object
                    outputExt = '.json';
                    writeJsonFile(outputFilePath, { result: result });
                }
                console.log(`Aggregation result saved to ${outputFilePath}`);
                return; // Exit after aggregation output

            case 'sort':
                if (!inputFilePath || !outputFilePath || args.length < 4 || (args.length - 3) % 2 !== 0) {
                    console.error("Usage: node cli.js sort <input_file> <output_file> <field> <order> [field2] [order2]...");
                    process.exit(1);
                }
                const sortFields = [];
                const sortOrders = [];
                for (let i = 3; i < args.length; i += 2) {
                    sortFields.push(args[i]);
                    sortOrders.push(args[i + 1]);
                }
                result = sortData(data, sortFields, sortOrders);
                break;

            case 'deduplicate':
                if (!inputFilePath || !outputFilePath) {
                    console.error("Usage: node cli.js deduplicate <input_file> <output_file> [fields...]");
                    process.exit(1);
                }
                const deduplicateFields = args.slice(3);
                result = removeDuplicates(data, deduplicateFields.length > 0 ? deduplicateFields : undefined);
                break;

            case 'validate':
                if (args.length !== 3) {
                    console.error("Usage: node cli.js validate <input_file> <schema_file>");
                    process.exit(1);
                }
                const schemaFilePath = args[2];
                if (!fs.existsSync(schemaFilePath)) {
                    console.error(`Error: Schema file not found: ${schemaFilePath}`);
                    process.exit(1);
                }
                const schema = readJsonFile(schemaFilePath);
                const isValid = data.every(item => validateData(item, schema));
                console.log(`Validation Result: ${isValid ? 'PASSED' : 'FAILED'}`);
                // No output file for validate, just print result
                return;

            case 'convert':
                if (!inputFilePath || !outputFilePath) {
                    console.error("Usage: node cli.js convert <input_file> <output_file>");
                    process.exit(1);
                }
                const inputExt = path.extname(inputFilePath).toLowerCase();
                outputExt = path.extname(outputFilePath).toLowerCase();

                if (inputExt === '.json' && outputExt === '.csv') {
                    data = readJsonFile(inputFilePath);
                    writeCsvFile(outputFilePath, data);
                    console.log(`Converted ${inputFilePath} to ${outputFilePath}`);
                } else if (inputExt === '.csv' && outputExt === '.json') {
                    data = readCsvFile(inputFilePath);
                    writeJsonFile(outputFilePath, data);
                    console.log(`Converted ${inputFilePath} to ${outputFilePath}`);
                } else {
                    console.error("Error: Unsupported conversion. Only JSON to CSV or CSV to JSON is supported.");
                    process.exit(1);
                }
                return; // Exit after conversion

            default:
                console.error(`Unknown command: ${command}`);
                displayHelp();
                process.exit(1);
        }

        // Determine output file type and write
        outputExt = path.extname(outputFilePath).toLowerCase();
        if (outputExt === '.json') {
            writeJsonFile(outputFilePath, result);
        } else if (outputExt === '.csv') {
            writeCsvFile(outputFilePath, result);
        } else {
            console.error(`Error: Unsupported output file type for ${outputFilePath}. Only .json and .csv are supported.`);
            process.exit(1);
        }
        console.log(`Operation '${command}' completed. Result saved to ${outputFilePath}`);

    } catch (error) {
        console.error(`An error occurred during '${command}' operation:`, error.message);
        process.exit(1);
    }
}

function parseValue(value) {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (!isNaN(Number(value)) && !isNaN(parseFloat(value))) return Number(value);
    // Handle array values for 'in' and '!in' operators
    if (value.startsWith('[') && value.endsWith(']')) {
        try {
            return JSON.parse(value);
        } catch (e) {
            // If it's not valid JSON array, treat as string
            return value;
        }
    }
    return value;
}

if (require.main === module) {
    main();
}
