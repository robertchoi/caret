const { flatten, group, filter, aggregate, sort, deduplicate, validate } = require('./processor');

// 샘플 데이터
const sampleData = [
    { "id": 1, "user": { "name": "Alice", "profile": { "age": 25, "city": "New York" } }, "department": "Engineering", "salary": 80000 },
    { "id": 2, "user": { "name": "Bob", "profile": { "age": 30, "city": "London" } }, "department": "Engineering", "salary": 90000 },
    { "id": 3, "user": { "name": "Charlie", "profile": { "age": 35, "city": "New York" } }, "department": "HR", "salary": 75000 },
    { "id": 4, "user": { "name": "David", "profile": { "age": 25, "city": "Tokyo" } }, "department": "Sales", "salary": 85000 },
    { "id": 5, "user": { "name": "Eve", "profile": { "age": 25, "city": "New York" } }, "department": "Engineering", "salary": 80000 }
];
const sampleDataWithDuplicate = [
    { "id": 1, "user": { "name": "Alice", "profile": { "age": 25, "city": "New York" } }, "department": "Engineering", "salary": 80000 },
    { "id": 2, "user": { "name": "Bob", "profile": { "age": 30, "city": "London" } }, "department": "Engineering", "salary": 90000 },
    { "id": 3, "user": { "name": "Charlie", "profile": { "age": 35, "city": "New York" } }, "department": "HR", "salary": 75000 },
    { "id": 4, "user": { "name": "David", "profile": { "age": 25, "city": "Tokyo" } }, "department": "Sales", "salary": 85000 },
    { "id": 1, "user": { "name": "Alice", "profile": { "age": 25, "city": "New York" } }, "department": "Engineering", "salary": 80000 }
];

describe('JSON Processor', () => {
    // 1. 데이터 변환 테스트
    describe('Data Transformation', () => {
        it('should flatten a nested JSON object', () => {
            const nestedJson = { user: { profile: { name: "John" } } };
            const flattened = flatten(nestedJson);
            expect(flattened).toEqual({ "user.profile.name": "John" });
        });

        it('should group data by a given key', () => {
            const grouped = group(sampleData, 'department');
            expect(grouped['Engineering'].length).toBe(3);
            expect(grouped['HR'].length).toBe(1);
            expect(grouped['Sales'].length).toBe(1);
        });
    });

    // 2. 필터링 및 검색 테스트
    describe('Filtering and Searching', () => {
        it('should filter data with complex conditions (AND/OR)', () => {
            const conditions = {
                $or: [
                    { "department": "Engineering" },
                    { "user.profile.city": "New York" }
                ],
                "user.profile.age": { $gt: 25 }
            };
            const filtered = filter(sampleData, conditions);
            // Bob (Eng, 30), Charlie (NY, 35)
            expect(filtered.length).toBe(2);
        });

        it('should filter data using regular expressions', () => {
            const conditions = { "user.name": /^A/ }; // A로 시작하는 이름
            const filtered = filter(sampleData, conditions);
            expect(filtered.length).toBe(1); // Alice
        });
    });

    // 3. 집계 및 통계 테스트
    describe('Aggregation and Statistics', () => {
        it('should calculate aggregate statistics (sum, avg, max, min)', () => {
            const stats = aggregate(sampleData, 'salary', ['sum', 'avg', 'max', 'min']);
            expect(stats.sum).toBe(410000);
            expect(stats.avg).toBe(82000);
            expect(stats.max).toBe(90000);
            expect(stats.min).toBe(75000);
        });
    });

    // 4. 정렬 및 정제 테스트
    describe('Sorting and Refinement', () => {
        it('should sort data by multiple fields', () => {
            const sorted = sort(sampleData, ['department:asc', 'salary:desc']);
            expect(sorted[0].user.name).toBe('Bob'); // Eng, 90000
            expect(sorted[1].user.name).toBe('Alice'); // Eng, 80000
            expect(sorted[2].user.name).toBe('Eve'); // Eng, 80000
        });

        it('should remove duplicate objects based on a key', () => {
            const uniqueById = deduplicate(sampleDataWithDuplicate, 'id');
            expect(uniqueById.length).toBe(4);
            const uniqueByName = deduplicate(sampleDataWithDuplicate, 'user.name');
            expect(uniqueByName.length).toBe(4);
        });

        it('should validate data against a schema', () => {
            const schema = {
                "id": "number",
                "user.name": "string",
                "user.profile.age": "number"
            };
            const { valid, invalid } = validate(sampleData, schema);
            expect(valid.length).toBe(5);
            expect(invalid.length).toBe(0);

            const invalidData = [...sampleData, { "id": "6", "user": { "name": "Frank", "profile": { "age": "thirty" } } }];
            const result = validate(invalidData, schema);
            expect(result.valid.length).toBe(5);
            expect(result.invalid.length).toBe(1);
        });
    });
});
