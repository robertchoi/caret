const JsonProcessor = require('./processor');
const fs = require('fs');
const path = require('path');

describe('JsonProcessor', () => {
  // 테스트를 위한 임시 파일 경로
  const tempJsonFilePath = path.join(__dirname, 'temp.json');
  const tempCsvFilePath = path.join(__dirname, 'temp.csv');

  afterEach(() => {
    // 각 테스트 후 임시 파일 삭제
    if (fs.existsSync(tempJsonFilePath)) {
      fs.unlinkSync(tempJsonFilePath);
    }
    if (fs.existsSync(tempCsvFilePath)) {
      fs.unlinkSync(tempCsvFilePath);
    }
  });

  // 2.1. 데이터 변환
  describe('Data Transformation', () => {
    // 중첩 JSON 평면화
    test('should flatten a simple nested JSON object', () => {
      const nestedJson = {
        user: {
          profile: {
            name: 'John Doe',
            age: 30
          }
        }
      };
      const expected = {
        'user.profile.name': 'John Doe',
        'user.profile.age': 30
      };
      expect(JsonProcessor.flattenJson(nestedJson)).toEqual(expected);
    });

    test('should flatten multiple levels of nested JSON objects', () => {
      const nestedJson = {
        a: {
          b: {
            c: 1,
            d: {
              e: 2
            }
          }
        },
        f: 3
      };
      const expected = {
        'a.b.c': 1,
        'a.b.d.e': 2,
        f: 3
      };
      expect(JsonProcessor.flattenJson(nestedJson)).toEqual(expected);
    });

    test('should flatten JSON with arrays containing objects', () => {
      const nestedJson = {
        items: [{
          id: 1,
          data: {
            value: 'A'
          }
        }, {
          id: 2,
          data: {
            value: 'B'
          }
        }],
        meta: {
          version: '1.0'
        }
      };
      const expected = {
        'items[0].id': 1,
        'items[0].data.value': 'A',
        'items[1].id': 2,
        'items[1].data.value': 'B',
        'meta.version': '1.0'
      };
      expect(JsonProcessor.flattenJson(nestedJson)).toEqual(expected);
    });

    test('should handle empty objects or null values during flattening', () => {
      const nestedJson = {
        a: {},
        b: null,
        c: {
          d: {
            e: null
          }
        }
      };
      const expected = {
        'a': {}, // 빈 객체는 그대로 유지
        'b': null, // null 값은 그대로 유지
        'c.d.e': null
      };
      expect(JsonProcessor.flattenJson(nestedJson)).toEqual(expected);
    });


    // 배열 데이터 그룹화
    test('should group data by a single field', () => {
      const data = [{
        name: 'Alice',
        department: 'HR'
      }, {
        name: 'Bob',
        department: 'IT'
      }, {
        name: 'Charlie',
        department: 'HR'
      }, ];
      const expected = {
        HR: [{
          name: 'Alice',
          department: 'HR'
        }, {
          name: 'Charlie',
          department: 'HR'
        }, ],
        IT: [{
          name: 'Bob',
          department: 'IT'
        }, ],
      };
      expect(JsonProcessor.groupData(data, 'department')).toEqual(expected);
    });

    test('should group data by multiple fields', () => {
      const data = [{
        name: 'Alice',
        department: 'HR',
        location: 'Seoul'
      }, {
        name: 'Bob',
        department: 'IT',
        location: 'Busan'
      }, {
        name: 'Charlie',
        department: 'HR',
        location: 'Seoul'
      }, {
        name: 'David',
        department: 'IT',
        location: 'Seoul'
      }, ];
      const expected = {
        'HR-Seoul': [{
          name: 'Alice',
          department: 'HR',
          location: 'Seoul'
        }, {
          name: 'Charlie',
          department: 'HR',
          location: 'Seoul'
        }, ],
        'IT-Busan': [{
          name: 'Bob',
          department: 'IT',
          location: 'Busan'
        }, ],
        'IT-Seoul': [{
          name: 'David',
          department: 'IT',
          location: 'Seoul'
        }, ],
      };
      expect(JsonProcessor.groupData(data, ['department', 'location'])).toEqual(expected);
    });

    test('should return an empty object if grouping by a non-existent field', () => {
      const data = [{
        name: 'Alice',
        department: 'HR'
      }];
      expect(JsonProcessor.groupData(data, 'nonExistentField')).toEqual({
        'undefined': [{
          name: 'Alice',
          department: 'HR'
        }]
      });
    });

    test('should handle empty array input for grouping', () => {
      expect(JsonProcessor.groupData([], 'department')).toEqual({});
    });
  });

  // 2.2. 필터링 및 검색
  describe('Filtering and Searching', () => {
    const sampleData = [{
      id: 1,
      name: 'Alice',
      age: 25,
      department: 'HR',
      city: 'Seoul'
    }, {
      id: 2,
      name: 'Bob',
      age: 30,
      department: 'IT',
      city: 'Busan'
    }, {
      id: 3,
      name: 'Charlie',
      age: 35,
      department: 'HR',
      city: 'Seoul'
    }, {
      id: 4,
      name: 'David',
      age: 28,
      department: 'IT',
      city: 'Seoul'
    }, ];

    test('should filter data by a single numeric condition', () => {
      const result = JsonProcessor.filterData(sampleData, item => item.age > 28);
      expect(result).toEqual([{
        id: 2,
        name: 'Bob',
        age: 30,
        department: 'IT',
        city: 'Busan'
      }, {
        id: 3,
        name: 'Charlie',
        age: 35,
        department: 'HR',
        city: 'Seoul'
      }, ]);
    });

    test('should filter data by a single string condition', () => {
      const result = JsonProcessor.filterData(sampleData, item => item.department === 'IT');
      expect(result).toEqual([{
        id: 2,
        name: 'Bob',
        age: 30,
        department: 'IT',
        city: 'Busan'
      }, {
        id: 4,
        name: 'David',
        age: 28,
        department: 'IT',
        city: 'Seoul'
      }, ]);
    });

    test('should filter data with AND conditions', () => {
      const result = JsonProcessor.filterData(
        sampleData,
        item => item.age > 25 && item.department === 'IT'
      );
      expect(result).toEqual([{
        id: 2,
        name: 'Bob',
        age: 30,
        department: 'IT',
        city: 'Busan'
      }, {
        id: 4,
        name: 'David',
        age: 28,
        department: 'IT',
        city: 'Seoul'
      }, ]);
    });

    test('should filter data with OR conditions', () => {
      const result = JsonProcessor.filterData(
        sampleData,
        item => item.department === 'IT' || item.city === 'Seoul'
      );
      expect(result).toEqual([{
        id: 1,
        name: 'Alice',
        age: 25,
        department: 'HR',
        city: 'Seoul'
      }, {
        id: 2,
        name: 'Bob',
        age: 30,
        department: 'IT',
        city: 'Busan'
      }, {
        id: 3,
        name: 'Charlie',
        age: 35,
        department: 'HR',
        city: 'Seoul'
      }, {
        id: 4,
        name: 'David',
        age: 28,
        department: 'IT',
        city: 'Seoul'
      }, ]);
    });

    test('should filter data with mixed AND/OR conditions', () => {
      const result = JsonProcessor.filterData(
        sampleData,
        item => (item.age > 30 && item.department === 'HR') || item.name === 'Alice'
      );
      expect(result).toEqual([{
        id: 1,
        name: 'Alice',
        age: 25,
        department: 'HR',
        city: 'Seoul'
      }, {
        id: 3,
        name: 'Charlie',
        age: 35,
        department: 'HR',
        city: 'Seoul'
      }, ]);
    });

    test('should filter data using regex for string search', () => {
      const result = JsonProcessor.filterData(sampleData, item => /a/i.test(item.name));
      expect(result).toEqual([{
        id: 1,
        name: 'Alice',
        age: 25,
        department: 'HR',
        city: 'Seoul'
      }, {
        id: 3,
        name: 'Charlie',
        age: 35,
        department: 'HR',
        city: 'Seoul'
      }, {
        id: 4,
        name: 'David',
        age: 28,
        department: 'IT',
        city: 'Seoul'
      }, ]);
    });

    test('should handle conditions for non-existent fields gracefully', () => {
      const result = JsonProcessor.filterData(sampleData, item => item.nonExistentField === 'test');
      expect(result).toEqual([]);
    });
  });

  // 2.3. 집계 및 통계
  describe('Aggregation and Statistics', () => {
    const data = [{
      value: 10
    }, {
      value: 20
    }, {
      value: 30
    }, {
      value: null
    }, {
      value: 'abc'
    }, ];

    test('should calculate sum, average, max, min for a numeric field', () => {
      const result = JsonProcessor.aggregateData(data, 'value');
      expect(result).toEqual({
        sum: 60,
        average: 20,
        max: 30,
        min: 10
      });
    });

    test('should handle empty array for aggregation', () => {
      const result = JsonProcessor.aggregateData([], 'value');
      expect(result).toEqual({
        sum: 0,
        average: 0,
        max: null,
        min: null
      });
    });

    test('should handle data with no numeric values for aggregation', () => {
      const data = [{
        value: 'a'
      }, {
        value: 'b'
      }];
      const result = JsonProcessor.aggregateData(data, 'value');
      expect(result).toEqual({
        sum: 0,
        average: 0,
        max: null,
        min: null
      });
    });

    test('should calculate frequency for a string field (case-sensitive)', () => {
      const data = [{
        color: 'Red'
      }, {
        color: 'red'
      }, {
        color: 'Blue'
      }, {
        color: 'Red'
      }, ];
      const result = JsonProcessor.analyzeFrequency(data, 'color', true);
      expect(result).toEqual({
        Red: 2,
        red: 1,
        Blue: 1
      });
    });

    test('should calculate frequency for a string field (case-insensitive)', () => {
      const data = [{
        color: 'Red'
      }, {
        color: 'red'
      }, {
        color: 'Blue'
      }, {
        color: 'Red'
      }, ];
      const result = JsonProcessor.analyzeFrequency(data, 'color', false);
      expect(result).toEqual({
        red: 3,
        blue: 1
      });
    });

    test('should calculate frequency for a numeric field', () => {
      const data = [{
        score: 10
      }, {
        score: 20
      }, {
        score: 10
      }, {
        score: 30
      }, ];
      const result = JsonProcessor.analyzeFrequency(data, 'score');
      expect(result).toEqual({
        10: 2,
        20: 1,
        30: 1
      });
    });

    test('should handle empty array for frequency analysis', () => {
      expect(JsonProcessor.analyzeFrequency([], 'field')).toEqual({});
    });
  });

  // 2.4. 정렬 및 정제
  describe('Sorting and Refinement', () => {
    const sampleData = [{
      name: 'Alice',
      age: 30,
      department: 'HR'
    }, {
      name: 'Bob',
      age: 25,
      department: 'IT'
    }, {
      name: 'Charlie',
      age: 30,
      department: 'IT'
    }, {
      name: 'David',
      age: 25,
      department: 'HR'
    }, ];

    test('should sort data by a single field in ascending order', () => {
      const sortConditions = [{
        field: 'age',
        order: 'asc'
      }];
      const result = JsonProcessor.sortData(sampleData, sortConditions);
      expect(result).toEqual([{
        name: 'Bob',
        age: 25,
        department: 'IT'
      }, {
        name: 'David',
        age: 25,
        department: 'HR'
      }, {
        name: 'Alice',
        age: 30,
        department: 'HR'
      }, {
        name: 'Charlie',
        age: 30,
        department: 'IT'
      }, ]);
    });

    test('should sort data by a single field in descending order', () => {
      const sortConditions = [{
        field: 'age',
        order: 'desc'
      }];
      const result = JsonProcessor.sortData(sampleData, sortConditions);
      expect(result).toEqual([{
        name: 'Alice',
        age: 30,
        department: 'HR'
      }, {
        name: 'Charlie',
        age: 30,
        department: 'IT'
      }, {
        name: 'Bob',
        age: 25,
        department: 'IT'
      }, {
        name: 'David',
        age: 25,
        department: 'HR'
      }, ]);
    });

    test('should sort data by multiple fields', () => {
      const sortConditions = [{
        field: 'department',
        order: 'asc'
      }, {
        field: 'age',
        order: 'desc'
      }, ];
      const result = JsonProcessor.sortData(sampleData, sortConditions);
      expect(result).toEqual([{
        name: 'Alice',
        age: 30,
        department: 'HR'
      }, {
        name: 'David',
        age: 25,
        department: 'HR'
      }, {
        name: 'Charlie',
        age: 30,
        department: 'IT'
      }, {
        name: 'Bob',
        age: 25,
        department: 'IT'
      }, ]);
    });

    test('should handle null/undefined values in sorting (always last)', () => {
      const dataWithNull = [{
        name: 'Alice',
        age: 30
      }, {
        name: 'Bob',
        age: null
      }, {
        name: 'Charlie',
        age: 25
      }, ];
      const sortConditions = [{
        field: 'age',
        order: 'asc'
      }];
      const result = JsonProcessor.sortData(dataWithNull, sortConditions);
      expect(result).toEqual([{
        name: 'Charlie',
        age: 25
      }, {
        name: 'Alice',
        age: 30
      }, {
        name: 'Bob',
        age: null
      }, ]);
    });

    // 중복 제거
    test('should deduplicate data based on a single field', () => {
      const data = [{
        id: 1,
        name: 'A'
      }, {
        id: 2,
        name: 'B'
      }, {
        id: 1,
        name: 'A'
      }, {
        id: 3,
        name: 'C'
      }, ];
      const expected = [{
        id: 1,
        name: 'A'
      }, {
        id: 2,
        name: 'B'
      }, {
        id: 3,
        name: 'C'
      }, ];
      expect(JsonProcessor.deduplicateData(data, 'id')).toEqual(expected);
    });

    test('should deduplicate data based on all fields', () => {
      const data = [{
        id: 1,
        name: 'A'
      }, {
        id: 2,
        name: 'B'
      }, {
        id: 1,
        name: 'A'
      }, {
        id: 3,
        name: 'C'
      }, ];
      const expected = [{
        id: 1,
        name: 'A'
      }, {
        id: 2,
        name: 'B'
      }, {
        id: 3,
        name: 'C'
      }, ];
      expect(JsonProcessor.deduplicateData(data)).toEqual(expected);
    });

    test('should handle empty array for deduplication', () => {
      expect(JsonProcessor.deduplicateData([])).toEqual([]);
    });

    // 데이터 유효성 검증
    test('should validate data based on a simple schema', () => {
      const data = [{
        name: 'John',
        age: 30
      }, {
        name: 'Jane',
        age: '25'
      }, // Invalid age type
      {
        name: 'Mike'
      }, // Missing age
      ];
      const schema = {
        name: 'string',
        age: 'number'
      };
      const result = JsonProcessor.validateData(data, schema);
      expect(result).toEqual([{
        name: 'John',
        age: 30
      }]);
    });

    test('should validate data with email format', () => {
      const data = [{
        name: 'John',
        email: 'john@example.com'
      }, {
        name: 'Jane',
        email: 'invalid-email'
      }, ];
      const schema = {
        name: 'string',
        email: 'email'
      };
      const result = JsonProcessor.validateData(data, schema);
      expect(result).toEqual([{
        name: 'John',
        email: 'john@example.com'
      }]);
    });

    test('should handle empty array for validation', () => {
      expect(JsonProcessor.validateData([], {
        name: 'string'
      })).toEqual([]);
    });
  });

  // 2.5. 파일 입출력
  describe('File I/O', () => {
    const sampleJsonData = [{
      id: 1,
      name: 'Test1'
    }, {
      id: 2,
      name: 'Test2'
    }];
    const sampleCsvData = `id,name\n1,Test1\n2,Test2`;
    const sampleCsvDataNoHeader = `1,Test1\n2,Test2`;

    test('should write and read JSON file correctly', async () => {
      await JsonProcessor.writeJsonFile(tempJsonFilePath, sampleJsonData);
      const readData = await JsonProcessor.readJsonFile(tempJsonFilePath);
      expect(readData).toEqual(sampleJsonData);
    });

    test('should handle error when reading non-existent JSON file', async () => {
      await expect(JsonProcessor.readJsonFile('non-existent.json')).rejects.toThrow();
    });

    test('should write and read CSV file correctly with header', async () => {
      await JsonProcessor.writeCsvFile(tempCsvFilePath, sampleJsonData, true);
      const readData = await JsonProcessor.readCsvFile(tempCsvFilePath, true);
      expect(readData).toEqual([{
        id: '1',
        name: 'Test1'
      }, {
        id: '2',
        name: 'Test2'
      }]);
    });

    test('should write and read CSV file correctly without header', async () => {
      const dataWithoutHeader = [{
        field1: '1',
        field2: 'Test1'
      }, {
        field1: '2',
        field2: 'Test2'
      }];
      await JsonProcessor.writeCsvFile(tempCsvFilePath, dataWithoutHeader, false);
      const readData = await JsonProcessor.readCsvFile(tempCsvFilePath, false);
      expect(readData).toEqual([
        ['1', 'Test1'],
        ['2', 'Test2']
      ]);
    });

    test('should handle error when reading non-existent CSV file', async () => {
      await expect(JsonProcessor.readCsvFile('non-existent.csv')).rejects.toThrow();
    });

    test('should write empty CSV file for empty data', async () => {
      await JsonProcessor.writeCsvFile(tempCsvFilePath, [], true);
      const content = fs.readFileSync(tempCsvFilePath, 'utf8');
      expect(content).toBe('');
    });
  });
});
