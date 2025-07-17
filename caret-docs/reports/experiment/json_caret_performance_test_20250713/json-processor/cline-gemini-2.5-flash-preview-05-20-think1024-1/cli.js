#!/usr/bin/env node

const JsonProcessor = require('./processor');
const fs = require('fs');
const path = require('path');

const processor = new JsonProcessor();

function displayHelp() {
  console.log(`
Usage: json-processor <command> [options]

Commands:
  flatten <inputFile> <outputFile>
    - Flattens a nested JSON file into a flat JSON file.

  group <inputFile> <outputFile> <keys...>
    - Groups data in a JSON file by one or more specified keys.
    - Example: group data.json output.json department city

  filter <inputFile> <outputFile> <conditions...> [--operator <AND|OR>]
    - Filters data in a JSON file based on complex conditions.
    - Conditions format: field:operator:value[:type]
      - operator: eq (equal), ne (not equal), gt (greater than), lt (less than), ge (greater than or equal), le (less than or equal), regex (regular expression)
      - type: string, number, regex (default: string)
    - Example: filter data.json output.json age:gt:30:number department:eq:Sales --operator AND

  aggregate <inputFile> <field> <function>
    - Performs aggregation (sum, avg, max, min, frequency) on a numeric field.
    - function: sum, avg, max, min, frequency
    - Example: aggregate data.json salary sum

  sort <inputFile> <outputFile> <sortBys...>
    - Sorts data in a JSON file by one or more fields.
    - sortBys format: field[:order]
      - order: asc (ascending), desc (descending) (default: asc)
    - Example: sort data.json output.json age:desc name:asc

  deduplicate <inputFile> <outputFile> <fields...>
    - Removes duplicate entries from a JSON file based on specified fields.
    - Example: deduplicate data.json output.json id name

  validate <inputFile> <requiredFields...>
    - Validates data in a JSON file based on required fields.
    - Example: validate data.json id name age

  read-csv <inputFile> <outputFile>
    - Reads a CSV file and converts it to JSON.

  write-csv <inputFile> <outputFile>
    - Reads a JSON file and converts it to CSV.

Options:
  --help, -h  Display this help message.
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    displayHelp();
    return;
  }

  const command = args[0];
  let inputFile, outputFile, field, func, keys, conditions, sortBys, requiredFields;
  let logicalOperator = 'AND';

  try {
    switch (command) {
      case 'flatten':
        [inputFile, outputFile] = args.slice(1);
        if (!inputFile || !outputFile) throw new Error('Usage: flatten <inputFile> <outputFile>');
        const flatData = processor.flattenJson(processor.readJsonFile(inputFile));
        processor.writeJsonFile(outputFile, flatData);
        console.log(`Flattened data saved to ${outputFile}`);
        break;

      case 'group':
        inputFile = args[1];
        outputFile = args[2];
        keys = args.slice(3);
        if (!inputFile || !outputFile || keys.length === 0) throw new Error('Usage: group <inputFile> <outputFile> <keys...>');
        const dataToGroup = processor.readJsonFile(inputFile);
        const groupedData = processor.groupData(dataToGroup, keys);
        processor.writeJsonFile(outputFile, groupedData);
        console.log(`Grouped data saved to ${outputFile}`);
        break;

      case 'filter':
        inputFile = args[1];
        outputFile = args[2];
        const operatorIndex = args.indexOf('--operator');
        if (operatorIndex !== -1) {
          logicalOperator = args[operatorIndex + 1];
          conditions = args.slice(3, operatorIndex);
        } else {
          conditions = args.slice(3);
        }

        if (!inputFile || !outputFile || conditions.length === 0) throw new Error('Usage: filter <inputFile> <outputFile> <conditions...> [--operator <AND|OR>]');

        const parsedConditions = conditions.map(cond => {
          const parts = cond.split(':');
          if (parts.length < 3) throw new Error(`Invalid condition format: ${cond}. Expected field:operator:value[:type]`);
          return {
            field: parts[0],
            operator: parts[1],
            value: parts[2],
            type: parts[3] || 'string' // Default to string
          };
        });

        const dataToFilter = processor.readJsonFile(inputFile);
        const filteredData = processor.filterData(dataToFilter, parsedConditions, logicalOperator);
        processor.writeJsonFile(outputFile, filteredData);
        console.log(`Filtered data saved to ${outputFile}`);
        break;

      case 'aggregate':
        [inputFile, field, func] = args.slice(1);
        if (!inputFile || !field || !func) throw new Error('Usage: aggregate <inputFile> <field> <function>');
        const dataToAggregate = processor.readJsonFile(inputFile);
        let result;
        switch (func) {
          case 'sum':
            result = processor.sum(dataToAggregate, field);
            break;
          case 'avg':
            result = processor.average(dataToAggregate, field);
            break;
          case 'max':
            result = processor.max(dataToAggregate, field);
            break;
          case 'min':
            result = processor.min(dataToAggregate, field);
            break;
          case 'frequency':
            result = processor.frequency(dataToAggregate, field);
            break;
          default:
            throw new Error(`Unknown aggregation function: ${func}`);
        }
        console.log(`Aggregation result for field '${field}' with function '${func}':`, result);
        break;

      case 'sort':
        inputFile = args[1];
        outputFile = args[2];
        sortBys = args.slice(3).map(s => {
          const parts = s.split(':');
          return { field: parts[0], order: parts[1] || 'asc' };
        });
        if (!inputFile || !outputFile || sortBys.length === 0) throw new Error('Usage: sort <inputFile> <outputFile> <sortBys...>');
        const dataToSort = processor.readJsonFile(inputFile);
        const sortedData = processor.sortData(dataToSort, sortBys);
        processor.writeJsonFile(outputFile, sortedData);
        console.log(`Sorted data saved to ${outputFile}`);
        break;

      case 'deduplicate':
        inputFile = args[1];
        outputFile = args[2];
        fields = args.slice(3);
        if (!inputFile || !outputFile || fields.length === 0) throw new Error('Usage: deduplicate <inputFile> <outputFile> <fields...>');
        const dataToDeduplicate = processor.readJsonFile(inputFile);
        const deduplicatedData = processor.removeDuplicates(dataToDeduplicate, fields);
        processor.writeJsonFile(outputFile, deduplicatedData);
        console.log(`Deduplicated data saved to ${outputFile}`);
        break;

      case 'validate':
        inputFile = args[1];
        requiredFields = args.slice(2);
        if (!inputFile || requiredFields.length === 0) throw new Error('Usage: validate <inputFile> <requiredFields...>');
        const dataToValidate = processor.readJsonFile(inputFile);
        const isValid = processor.validateData(dataToValidate, requiredFields);
        console.log(`Data validation result: ${isValid ? 'Valid' : 'Invalid'}`);
        break;

      case 'read-csv':
        [inputFile, outputFile] = args.slice(1);
        if (!inputFile || !outputFile) throw new Error('Usage: read-csv <inputFile> <outputFile>');
        const jsonDataFromCsv = processor.readCsvFile(inputFile);
        processor.writeJsonFile(outputFile, jsonDataFromCsv);
        console.log(`CSV data from ${inputFile} converted to JSON and saved to ${outputFile}`);
        break;

      case 'write-csv':
        [inputFile, outputFile] = args.slice(1);
        if (!inputFile || !outputFile) throw new Error('Usage: write-csv <inputFile> <outputFile>');
        const dataToConvertToJson = processor.readJsonFile(inputFile);
        processor.writeCsvFile(outputFile, dataToConvertToJson);
        console.log(`JSON data from ${inputFile} converted to CSV and saved to ${outputFile}`);
        break;

      default:
        console.error(`Unknown command: ${command}`);
        displayHelp();
        break;
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    displayHelp();
  }
}

main();
