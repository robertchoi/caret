const { flatten, group, filter, aggregate, sort, deduplicate, validate } = require('./processor');

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
                { department: 'Engineering', name: 'John' },
                { department: 'HR', name: 'Jane' },
                { department: 'Engineering', name: 'Doe' },
            ];
            const expected = {
                'Engineering': [
                    { department: 'Engineering', name: 'John' },
                    { department: 'Engineering', name: 'Doe' },
                ],
                'HR': [
                    { department: 'HR', name: 'Jane' },
                ]
            };
            expect(group(data, 'department')).toEqual(expected);
        });
    });

    // 2.2. 필터링 및 검색 테스트
    describe('Filtering and Searching', () => {
        const data = [
            { name: 'John', age: 30, city: 'New York' },
            { name: 'Jane', age: 25, city: 'London' },
            { name: 'Doe', age: 35, city: 'New York' },
        ];

        it('should filter data with a simple AND condition', () => {
            const conditions = { city: 'New York', age: 35 };
            expect(filter(data, conditions)).toEqual([{ name: 'Doe', age: 35, city: 'New York' }]);
        });

        it('should filter data with a regex', () => {
            const conditions = { name: /J/ };
            expect(filter(data, conditions).length).toBe(2);
        });
    });

    // 2.3. 집계 및 통계 테스트
    describe('Aggregation and Statistics', () => {
        const data = [
            { name: 'Product A', price: 100, quantity: 5 },
            { name: 'Product B', price: 200, quantity: 2 },
            { name: 'Product C', price: 50, quantity: 10 },
        ];

        it('should calculate sum and average', () => {
            const result = aggregate(data, 'price', ['sum', 'avg']);
            expect(result.sum).toBe(350);
            expect(result.avg).toBeCloseTo(116.67);
        });

        it('should find min and max', () => {
            const result = aggregate(data, 'quantity', ['min', 'max']);
            expect(result.min).toBe(2);
            expect(result.max).toBe(10);
        });
    });

    // 2.4. 정렬 및 정제 테스트
    describe('Sorting and Refinement', () => {
        const data = [
            { name: 'John', age: 30 },
            { name: 'Jane', age: 25 },
            { name: 'Adam', age: 30 },
        ];

        it('should sort by multiple fields', () => {
            const sorted = sort(data, ['age', 'name']);
            expect(sorted[0].name).toBe('Jane');
            expect(sorted[1].name).toBe('Adam');
            expect(sorted[2].name).toBe('John');
        });

        it('should remove duplicate objects', () => {
            const dirtyData = [...data, { name: 'Jane', age: 25 }];
            expect(deduplicate(dirtyData).length).toBe(3);
        });

        it('should validate data against a schema', () => {
            const schema = {
                name: 'string',
                age: 'number'
            };
            const invalidData = { name: 'Test', age: '29' };
            expect(validate(data[0], schema)).toBe(true);
            expect(validate(invalidData, schema)).toBe(false);
        });
    });
});
