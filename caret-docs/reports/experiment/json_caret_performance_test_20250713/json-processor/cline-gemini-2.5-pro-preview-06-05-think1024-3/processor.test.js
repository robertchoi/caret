const {
    flatten,
    group,
    filter,
    aggregate,
    sort,
    removeDuplicates,
    validate
} = require('./processor');

// Test Data
const nestedData = {
    user: {
        profile: {
            name: "John Doe",
            age: 30
        },
        roles: ["admin", "editor"]
    },
    posts: [{
        id: 1,
        title: "Post 1"
    }, {
        id: 2,
        title: "Post 2"
    }]
};

const userList = [{
    id: 1,
    name: "Alice",
    department: "HR",
    region: "NA"
}, {
    id: 2,
    name: "Bob",
    department: "Engineering",
    region: "EU"
}, {
    id: 3,
    name: "Charlie",
    department: "Engineering",
    region: "NA"
}, {
    id: 4,
    name: "Alice",
    department: "Marketing",
    region: "EU"
}, ];

describe("JSON Processor", () => {
    // 1. Data Transformation
    test("R-1.1: should flatten a nested JSON object", () => {
        const expected = {
            "user.profile.name": "John Doe",
            "user.profile.age": 30,
            "user.roles.0": "admin",
            "user.roles.1": "editor",
            "posts.0.id": 1,
            "posts.0.title": "Post 1",
            "posts.1.id": 2,
            "posts.1.title": "Post 2"
        };
        expect(flatten(nestedData)).toEqual(expected);
    });

    test("R-1.2: should group an array of objects by a key", () => {
        const expected = {
            Engineering: [{
                id: 2,
                name: "Bob",
                department: "Engineering",
                region: "EU"
            }, {
                id: 3,
                name: "Charlie",
                department: "Engineering",
                region: "NA"
            }, ],
            HR: [{
                id: 1,
                name: "Alice",
                department: "HR",
                region: "NA"
            }],
            Marketing: [{
                id: 4,
                name: "Alice",
                department: "Marketing",
                region: "EU"
            }, ],
        };
        expect(group(userList, "department")).toEqual(expected);
    });

    // 2. Filtering and Searching
    test("R-2.1: should filter data with complex conditions", () => {
        const conditions = {
            $or: [{
                department: "Engineering"
            }, {
                region: "NA"
            }],
            $and: [{
                name: "Alice"
            }]
        };
        // This is a tricky one. The logic should be: (department is 'Engineering' OR region is 'NA') AND (name is 'Alice')
        // Let's trace:
        // 1. Alice, HR, NA -> (false OR true) AND true -> true
        // 2. Bob, Eng, EU -> (true OR false) AND false -> false
        // 3. Charlie, Eng, NA -> (true OR true) AND false -> false
        // 4. Alice, Mkt, EU -> (false OR false) AND true -> false
        // So, only the first Alice should be returned.
        const result = filter(userList, {
            $and: [{
                name: "Alice"
            }, {
                $or: [{
                    department: "HR"
                }, {
                    region: "EU"
                }]
            }, ],
        });
        expect(result).toEqual([{
            id: 1,
            name: "Alice",
            department: "HR",
            region: "NA"
        }, {
            id: 4,
            name: "Alice",
            department: "Marketing",
            region: "EU"
        }, ]);
    });

    test("R-2.2: should filter data with regex", () => {
        const result = filter(userList, {
            name: /lic/
        });
        expect(result.length).toBe(2);
        expect(result.every((u) => /lic/.test(u.name))).toBe(true);
    });


    // 3. Aggregation and Statistics
    test("R-3.1: should calculate aggregate statistics", () => {
        const numbers = [{
            v: 1
        }, {
            v: 2
        }, {
            v: 3
        }, {
            v: 4
        }, {
            v: 5
        }];
        const result = aggregate(numbers, "v", ["sum", "avg", "max", "min"]);
        expect(result).toEqual({
            sum: 15,
            avg: 3,
            max: 5,
            min: 1
        });
    });

    test("R-3.2: should perform frequency analysis", () => {
        const result = aggregate(userList, "name", ["freq"]);
        expect(result.freq).toEqual({
            Alice: 2,
            Bob: 1,
            Charlie: 1
        });
    });


    // 4. Sorting and Refinement
    test("R-4.1: should sort by multiple fields", () => {
        const sorted = sort(userList, [{
            field: "name",
            order: "asc"
        }, {
            field: "department",
            order: "desc"
        }]);
        expect(sorted.map((u) => u.id)).toEqual([4, 1, 2, 3]);
    });

    test("R-4.2: should remove duplicate objects based on a key", () => {
        const unique = removeDuplicates(userList, "name");
        expect(unique.length).toBe(3);
        expect(unique.map((u) => u.name)).toEqual(["Alice", "Bob", "Charlie"]);
    });

    test("R-4.3: should validate data against a schema", () => {
        const schema = {
            id: "number",
            name: "string",
            department: (val) => ["HR", "Engineering", "Marketing"].includes(val),
            region: "string",
        };
        const invalidUser = {
            id: "5",
            name: "David",
            department: "Sales",
            region: "APAC"
        };
        const {
            valid,
            errors
        } = validate(invalidUser, schema);
        expect(valid).toBe(false);
        expect(errors).toEqual([{
            field: "id",
            error: "Type mismatch: expected number, got string"
        }, {
            field: "department",
            error: "Validation function failed"
        }, ]);
    });
});
