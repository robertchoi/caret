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
        const checkCondition = (item, condition) => {
            for (const key in condition) {
                if (key === '$or') {
                    return condition[key].some(subCond => checkCondition(item, subCond));
                }
                if (key === '$and') {
                    return condition[key].every(subCond => checkCondition(item, subCond));
                }
                if (typeof condition[key] === 'object' && condition[key] !== null) {
                    if (condition[key] instanceof RegExp) {
                        if (!condition[key].test(item[key])) return false;
                    } else {
                        const operator = Object.keys(condition[key])[0];
                        const value = condition[key][operator];
                        if (operator === '$gt' && !(item[key] > value)) return false;
                        if (operator === '$lt' && !(item[key] < value)) return false;
                        if (operator === '$gte' && !(item[key] >= value)) return false;
                        if (operator === '$lte' && !(item[key] <= value)) return false;
                    }
                } else {
                    if (item[key] !== condition[key]) return false;
                }
            }
            return true;
        };
        return checkCondition(item, conditions);
    });
}


function aggregate(data, field, types) {
    const result = {};
    const values = data.map(item => item[field]);

    if (types.includes('sum')) {
        result.sum = values.reduce((acc, val) => acc + val, 0);
    }
    if (types.includes('average')) {
        result.average = values.reduce((acc, val) => acc + val, 0) / values.length;
    }
    if (types.includes('max')) {
        result.max = Math.max(...values);
    }
    if (types.includes('min')) {
        result.min = Math.min(...values);
    }

    return result;
}

function sort(data, criteria) {
    return [...data].sort((a, b) => {
        for (const c of criteria) {
            const { field, order } = c;
            if (a[field] < b[field]) return order === 'asc' ? -1 : 1;
            if (a[field] > b[field]) return order === 'asc' ? 1 : -1;
        }
        return 0;
    });
}

function dedup(data, key) {
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

function validate(item, schema) {
    for (const key in schema) {
        const rule = schema[key];
        if (rule.required && !Object.prototype.hasOwnProperty.call(item, key)) {
            return false;
        }
        if (Object.prototype.hasOwnProperty.call(item, key) && typeof item[key] !== rule.type) {
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
    dedup,
    validate
};
