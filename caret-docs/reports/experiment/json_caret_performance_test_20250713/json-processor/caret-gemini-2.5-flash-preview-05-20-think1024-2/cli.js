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
Usage: node cli.js <command> [options]

Commands:
  flatten         Flatten a nested JSON object.
  group           Group array data by specified fields.
  filter          Filter data based on complex conditions.
  aggregate       Perform aggregation operations on numeric data.
  sort            Sort data by multiple fields.
  deduplicate     Remove duplicate records.
  validate        Validate data against a schema.
  json-to-csv     Convert JSON data to CSV format.
  csv-to-json     Convert CSV data to JSON format.

Options:
  --input <file>    Input file path (JSON or CSV).
  --output <file>   Output file path (JSON or CSV).
  --field <name>    Field name for operations (e.g., aggregate, deduplicate).
  --fields <names>  Comma-separated field names for operations (e.g., group, sort).
  --condition <json> JSON string for filter conditions.
  --operation <type> Aggregation operation (sum, avg, max, min, count).
  --sort-by <json>  JSON string for sort criteria (e.g., '[{"field":"age","order":"asc"}]').
  --schema <file>   JSON schema file path for validation.
  --help            Display this help message.

Examples:
  node cli.js flatten --input data.json --output flattened.json
  node cli.js group --input users.json --output grouped_users.json --fields "department,location"
  node cli.js filter --input data.json --output filtered.json --condition '{"type":"AND","conditions":[{"field":"age", "operator":">", "value":30}, {"field":"city", "operator":"=", "value":"New York"}]}'
  node cli.js aggregate --input sales.json --field "amount" --operation "sum"
  node cli.js sort --input products.json --output sorted_products.json --sort-by '[{"field":"price","order":"asc"},{"field":"name","order":"desc"}]'
  node cli.js deduplicate --input records.json --output unique_records.json --field "email"
  node cli.js validate --input data.json --output valid_data.json --schema schema.json
  node cli.js json-to-csv --input data.json --output data.csv
  node cli.js csv-to-json --input data.csv --output data.json
`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const options = {};

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.substring(2);
      const value = args[i + 1];
      options[key] = value;
      i++;
    }
  }

  if (options.help || !command) {
    displayHelp();
    return;
  }

  let inputData;
  if (options.input) {
    const inputFileExtension = path.extname(options.input).toLowerCase();
    if (inputFileExtension === '.json') {
      inputData = readJsonFile(options.input);
    } else if (inputFileExtension === '.csv') {
      inputData = readCsvFile(options.input);
    } else {
      console.error('Error: Unsupported input file format. Only .json and .csv are supported.');
      process.exit(1);
    }
  }

  let outputData;

  try {
    switch (command) {
      case 'flatten':
        if (!inputData) throw new Error('Input data is required for flatten command.');
        outputData = Array.isArray(inputData) ? inputData.map(item => flattenJson(item)) : flattenJson(inputData);
        break;
      case 'group':
        if (!inputData || !options.fields) throw new Error('Input data and fields are required for group command.');
        const groupFields = options.fields.split(',').map(f => f.trim());
        outputData = groupData(inputData, groupFields);
        break;
      case 'filter':
        if (!inputData || !options.condition) throw new Error('Input data and condition are required for filter command.');
        const condition = JSON.parse(options.condition);
        outputData = filterData(inputData, condition);
        break;
      case 'aggregate':
        if (!inputData || !options.field || !options.operation) throw new Error('Input data, field, and operation are required for aggregate command.');
        outputData = aggregateData(inputData, options.field, options.operation);
        break;
      case 'sort':
        if (!inputData || !options['sort-by']) throw new Error('Input data and sort-by criteria are required for sort command.');
        const sortBys = JSON.parse(options['sort-by']);
        outputData = sortData(inputData, sortBys);
        break;
      case 'deduplicate':
        if (!inputData) throw new Error('Input data is required for deduplicate command.');
        outputData = removeDuplicates(inputData, options.field); // field는 선택 사항
        break;
      case 'validate':
        if (!inputData || !options.schema) throw new Error('Input data and schema file are required for validate command.');
        const schema = readJsonFile(options.schema);
        outputData = validateData(inputData, schema);
        break;
      case 'json-to-csv':
        if (!inputData) throw new Error('Input JSON data is required for json-to-csv command.');
        if (!options.output || !options.output.endsWith('.csv')) throw new Error('Output file must be a .csv file for json-to-csv command.');
        writeCsvFile(options.output, inputData);
        console.log(`Successfully converted JSON to CSV: ${options.output}`);
        return;
      case 'csv-to-json':
        if (!options.input || !options.input.endsWith('.csv')) throw new Error('Input file must be a .csv file for csv-to-json command.');
        if (!options.output || !options.output.endsWith('.json')) throw new Error('Output file must be a .json file for csv-to-json command.');
        outputData = readCsvFile(options.input);
        writeJsonFile(options.output, outputData);
        console.log(`Successfully converted CSV to JSON: ${options.output}`);
        return;
      default:
        console.error(`Error: Unknown command "${command}"`);
        displayHelp();
        process.exit(1);
    }

    if (options.output && outputData !== undefined) {
      const outputFileExtension = path.extname(options.output).toLowerCase();
      if (outputFileExtension === '.json') {
        writeJsonFile(options.output, outputData);
        console.log(`Operation successful. Result saved to ${options.output}`);
      } else {
        console.error('Error: Unsupported output file format. Only .json is supported for general operations.');
        process.exit(1);
      }
    } else if (outputData !== undefined) {
      console.log(JSON.stringify(outputData, null, 2));
    }

  } catch (error) {
    console.error(`Error executing command "${command}": ${error.message}`);
    process.exit(1);
  }
}

main();
