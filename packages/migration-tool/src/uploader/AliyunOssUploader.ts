import {AbstractOssUploader, OssUploaderOption} from "./AbstractOssUploader";
import OSS from "ali-oss";
import path from "path";
import Buffer from "buffer";
import fs from "fs";


export interface AliyunOssOption extends OssUploaderOption {
  /**
   * 填写Bucket所在地域。以华东1（杭州）为例，Region填写为oss-cn-hangzhou。
   */
  region: string,
  /**
   * 阿里云账号AccessKey拥有所有API的访问权限，风险很高。强烈建议您创建并使用RAM用户进行API访问或日常运维，请登录RAM控制台创建RAM用户。
   */
  accessKeyId: string,
  accessKeySecret: string,
  /**
   * 填写Bucket名称。
   */
  bucket: string,

  postProcessors?: {
    beforeUpload?: (imgPathMap: Map<string, string>) => void;
    beforeImgUpload?: (imgPath: string, mdFile: string) => void;
    afterImgUpload?: (imgPath: string, mdFile: string) => void;
    afterUpload?: (imgPathMap: Map<string, string>) => void;
  }
}

export class AliyunOssUploader extends AbstractOssUploader {
  protected option: AliyunOssOption;
  protected client: any;

  public constructor(option: AliyunOssOption) {
    super(option);
    this.option = option;
    this.client = new OSS({
      region: this.option.region,
      accessKeyId: this.option.accessKeyId,
      accessKeySecret: this.option.accessKeySecret,
      bucket: this.option.bucket
    });
  }

  protected uploadFile2Oss(imgPath: string) {
    const readStream = fs.createReadStream(imgPath);
    const size = fs.statSync(imgPath).size;
    let imagePathOfOss = path.join(this.getOssDir(imgPath), path.basename(imgPath))
      .replace(/\\+/g, "/");
    return this.client.putStream(imagePathOfOss, readStream, {contentLength: size});
  }

  protected doUpload(imgPathMap: Map<string, string>) {
    const createdOssDirSet: Set<string> = new Set<string>();
    const dirCreatePromises: Promise<any>[] = [];
    for (let imgPath of imgPathMap.keys()) {
      let ossDir = this.getOssDir(imgPath);
      if (createdOssDirSet.has(ossDir)) {
        continue;
      }
      createdOssDirSet.add(ossDir);
      const dirCreatePromise = this.client.put(ossDir, new Buffer.Buffer(""));
      dirCreatePromises.push(dirCreatePromise);
    }
    return Promise.all(dirCreatePromises).then(() => {
      const imgUploadPromises: Promise<any>[] = [];
      for (let imgPath of imgPathMap.keys()) {
        const imgUploadPromise = this.uploadFile2Oss(imgPath);
        imgUploadPromises.push(imgUploadPromise);
      }
      return Promise.all(imgUploadPromises);
    });
  }

  protected getImgUrl(imgPath: string): string {
    const name = path.basename(imgPath);
    const dir = this.getOssDir(imgPath);
    const urlPath = path.normalize(path.join(dir, name))
      .replace(/\\+/g, "/").substring(1);
    let url = `https://${this.option.bucket}.${this.option.region}.aliyuncs.com/${urlPath}`;
    return encodeURI(url);
  }
}
