const fs = require('fs');
const path = require('path');

/**
 * 중첩된 JSON 객체를 평면화합니다.
 * @param {object} obj - 평면화할 JSON 객체.
 * @param {string} prefix - 재귀 호출을 위한 접두사.
 * @param {object} res - 결과를 저장할 객체.
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
 * @param {string|Array<string>} keys - 그룹화할 필드(들).
 * @returns {object} 그룹화된 데이터 객체.
 */
function groupData(data, keys) {
  if (!Array.isArray(data)) {
    throw new Error("Input data must be an array.");
  }
  if (!keys) {
    return data;
  }

  const groupKeys = Array.isArray(keys) ? keys : [keys];

  return data.reduce((acc, item) => {
    let currentGroup = acc;
    let groupNameParts = [];

    for (let i = 0; i < groupKeys.length; i++) {
      const key = groupKeys[i];
      const value = item[key];
      const groupValue = value === undefined ? 'undefined' : value; // undefined 값 처리

      groupNameParts.push(groupValue);

      if (i === groupKeys.length - 1) {
        // 마지막 키일 경우 배열에 추가
        if (!currentGroup[groupValue]) {
          currentGroup[groupValue] = [];
        }
        currentGroup[groupValue].push(item);
      } else {
        // 중간 키일 경우 다음 중첩 객체로 이동
        if (!currentGroup[groupValue]) {
          currentGroup[groupValue] = {};
        }
        currentGroup = currentGroup[groupValue];
      }
    }
    return acc;
  }, {});
}

/**
 * 복잡한 조건을 통해 데이터를 필터링합니다.
 * @param {Array<object>} data - 필터링할 데이터 배열.
 * @param {object} condition - 필터링 조건 객체 (예: { type: 'AND', conditions: [{ field: 'age', operator: '>', value: 30 }] }).
 * @returns {Array<object>} 필터링된 데이터 배열.
 */
function filterData(data, condition) {
  if (!Array.isArray(data)) {
    throw new Error("Input data must be an array.");
  }
  if (!condition || Object.keys(condition).length === 0) {
    return data;
  }

  const evaluateCondition = (item, cond) => {
    if (cond.type === 'AND') {
      return cond.conditions.every(c => evaluateCondition(item, c));
    } else if (cond.type === 'OR') {
      return cond.conditions.some(c => evaluateCondition(item, c));
    } else {
      const value = item[cond.field];
      switch (cond.operator) {
        case '=':
          return value === cond.value;
        case '!=':
          return value !== cond.value;
        case '>':
          return value > cond.value;
        case '<':
          return value < cond.value;
        case '>=':
          return value >= cond.value;
        case '<=':
          return value <= cond.value;
        case 'regex':
          try {
            const regex = new RegExp(cond.value);
            return regex.test(value);
          } catch (e) {
            console.warn(`Invalid regex: ${cond.value}. Skipping condition.`);
            return false;
          }
        default:
          return false;
      }
    }
  };

  return data.filter(item => evaluateCondition(item, condition));
}

/**
 * 숫자형 데이터의 합계, 평균, 최대/최소값, 빈도 분석을 수행합니다.
 * @param {Array<object>} data - 집계할 데이터 배열.
 * @param {string} field - 집계할 필드.
 * @param {string} operation - 수행할 연산 ('sum', 'avg', 'max', 'min', 'count').
 * @returns {number|object} 집계 결과.
 */
function aggregateData(data, field, operation) {
  if (!Array.isArray(data)) {
    throw new Error("Input data must be an array.");
  }
  if (!field || !operation) {
    throw new Error("Field and operation are required for aggregation.");
  }

  const numbers = data.map(item => item[field]).filter(value => typeof value === 'number');

  switch (operation) {
    case 'sum':
      return numbers.reduce((acc, val) => acc + val, 0);
    case 'avg':
      return numbers.length > 0 ? numbers.reduce((acc, val) => acc + val, 0) / numbers.length : 0;
    case 'max':
      return numbers.length > 0 ? Math.max(...numbers) : undefined;
    case 'min':
      return numbers.length > 0 ? Math.min(...numbers) : undefined;
    case 'count':
      const counts = {};
      data.forEach(item => {
        const value = item[field];
        counts[value] = (counts[value] || 0) + 1;
      });
      return counts;
    default:
      throw new Error(`Unsupported aggregation operation: ${operation}`);
  }
}

/**
 * 데이터를 다중 필드를 기준으로 정렬합니다.
 * @param {Array<object>} data - 정렬할 데이터 배열.
 * @param {Array<object>} sortBys - 정렬 기준 배열 (예: [{ field: 'age', order: 'asc' }, { field: 'name', order: 'desc' }]).
 * @returns {Array<object>} 정렬된 데이터 배열.
 */
function sortData(data, sortBys) {
  if (!Array.isArray(data)) {
    throw new Error("Input data must be an array.");
  }
  if (!sortBys || sortBys.length === 0) {
    return [...data]; // 원본 배열 변경 방지
  }

  return [...data].sort((a, b) => {
    for (const sortBy of sortBys) {
      const valA = a[sortBy.field];
      const valB = b[sortBy.field];

      if (valA < valB) {
        return sortBy.order === 'asc' ? -1 : 1;
      }
      if (valA > valB) {
        return sortBy.order === 'asc' ? 1 : -1;
      }
    }
    return 0;
  });
}

/**
 * 특정 필드 또는 전체 레코드를 기준으로 중복된 데이터를 제거합니다.
 * @param {Array<object>} data - 중복 제거할 데이터 배열.
 * @param {string} [key] - 중복을 확인할 필드 (선택 사항). 없으면 전체 레코드 기준.
 * @returns {Array<object>} 중복 제거된 데이터 배열.
 */
function removeDuplicates(data, key) {
  if (!Array.isArray(data)) {
    throw new Error("Input data must be an array.");
  }
  if (!key) {
    // 전체 레코드 기준 중복 제거
    const seen = new Set();
    return data.filter(item => {
      const stringified = JSON.stringify(item);
      if (seen.has(stringified)) {
        return false;
      }
      seen.add(stringified);
      return true;
    });
  } else {
    // 특정 필드 기준 중복 제거
    const seen = new Set();
    return data.filter(item => {
      const value = item[key];
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  }
}

/**
 * 정의된 스키마 또는 규칙에 따라 데이터의 유효성을 검증합니다.
 * @param {Array<object>} data - 유효성을 검증할 데이터 배열.
 * @param {object} schema - 유효성 검증 스키마 (예: { name: { type: 'string', required: true }, age: { type: 'number', min: 0 } }).
 * @returns {Array<object>} 유효성 검증 결과 (유효한 데이터만 반환).
 */
function validateData(data, schema) {
  if (!Array.isArray(data)) {
    throw new Error("Input data must be an array.");
  }
  if (!schema || Object.keys(schema).length === 0) {
    return [...data]; // 스키마가 없으면 모든 데이터 유효하다고 간주
  }

  return data.filter(item => {
    for (const field in schema) {
      if (Object.prototype.hasOwnProperty.call(schema, field)) {
        const rules = schema[field];
        const value = item[field];

        // 필수 필드 검증
        if (rules.required && (value === undefined || value === null || value === '')) {
          return false;
        }

        // 타입 검증
        if (rules.type && typeof value !== rules.type && value !== undefined) {
          return false;
        }

        // 최소값 검증 (숫자형)
        if (rules.min !== undefined && typeof value === 'number' && value < rules.min) {
          return false;
        }

        // 최대값 검증 (숫자형)
        if (rules.max !== undefined && typeof value === 'number' && value > rules.max) {
          return false;
        }

        // 정규식 패턴 검증 (문자열)
        if (rules.pattern && typeof value === 'string' && !new RegExp(rules.pattern).test(value)) {
          return false;
        }
      }
    }
    return true;
  });
}

/**
 * JSON 파일을 읽습니다.
 * @param {string} filePath - JSON 파일 경로.
 * @returns {Array<object>|object} JSON 데이터.
 */
function readJsonFile(filePath) {
  const fullPath = path.resolve(filePath);
  const data = fs.readFileSync(fullPath, 'utf8');
  return JSON.parse(data);
}

/**
 * JSON 데이터를 파일에 씁니다.
 * @param {string} filePath - JSON 파일을 쓸 경로.
 * @param {Array<object>|object} data - 쓸 JSON 데이터.
 */
function writeJsonFile(filePath, data) {
  const fullPath = path.resolve(filePath);
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * CSV 파일을 읽고 JSON으로 변환합니다.
 * @param {string} filePath - CSV 파일 경로.
 * @returns {Array<object>} JSON 데이터 배열.
 */
function readCsvFile(filePath) {
  const fullPath = path.resolve(filePath);
  const data = fs.readFileSync(fullPath, 'utf8');
  const lines = data.trim().split('\n');
  const headers = lines[0].split(',').map(header => header.trim());
  const result = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(value => value.trim());
    const obj = {};
    headers.forEach((header, index) => {
      let parsedValue = values[index];
      // 숫자형으로 변환 시도
      if (!isNaN(parsedValue) && parsedValue !== '') {
        parsedValue = Number(parsedValue);
      }
      obj[header] = parsedValue;
    });
    result.push(obj);
  }
  return result;
}

/**
 * JSON 데이터를 CSV 파일로 변환하여 씁니다.
 * @param {string} filePath - CSV 파일을 쓸 경로.
 * @param {Array<object>} data - JSON 데이터 배열.
 */
function writeCsvFile(filePath, data) {
  if (!Array.isArray(data) || data.length === 0) {
    fs.writeFileSync(filePath, '', 'utf8');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvRows = [];
  csvRows.push(headers.join(','));

  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`; // 쉼표 포함 시 따옴표로 묶기
      }
      return value;
    });
    csvRows.push(values.join(','));
  });

  const fullPath = path.resolve(filePath);
  fs.writeFileSync(fullPath, csvRows.join('\n'), 'utf8');
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
