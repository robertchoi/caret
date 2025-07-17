const fs = require('fs');
const path = require('path');

/**
 * 중첩된 JSON 객체를 평면화합니다.
 * @param {object} obj - 평면화할 JSON 객체.
 * @param {string} prefix - 현재 키의 접두사 (재귀 호출용).
 * @param {object} res - 결과 객체 (재귀 호출용).
 * @returns {object} 평면화된 JSON 객체.
 */
function flattenJson(obj, prefix = '', res = {}) {
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const newKey = prefix ? `${prefix}.${key}` : key;
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                flattenJson(obj[key], newKey, res);
            } else {
                res[newKey] = obj[key];
            }
        }
    }
    return res;
}

/**
 * 배열 데이터를 특정 필드를 기준으로 그룹화합니다.
 * @param {Array<object>} data - 그룹화할 데이터 배열.
 * @param {string|Array<string>} fields - 그룹화할 필드(들).
 * @returns {object} 그룹화된 데이터 객체.
 */
function groupData(data, fields) {
    if (!Array.isArray(data) || data.length === 0) {
        return {};
    }

    const groupFields = Array.isArray(fields) ? fields : [fields];
    const result = {};

    data.forEach(item => {
        const keyParts = groupFields.map(field => {
            const value = item[field];
            return value === undefined || value === null ? 'undefined' : value;
        });
        const key = keyParts.join('-'); // Use hyphen to join multiple field values

        if (!result[key]) {
            result[key] = [];
        }
        result[key].push(item);
    });

    return result;
}

/**
 * 복잡한 조건을 통해 데이터를 필터링합니다.
 * @param {Array<object>} data - 필터링할 데이터 배열.
 * @param {object} condition - 필터링 조건 객체.
 *   - 단일 조건: { field: 'name', operator: '=', value: 'John' }
 *   - 복합 조건: { operator: 'AND'|'OR', conditions: [...] }
 *   - 연산자: '=', '!=', '>', '>=', '<', '<=', 'regex', 'in', '!in'
 * @returns {Array<object>} 필터링된 데이터 배열.
 */
function filterData(data, condition) {
    if (!Array.isArray(data) || data.length === 0) {
        return [];
    }

    if (!condition) {
        return data;
    }

    const evaluateCondition = (item, cond) => {
        if (cond.operator === 'AND' || cond.operator === 'OR') {
            const results = cond.conditions.map(subCond => evaluateCondition(item, subCond));
            return cond.operator === 'AND' ? results.every(Boolean) : results.some(Boolean);
        } else {
            const value = item[cond.field];
            switch (cond.operator) {
                case '=': return value === cond.value;
                case '!=': return value !== cond.value;
                case '>': return value > cond.value;
                case '>=': return value >= cond.value;
                case '<': return value < cond.value;
                case '<=': return value <= cond.value;
                case 'regex': return typeof value === 'string' && new RegExp(cond.value).test(value);
                case 'in': return Array.isArray(cond.value) && cond.value.includes(value);
                case '!in': return Array.isArray(cond.value) && !cond.value.includes(value);
                default: return false;
            }
        }
    };

    return data.filter(item => evaluateCondition(item, condition));
}

/**
 * 숫자형 데이터의 합계, 평균, 최대/최소값, 빈도 분석을 수행합니다.
 * @param {Array<object>} data - 집계할 데이터 배열.
 * @param {string} field - 집계할 필드.
 * @param {string} operation - 수행할 집계 연산 ('sum', 'average', 'max', 'min', 'frequency').
 * @returns {number|object|null} 집계 결과.
 */
function aggregateData(data, field, operation) {
    if (!Array.isArray(data) || data.length === 0) {
        if (['sum', 'average'].includes(operation)) return 0;
        if (['max', 'min'].includes(operation)) return null;
        if (operation === 'frequency') return {};
        return null;
    }

    const numericValues = data.map(item => item[field]).filter(value => typeof value === 'number' && !isNaN(value));

    switch (operation) {
        case 'sum':
            return numericValues.reduce((acc, val) => acc + val, 0);
        case 'average':
            return numericValues.length > 0 ? numericValues.reduce((acc, val) => acc + val, 0) / numericValues.length : 0;
        case 'max':
            return numericValues.length > 0 ? Math.max(...numericValues) : null;
        case 'min':
            return numericValues.length > 0 ? Math.min(...numericValues) : null;
        case 'frequency':
            return data.reduce((acc, item) => {
                const value = item[field];
                acc[value] = (acc[value] || 0) + 1;
                return acc;
            }, {});
        default:
            throw new Error(`Unsupported aggregation operation: ${operation}`);
    }
}

/**
 * 다중 필드 정렬을 지원합니다.
 * @param {Array<object>} data - 정렬할 데이터 배열.
 * @param {string|Array<string>} fields - 정렬할 필드(들).
 * @param {string|Array<string>} orders - 각 필드의 정렬 순서 ('asc' 또는 'desc').
 * @returns {Array<object>} 정렬된 데이터 배열.
 */
function sortData(data, fields, orders) {
    if (!Array.isArray(data) || data.length === 0) {
        return [];
    }

    const sortFields = Array.isArray(fields) ? fields : [fields];
    const sortOrders = Array.isArray(orders) ? orders : [orders];

    return [...data].sort((a, b) => {
        for (let i = 0; i < sortFields.length; i++) {
            const field = sortFields[i];
            const order = sortOrders[i] || 'asc'; // Default to ascending

            const valA = a[field];
            const valB = b[field];

            if (valA < valB) {
                return order === 'asc' ? -1 : 1;
            }
            if (valA > valB) {
                return order === 'asc' ? 1 : -1;
            }
        }
        return 0;
    });
}

/**
 * 중복을 제거합니다.
 * @param {Array<object>} data - 중복 제거할 데이터 배열.
 * @param {string|Array<string>} [fields] - 중복을 판단할 필드(들). 없으면 전체 객체 비교.
 * @returns {Array<object>} 중복이 제거된 데이터 배열.
 */
function removeDuplicates(data, fields) {
    if (!Array.isArray(data) || data.length === 0) {
        return [];
    }

    const seen = new Set();
    const result = [];

    data.forEach(item => {
        let key;
        if (fields) {
            const uniqueFields = Array.isArray(fields) ? fields : [fields];
            key = JSON.stringify(uniqueFields.map(field => item[field]));
        } else {
            key = JSON.stringify(item);
        }

        if (!seen.has(key)) {
            seen.add(key);
            result.push(item);
        }
    });

    return result;
}

/**
 * 데이터 유효성을 검증합니다. (간단한 타입 및 필수 필드, 정규식 검증)
 * @param {object} data - 검증할 데이터 객체.
 * @param {object} schema - 검증 스키마. 예: { fieldName: { type: 'string', required: true, regex: /pattern/ } }
 * @returns {boolean} 유효성 검증 결과.
 */
function validateData(data, schema) {
    for (const field in schema) {
        if (Object.prototype.hasOwnProperty.call(schema, field)) {
            const rules = schema[field];
            const value = data[field];

            // Required check
            if (rules.required && (value === undefined || value === null || (typeof value === 'string' && value.trim() === ''))) {
                return false;
            }

            // Type check (if value exists)
            if (value !== undefined && value !== null) {
                if (rules.type && typeof value !== rules.type) {
                    return false;
                }
            }

            // Regex check (if value is string and regex is provided)
            if (rules.regex && typeof value === 'string' && !rules.regex.test(value)) {
                return false;
            }
        }
    }
    return true;
}

/**
 * JSON 파일을 읽습니다.
 * @param {string} filePath - JSON 파일 경로.
 * @returns {Array<object>|object} 파싱된 JSON 데이터.
 */
function readJsonFile(filePath) {
    try {
        const rawData = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(rawData);
    } catch (error) {
        console.error(`Error reading JSON file ${filePath}:`, error.message);
        throw error;
    }
}

/**
 * 데이터를 JSON 파일로 씁니다.
 * @param {string} filePath - JSON 파일 경로.
 * @param {Array<object>|object} data - 쓸 데이터.
 */
function writeJsonFile(filePath, data) {
    try {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error(`Error writing JSON file ${filePath}:`, error.message);
        throw error;
    }
}

/**
 * CSV 파일을 읽어 JSON 배열로 변환합니다.
 * @param {string} filePath - CSV 파일 경로.
 * @returns {Array<object>} 파싱된 JSON 데이터 배열.
 */
function readCsvFile(filePath) {
    try {
        const rawData = fs.readFileSync(filePath, 'utf8');
        const lines = rawData.trim().split('\n');
        if (lines.length === 0 || (lines.length === 1 && lines[0].trim() === '')) {
            return [];
        }
        const headers = lines[0].split(',');
        return lines.slice(1).map(line => {
            const values = line.split(',');
            const obj = {};
            headers.forEach((header, i) => {
                obj[header.trim()] = values[i] ? values[i].trim() : '';
            });
            return obj;
        });
    } catch (error) {
        console.error(`Error reading CSV file ${filePath}:`, error.message);
        throw error;
    }
}

/**
 * JSON 배열을 CSV 파일로 씁니다.
 * @param {string} filePath - CSV 파일 경로.
 * @param {Array<object>} data - 쓸 JSON 데이터 배열.
 */
function writeCsvFile(filePath, data) {
    try {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        if (data.length === 0) {
            fs.writeFileSync(filePath, '', 'utf8');
            return;
        }

        const allKeys = Array.from(new Set(data.flatMap(Object.keys)));
        const header = allKeys.join(',');
        const rows = data.map(item =>
            allKeys.map(key => {
                const value = item[key];
                // Handle commas in values by enclosing them in double quotes
                if (typeof value === 'string' && value.includes(',')) {
                    return `"${value.replace(/"/g, '""')}"`; // Escape double quotes
                }
                return value !== undefined && value !== null ? value : '';
            }).join(',')
        );

        fs.writeFileSync(filePath, [header, ...rows].join('\n'), 'utf8');
    } catch (error) {
        console.error(`Error writing CSV file ${filePath}:`, error.message);
        throw error;
    }
}

module.exports = {
    flattenJson,
    groupData,
    filterData,
    aggregateData,
    sortData,
    removeDuplicates,
    validateData,
    readJsonFile,
    writeJsonFile,
    readCsvFile,
    writeCsvFile
};
