'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isNetworkError = isNetworkError;
exports.default = axiosRetry;

var _isRetryAllowed = require('is-retry-allowed');

var _isRetryAllowed2 = _interopRequireDefault(_isRetryAllowed);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var namespace = 'axios-retry';

/**
 * @param  {Error}  error
 * @return {boolean}
 */
function isNetworkError(error) {
  return !error.response;
}

/**
 * Initializes and returns the retry state for the given request/config
 * @param  {AxiosRequestConfig} config
 * @return {Object}
 */
function getCurrentState(config) {
  var currentState = config[namespace] || {};
  currentState.retryCount = currentState.retryCount || 0;
  config[namespace] = currentState;
  return currentState;
}

/**
 * Returns the axios-retry options for the current request
 * @param  {AxiosRequestConfig} config
 * @param  {AxiosRetryConfig} defaultOptions
 * @return {AxiosRetryConfig}
 */
function getRequestOptions(config, defaultOptions) {
  return Object.assign({}, defaultOptions, config[namespace]);
}

/**
 * @param  {Axios} axios
 * @param  {AxiosRequestConfig} config
 */
function fixConfig(axios, config) {
  if (axios.defaults.agent === config.agent) {
    delete config.agent;
  }
  if (axios.defaults.httpAgent === config.httpAgent) {
    delete config.httpAgent;
  }
  if (axios.defaults.httpsAgent === config.httpsAgent) {
    delete config.httpsAgent;
  }
}

/**
 * Adds response interceptors to an axios instance to retry requests failed due to network issues
 *
 * @example
 *
 * import axios from 'axios';
 *
 * axiosRetry(axios, { retries: 3 });
 *
 * axios.get('http://example.com/test') // The first request fails and the second returns 'ok'
 *   .then(result => {
 *     result.data; // 'ok'
 *   });
 *
 * // Also works with custom axios instances
 * const client = axios.create({ baseURL: 'http://example.com' });
 * axiosRetry(client, { retries: 3 });
 *
 * client.get('/test') // The first request fails and the second returns 'ok'
 *   .then(result => {
 *     result.data; // 'ok'
 *   });
 *
 * // Allows request-specific configuration
 * client
 *   .get('/test', {
 *     'axios-retry': {
 *       retries: 0
 *     }
 *   })
 *   .catch(error => { // The first request fails
 *     error !== undefined
 *   });
 *
 * @param {Axios} axios An axios instance (the axios object or one created from axios.create)
 * @param {Object} [defaultOptions]
 * @param {number} [defaultOptions.retries=3] Number of retries
 * @param {number} [defaultOptions.retryCondition=isNetworkError] Number of retries
 * @param {number} [defaultOptions.delay=0] Delay between retries
 */
function axiosRetry(axios, defaultOptions) {
  axios.interceptors.response.use(null, function (error) {
    var config = error.config;

    // If we have no information to retry the request
    if (!config) {
      return Promise.reject(error);
    }

    var _getRequestOptions = getRequestOptions(config, defaultOptions),
        _getRequestOptions$re = _getRequestOptions.retries,
        retries = _getRequestOptions$re === undefined ? 3 : _getRequestOptions$re,
        _getRequestOptions$re2 = _getRequestOptions.retryCondition,
        retryCondition = _getRequestOptions$re2 === undefined ? isNetworkError : _getRequestOptions$re2,
        _getRequestOptions$de = _getRequestOptions.delay,
        delay = _getRequestOptions$de === undefined ? 0 : _getRequestOptions$de;

    var currentState = getCurrentState(config);

    var shouldRetry = retryCondition(error) && error.code !== 'ECONNABORTED' && currentState.retryCount < retries && (0, _isRetryAllowed2.default)(error);

    if (shouldRetry) {
      return new Promise(function (resolve) {
        setTimeout(resolve, delay);
      }).then(function () {
        currentState.retryCount++;

        // Axios fails merging this configuration to the default configuration because it has
        // an issue with circular structures: https://github.com/mzabriskie/axios/issues/370
        fixConfig(axios, config);

        var now = Date.now();
        if (config.timeout && currentState.lastRequestTime) {
          config.timeout -= now - currentState.lastRequestTime;
        }
        currentState.lastRequestTime = now;

        return axios(config);
      });
    }

    return Promise.reject(error);
  });
}
//# sourceMappingURL=index.js.map