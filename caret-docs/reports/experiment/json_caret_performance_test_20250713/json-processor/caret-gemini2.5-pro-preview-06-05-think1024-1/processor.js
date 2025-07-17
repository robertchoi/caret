const _ = require('lodash');

/**
 * 중첩된 JSON 객체를 평면화합니다.
 * @param {object} obj - 평면화할 객체
 * @param {string} parentKey - 상위 키 (재귀 호출용)
 * @param {object} result - 결과 객체 (재귀 호출용)
 * @returns {object} 평면화된 객체
 */
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

/**
 * 키를 기준으로 데이터를 그룹화합니다.
 * @param {Array<object>} data - 데이터 배열
 * @param {string} key - 그룹화 기준 키
 * @returns {object} 그룹화된 객체
 */
function group(data, key) {
    return _.groupBy(data, key);
}

/**
 * 주어진 조건에 따라 데이터를 필터링합니다.
 * @param {Array<object>} data - 데이터 배열
 * @param {object} conditions - 필터링 조건
 * @returns {Array<object>} 필터링된 데이터 배열
 */
function filter(data, conditions) {
    // 이 함수는 복잡한 조건을 처리하기 위해 더 정교한 구현이 필요합니다.
    // 우선 간단한 정규식과 $or, $gt (greater than) 연산자만 지원합니다.
    return data.filter(item => {
        const flatItem = flatten(item);
        
        const checkCondition = (conds) => {
            for (const key in conds) {
                if (key === '$or') {
                    if (!conds[key].some(orCond => checkCondition(orCond))) {
                        return false;
                    }
                } else {
                    const itemValue = _.get(item, key);
                    const conditionValue = conds[key];

                    if (conditionValue instanceof RegExp) {
                        if (!conditionValue.test(itemValue)) return false;
                    } else if (typeof conditionValue === 'object' && conditionValue !== null) {
                        if (conditionValue.$gt && !(itemValue > conditionValue.$gt)) return false;
                        // 다른 연산자($lt, $lte, $gte 등) 추가 가능
                    } else {
                        if (itemValue !== conditionValue) return false;
                    }
                }
            }
            return true;
        };

        return checkCondition(conditions);
    });
}


/**
 * 특정 필드의 통계치를 계산합니다.
 * @param {Array<object>} data - 데이터 배열
 * @param {string} field - 통계 계산 대상 필드
 * @param {Array<string>} types - 계산할 통계 유형 (sum, avg, max, min)
 * @returns {object} 계산된 통계 결과
 */
function aggregate(data, field, types) {
    const values = data.map(item => item[field]);
    const result = {};
    if (types.includes('sum')) result.sum = _.sum(values);
    if (types.includes('avg')) result.avg = _.mean(values);
    if (types.includes('max')) result.max = _.max(values);
    if (types.includes('min')) result.min = _.min(values);
    return result;
}

/**
 * 다중 필드를 기준으로 데이터를 정렬합니다.
 * @param {Array<object>} data - 데이터 배열
 * @param {Array<string>} fields - 정렬 기준 필드 (예: ['name:asc', 'age:desc'])
 * @returns {Array<object>} 정렬된 데이터 배열
 */
function sort(data, fields) {
    const [keys, orders] = _.unzip(fields.map(f => f.split(':')));
    return _.orderBy(data, keys, orders);
}

/**
 * 지정된 키를 기준으로 중복 데이터를 제거합니다.
 * @param {Array<object>} data - 데이터 배열
 * @param {string} key - 중복 비교 기준 키
 * @returns {Array<object>} 중복이 제거된 데이터 배열
 */
function deduplicate(data, key) {
    return _.uniqBy(data, item => _.get(item, key));
}

/**
 * 스키마에 따라 데이터 유효성을 검증합니다.
 * @param {Array<object>} data - 데이터 배열
 * @param {object} schema - 유효성 검증 스키마 (예: { 'user.name': 'string' })
 * @returns {{valid: Array<object>, invalid: Array<object>}} 유효/무효 데이터 객체
 */
function validate(data, schema) {
    const valid = [];
    const invalid = [];
    data.forEach(item => {
        const flatItem = flatten(item);
        let isValid = true;
        for (const key in schema) {
            if (typeof flatItem[key] !== schema[key]) {
                isValid = false;
                break;
            }
        }
        if (isValid) {
            valid.push(item);
        } else {
            invalid.push(item);
        }
    });
    return { valid, invalid };
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
