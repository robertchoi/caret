#!/usr/bin/env node

const JsonProcessor = require('./processor');
const fs = require('fs');
const path = require('path');

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const inputFilePath = args[1];
  const outputFilePath = args[2];
  const options = args.slice(3);

  if (!command || !inputFilePath || !outputFilePath) {
    console.log(`
Usage:
  node cli.js <command> <inputFilePath> <outputFilePath> [options]

Commands:
  flatten <input.json> <output.json>
  group <input.json> <output.json> <field1> [field2...]
  filter <input.json> <output.json> <conditionFnString>
  aggregate <input.json> <output.json> <field>
  frequency <input.json> <output.json> <field> [--case-insensitive]
  sort <input.json> <output.json> <field1:order1> [field2:order2...]
  deduplicate <input.json> <output.json> [--fields field1,field2...]
  validate <input.json> <output.json> <schemaFilePath>
  json-to-csv <input.json> <output.csv> [--no-header]
  csv-to-json <input.csv> <output.json> [--no-header]

Examples:
  node cli.js flatten sample.json flattened.json
  node cli.js group sample.json grouped.json department location
  node cli.js filter sample.json filtered.json "item => item.age > 30 && item.department === 'IT'"
  node cli.js aggregate sample.json aggregated.json age
  node cli.js frequency sample.json frequency.json department --case-insensitive
  node cli.js sort sample.json sorted.json "age:desc" "name:asc"
  node cli.js deduplicate sample.json deduplicated.json --fields id,name
  node cli.js validate sample.json validated.json "{\\"name\\":\\"string\\",\\"age\\":\\"number\\"}"
  node cli.js json-to-csv sample.json sample.csv
  node cli.js csv-to-json sample.csv sample.json --no-header
    `);
    process.exit(1);
  }

  try {
    let data;
    if (command !== 'csv-to-json') { // csv-to-json은 JSON이 아닌 CSV를 읽어야 함
      data = await JsonProcessor.readJsonFile(inputFilePath);
    }

    let result;
    switch (command) {
      case 'flatten':
        result = Array.isArray(data) ? data.map(item => JsonProcessor.flattenJson(item)) : JsonProcessor.flattenJson(data);
        await JsonProcessor.writeJsonFile(outputFilePath, result);
        break;
      case 'group':
        const groupFields = options;
        result = JsonProcessor.groupData(data, groupFields);
        await JsonProcessor.writeJsonFile(outputFilePath, result);
        break;
      case 'filter':
        const conditionFnString = options[0];
        const conditionFn = eval(conditionFnString); // 위험할 수 있으므로 주의
        result = JsonProcessor.filterData(data, conditionFn);
        await JsonProcessor.writeJsonFile(outputFilePath, result);
        break;
      case 'aggregate':
        const aggregateField = options[0];
        result = JsonProcessor.aggregateData(data, aggregateField);
        await JsonProcessor.writeJsonFile(outputFilePath, result);
        break;
      case 'frequency':
        const frequencyField = options[0];
        const caseInsensitive = options.includes('--case-insensitive');
        result = JsonProcessor.analyzeFrequency(data, frequencyField, !caseInsensitive);
        await JsonProcessor.writeJsonFile(outputFilePath, result);
        break;
      case 'sort':
        const sortConditions = options.map(opt => {
          const [field, order] = opt.split(':');
          return { field, order: order || 'asc' };
        });
        result = JsonProcessor.sortData(data, sortConditions);
        await JsonProcessor.writeJsonFile(outputFilePath, result);
        break;
      case 'deduplicate':
        const deduplicateFieldsIndex = options.indexOf('--fields');
        let deduplicateFields = undefined;
        if (deduplicateFieldsIndex !== -1) {
          deduplicateFields = options[deduplicateFieldsIndex + 1].split(',');
        }
        result = JsonProcessor.deduplicateData(data, deduplicateFields);
        await JsonProcessor.writeJsonFile(outputFilePath, result);
        break;
      case 'validate':
        const schemaFilePath = options[0];
        const schema = await JsonProcessor.readJsonFile(schemaFilePath);
        result = JsonProcessor.validateData(data, schema);
        await JsonProcessor.writeJsonFile(outputFilePath, result);
        break;
      case 'json-to-csv':
        const includeHeaderJsonToCsv = !options.includes('--no-header');
        await JsonProcessor.writeCsvFile(outputFilePath, data, includeHeaderJsonToCsv);
        break;
      case 'csv-to-json':
        const hasHeaderCsvToJson = !options.includes('--no-header');
        result = await JsonProcessor.readCsvFile(inputFilePath, hasHeaderCsvToJson);
        await JsonProcessor.writeJsonFile(outputFilePath, result);
        break;
      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
    console.log(`Command '${command}' executed successfully. Result saved to ${outputFilePath}`);
  } catch (error) {
    console.error(`Error executing command '${command}':`, error.message);
    process.exit(1);
  }
}

main();
