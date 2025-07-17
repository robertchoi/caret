const { flatten, group, filter, aggregate, sort, deduplicate, validate } = require('./processor');

describe('JSON Processor', () => {
  // 2.1. 데이터 변환 테스트
  describe('Data Transformation', () => {
    test('R-1.1: should flatten a nested JSON object', () => {
      const nested = { user: { profile: { name: "John", details: { age: 30 } } } };
      const expected = { "user.profile.name": "John", "user.profile.details.age": 30 };
      expect(flatten(nested)).toEqual(expected);
    });

    test('R-1.2: should group an array of objects by a key', () => {
      const data = [
        { name: "Alice", department: "Engineering" },
        { name: "Bob", department: "Marketing" },
        { name: "Charlie", department: "Engineering" },
      ];
      const expected = {
        "Engineering": [
          { name: "Alice", department: "Engineering" },
          { name: "Charlie", department: "Engineering" },
        ],
        "Marketing": [
          { name: "Bob", department: "Marketing" },
        ],
      };
      expect(group(data, 'department')).toEqual(expected);
    });
  });

  // 2.2. 필터링 및 검색 테스트
  describe('Filtering and Searching', () => {
    const data = [
      { name: "Dave", age: 35, department: "Sales", location: "New York" },
      { name: "Eve", age: 28, department: "Sales", location: "London" },
      { name: "Frank", age: 42, department: "HR", location: "New York" },
    ];

    test('R-2.1: should filter data with complex conditions (AND/OR)', () => {
      const condition = {
        or: [
          { and: [{ field: 'age', operator: '>', value: 30 }, { field: 'department', operator: '===', value: 'Sales' }] },
          { field: 'location', operator: '===', value: 'New York' }
        ]
      };
      const expected = [
        { name: "Dave", age: 35, department: "Sales", location: "New York" },
        { name: "Frank", age: 42, department: "HR", location: "New York" },
      ];
      expect(filter(data, condition)).toEqual(expect.arrayContaining(expected));
    });

    test('R-2.2: should filter data using regular expressions', () => {
      const condition = { field: 'name', operator: 'regex', value: '^D' };
      const expected = [{ name: "Dave", age: 35, department: "Sales", location: "New York" }];
      expect(filter(data, condition)).toEqual(expected);
    });
  });

  // 2.3. 집계 및 통계 테스트
  describe('Aggregation and Statistics', () => {
    const data = [
      { product: "A", price: 100, quantity: 5 },
      { product: "B", price: 150, quantity: 2 },
      { product: "A", price: 120, quantity: 3 },
    ];

    test('R-3.1: should calculate basic statistics (sum, avg, max, min)', () => {
      expect(aggregate(data, 'price', 'sum')).toBe(370);
      expect(aggregate(data, 'quantity', 'average')).toBeCloseTo(3.33);
      expect(aggregate(data, 'price', 'max')).toBe(150);
      expect(aggregate(data, 'quantity', 'min')).toBe(2);
    });

    test('R-3.2: should perform frequency analysis', () => {
        const dataForFrequency = [{ category: 'X' }, { category: 'Y' }, { category: 'X' }];
        const expected = { 'X': 2, 'Y': 1 };
        expect(aggregate(dataForFrequency, 'category', 'frequency')).toEqual(expected);
    });
  });

  // 2.4. 정렬 및 정제 테스트
  describe('Sorting and Refinement', () => {
    const data = [
        { name: "Grace", score: 95, city: "Tokyo" },
        { name: "Heidi", score: 80, city: "Paris" },
        { name: "Ivan", score: 95, city: "London" },
        { name: "Heidi", score: 80, city: "Paris" }, // Duplicate
    ];

    test('R-4.1: should sort data by multiple fields', () => {
        const sortKeys = [{ field: 'score', order: 'desc' }, { field: 'name', order: 'asc' }];
        const expected = [
            { name: "Grace", score: 95, city: "Tokyo" },
            { name: "Ivan", score: 95, city: "London" },
            { name: "Heidi", score: 80, city: "Paris" },
            { name: "Heidi", score: 80, city: "Paris" },
        ];
        expect(sort(data, sortKeys)).toEqual(expected);
    });

    test('R-4.2: should deduplicate data based on a key', () => {
        const expected = [
            { name: "Grace", score: 95, city: "Tokyo" },
            { name: "Heidi", score: 80, city: "Paris" },
            { name: "Ivan", score: 95, city: "London" },
        ];
        expect(deduplicate(data, 'name')).toEqual(expect.arrayContaining(expected));
    });

    test('R-4.3: should validate data against a schema', () => {
        const schema = {
            properties: {
                name: { type: "string" },
                score: { type: "number", minimum: 0, maximum: 100 },
                city: { type: "string" }
            },
            required: ["name", "score"]
        };
        const invalidData = { name: "Judy", score: 105 }; // Invalid score
        expect(validate(data[0], schema)).toBe(true);
        expect(validate(invalidData, schema)).toBe(false);
    });
  });
});
