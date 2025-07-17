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

function evaluateCondition(item, condition) {
    if (condition.and) {
        return condition.and.every(cond => evaluateCondition(item, cond));
    }
    if (condition.or) {
        return condition.or.some(cond => evaluateCondition(item, cond));
    }

    const { field, operator, value } = condition;
    const itemValue = item[field];

    switch (operator) {
        case '===': return itemValue === value;
        case '!==': return itemValue !== value;
        case '>': return itemValue > value;
        case '<': return itemValue < value;
        case '>=': return itemValue >= value;
        case '<=': return itemValue <= value;
        case 'regex': return new RegExp(value).test(itemValue);
        default: return false;
    }
}

function filter(data, condition) {
    return data.filter(item => evaluateCondition(item, condition));
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
        case 'frequency':
            return values.reduce((acc, val) => {
                acc[val] = (acc[val] || 0) + 1;
                return acc;
            }, {});
        default:
            return null;
    }
}

function sort(data, keys) {
    return [...data].sort((a, b) => {
        for (const key of keys) {
            const { field, order } = key;
            const valA = a[field];
            const valB = b[field];

            if (valA < valB) return order === 'asc' ? -1 : 1;
            if (valA > valB) return order === 'asc' ? 1 : -1;
        }
        return 0;
    });
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

function validate(item, schema) {
    if (schema.required) {
        for (const key of schema.required) {
            if (!Object.prototype.hasOwnProperty.call(item, key)) {
                return false;
            }
        }
    }

    for (const key in schema.properties) {
        if (Object.prototype.hasOwnProperty.call(item, key)) {
            const prop = schema.properties[key];
            const value = item[key];

            if (typeof value !== prop.type) return false;
            if (prop.minimum !== undefined && value < prop.minimum) return false;
            if (prop.maximum !== undefined && value > prop.maximum) return false;
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
