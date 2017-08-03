import * as axios from 'axios'

export interface IAxiosRetryConfig {
  /**
   * The number of times to retry before failing
   * default: 3
   * 
   * @type {number}
   */
  retries?: number,
  /**
   * A callback to further control if a request should be retried. By default, it retries if the result did not have a response.
   * default: error => !error.response
   * 
   * @type {Function}
   */
  retryCondition?: (error: axios.AxiosError) => boolean
  /**
   * The delay between retries, it can be a simple number or function which recieves attempt count as argument ar returns delay as a nummber
   * default: 0
   * 
   * @type {Function|Number}
   */
  delay?: (attempt: number) => number | number
}

export interface IAxiosRetry {
  (
    axios: axios.AxiosStatic,
    axiosRetryConfig?: IAxiosRetryConfig
  )
}

declare const axiosRetry: IAxiosRetry

export default axiosRetry
