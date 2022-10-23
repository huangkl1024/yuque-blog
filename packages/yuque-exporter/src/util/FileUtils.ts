import fs from "fs";
import path from "path";

/**
 * 删除目录
 *
 * @param dirPath 目录路径
 */
export function deleteDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    return;
  }
  let files = fs.readdirSync(dirPath);
  files.forEach(function (file, index) {
    const curPath = dirPath + "/" + file;
    if (fs.statSync(curPath).isDirectory()) {
      deleteDir(curPath);
    } else {
      // 删除文件
      fs.unlinkSync(curPath);
    }
  });
  fs.rmdirSync(dirPath);
}

/**
 * 把字符串写入指定文件
 *
 * @param filePath 文件路径
 * @param content 内容
 */
export function writeString(filePath: string, content: string) {
  const fd = fs.openSync(filePath, 'w');
  fs.writeSync(fd, content);
  // 进度条
  fs.closeSync(fd);
}

/**
 * 读取文件内容
 *
 * @param filePath 文件路径
 * @returns {string} 文件内容
 */
export function readString(filePath: string): string {
  return fs.readFileSync(filePath, {encoding: 'utf-8'});
}

/**
 * 如果 path 路径的目录不存在则创建
 *
 * @param dirPath 目录路径
 */
export function mkdirIfNeed(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, {recursive: true});
  }
}

/**
 * 列出目录下的所有文件
 *
 * @param dirPath 目录路径
 */
export function listFiles(dirPath: string): string[] {
  const stat = fs.statSync(dirPath);
  if (stat.isDirectory()) {
    const subDirs = fs.readdirSync(dirPath);
    return subDirs.flatMap(subDir => {
      const newPath = path.join(dirPath, subDir);
      return listFiles(newPath);
    });
  } else if (stat.isFile()) {
    return [dirPath];
  }
  throw new Error(`${dirPath} is invalid!`);
}
