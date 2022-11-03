import {AbstractOssUploader, OssUploaderOption} from "./AbstractOssUploader";
import Qiniu from "node-qiniu";
import fs from "fs";

export interface QiniuOssUploaderOption extends OssUploaderOption {
  accessKey: string;
  secretKey: string;
  buket: string;
  ossImgUrlPrefix: string;
}

export class QiniuOssUploader extends AbstractOssUploader {
  protected option: QiniuOssUploaderOption;
  private buket: any;

  constructor(option: QiniuOssUploaderOption) {
    super(option);
    this.option = option;
    if(!this.option.ossImgUrlPrefix.endsWith("/")) {
      this.option.ossImgUrlPrefix = this.option.ossImgUrlPrefix + "/";
    }
    Qiniu.config({
      access_key: option.accessKey,
      secret_key: option.secretKey,
      uploadUrl: "up-z2.qiniup.com"
    })
    this.buket = Qiniu.bucket(option.buket);
  }


  protected doUpload(imgPathMap: Map<string, string>) {
    const promises: Promise<any>[] = [];
    for (let imgPath of imgPathMap.keys()) {
      const promise: Promise<any> = new Promise((resolve, reject) => {
        // 不需要 / 开头
        const puttingStream = this.buket.createPutStream(this.getOssImagePath(imgPath).substring(1));
        const readingStream = fs.createReadStream(imgPath);
        readingStream.pipe(puttingStream)
          .on('error', function (err) {
            reject(err)
          })
          .on('end', function (reply) {
            resolve(reply);
          });
      });
      promises.push(promise);
    }
    return Promise.all(promises);
  }

  protected getImgUrl(imgPath: string, _mdFile: string): string {
    return encodeURI(`${this.option.ossImgUrlPrefix}${this.getOssImagePath(imgPath).substring(1)}`);
  }
}
