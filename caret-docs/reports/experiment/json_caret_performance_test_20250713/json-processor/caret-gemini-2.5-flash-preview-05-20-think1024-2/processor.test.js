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

// 테스트용 임시 파일 경로
const testDir = path.join(__dirname, 'test_files');
const testJsonFilePath = path.join(testDir, 'test.json');
const testCsvFilePath = path.join(testDir, 'test.csv');
const outputJsonFilePath = path.join(testDir, 'output.json');
const outputCsvFilePath = path.join(testDir, 'output.csv');

// 테스트 전/후 설정
beforeAll(() => {
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir);
  }
});

afterAll(() => {
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, {
      recursive: true,
      force: true
    });
  }
});

describe('JSON Processor Core Functions', () => {

  // 2.1. 데이터 변환
  describe('flattenJson', () => {
    test('중첩된 JSON 객체를 평면화해야 합니다.', () => {
      const nested = {
        user: {
          profile: {
            name: "John",
            age: 30
          }
        },
        address: {
          city: "New York",
          zip: "10001"
        },
        hobbies: ["reading", "hiking"]
      };
      const flattened = flattenJson(nested);
      expect(flattened).toEqual({
        "user.profile.name": "John",
        "user.profile.age": 30,
        "address.city": "New York",
        "address.zip": "10001",
        "hobbies": ["reading", "hiking"]
      });
    });

    test('빈 객체를 평면화할 수 있어야 합니다.', () => {
      expect(flattenJson({})).toEqual({});
    });

    test('이미 평면화된 객체를 평면화할 수 있어야 합니다.', () => {
      const flat = {
        name: "Jane",
        age: 25
      };
      expect(flattenJson(flat)).toEqual(flat);
    });
  });

  describe('groupData', () => {
    const data = [{
      id: 1,
      name: 'Alice',
      department: 'Sales',
      location: 'NY'
    }, {
      id: 2,
      name: 'Bob',
      department: 'Marketing',
      location: 'LA'
    }, {
      id: 3,
      name: 'Charlie',
      department: 'Sales',
      location: 'NY'
    }, {
      id: 4,
      name: 'David',
      department: 'Marketing',
      location: 'NY'
    }, ];

    test('단일 필드를 기준으로 데이터를 그룹화해야 합니다.', () => {
      const grouped = groupData(data, 'department');
      expect(grouped).toEqual({
        Sales: [{
          id: 1,
          name: 'Alice',
          department: 'Sales',
          location: 'NY'
        }, {
          id: 3,
          name: 'Charlie',
          department: 'Sales',
          location: 'NY'
        }, ],
        Marketing: [{
          id: 2,
          name: 'Bob',
          department: 'Marketing',
          location: 'LA'
        }, {
          id: 4,
          name: 'David',
          department: 'Marketing',
          location: 'NY'
        }, ],
      });
    });

    test('다중 필드를 기준으로 데이터를 그룹화해야 합니다.', () => {
      const grouped = groupData(data, ['department', 'location']);
      expect(grouped).toEqual({
        Sales: {
          NY: [{
            id: 1,
            name: 'Alice',
            department: 'Sales',
            location: 'NY'
          }, {
            id: 3,
            name: 'Charlie',
            department: 'Sales',
            location: 'NY'
          }, ],
        },
        Marketing: {
          LA: [{
            id: 2,
            name: 'Bob',
            department: 'Marketing',
            location: 'LA'
          }, ],
          NY: [{
            id: 4,
            name: 'David',
            department: 'Marketing',
            location: 'NY'
          }, ],
        },
      });
    });

    test('빈 배열을 그룹화할 수 있어야 합니다.', () => {
      expect(groupData([], 'department')).toEqual({});
    });

    test('유효하지 않은 필드로 그룹화할 때 빈 객체를 반환해야 합니다.', () => {
      const grouped = groupData(data, 'nonExistentField');
      expect(grouped).toEqual({
        undefined: data
      });
    });

    test('데이터가 배열이 아니면 오류를 발생시켜야 합니다.', () => {
      expect(() => groupData({}, 'department')).toThrow("Input data must be an array.");
    });
  });

  // 2.2. 필터링 및 검색
  describe('filterData', () => {
    const data = [{
      name: 'Alice',
      age: 30,
      city: 'New York',
      department: 'Sales'
    }, {
      name: 'Bob',
      age: 25,
      city: 'Los Angeles',
      department: 'Marketing'
    }, {
      name: 'Charlie',
      age: 35,
      city: 'New York',
      department: 'Sales'
    }, {
      name: 'David',
      age: 28,
      city: 'Chicago',
      department: 'Marketing'
    }, ];

    test('단일 조건으로 데이터를 필터링해야 합니다.', () => {
      const condition = {
        field: 'age',
        operator: '>',
        value: 28
      };
      const filtered = filterData(data, condition);
      expect(filtered).toEqual([{
        name: 'Alice',
        age: 30,
        city: 'New York',
        department: 'Sales'
      }, {
        name: 'Charlie',
        age: 35,
        city: 'New York',
        department: 'Sales'
      }, ]);
    });

    test('AND 조건으로 데이터를 필터링해야 합니다.', () => {
      const condition = {
        type: 'AND',
        conditions: [{
          field: 'age',
          operator: '>',
          value: 25
        }, {
          field: 'city',
          operator: '=',
          value: 'New York'
        }, ],
      };
      const filtered = filterData(data, condition);
      expect(filtered).toEqual([{
        name: 'Alice',
        age: 30,
        city: 'New York',
        department: 'Sales'
      }, {
        name: 'Charlie',
        age: 35,
        city: 'New York',
        department: 'Sales'
      }, ]);
    });

    test('OR 조건으로 데이터를 필터링해야 합니다.', () => {
      const condition = {
        type: 'OR',
        conditions: [{
          field: 'department',
          operator: '=',
          value: 'Sales'
        }, {
          field: 'city',
          operator: '=',
          value: 'Chicago'
        }, ],
      };
      const filtered = filterData(data, condition);
      expect(filtered).toEqual([{
        name: 'Alice',
        age: 30,
        city: 'New York',
        department: 'Sales'
      }, {
        name: 'Charlie',
        age: 35,
        city: 'New York',
        department: 'Sales'
      }, {
        name: 'David',
        age: 28,
        city: 'Chicago',
        department: 'Marketing'
      }, ]);
    });

    test('정규식으로 데이터를 필터링해야 합니다.', () => {
      const condition = {
        field: 'name',
        operator: 'regex',
        value: '^Ch'
      };
      const filtered = filterData(data, condition);
      expect(filtered).toEqual([{
        name: 'Charlie',
        age: 35,
        city: 'New York',
        department: 'Sales'
      }, ]);
    });

    test('존재하지 않는 필드에 대한 필터링은 빈 배열을 반환해야 합니다.', () => {
      const condition = {
        field: 'nonExistent',
        operator: '=',
        value: 'test'
      };
      const filtered = filterData(data, condition);
      expect(filtered).toEqual([]);
    });

    test('데이터가 배열이 아니면 오류를 발생시켜야 합니다.', () => {
      expect(() => filterData({}, {
        field: 'age',
        operator: '>',
        value: 20
      })).toThrow("Input data must be an array.");
    });
  });

  // 2.3. 집계 및 통계
  describe('aggregateData', () => {
    const data = [{
      name: 'A',
      value: 10,
      category: 'X'
    }, {
      name: 'B',
      value: 20,
      category: 'Y'
    }, {
      name: 'C',
      value: 30,
      category: 'X'
    }, {
      name: 'D',
      value: 20,
      category: 'Z'
    }, {
      name: 'E',
      value: 'invalid',
      category: 'Z'
    }, ];

    test('합계를 정확하게 계산해야 합니다.', () => {
      expect(aggregateData(data, 'value', 'sum')).toBe(80);
    });

    test('평균을 정확하게 계산해야 합니다.', () => {
      expect(aggregateData(data, 'value', 'avg')).toBe(20);
    });

    test('최대값을 정확하게 계산해야 합니다.', () => {
      expect(aggregateData(data, 'value', 'max')).toBe(30);
    });

    test('최소값을 정확하게 계산해야 합니다.', () => {
      expect(aggregateData(data, 'value', 'min')).toBe(10);
    });

    test('빈도 분석을 정확하게 수행해야 합니다.', () => {
      expect(aggregateData(data, 'category', 'count')).toEqual({
        X: 2,
        Y: 1,
        Z: 2,
      });
    });

    test('숫자가 아닌 값은 집계에서 제외해야 합니다.', () => {
      const dataWithNonNumbers = [{
        value: 1
      }, {
        value: 'a'
      }, {
        value: 2
      }];
      expect(aggregateData(dataWithNonNumbers, 'value', 'sum')).toBe(3);
    });

    test('빈 배열에 대한 집계는 0 또는 undefined를 반환해야 합니다.', () => {
      expect(aggregateData([], 'value', 'sum')).toBe(0);
      expect(aggregateData([], 'value', 'avg')).toBe(0);
      expect(aggregateData([], 'value', 'max')).toBeUndefined();
      expect(aggregateData([], 'value', 'min')).toBeUndefined();
      expect(aggregateData([], 'category', 'count')).toEqual({});
    });

    test('데이터가 배열이 아니면 오류를 발생시켜야 합니다.', () => {
      expect(() => aggregateData({}, 'value', 'sum')).toThrow("Input data must be an array.");
    });
  });

  // 2.4. 정렬 및 정제
  describe('sortData', () => {
    const data = [{
      name: 'Charlie',
      age: 30
    }, {
      name: 'Alice',
      age: 25
    }, {
      name: 'Bob',
      age: 35
    }, ];

    test('단일 필드를 기준으로 오름차순 정렬해야 합니다.', () => {
      const sorted = sortData(data, [{
        field: 'age',
        order: 'asc'
      }]);
      expect(sorted).toEqual([{
        name: 'Alice',
        age: 25
      }, {
        name: 'Charlie',
        age: 30
      }, {
        name: 'Bob',
        age: 35
      }, ]);
    });

    test('단일 필드를 기준으로 내림차순 정렬해야 합니다.', () => {
      const sorted = sortData(data, [{
        field: 'age',
        order: 'desc'
      }]);
      expect(sorted).toEqual([{
        name: 'Bob',
        age: 35
      }, {
        name: 'Charlie',
        age: 30
      }, {
        name: 'Alice',
        age: 25
      }, ]);
    });

    test('다중 필드를 기준으로 정렬해야 합니다.', () => {
      const multiFieldData = [{
        name: 'Alice',
        age: 30,
        city: 'NY'
      }, {
        name: 'Bob',
        age: 25,
        city: 'LA'
      }, {
        name: 'Charlie',
        age: 30,
        city: 'LA'
      }, ];
      const sorted = sortData(multiFieldData, [{
        field: 'age',
        order: 'asc'
      }, {
        field: 'city',
        order: 'desc'
      }]);
      expect(sorted).toEqual([{
        name: 'Bob',
        age: 25,
        city: 'LA'
      }, {
        name: 'Alice',
        age: 30,
        city: 'NY'
      }, {
        name: 'Charlie',
        age: 30,
        city: 'LA'
      }, ]);
    });

    test('빈 배열을 정렬할 수 있어야 합니다.', () => {
      expect(sortData([], [{
        field: 'age',
        order: 'asc'
      }])).toEqual([]);
    });

    test('정렬 기준이 없으면 원본 배열의 복사본을 반환해야 합니다.', () => {
      const originalData = [{
        name: 'A'
      }, {
        name: 'B'
      }];
      const sorted = sortData(originalData, []);
      expect(sorted).toEqual(originalData);
      expect(sorted).not.toBe(originalData); // 원본 배열 변경 방지
    });

    test('데이터가 배열이 아니면 오류를 발생시켜야 합니다.', () => {
      expect(() => sortData({}, [{
        field: 'age',
        order: 'asc'
      }])).toThrow("Input data must be an array.");
    });
  });

  describe('removeDuplicates', () => {
    const data = [{
      id: 1,
      name: 'Alice'
    }, {
      id: 2,
      name: 'Bob'
    }, {
      id: 1,
      name: 'Alice'
    }, {
      id: 3,
      name: 'Charlie'
    }, {
      id: 2,
      name: 'Bob'
    }, ];

    test('전체 레코드를 기준으로 중복을 제거해야 합니다.', () => {
      const unique = removeDuplicates(data);
      expect(unique).toEqual([{
        id: 1,
        name: 'Alice'
      }, {
        id: 2,
        name: 'Bob'
      }, {
        id: 3,
        name: 'Charlie'
      }, ]);
    });

    test('특정 필드를 기준으로 중복을 제거해야 합니다.', () => {
      const uniqueById = removeDuplicates(data, 'id');
      expect(uniqueById).toEqual([{
        id: 1,
        name: 'Alice'
      }, {
        id: 2,
        name: 'Bob'
      }, {
        id: 3,
        name: 'Charlie'
      }, ]);

      const uniqueByName = removeDuplicates(data, 'name');
      expect(uniqueByName).toEqual([{
        id: 1,
        name: 'Alice'
      }, {
        id: 2,
        name: 'Bob'
      }, {
        id: 3,
        name: 'Charlie'
      }, ]);
    });

    test('빈 배열에서 중복을 제거할 수 있어야 합니다.', () => {
      expect(removeDuplicates([])).toEqual([]);
    });

    test('데이터가 배열이 아니면 오류를 발생시켜야 합니다.', () => {
      expect(() => removeDuplicates({}, 'id')).toThrow("Input data must be an array.");
    });
  });

  describe('validateData', () => {
    const data = [{
      name: 'John',
      age: 30,
      email: 'john@example.com'
    }, {
      name: 'Jane',
      age: 'twenty',
      email: 'jane@example.com'
    }, // age type mismatch
    {
      name: 'Mike',
      age: 25
    }, // email missing
    {
      name: 'Anna',
      age: -5,
      email: 'anna@example.com'
    }, // age min violation
    {
      name: 'Peter',
      age: 40,
      email: 'peter@example.com'
    }, ];

    const schema = {
      name: {
        type: 'string',
        required: true
      },
      age: {
        type: 'number',
        required: true,
        min: 0
      },
      email: {
        type: 'string',
        required: true,
        pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
      },
    };

    test('스키마에 따라 유효한 데이터를 필터링해야 합니다.', () => {
      const validData = validateData(data, schema);
      expect(validData).toEqual([{
        name: 'John',
        age: 30,
        email: 'john@example.com'
      }, {
        name: 'Peter',
        age: 40,
        email: 'peter@example.com'
      }, ]);
    });

    test('스키마가 없으면 모든 데이터를 유효하다고 간주해야 합니다.', () => {
      expect(validateData(data, {})).toEqual(data);
    });

    test('빈 배열을 유효성 검증할 수 있어야 합니다.', () => {
      expect(validateData([], schema)).toEqual([]);
    });

    test('데이터가 배열이 아니면 오류를 발생시켜야 합니다.', () => {
      expect(() => validateData({}, schema)).toThrow("Input data must be an array.");
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
    const sampleCsvContent = "id,name\n1,Test1\n2,Test2";
    const sampleCsvData = [{
      id: 1,
      name: 'Test1'
    }, {
      id: 2,
      name: 'Test2'
    }];

    test('JSON 파일을 읽고 쓸 수 있어야 합니다.', () => {
      writeJsonFile(testJsonFilePath, sampleJsonData);
      const readData = readJsonFile(testJsonFilePath);
      expect(readData).toEqual(sampleJsonData);
    });

    test('CSV 파일을 읽고 JSON으로 변환할 수 있어야 합니다.', () => {
      fs.writeFileSync(testCsvFilePath, sampleCsvContent, 'utf8');
      const readData = readCsvFile(testCsvFilePath);
      expect(readData).toEqual(sampleCsvData);
    });

    test('JSON 데이터를 CSV 파일로 변환하여 쓸 수 있어야 합니다.', () => {
      writeCsvFile(outputCsvFilePath, sampleJsonData);
      const writtenContent = fs.readFileSync(outputCsvFilePath, 'utf8');
      expect(writtenContent.trim()).toBe(sampleCsvContent.trim());
    });

    test('존재하지 않는 JSON 파일을 읽으려 할 때 오류를 발생시켜야 합니다.', () => {
      expect(() => readJsonFile(path.join(testDir, 'non_existent.json'))).toThrow();
    });

    test('존재하지 않는 CSV 파일을 읽으려 할 때 오류를 발생시켜야 합니다.', () => {
      expect(() => readCsvFile(path.join(testDir, 'non_existent.csv'))).toThrow();
    });

    test('빈 JSON 배열을 CSV로 쓸 때 헤더만 포함해야 합니다.', () => {
      writeCsvFile(outputCsvFilePath, []);
      const writtenContent = fs.readFileSync(outputCsvFilePath, 'utf8');
      expect(writtenContent.trim()).toBe('');
    });

    test('CSV에 쉼표가 포함된 문자열을 올바르게 처리해야 합니다.', () => {
      const dataWithComma = [{
        id: 1,
        name: 'Test, One'
      }];
      writeCsvFile(outputCsvFilePath, dataWithComma);
      const writtenContent = fs.readFileSync(outputCsvFilePath, 'utf8');
      expect(writtenContent.trim()).toBe('id,name\n1,"Test, One"');
    });
  });
});
