function flatten(data, prefix = '') {
    const result = {};
    for (const key in data) {
        if (typeof data[key] === 'object' && data[key] !== null) {
            Object.assign(result, flatten(data[key], `${prefix}${key}.`));
        } else {
            result[`${prefix}${key}`] = data[key];
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
        return Object.entries(conditions).every(([key, value]) => {
            if (key === '$and') {
                return value.every(cond => filter([item], cond).length > 0);
            }
            if (key === '$or') {
                return value.some(cond => filter([item], cond).length > 0);
            }
            if (value instanceof RegExp) {
                return value.test(item[key]);
            }
            return item[key] === value;
        });
    });
}


function aggregate(data, field, operations) {
    const result = {};
    const values = data.map(item => item[field]);

    for (const op of operations) {
        switch (op) {
            case 'sum':
                result.sum = values.reduce((a, b) => a + b, 0);
                break;
            case 'avg':
                result.avg = values.reduce((a, b) => a + b, 0) / values.length;
                break;
            case 'max':
                result.max = Math.max(...values);
                break;
            case 'min':
                result.min = Math.min(...values);
                break;
            case 'freq':
                result.freq = values.reduce((acc, value) => {
                    acc[value] = (acc[value] || 0) + 1;
                    return acc;
                }, {});
                break;
        }
    }
    return result;
}

function sort(data, fields) {
    return [...data].sort((a, b) => {
        for (const {
                field,
                order
            } of fields) {
            const valA = a[field];
            const valB = b[field];
            if (valA < valB) return order === 'asc' ? -1 : 1;
            if (valA > valB) return order === 'asc' ? 1 : -1;
        }
        return 0;
    });
}

function removeDuplicates(data, key) {
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
    const errors = [];
    for (const key in schema) {
        const rule = schema[key];
        const value = data[key];

        if (typeof rule === 'string') {
            if (typeof value !== rule) {
                errors.push({
                    field: key,
                    error: `Type mismatch: expected ${rule}, got ${typeof value}`
                });
            }
        } else if (typeof rule === 'function') {
            if (!rule(value)) {
                errors.push({
                    field: key,
                    error: 'Validation function failed'
                });
            }
        }
    }
    return {
        valid: errors.length === 0,
        errors
    };
}


module.exports = {
    flatten,
    group,
    filter,
    aggregate,
    sort,
    removeDuplicates,
    validate
};
