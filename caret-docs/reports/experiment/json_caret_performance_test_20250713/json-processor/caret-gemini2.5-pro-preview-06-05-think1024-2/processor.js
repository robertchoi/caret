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
            const condition = conditions[key];
            if (condition instanceof RegExp) {
                if (!condition.test(item[key])) {
                    return false;
                }
            } else if (item[key] !== condition) {
                return false;
            }
        }
        return true;
    });
}

function aggregate(data, key, operations) {
    const values = data.map(item => item[key]);
    const result = {};
    if (operations.includes('sum')) {
        result.sum = values.reduce((a, b) => a + b, 0);
    }
    if (operations.includes('avg')) {
        result.avg = values.reduce((a, b) => a + b, 0) / values.length;
    }
    if (operations.includes('min')) {
        result.min = Math.min(...values);
    }
    if (operations.includes('max')) {
        result.max = Math.max(...values);
    }
    return result;
}

function sort(data, keys) {
    return data.sort((a, b) => {
        for (const key of keys) {
            if (a[key] < b[key]) return -1;
            if (a[key] > b[key]) return 1;
        }
        return 0;
    });
}

function deduplicate(data) {
    return Array.from(new Set(data.map(JSON.stringify))).map(JSON.parse);
}

function validate(item, schema) {
    for (const key in schema) {
        if (typeof item[key] !== schema[key]) {
            return false;
        }
    }
    return true;
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
