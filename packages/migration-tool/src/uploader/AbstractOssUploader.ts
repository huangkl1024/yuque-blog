import {isBlank, listFiles, mkdirIfNeed, writeString} from "common-util";
import path from "path";
import {resolveMdLocalImageUrl} from "./UploadSupport";
import fs from "fs";


export interface OssUploaderOption {
  mdDir: string;
  outputDir: string;
  ossBaseDir?: string;
}

export abstract class AbstractOssUploader {
  protected option: OssUploaderOption;

  protected constructor(option: OssUploaderOption) {
    this.option = option;
  }


  public async upload() {
    const mdFiles = listFiles(this.option.mdDir, filePath => {
      const basename = path.basename(filePath);
      return (basename.endsWith("md") || basename.endsWith("Md")) &&
        !basename.startsWith("_") && !basename.startsWith(".");
    });

    const imgPaths = this.replaceImgUrlAndCopy2OutputDir(mdFiles);
    return this.doUpload(imgPaths);
  }

  protected replaceImgUrlAndCopy2OutputDir(mdFiles: string[]) {
    // key: image path, val: md file
    const imgPathMap: Map<string, string> = new Map<string, string>();
    for (let mdFile of mdFiles) {
      let relativeDir = this.getRelativeDirOfMdDir(mdFile);
      const newContent = resolveMdLocalImageUrl(mdFile, (imgPath) => {
        if (!fs.existsSync(imgPath)) {
          return null;
        }
        imgPathMap.set(imgPath, mdFile);
        return this.getImgUrl(imgPath, mdFile);
      });
      this.writeNewMdFile(relativeDir, mdFile, newContent);
    }
    return imgPathMap;
  }

  protected writeNewMdFile(relativeDir: string, mdFile: string, newContent: string) {
    const outputDir = path.join(this.option.outputDir, relativeDir);
    mkdirIfNeed(outputDir);
    const newMdFile = path.join(outputDir, path.basename(mdFile));
    writeString(newMdFile, newContent);
  }

  protected getRelativeDirOfMdDir(filePath: string) {
    const dirname = path.dirname(filePath);
    return dirname.substring(this.option.mdDir.length + 1) + "/";
  }

  /**
   * 获取图片 url
   *
   * @param imgPath 图片路径
   * @param mdFile md file
   * @return 图片 url
   * @protected
   */
  protected abstract getImgUrl(imgPath: string, mdFile: string): string;

  /**
   * 上传图片
   *
   * @param imgPathMap key: image path, val: md file
   * @protected
   */
  protected abstract doUpload(imgPathMap: Map<string, string>): Promise<any>;

  /**
   * 获取上传的 oss 目录
   *
   * @param imgPath
   * @protected
   */
  protected getOssDir(imgPath: string) {
    let relativeDirOfMdDir = this.getRelativeDirOfMdDir(imgPath);
    let ossBaseDir = this.option.ossBaseDir;
    let ossDir = (
      isBlank(ossBaseDir) ?
        relativeDirOfMdDir :
        path.normalize(path.join(ossBaseDir, relativeDirOfMdDir))
    ).replace(/\\+/g, "/");
    if (!ossDir.startsWith("/")) {
      ossDir += "/";
    }
    return ossDir.endsWith("/") ? ossDir : ossDir + "/";
  }

  /**
   * 获取 oss 图片路径
   *
   * @param imgPath
   * @protected
   */
  protected getOssImagePath(imgPath: string) {
    return this.getOssDir(imgPath) + path.basename(imgPath);
  }
}
