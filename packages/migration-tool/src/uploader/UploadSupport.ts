import {isBlank, readString} from "common-util";
import path from "path";


const markdownImagesUrlRegx = /\!\[(.*?)\]\((.*?)\)/g;

/**
 * 解析 md 本地图片 url
 *
 * @param mdFilePath
 * @param handle
 */
export function resolveMdLocalImageUrl(mdFilePath: string, handle: (imgPath: string, match: string, args: any[]) => string) {
  const content = readString(mdFilePath);
  const baseDir = path.dirname(mdFilePath);
  return content.replace(markdownImagesUrlRegx, (match, ...args) => {
    const imgUrl = args[1];
    if (isBlank(imgUrl) || imgUrl.startsWith("http")) {
      // 不是本地图片，不做任务出来
      return match;
    }

    let imagePathOfLocal = imgUrl;
    if (imgUrl.startsWith("./") && !imgUrl.startsWith("/")) {
      // 相对路径
      imagePathOfLocal = path.join(baseDir, imgUrl);
    }
    const newImgUrl = handle(imagePathOfLocal, match, args);
    if (isBlank(newImgUrl)) {
      return match;
    }
    return `![${args[0]}](${newImgUrl})`;
  });
}
