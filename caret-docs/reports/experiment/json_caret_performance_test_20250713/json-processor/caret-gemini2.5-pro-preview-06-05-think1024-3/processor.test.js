const { flatten, group, filter, aggregate, sort, dedup, validate } = require('./processor');

describe('JSON Processor', () => {
    // 2.1. 데이터 변환 테스트
    describe('Data Transformation', () => {
        it('should flatten a nested JSON object', () => {
            const nested = { user: { profile: { name: "John", details: { age: 30 } } } };
            const expected = { "user.profile.name": "John", "user.profile.details.age": 30 };
            expect(flatten(nested)).toEqual(expected);
        });

        it('should group an array of objects by a key', () => {
            const data = [
                { name: "Alice", department: "HR" },
                { name: "Bob", department: "Engineering" },
                { name: "Charlie", department: "HR" }
            ];
            const expected = {
                HR: [{ name: "Alice", department: "HR" }, { name: "Charlie", department: "HR" }],
                Engineering: [{ name: "Bob", department: "Engineering" }]
            };
            expect(group(data, 'department')).toEqual(expected);
        });
    });

    // 2.2. 필터링 및 검색 테스트
    describe('Filtering and Searching', () => {
        const users = [
            { name: "Alice", age: 25, city: "New York" },
            { name: "Bob", age: 30, city: "San Francisco" },
            { name: "Charlie", age: 35, city: "New York" }
        ];

        it('should filter data with complex AND/OR conditions', () => {
            const conditions = {
                $or: [
                    { age: { $gt: 30 } },
                    { city: "New York" }
                ]
            };
            const expected = [
                { name: "Alice", age: 25, city: "New York" },
                { name: "Charlie", age: 35, city: "New York" }
            ];
            expect(filter(users, conditions)).toEqual(expect.arrayContaining(expected));
        });

        it('should filter data using regular expressions', () => {
            const conditions = { name: /lic/ };
            const expected = [{ name: "Alice", age: 25, city: "New York" }];
            expect(filter(users, conditions)).toEqual(expected);
        });
    });

    // 2.3. 집계 및 통계 테스트
    describe('Aggregation and Statistics', () => {
        const data = [
            { value: 10 }, { value: 20 }, { value: 30 }, { value: -5.5 }
        ];

        it('should calculate sum, average, max, and min', () => {
            const expected = {
                sum: 54.5,
                average: 13.625,
                max: 30,
                min: -5.5
            };
            expect(aggregate(data, 'value', ['sum', 'average', 'max', 'min'])).toEqual(expected);
        });
    });

    // 2.4. 정렬 및 정제 테스트
    describe('Sorting and Refinement', () => {
        const data = [
            { name: "Charlie", age: 35 },
            { name: "Alice", age: 25 },
            { name: "Bob", age: 35 },
            { name: "Alice", age: 25 }
        ];

        it('should sort by multiple fields', () => {
            const expected = [
                { name: "Alice", age: 25 },
                { name: "Alice", age: 25 },
                { name: "Bob", age: 35 },
                { name: "Charlie", age: 35 }
            ];
            expect(sort(data, [{ field: 'name', order: 'asc' }, { field: 'age', order: 'asc' }])).toEqual(expected);
        });

        it('should remove duplicates based on a key', () => {
            const expected = [
                { name: "Charlie", age: 35 },
                { name: "Alice", age: 25 },
                { name: "Bob", age: 35 }
            ];
            expect(dedup(data, 'name')).toEqual(expect.arrayContaining(expected));
        });

        it('should validate data against a schema', () => {
            const schema = {
                name: { type: 'string', required: true },
                age: { type: 'number', required: true }
            };
            const invalidData = { name: "David" }; // age is missing
            expect(validate(data[0], schema)).toBe(true);
            expect(validate(invalidData, schema)).toBe(false);
        });
    });
});
