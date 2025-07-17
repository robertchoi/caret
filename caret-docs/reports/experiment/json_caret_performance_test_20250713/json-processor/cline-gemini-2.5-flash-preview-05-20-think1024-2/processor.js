const { parse } = require('csv-parse');
const { stringify } = require('csv-stringify');
const fs = require('fs');
const util = require('util');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

class JsonProcessor {
  /**
   * 중첩된 JSON 객체를 평면화합니다.
   * @param {object} obj - 평면화할 JSON 객체.
   * @param {string} prefix - 재귀 호출을 위한 접두사.
   * @returns {object} 평면화된 객체.
   */
  static flattenJson(obj, prefix = '') {
    let result = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          if (Array.isArray(obj[key])) {
            obj[key].forEach((item, index) => {
              if (typeof item === 'object' && item !== null) {
                Object.assign(result, JsonProcessor.flattenJson(item, `${newKey}[${index}]`));
              } else {
                result[`${newKey}[${index}]`] = item;
              }
            });
          } else if (Object.keys(obj[key]).length === 0) { // 빈 객체 처리
            result[newKey] = {};
          } else {
            Object.assign(result, JsonProcessor.flattenJson(obj[key], newKey));
          }
        } else {
          result[newKey] = obj[key];
        }
      }
    }
    return result;
  }

  /**
   * 배열 데이터를 특정 필드를 기준으로 그룹화합니다.
   * @param {Array<object>} data - 그룹화할 배열 데이터.
   * @param {string|Array<string>} fields - 그룹화할 필드(들).
   * @returns {object} 그룹화된 객체.
   */
  static groupData(data, fields) {
    if (!Array.isArray(data)) {
      throw new Error("Input data must be an array.");
    }
    if (!Array.isArray(fields)) {
      fields = [fields];
    }

    return data.reduce((acc, item) => {
      const keyParts = fields.map(field => item[field]);
      // undefined 값이 포함된 경우, 해당 키를 'undefined'로 처리하거나,
      // 아니면 해당 항목을 그룹화하지 않도록 할 수 있습니다.
      // 여기서는 테스트 케이스에 맞춰 'undefined' 키를 그대로 사용하도록 합니다.
      const key = keyParts.some(part => part === undefined) ? 'undefined' : keyParts.join('-');
      
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {});
  }

  /**
   * 복잡한 조건으로 데이터를 필터링합니다.
   * @param {Array<object>} data - 필터링할 배열 데이터.
   * @param {function} conditionFn - 필터링 조건을 정의하는 함수. (예: item => item.age > 25 && item.department === "IT")
   * @returns {Array<object>} 필터링된 데이터.
   */
  static filterData(data, conditionFn) {
    if (!Array.isArray(data)) {
      throw new Error("Input data must be an array.");
    }
    if (typeof conditionFn !== 'function') {
      throw new Error("Condition must be a function.");
    }
    return data.filter(conditionFn);
  }

  /**
   * 숫자형 데이터에 대한 집계 통계를 계산합니다.
   * @param {Array<object>} data - 집계할 배열 데이터.
   * @param {string} field - 집계할 숫자형 필드.
   * @returns {object} 합계, 평균, 최대값, 최소값을 포함하는 객체.
   */
  static aggregateData(data, field) {
    if (!Array.isArray(data)) {
      throw new Error("Input data must be an array.");
    }
    const numbers = data
      .map(item => item[field])
      .filter(value => typeof value === 'number' && !isNaN(value));

    if (numbers.length === 0) {
      return { sum: 0, average: 0, max: null, min: null };
    }

    const sum = numbers.reduce((acc, val) => acc + val, 0);
    const average = sum / numbers.length;
    const max = Math.max(...numbers);
    const min = Math.min(...numbers);

    return { sum, average, max, min };
  }

  /**
   * 특정 필드의 값에 대한 빈도를 계산합니다.
   * @param {Array<object>} data - 빈도를 계산할 배열 데이터.
   * @param {string} field - 빈도를 계산할 필드.
   * @param {boolean} caseSensitive - 대소문자 구분 여부.
   * @returns {object} 각 값의 빈도를 포함하는 객체.
   */
  static analyzeFrequency(data, field, caseSensitive = true) {
    if (!Array.isArray(data)) {
      throw new Error("Input data must be an array.");
    }
    return data.reduce((acc, item) => {
      let value = item[field];
      if (typeof value === 'string' && !caseSensitive) {
        value = value.toLowerCase();
      }
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * 다중 필드를 기준으로 데이터를 정렬합니다.
   * @param {Array<object>} data - 정렬할 배열 데이터.
   * @param {Array<object>} sortConditions - 정렬 조건 배열 (예: [{field: "department", order: "asc"}, {field: "age", order: "desc"}]).
   * @returns {Array<object>} 정렬된 데이터.
   */
  static sortData(data, sortConditions) {
    if (!Array.isArray(data)) {
      throw new Error("Input data must be an array.");
    }
    if (!Array.isArray(sortConditions)) {
      throw new Error("Sort conditions must be an array.");
    }

    return [...data].sort((a, b) => {
      for (const condition of sortConditions) {
        const { field, order } = condition;
        const valA = a[field];
        const valB = b[field];

        // null, undefined 값을 항상 마지막에 위치
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (typeof valA === 'string' && typeof valB === 'string') {
          const comparison = valA.localeCompare(valB);
          if (comparison !== 0) {
            return order === 'asc' ? comparison : -comparison;
          }
        } else if (typeof valA === 'number' && typeof valB === 'number') {
          const comparison = valA - valB;
          if (comparison !== 0) {
            return order === 'asc' ? comparison : -comparison;
          }
        }
        // 다른 타입의 비교 로직 추가 가능 (예: Date 객체)
      }
      return 0;
    });
  }

  /**
   * 중복된 데이터를 제거합니다.
   * @param {Array<object>} data - 중복 제거할 배열 데이터.
   * @param {string|Array<string>} [fields] - 중복을 판단할 필드(들). 없으면 모든 필드 기준.
   * @returns {Array<object>} 중복 제거된 데이터.
   */
  static deduplicateData(data, fields) {
    if (!Array.isArray(data)) {
      throw new Error("Input data must be an array.");
    }
    if (data.length === 0) {
      return [];
    }

    const seen = new Set();
    const result = [];

    for (const item of data) {
      let key;
      if (fields) {
        const fieldsArray = Array.isArray(fields) ? fields : [fields];
        key = JSON.stringify(fieldsArray.map(field => item[field]));
      } else {
        key = JSON.stringify(item);
      }

      if (!seen.has(key)) {
        seen.add(key);
        result.push(item);
      }
    }
    return result;
  }

  /**
   * 스키마 정의에 따라 데이터의 유효성을 검증합니다.
   * @param {Array<object>} data - 유효성을 검증할 배열 데이터.
   * @param {object} schema - 유효성 검증 스키마 (예: {name: "string", age: "number", email: "email"}).
   * @returns {Array<object>} 유효한 데이터.
   */
  static validateData(data, schema) {
    if (!Array.isArray(data)) {
      throw new Error("Input data must be an array.");
    }
    if (typeof schema !== 'object' || schema === null) {
      throw new Error("Schema must be an object.");
    }

    const validData = [];
    for (const item of data) {
      let isValid = true;
      for (const key in schema) {
        if (schema.hasOwnProperty(key)) {
          const expectedType = schema[key];
          const value = item[key];

          // 필수 필드 검증 (undefined 또는 null)
          if (value === undefined || value === null) {
            isValid = false;
            break;
          }

          // 타입 검증
          if (expectedType === 'string' && typeof value !== 'string') {
            isValid = false;
            break;
          }
          if (expectedType === 'number' && typeof value !== 'number') {
            isValid = false;
            break;
          }
          if (expectedType === 'boolean' && typeof value !== 'boolean') {
            isValid = false;
            break;
          }
          // 이메일 형식 검증 (정규식)
          if (expectedType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            isValid = false;
            break;
          }
          // 추가적인 타입 또는 정규식 검증 로직 추가 가능
        }
      }
      if (isValid) {
        validData.push(item);
      }
    }
    return validData;
  }

  /**
   * JSON 파일을 읽습니다.
   * @param {string} filePath - JSON 파일 경로.
   * @returns {Promise<object|Array>} JSON 데이터.
   */
  static async readJsonFile(filePath) {
    try {
      const data = await readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading JSON file ${filePath}:`, error.message);
      throw error;
    }
  }

  /**
   * JSON 데이터를 파일에 씁니다.
   * @param {string} filePath - JSON 파일을 쓸 경로.
   * @param {object|Array} data - 쓸 JSON 데이터.
   * @returns {Promise<void>}
   */
  static async writeJsonFile(filePath, data) {
    try {
      await writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`JSON data successfully written to ${filePath}`);
    } catch (error) {
      console.error(`Error writing JSON file ${filePath}:`, error.message);
      throw error;
    }
  }

  /**
   * CSV 파일을 읽습니다.
   * @param {string} filePath - CSV 파일 경로.
   * @param {boolean} hasHeader - 헤더 포함 여부.
   * @returns {Promise<Array<object>>} CSV 데이터 (객체 배열).
   */
  static async readCsvFile(filePath, hasHeader = true) {
    try {
      const data = await readFile(filePath, 'utf8');
      return new Promise((resolve, reject) => {
        parse(data, {
          columns: hasHeader,
          skip_empty_lines: true
        }, (err, records) => {
          if (err) {
            return reject(err);
          }
          resolve(records);
        });
      });
    } catch (error) {
      console.error(`Error reading CSV file ${filePath}:`, error.message);
      throw error;
    }
  }

  /**
   * CSV 데이터를 파일에 씁니다.
   * @param {string} filePath - CSV 파일을 쓸 경로.
   * @param {Array<object>} data - 쓸 CSV 데이터 (객체 배열).
   * @param {boolean} includeHeader - 헤더 포함 여부.
   * @returns {Promise<void>}
   */
  static async writeCsvFile(filePath, data, includeHeader = true) {
    if (!Array.isArray(data) || data.length === 0) {
      await writeFile(filePath, '', 'utf8'); // 빈 파일 생성
      console.log(`CSV data successfully written to ${filePath} (empty data)`);
      return;
    }

    const columns = includeHeader ? Object.keys(data[0]) : undefined;

    try {
      const output = await new Promise((resolve, reject) => {
        stringify(data, { header: includeHeader, columns: columns }, (err, result) => {
          if (err) {
            return reject(err);
          }
          resolve(result);
        });
      });
      await writeFile(filePath, output, 'utf8');
      console.log(`CSV data successfully written to ${filePath}`);
    } catch (error) {
      console.error(`Error writing CSV file ${filePath}:`, error.message);
      throw error;
    }
  }
}

module.exports = JsonProcessor;
