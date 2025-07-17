function flatten(obj, parentKey = '', result = {}) {
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const newKey = parentKey ? `${parentKey}.${key}` : key;
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                flatten(obj[key], newKey, result);
            } else {
                result[newKey] = obj[key];
            }
        }
    }
    return result;
}

function group(data, key) {
    return data.reduce((acc, item) => {
        const groupKey = item[key];
        if (!acc[groupKey]) {
            acc[groupKey] = [];
        }
        acc[groupKey].push(item);
        return acc;
    }, {});
}

function filter(data, conditions) {
    return data.filter(item => {
        for (const key in conditions) {
            const value = conditions[key];
            if (value instanceof RegExp) {
                if (!value.test(item[key])) {
                    return false;
                }
            } else if (Array.isArray(value)) {
                if (!value.some(v => item[key] === v)) {
                    return false;
                }
            } else {
                if (item[key] !== value) {
                    return false;
                }
            }
        }
        return true;
    });
}

function aggregate(data, field, type) {
    const values = data.map(item => item[field]);
    switch (type) {
        case 'sum':
            return values.reduce((a, b) => a + b, 0);
        case 'average':
            return values.reduce((a, b) => a + b, 0) / values.length;
        case 'max':
            return Math.max(...values);
        case 'min':
            return Math.min(...values);
        default:
            throw new Error(`Unsupported aggregation type: ${type}`);
    }
}

function sort(data, criteria) {
    const sortedData = [...data];
    sortedData.sort((a, b) => {
        for (const { field, order } of criteria) {
            const valA = a[field];
            const valB = b[field];
            if (valA < valB) return order === 'asc' ? -1 : 1;
            if (valA > valB) return order === 'asc' ? 1 : -1;
        }
        return 0;
    });
    return sortedData;
}

function deduplicate(data, key) {
    const seen = new Set();
    return data.filter(item => {
        const value = item[key];
        if (seen.has(value)) {
            return false;
        } else {
            seen.add(value);
            return true;
        }
    });
}

function validate(data, schema) {
    // Basic validation logic, can be expanded
    return data.filter(item => {
        return Object.entries(schema).every(([key, type]) => {
            return typeof item[key] === type;
        });
    });
}


module.exports = {
    flatten,
    group,
    filter,
    aggregate,
    sort,
    deduplicate,
    validate
};
