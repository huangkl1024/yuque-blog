import fs from "fs";
import path from "path";

import axios from "axios";

import { mkdirIfNeed } from "./FileUtils";
import { isBlank } from "./StrUtils";

/**
 * 下载文件
 *
 * @param url 文件 url
 * @param savePath 保存路径
 */
export async function downloadFile(url: string, savePath: string) {
  if (isBlank(savePath)) {
    throw new Error("save path cannot be blank!");
  }
  const dir = path.dirname(savePath);
  mkdirIfNeed(dir);
  const resp = await axios.get(url, {
    responseType: "stream",
  });
  await resp.data.pipe(fs.createWriteStream(savePath));
}
