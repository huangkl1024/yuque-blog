/**
 * 判断字符串是否为空
 *
 * @param str 字符串
 * @returns {boolean} true 为空, false 不为空
 */
export function isBlank(str: string): boolean {
  return str === null || str === undefined || str === "";
}
