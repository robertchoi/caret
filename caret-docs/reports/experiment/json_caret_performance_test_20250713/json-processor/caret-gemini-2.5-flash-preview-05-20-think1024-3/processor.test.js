const { flattenJson, groupData, filterData, aggregateData, sortData, removeDuplicates, validateData, readJsonFile, writeJsonFile, readCsvFile, writeCsvFile } = require('./processor');
const fs = require('fs');
const path = require('path');

// Helper function to create a temporary file for testing file operations
const createTempFile = (filename, content) => {
    const filePath = path.join(__dirname, filename);
    fs.writeFileSync(filePath, content);
    return filePath;
};

// Helper function to clean up temporary files
const cleanupTempFile = (filename) => {
    const filePath = path.join(__dirname, filename);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

describe('JSON Processor Core Logic Tests', () => {

    // Test for flattenJson
    describe('flattenJson', () => {
        test('should flatten a simple nested JSON object', () => {
            const data = { user: { profile: { name: "John Doe", age: 30 } } };
            const expected = { "user.profile.name": "John Doe", "user.profile.age": 30 };
            expect(flattenJson(data)).toEqual(expected);
        });

        test('should flatten a deeply nested JSON object', () => {
            const data = { a: { b: { c: { d: 1 } } } };
            const expected = { "a.b.c.d": 1 };
            expect(flattenJson(data)).toEqual(expected);
        });

        test('should handle arrays within nested objects by keeping them as is', () => {
            const data = { user: { hobbies: ["reading", "coding"] } };
            const expected = { "user.hobbies": ["reading", "coding"] };
            expect(flattenJson(data)).toEqual(expected);
        });

        test('should return an empty object for an empty input object', () => {
            expect(flattenJson({})).toEqual({});
        });

        test('should handle null and undefined values', () => {
            const data = { a: null, b: { c: undefined } };
            const expected = { "a": null, "b.c": undefined };
            expect(flattenJson(data)).toEqual(expected);
        });
    });

    // Test for groupData
    describe('groupData', () => {
        const users = [
            { name: "Alice", department: "HR", region: "East" },
            { name: "Bob", department: "IT", region: "West" },
            { name: "Charlie", department: "HR", region: "East" },
            { name: "David", department: "IT", region: "North" },
        ];

        test('should group data by a single field', () => {
            const expected = {
                "HR": [
                    { name: "Alice", department: "HR", region: "East" },
                    { name: "Charlie", department: "HR", region: "East" },
                ],
                "IT": [
                    { name: "Bob", department: "IT", region: "West" },
                    { name: "David", department: "IT", region: "North" },
                ],
            };
            expect(groupData(users, 'department')).toEqual(expected);
        });

        test('should group data by multiple fields', () => {
            const expected = {
                "HR-East": [
                    { name: "Alice", department: "HR", region: "East" },
                    { name: "Charlie", department: "HR", region: "East" },
                ],
                "IT-West": [
                    { name: "Bob", department: "IT", region: "West" },
                ],
                "IT-North": [
                    { name: "David", department: "IT", region: "North" },
                ],
            };
            expect(groupData(users, ['department', 'region'])).toEqual(expected);
        });

        test('should handle empty data array', () => {
            expect(groupData([], 'department')).toEqual({});
        });

        test('should handle missing grouping field', () => {
            const data = [{ name: "Alice" }];
            expect(groupData(data, 'department')).toEqual({ "undefined": [{ name: "Alice" }] });
        });
    });

    // Test for filterData
    describe('filterData', () => {
        const products = [
            { id: 1, name: "Laptop", category: "Electronics", price: 1200 },
            { id: 2, name: "Keyboard", category: "Electronics", price: 75 },
            { id: 3, name: "Mouse", category: "Electronics", price: 25 },
            { id: 4, name: "Desk", category: "Furniture", price: 300 },
            { id: 5, name: "Chair", category: "Furniture", price: 150 },
        ];

        test('should filter data with a single condition', () => {
            const condition = { field: 'category', operator: '=', value: 'Electronics' };
            const expected = [
                { id: 1, name: "Laptop", category: "Electronics", price: 1200 },
                { id: 2, name: "Keyboard", category: "Electronics", price: 75 },
                { id: 3, name: "Mouse", category: "Electronics", price: 25 },
            ];
            expect(filterData(products, condition)).toEqual(expected);
        });

        test('should filter data with AND conditions', () => {
            const condition = {
                operator: 'AND',
                conditions: [
                    { field: 'category', operator: '=', value: 'Electronics' },
                    { field: 'price', operator: '>', value: 50 }
                ]
            };
            const expected = [
                { id: 1, name: "Laptop", category: "Electronics", price: 1200 },
                { id: 2, name: "Keyboard", category: "Electronics", price: 75 },
            ];
            expect(filterData(products, condition)).toEqual(expected);
        });

        test('should filter data with OR conditions', () => {
            const condition = {
                operator: 'OR',
                conditions: [
                    { field: 'category', operator: '=', value: 'Furniture' },
                    { field: 'price', operator: '<', value: 50 }
                ]
            };
            const expected = [
                { id: 3, name: "Mouse", category: "Electronics", price: 25 },
                { id: 4, name: "Desk", category: "Furniture", price: 300 },
                { id: 5, name: "Chair", category: "Furniture", price: 150 },
            ];
            expect(filterData(products, condition)).toEqual(expected);
        });

        test('should filter data with regex condition', () => {
            const condition = { field: 'name', operator: 'regex', value: '^L.*p$' };
            const expected = [
                { id: 1, name: "Laptop", category: "Electronics", price: 1200 },
            ];
            expect(filterData(products, condition)).toEqual(expected);
        });

        test('should handle empty data array', () => {
            const condition = { field: 'category', operator: '=', value: 'Electronics' };
            expect(filterData([], condition)).toEqual([]);
        });

        test('should handle no matching data', () => {
            const condition = { field: 'category', operator: '=', value: 'Books' };
            expect(filterData(products, condition)).toEqual([]);
        });
    });

    // Test for aggregateData
    describe('aggregateData', () => {
        const sales = [
            { item: "A", value: 10, quantity: 2 },
            { item: "B", value: 20, quantity: 1 },
            { item: "A", value: 15, quantity: 3 },
            { item: "C", value: 5, quantity: 1 },
        ];

        test('should calculate sum', () => {
            expect(aggregateData(sales, 'value', 'sum')).toBe(50);
        });

        test('should calculate average', () => {
            expect(aggregateData(sales, 'value', 'average')).toBe(12.5);
        });

        test('should calculate max', () => {
            expect(aggregateData(sales, 'value', 'max')).toBe(20);
        });

        test('should calculate min', () => {
            expect(aggregateData(sales, 'value', 'min')).toBe(5);
        });

        test('should calculate frequency', () => {
            expect(aggregateData(sales, 'item', 'frequency')).toEqual({ A: 2, B: 1, C: 1 });
        });

        test('should handle empty data array for numeric aggregation', () => {
            expect(aggregateData([], 'value', 'sum')).toBe(0);
            expect(aggregateData([], 'value', 'average')).toBe(0);
            expect(aggregateData([], 'value', 'max')).toBe(null);
            expect(aggregateData([], 'value', 'min')).toBe(null);
        });

        test('should handle empty data array for frequency aggregation', () => {
            expect(aggregateData([], 'item', 'frequency')).toEqual({});
        });

        test('should handle non-numeric data for numeric aggregation', () => {
            const mixedData = [{ value: 10 }, { value: "abc" }, { value: 20 }];
            expect(aggregateData(mixedData, 'value', 'sum')).toBe(30); // "abc" should be ignored
        });
    });

    // Test for sortData
    describe('sortData', () => {
        const items = [
            { name: "Banana", price: 10, category: "Fruit" },
            { name: "Apple", price: 5, category: "Fruit" },
            { name: "Carrot", price: 3, category: "Vegetable" },
            { name: "Orange", price: 10, category: "Fruit" },
        ];

        test('should sort by a single field in ascending order', () => {
            const expected = [
                { name: "Apple", price: 5, category: "Fruit" },
                { name: "Banana", price: 10, category: "Fruit" },
                { name: "Carrot", price: 3, category: "Vegetable" },
                { name: "Orange", price: 10, category: "Fruit" },
            ];
            expect(sortData(items, 'name', 'asc')).toEqual(expected);
        });

        test('should sort by a single field in descending order', () => {
            const expected = [
                { name: "Orange", price: 10, category: "Fruit" },
                { name: "Carrot", price: 3, category: "Vegetable" },
                { name: "Banana", price: 10, category: "Fruit" },
                { name: "Apple", price: 5, category: "Fruit" },
            ];
            expect(sortData(items, 'name', 'desc')).toEqual(expected);
        });

        test('should sort by multiple fields (primary asc, secondary asc)', () => {
            const expected = [
                { name: "Apple", price: 5, category: "Fruit" },
                { name: "Banana", price: 10, category: "Fruit" },
                { name: "Orange", price: 10, category: "Fruit" },
                { name: "Carrot", price: 3, category: "Vegetable" },
            ];
            expect(sortData(items, ['category', 'name'], ['asc', 'asc'])).toEqual(expected);
        });

        test('should sort by multiple fields (primary desc, secondary asc)', () => {
            const expected = [
                { name: "Carrot", price: 3, category: "Vegetable" },
                { name: "Apple", price: 5, category: "Fruit" },
                { name: "Banana", price: 10, category: "Fruit" },
                { name: "Orange", price: 10, category: "Fruit" },
            ];
            expect(sortData(items, ['category', 'name'], ['desc', 'asc'])).toEqual(expected);
        });

        test('should handle empty data array', () => {
            expect(sortData([], 'name', 'asc')).toEqual([]);
        });
    });

    // Test for removeDuplicates
    describe('removeDuplicates', () => {
        const data = [
            { id: 1, name: "A" },
            { id: 2, name: "B" },
            { id: 1, name: "A" },
            { id: 3, name: "C" },
            { id: 2, name: "B" },
        ];

        test('should remove duplicates based on a single field', () => {
            const expected = [
                { id: 1, name: "A" },
                { id: 2, name: "B" },
                { id: 3, name: "C" },
            ];
            expect(removeDuplicates(data, 'id')).toEqual(expected);
        });

        test('should remove duplicates based on multiple fields', () => {
            const dataWithMoreDuplicates = [
                { id: 1, name: "A", value: 10 },
                { id: 2, name: "B", value: 20 },
                { id: 1, name: "A", value: 10 },
                { id: 3, name: "C", value: 30 },
                { id: 2, name: "B", value: 20 },
                { id: 1, name: "A", value: 15 }, // Different value, so not a duplicate by id+name+value
            ];
            const expected = [
                { id: 1, name: "A", value: 10 },
                { id: 2, name: "B", value: 20 },
                { id: 3, name: "C", value: 30 },
                { id: 1, name: "A", value: 15 },
            ];
            expect(removeDuplicates(dataWithMoreDuplicates, ['id', 'name', 'value'])).toEqual(expected);
        });

        test('should remove duplicates based on entire object if no fields specified', () => {
            const expected = [
                { id: 1, name: "A" },
                { id: 2, name: "B" },
                { id: 3, name: "C" },
            ];
            expect(removeDuplicates(data)).toEqual(expected);
        });

        test('should handle empty data array', () => {
            expect(removeDuplicates([])).toEqual([]);
        });
    });

    // Test for validateData (simple implementation)
    describe('validateData', () => {
        const schema = {
            name: { type: 'string', required: true },
            age: { type: 'number', required: false },
            email: { type: 'string', required: true, regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
        };

        test('should validate valid data', () => {
            const data = { name: "John Doe", age: 30, email: "john@example.com" };
            expect(validateData(data, schema)).toBe(true);
        });

        test('should invalidate data with missing required field', () => {
            const data = { age: 30, email: "john@example.com" };
            expect(validateData(data, schema)).toBe(false);
        });

        test('should invalidate data with incorrect type', () => {
            const data = { name: "John Doe", age: "thirty", email: "john@example.com" };
            expect(validateData(data, schema)).toBe(false);
        });

        test('should invalidate data with invalid regex pattern', () => {
            const data = { name: "John Doe", age: 30, email: "invalid-email" };
            expect(validateData(data, schema)).toBe(false);
        });

        test('should validate data with optional fields missing', () => {
            const data = { name: "John Doe", email: "john@example.com" };
            expect(validateData(data, schema)).toBe(true);
        });
    });

    // Test for file operations
    describe('File Operations', () => {
        const jsonTestFile = 'test.json';
        const csvTestFile = 'test.csv';

        afterEach(() => {
            cleanupTempFile(jsonTestFile);
            cleanupTempFile(csvTestFile);
        });

        // Test for readJsonFile
        test('should read a JSON file correctly', () => {
            const content = JSON.stringify([{ id: 1, name: "Test" }]);
            createTempFile(jsonTestFile, content);
            expect(readJsonFile(path.join(__dirname, jsonTestFile))).toEqual([{ id: 1, name: "Test" }]);
        });

        test('should throw error for non-existent JSON file', () => {
            expect(() => readJsonFile('nonexistent.json')).toThrow();
        });

        // Test for writeJsonFile
        test('should write data to a JSON file correctly', () => {
            const data = [{ id: 1, name: "Test" }];
            writeJsonFile(path.join(__dirname, jsonTestFile), data);
            const readContent = fs.readFileSync(path.join(__dirname, jsonTestFile), 'utf8');
            expect(JSON.parse(readContent)).toEqual(data);
        });

        // Test for readCsvFile
        test('should read a CSV file correctly', () => {
            const content = "id,name,age\n1,John,30\n2,Jane,25";
            createTempFile(csvTestFile, content);
            const expected = [
                { id: '1', name: 'John', age: '30' },
                { id: '2', name: 'Jane', age: '25' },
            ];
            expect(readCsvFile(path.join(__dirname, csvTestFile))).toEqual(expected);
        });

        test('should throw error for non-existent CSV file', () => {
            expect(() => readCsvFile('nonexistent.csv')).toThrow();
        });

        // Test for writeCsvFile
        test('should write data to a CSV file correctly', () => {
            const data = [
                { id: 1, name: "John", age: 30 },
                { id: 2, name: "Jane", age: 25 },
            ];
            writeCsvFile(path.join(__dirname, csvTestFile), data);
            const readContent = fs.readFileSync(path.join(__dirname, csvTestFile), 'utf8');
            const expectedContent = "id,name,age\n1,John,30\n2,Jane,25";
            expect(readContent.trim()).toEqual(expectedContent.trim());
        });

        test('should handle writing empty array to CSV', () => {
            writeCsvFile(path.join(__dirname, csvTestFile), []);
            const readContent = fs.readFileSync(path.join(__dirname, csvTestFile), 'utf8');
            expect(readContent.trim()).toEqual("");
        });

        test('should handle writing data with inconsistent keys to CSV', () => {
            const data = [
                { id: 1, name: "John" },
                { id: 2, age: 25 },
            ];
            writeCsvFile(path.join(__dirname, csvTestFile), data);
            const readContent = fs.readFileSync(path.join(__dirname, csvTestFile), 'utf8');
            const expectedContent = "id,name,age\n1,John,\n2,,25";
            expect(readContent.trim()).toEqual(expectedContent.trim());
        });
    });
});
