const JsonProcessor = require('./processor');
const fs = require('fs');
const path = require('path');

describe('JsonProcessor', () => {
  let processor;
  let sampleData;

  beforeEach(() => {
    processor = new JsonProcessor();
    sampleData = [
      { "id": 1, "name": "Alice", "age": 30, "city": "New York", "department": "Sales", "salary": 60000, "isActive": true },
      { "id": 2, "name": "Bob", "age": 24, "city": "London", "department": "Marketing", "salary": 45000, "isActive": false },
      { "id": 3, "name": "Charlie", "age": 35, "city": "New York", "department": "Sales", "salary": 70000, "isActive": true },
      { "id": 4, "name": "David", "age": 29, "city": "Paris", "department": "Engineering", "salary": 80000, "isActive": true },
      { "id": 5, "name": "Eve", "age": 24, "city": "London", "department": "Marketing", "salary": 50000, "isActive": false },
      { "id": 6, "name": "Frank", "age": 40, "city": "New York", "department": "Engineering", "salary": 90000, "isActive": true }
    ];
  });

  // 2.1. 데이터 변환 테스트
  describe('Data Transformation', () => {
    test('should flatten nested JSON objects', () => {
      const nestedJson = {
        user: {
          profile: {
            name: "John",
            age: 30
          },
          contact: {
            email: "john@example.com"
          }
        },
        address: {
          city: "Seoul",
          zip: "12345"
        }
      };
      const flattened = processor.flattenJson(nestedJson);
      expect(flattened).toEqual({
        "user.profile.name": "John",
        "user.profile.age": 30,
        "user.contact.email": "john@example.com",
        "address.city": "Seoul",
        "address.zip": "12345"
      });
    });

    test('should group data by a single key', () => {
      const grouped = processor.groupData(sampleData, ['department']);
      expect(grouped).toEqual({
        "Sales": {
          "items": [
            { "id": 1, "name": "Alice", "age": 30, "city": "New York", "department": "Sales", "salary": 60000, "isActive": true },
            { "id": 3, "name": "Charlie", "age": 35, "city": "New York", "department": "Sales", "salary": 70000, "isActive": true }
          ]
        },
        "Marketing": {
          "items": [
            { "id": 2, "name": "Bob", "age": 24, "city": "London", "department": "Marketing", "salary": 45000, "isActive": false },
            { "id": 5, "name": "Eve", "age": 24, "city": "London", "department": "Marketing", "salary": 50000, "isActive": false }
          ]
        },
        "Engineering": {
          "items": [
            { "id": 4, "name": "David", "age": 29, "city": "Paris", "department": "Engineering", "salary": 80000, "isActive": true },
            { "id": 6, "name": "Frank", "age": 40, "city": "New York", "department": "Engineering", "salary": 90000, "isActive": true }
          ]
        }
      });
    });

    test('should group data by multiple keys', () => {
      const grouped = processor.groupData(sampleData, ['city', 'department']);
      expect(grouped).toEqual({
        "New York": {
          "Sales": {
            "items": [
              { "id": 1, "name": "Alice", "age": 30, "city": "New York", "department": "Sales", "salary": 60000, "isActive": true },
              { "id": 3, "name": "Charlie", "age": 35, "city": "New York", "department": "Sales", "salary": 70000, "isActive": true }
            ]
          },
          "Engineering": {
            "items": [
              { "id": 6, "name": "Frank", "age": 40, "city": "New York", "department": "Engineering", "salary": 90000, "isActive": true }
            ]
          }
        },
        "London": {
          "Marketing": {
            "items": [
              { "id": 2, "name": "Bob", "age": 24, "city": "London", "department": "Marketing", "salary": 45000, "isActive": false },
              { "id": 5, "name": "Eve", "age": 24, "city": "London", "department": "Marketing", "salary": 50000, "isActive": false }
            ]
          }
        },
        "Paris": {
          "Engineering": {
            "items": [
              { "id": 4, "name": "David", "age": 29, "city": "Paris", "department": "Engineering", "salary": 80000, "isActive": true }
            ]
          }
        }
      });
    });

    test('should throw error if grouping key not found', () => {
      expect(() => processor.groupData(sampleData, ['nonExistentKey'])).toThrow("Key 'nonExistentKey' not found in some items for grouping.");
    });
  });

  // 2.2. 필터링 및 검색 테스트
  describe('Filtering and Searching', () => {
    test('should filter data with single condition (eq)', () => {
      const conditions = [{ field: 'city', operator: 'eq', value: 'New York', type: 'string' }];
      const filtered = processor.filterData(sampleData, conditions);
      expect(filtered.length).toBe(3);
      expect(filtered.every(item => item.city === 'New York')).toBe(true);
    });

    test('should filter data with AND condition', () => {
      const conditions = [
        { field: 'department', operator: 'eq', value: 'Sales', type: 'string' },
        { field: 'age', operator: 'gt', value: 30, type: 'number' }
      ];
      const filtered = processor.filterData(sampleData, conditions, 'AND');
      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toBe('Charlie');
    });

    test('should filter data with OR condition', () => {
      const conditions = [
        { field: 'city', operator: 'eq', value: 'Paris', type: 'string' },
        { field: 'department', operator: 'eq', value: 'Marketing', type: 'string' }
      ];
      const filtered = processor.filterData(sampleData, conditions, 'OR');
      expect(filtered.length).toBe(3);
      expect(filtered.some(item => item.name === 'David')).toBe(true);
      expect(filtered.some(item => item.name === 'Bob')).toBe(true);
      expect(filtered.some(item => item.name === 'Eve')).toBe(true);
    });

    test('should filter data with regex condition', () => {
      const conditions = [{ field: 'name', operator: 'regex', value: '^A.*e$', type: 'regex' }];
      const filtered = processor.filterData(sampleData, conditions);
      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toBe('Alice');
    });

    test('should filter data with number range (gt and lt)', () => {
      const conditions = [
        { field: 'age', operator: 'gt', value: 25, type: 'number' },
        { field: 'age', operator: 'lt', value: 35, type: 'number' }
      ];
      const filtered = processor.filterData(sampleData, conditions, 'AND');
      expect(filtered.length).toBe(2);
      expect(filtered.some(item => item.name === 'Alice')).toBe(true);
      expect(filtered.some(item => item.name === 'David')).toBe(true);
    });

    test('should return all data if no conditions provided', () => {
      const filtered = processor.filterData(sampleData, []);
      expect(filtered).toEqual(sampleData);
    });
  });

  // 2.3. 집계 및 통계 테스트
  describe('Aggregation and Statistics', () => {
    test('should calculate sum of a numeric field', () => {
      expect(processor.sum(sampleData, 'salary')).toBe(395000);
    });

    test('should calculate average of a numeric field', () => {
      expect(processor.average(sampleData, 'salary')).toBe(395000 / 6);
    });

    test('should calculate max of a numeric field', () => {
      expect(processor.max(sampleData, 'salary')).toBe(90000);
    });

    test('should calculate min of a numeric field', () => {
      expect(processor.min(sampleData, 'salary')).toBe(45000);
    });

    test('should return 0 for sum/average and undefined for max/min if no numeric values', () => {
      const dataWithNoNumbers = [{ a: 'x' }, { a: 'y' }];
      expect(processor.sum(dataWithNoNumbers, 'a')).toBe(0);
      expect(processor.average(dataWithNoNumbers, 'a')).toBe(0);
      expect(processor.max(dataWithNoNumbers, 'a')).toBeUndefined();
      expect(processor.min(dataWithNoNumbers, 'a')).toBeUndefined();
    });

    test('should calculate frequency of a field', () => {
      const frequency = processor.frequency(sampleData, 'department');
      expect(frequency).toEqual({
        "Sales": 2,
        "Marketing": 2,
        "Engineering": 2
      });
    });
  });

  // 2.4. 정렬 및 정제 테스트
  describe('Sorting and Refinement', () => {
    test('should sort data by single field ascending', () => {
      const sorted = processor.sortData(sampleData, [{ field: 'age', order: 'asc' }]);
      expect(sorted.map(item => item.age)).toEqual([24, 24, 29, 30, 35, 40]);
    });

    test('should sort data by single field descending', () => {
      const sorted = processor.sortData(sampleData, [{ field: 'age', order: 'desc' }]);
      expect(sorted.map(item => item.age)).toEqual([40, 35, 30, 29, 24, 24]);
    });

    test('should sort data by multiple fields', () => {
      const sorted = processor.sortData(sampleData, [
        { field: 'department', order: 'asc' },
        { field: 'salary', order: 'desc' }
      ]);
      expect(sorted.map(item => ({ department: item.department, salary: item.salary }))).toEqual([
        { department: 'Engineering', salary: 90000 },
        { department: 'Engineering', salary: 80000 },
        { department: 'Marketing', salary: 50000 },
        { department: 'Marketing', salary: 45000 },
        { department: 'Sales', salary: 70000 },
        { department: 'Sales', salary: 60000 }
      ]);
    });

    test('should remove duplicates based on a single field', () => {
      const dataWithDuplicates = [
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
        { id: 1, name: 'A' },
        { id: 3, name: 'C' }
      ];
      const unique = processor.removeDuplicates(dataWithDuplicates, ['id']);
      expect(unique.length).toBe(3);
      expect(unique).toEqual([
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
        { id: 3, name: 'C' }
      ]);
    });

    test('should remove duplicates based on multiple fields', () => {
      const dataWithDuplicates = [
        { id: 1, name: 'A', value: 10 },
        { id: 2, name: 'B', value: 20 },
        { id: 1, name: 'A', value: 10 },
        { id: 1, name: 'A', value: 15 }, // Different value, so not a duplicate by (id, name, value)
        { id: 3, name: 'C', value: 30 }
      ];
      const unique = processor.removeDuplicates(dataWithDuplicates, ['id', 'name', 'value']);
      expect(unique.length).toBe(4);
      expect(unique).toEqual([
        { id: 1, name: 'A', value: 10 },
        { id: 2, name: 'B', value: 20 },
        { id: 1, name: 'A', value: 15 },
        { id: 3, name: 'C', value: 30 }
      ]);
    });

    test('should validate data with required fields', () => {
      const valid = processor.validateData(sampleData, ['id', 'name', 'age']);
      expect(valid).toBe(true);

      const invalidData = [
        { id: 1, name: 'Alice' },
        { id: 2, age: 24 }
      ];
      const invalid = processor.validateData(invalidData, ['id', 'name', 'age']);
      expect(invalid).toBe(false);
    });
  });

  // 2.5. 파일 입출력 테스트
  describe('File I/O', () => {
    const testJsonFilePath = path.join(__dirname, 'test_output.json');
    const testCsvFilePath = path.join(__dirname, 'test_output.csv');

    afterEach(() => {
      if (fs.existsSync(testJsonFilePath)) {
        fs.unlinkSync(testJsonFilePath);
      }
      if (fs.existsSync(testCsvFilePath)) {
        fs.unlinkSync(testCsvFilePath);
      }
    });

    test('should write and read JSON file', () => {
      const dataToWrite = [{ a: 1, b: 'test' }, { c: 2, d: 'data' }];
      processor.writeJsonFile(testJsonFilePath, dataToWrite);
      const readData = processor.readJsonFile(testJsonFilePath);
      expect(readData).toEqual(dataToWrite);
    });

    test('should write and read CSV file', () => {
      const dataToWrite = [
        { name: 'Alice', age: 30, city: 'New York' },
        { name: 'Bob', age: 24, city: 'London' }
      ];
      processor.writeCsvFile(testCsvFilePath, dataToWrite);
      const readData = processor.readCsvFile(testCsvFilePath);
      expect(readData).toEqual([
        { name: 'Alice', age: 30, city: 'New York' },
        { name: 'Bob', age: 24, city: 'London' }
      ]);
    });

    test('should handle empty CSV data write', () => {
      processor.writeCsvFile(testCsvFilePath, []);
      const content = fs.readFileSync(testCsvFilePath, 'utf8');
      expect(content).toBe('');
    });

    test('should throw error when reading non-existent JSON file', () => {
      expect(() => processor.readJsonFile('non_existent.json')).toThrow('Error reading JSON file');
    });

    test('should throw error when reading non-existent CSV file', () => {
      expect(() => processor.readCsvFile('non_existent.csv')).toThrow('Error reading CSV file');
    });
  });
});
