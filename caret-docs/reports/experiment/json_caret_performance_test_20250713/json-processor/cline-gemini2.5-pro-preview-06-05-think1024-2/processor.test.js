const { flatten, group, filter, aggregate, sort,deduplicate, validate } = require('./processor');

describe('JSON Processor', () => {
    // 1. 데이터 변환 테스트
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
                "HR": [{ name: "Alice", department: "HR" }, { name: "Charlie", department: "HR" }],
                "Engineering": [{ name: "Bob", department: "Engineering" }]
            };
            expect(group(data, 'department')).toEqual(expected);
        });
    });

    // 2. 필터링 및 검색 테스트
    describe('Filtering and Searching', () => {
        const data = [
            { name: "Apple", type: "fruit", price: 1.2 },
            { name: "Banana", type: "fruit", price: 0.5 },
            { name: "Carrot", type: "vegetable", price: 0.8 }
        ];

        it('should filter data with a simple AND condition', () => {
            const conditions = { type: "fruit", price: 1.2 };
            expect(filter(data, conditions)).toEqual([{ name: "Apple", type: "fruit", price: 1.2 }]);
        });
        
        it('should filter data with a regex pattern', () => {
            const conditions = { name: /a/i }; // "Apple", "Banana", "Carrot"
            expect(filter(data, conditions).length).toBe(3);
        });
    });

    // 3. 집계 및 통계 테스트
    describe('Aggregation and Statistics', () => {
        const data = [
            { product: "A", sales: 100 },
            { product: "B", sales: 150 },
            { product: "C", sales: 200 }
        ];

        it('should calculate the sum of a field', () => {
            expect(aggregate(data, 'sales', 'sum')).toBe(450);
        });

        it('should calculate the average of a field', () => {
            expect(aggregate(data, 'sales', 'average')).toBe(150);
        });
    });

    // 4. 정렬 및 정제 테스트
    describe('Sorting and Refinement', () => {
        const data = [
            { name: "John", age: 30 },
            { name: "Jane", age: 25 },
            { name: "John", age: 30 },
            { name: "Doe", age: 25 }
        ];

        it('should sort data by a single field', () => {
            const sorted = sort(data, [{ field: 'age', order: 'asc' }]);
            expect(sorted[0].age).toBe(25);
            expect(sorted[3].age).toBe(30);
        });

        it('should sort data by multiple fields', () => {
            const sorted = sort(data, [{ field: 'age', order: 'asc' }, { field: 'name', order: 'asc' }]);
            expect(sorted[0].name).toBe("Doe");
            expect(sorted[1].name).toBe("Jane");
        });

        it('should remove duplicate objects', () => {
            expect(deduplicate(data, 'name').length).toBe(3);
        });
    });
});
