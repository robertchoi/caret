const fs = require('fs');
const path = require('path');

class JsonProcessor {
  /**
   * 중첩 JSON 객체를 평면화합니다.
   * @param {object} obj - 평면화할 JSON 객체.
   * @param {string} prefix - 재귀 호출을 위한 접두사.
   * @returns {object} 평면화된 JSON 객체.
   */
  flattenJson(obj, prefix = '') {
    const result = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          Object.assign(result, this.flattenJson(obj[key], newKey));
        } else {
          result[newKey] = obj[key];
        }
      }
    }
    return result;
  }

  /**
   * 배열 데이터를 지정된 키를 기준으로 그룹화합니다.
   * @param {Array<object>} data - 그룹화할 데이터 배열.
   * @param {Array<string>} keys - 그룹화할 키 배열.
   * @returns {object} 그룹화된 데이터 객체.
   */
  groupData(data, keys) {
    if (!Array.isArray(data)) {
      throw new Error('Input data must be an array.');
    }
    if (!Array.isArray(keys) || keys.length === 0) {
      throw new Error('Grouping keys must be a non-empty array.');
    }

    return data.reduce((acc, item) => {
      let currentGroup = acc;
      const groupValues = [];
      for (const key of keys) {
        const value = item[key];
        if (value === undefined) {
          throw new Error(`Key '${key}' not found in some items for grouping.`);
        }
        groupValues.push(value);
        if (!currentGroup[value]) {
          currentGroup[value] = {};
        }
        currentGroup = currentGroup[value];
      }
      if (!currentGroup.items) {
        currentGroup.items = [];
      }
      currentGroup.items.push(item);
      return acc;
    }, {});
  }

  /**
   * 복잡한 조건을 통해 데이터를 필터링합니다.
   * 조건은 { field: 'fieldName', operator: 'operator', value: 'value', type: 'string|number|regex' } 형태의 객체 배열입니다.
   * 논리 연산자는 'AND', 'OR'을 지원합니다.
   * @param {Array<object>} data - 필터링할 데이터 배열.
   * @param {Array<object>} conditions - 필터링 조건 배열.
   * @param {string} logicalOperator - 'AND' 또는 'OR'.
   * @returns {Array<object>} 필터링된 데이터 배열.
   */
  filterData(data, conditions, logicalOperator = 'AND') {
    if (!Array.isArray(data)) {
      throw new Error('Input data must be an array.');
    }
    if (!Array.isArray(conditions) || conditions.length === 0) {
      return data; // 조건이 없으면 원본 데이터 반환
    }

    return data.filter(item => {
      const results = conditions.map(condition => {
        const { field, operator, value, type } = condition;
        const itemValue = item[field];

        if (itemValue === undefined) {
          return false; // 필드가 없으면 조건 불만족
        }

        switch (operator) {
          case 'eq': // equal
            return itemValue === value;
          case 'ne': // not equal
            return itemValue !== value;
          case 'gt': // greater than
            return type === 'number' && itemValue > value;
          case 'lt': // less than
            return type === 'number' && itemValue < value;
          case 'ge': // greater than or equal
            return type === 'number' && itemValue >= value;
          case 'le': // less than or equal
            return type === 'number' && itemValue <= value;
          case 'regex': // regular expression
            if (type === 'regex') {
              const regex = new RegExp(value);
              return regex.test(itemValue);
            }
            return false;
          default:
            return false;
        }
      });

      if (logicalOperator.toUpperCase() === 'OR') {
        return results.some(r => r);
      } else { // Default to AND
        return results.every(r => r);
      }
    });
  }

  /**
   * 숫자형 데이터의 합계를 계산합니다.
   * @param {Array<object>} data - 데이터 배열.
   * @param {string} field - 합계를 계산할 숫자형 필드.
   * @returns {number} 합계.
   */
  sum(data, field) {
    if (!Array.isArray(data)) {
      throw new Error('Input data must be an array.');
    }
    const values = data.map(item => item[field]).filter(val => typeof val === 'number');
    if (values.length === 0) {
      return 0;
    }
    return values.reduce((acc, val) => acc + val, 0);
  }

  /**
   * 숫자형 데이터의 평균을 계산합니다.
   * @param {Array<object>} data - 데이터 배열.
   * @param {string} field - 평균을 계산할 숫자형 필드.
   * @returns {number} 평균.
   */
  average(data, field) {
    if (!Array.isArray(data)) {
      throw new Error('Input data must be an array.');
    }
    const values = data.map(item => item[field]).filter(val => typeof val === 'number');
    if (values.length === 0) {
      return 0;
    }
    return this.sum(data, field) / values.length;
  }

  /**
   * 숫자형 데이터의 최대값을 계산합니다.
   * @param {Array<object>} data - 데이터 배열.
   * @param {string} field - 최대값을 계산할 숫자형 필드.
   * @returns {number} 최대값.
   */
  max(data, field) {
    if (!Array.isArray(data)) {
      throw new Error('Input data must be an array.');
    }
    const values = data.map(item => item[field]).filter(val => typeof val === 'number');
    if (values.length === 0) {
      return undefined;
    }
    return Math.max(...values);
  }

  /**
   * 숫자형 데이터의 최소값을 계산합니다.
   * @param {Array<object>} data - 데이터 배열.
   * @param {string} field - 최소값을 계산할 숫자형 필드.
   * @returns {number} 최소값.
   */
  min(data, field) {
    if (!Array.isArray(data)) {
      throw new Error('Input data must be an array.');
    }
    const values = data.map(item => item[field]).filter(val => typeof val === 'number');
    if (values.length === 0) {
      return undefined;
    }
    return Math.min(...values);
  }

  /**
   * 특정 필드의 값에 대한 빈도수를 계산합니다.
   * @param {Array<object>} data - 데이터 배열.
   * @param {string} field - 빈도수를 계산할 필드.
   * @returns {object} 각 값의 빈도수를 담은 객체.
   */
  frequency(data, field) {
    if (!Array.isArray(data)) {
      throw new Error('Input data must be an array.');
    }
    return data.reduce((acc, item) => {
      const value = item[field];
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * 다중 필드를 기준으로 데이터를 정렬합니다.
   * @param {Array<object>} data - 정렬할 데이터 배열.
   * @param {Array<object>} sortBys - 정렬 기준 배열. 예: [{ field: 'name', order: 'asc' }, { field: 'age', order: 'desc' }]
   * @returns {Array<object>} 정렬된 데이터 배열.
   */
  sortData(data, sortBys) {
    if (!Array.isArray(data)) {
      throw new Error('Input data must be an array.');
    }
    if (!Array.isArray(sortBys) || sortBys.length === 0) {
      return [...data]; // 정렬 기준이 없으면 원본 복사본 반환
    }

    return [...data].sort((a, b) => {
      for (const sortBy of sortBys) {
        const { field, order = 'asc' } = sortBy;
        const valA = a[field];
        const valB = b[field];

        if (valA === valB) continue;

        if (order.toLowerCase() === 'desc') {
          return valA < valB ? 1 : -1;
        } else {
          return valA < valB ? -1 : 1;
        }
      }
      return 0;
    });
  }

  /**
   * 지정된 필드를 기준으로 중복된 데이터를 제거합니다.
   * @param {Array<object>} data - 중복 제거할 데이터 배열.
   * @param {Array<string>} fields - 중복을 확인할 필드 배열.
   * @returns {Array<object>} 중복이 제거된 데이터 배열.
   */
  removeDuplicates(data, fields) {
    if (!Array.isArray(data)) {
      throw new Error('Input data must be an array.');
    }
    if (!Array.isArray(fields) || fields.length === 0) {
      return [...new Set(data)]; // 필드가 없으면 객체 참조 기준으로 중복 제거
    }

    const seen = new Set();
    return data.filter(item => {
      const key = fields.map(field => item[field]).join('|');
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * 데이터 유효성을 검증합니다. (간단한 필수 필드 존재 여부 검증)
   * @param {Array<object>} data - 검증할 데이터 배열.
   * @param {Array<string>} requiredFields - 필수 필드 배열.
   * @returns {boolean} 유효성 검증 결과.
   */
  validateData(data, requiredFields) {
    if (!Array.isArray(data)) {
      throw new Error('Input data must be an array.');
    }
    if (!Array.isArray(requiredFields) || requiredFields.length === 0) {
      return true; // 필수 필드가 없으면 항상 유효
    }

    return data.every(item => {
      return requiredFields.every(field => Object.prototype.hasOwnProperty.call(item, field));
    });
  }

  /**
   * JSON 파일을 읽습니다.
   * @param {string} filePath - JSON 파일 경로.
   * @returns {Array<object>|object} JSON 데이터.
   */
  readJsonFile(filePath) {
    try {
      const fullPath = path.resolve(filePath);
      const data = fs.readFileSync(fullPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      throw new Error(`Error reading JSON file: ${error.message}`);
    }
  }

  /**
   * JSON 데이터를 파일에 씁니다.
   * @param {string} filePath - 저장할 파일 경로.
   * @param {Array<object>|object} data - 저장할 JSON 데이터.
   */
  writeJsonFile(filePath, data) {
    try {
      const fullPath = path.resolve(filePath);
      fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      throw new Error(`Error writing JSON file: ${error.message}`);
    }
  }

  /**
   * CSV 파일을 읽습니다. (간단한 구현, 첫 줄을 헤더로 간주)
   * @param {string} filePath - CSV 파일 경로.
   * @returns {Array<object>} CSV 데이터.
   */
  readCsvFile(filePath) {
    try {
      const fullPath = path.resolve(filePath);
      const data = fs.readFileSync(fullPath, 'utf8');
      const lines = data.trim().split('\n');
      if (lines.length === 0) return [];

      const headers = lines[0].split(',').map(h => h.trim());
      return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const obj = {};
        headers.forEach((header, i) => {
          // 숫자형으로 변환 가능한 경우 변환
          obj[header] = isNaN(Number(values[i])) ? values[i] : Number(values[i]);
        });
        return obj;
      });
    } catch (error) {
      throw new Error(`Error reading CSV file: ${error.message}`);
    }
  }

  /**
   * 데이터를 CSV 파일로 씁니다.
   * @param {string} filePath - 저장할 파일 경로.
   * @param {Array<object>} data - 저장할 데이터 배열.
   */
  writeCsvFile(filePath, data) {
    try {
      const fullPath = path.resolve(filePath);
      if (data.length === 0) {
        fs.writeFileSync(fullPath, '', 'utf8');
        return;
      }

      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => row[header]).join(','))
      ].join('\n');

      fs.writeFileSync(fullPath, csvContent, 'utf8');
    } catch (error) {
      throw new Error(`Error writing CSV file: ${error.message}`);
    }
  }
}

module.exports = JsonProcessor;
