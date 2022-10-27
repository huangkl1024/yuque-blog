import {Command} from "commander";
import path from "path";
import fs from "fs";
import OSS from "ali-oss";
import * as Buffer from "buffer";
import {listFiles, mkdirIfNeed, readString, writeString} from "common-util";

/**
 * 命令行参数对象
 */
export interface CliArgs {
  dir: string;
  output: string;
  region: string;
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
}


/**
 * 解析命令行参数
 */
export function parseCliArgs(): CliArgs {
  // 解析参数
  const program = new Command();
  program.requiredOption('-d, --dir <type>', 'dir')
    .requiredOption("-o, --output <type>", "output dir")
    .requiredOption("-r, --region <type>", "aliyun oss regin")
    .requiredOption("-i, --accessKeyId <type>", "aliyun oss accessKeyId")
    .requiredOption("-s, --accessKeySecret <type>", "aliyun oss accessKeySecret")
    .requiredOption("-b, --bucket <type>", "aliyun oss bucket")
  program.parse();
  const options = program.opts();
  return {
    dir: options.dir,
    output: options.output,
    region: options.region,
    accessKeyId: options.accessKeyId,
    accessKeySecret: options.accessKeySecret,
    bucket: options.bucket,
  }
}

const cliArgs = parseCliArgs();
const files = listFiles(cliArgs.dir);
const filterFiles = files.filter(file => {
  const basename = path.basename(file);
  return (basename.endsWith("md") || basename.endsWith("Md")) && !basename.startsWith("_") && !basename.startsWith(".");
});

const markdownImagesUrlRegx = /\!\[(.*?)\]\((.*?)\)/g;
// @ts-ignore
const client = new OSS({
  // yourregion填写Bucket所在地域。以华东1（杭州）为例，Region填写为oss-cn-hangzhou。
  region: cliArgs.region,
  // 阿里云账号AccessKey拥有所有API的访问权限，风险很高。强烈建议您创建并使用RAM用户进行API访问或日常运维，请登录RAM控制台创建RAM用户。
  accessKeyId: cliArgs.accessKeyId,
  accessKeySecret: cliArgs.accessKeySecret,
  // 填写Bucket名称。
  bucket: cliArgs.bucket
});

const imgBaseDirOfOss = "/huangkl-blog/asset/images/";

function addHttpsProtocol(url) {
  const urlObj = new URL(url)
  urlObj.protocol = "https";
  return urlObj.toString()
}

for (let file of filterFiles) {
  const dirname = path.dirname(file);
  let relativeDir = dirname.substring(cliArgs.dir.length + 1) + "/";
  // 上传到 oss
  const imgDirOfOss = imgBaseDirOfOss + relativeDir;
  // @ts-ignore
  client.put(imgDirOfOss, new Buffer.Buffer("")).then(result => {
    let imageUrlPrefixOfOss = addHttpsProtocol(result.url);
    const content = readString(file);
    // @ts-ignore
    const newContent = content.replace(markdownImagesUrlRegx, (all, ...args) => {
      const imgUrlOfMd = args[1];
      if (imgUrlOfMd.startsWith("http")) {
        return all;
      }
      // @ts-ignore
      let imagePathOfLocal = imgUrlOfMd;
      if (imgUrlOfMd.startsWith("./") || !imgUrlOfMd.startsWith("/")) {
        imagePathOfLocal = path.join(dirname, imgUrlOfMd);
      }
      if (fs.existsSync(imagePathOfLocal)) {
        const readStream = fs.createReadStream(imagePathOfLocal);
        const size = fs.statSync(imagePathOfLocal).size;
        let imgBasename = path.basename(imagePathOfLocal);
        let imagePathOfOss = imgDirOfOss + imgBasename;
        client.putStream(imagePathOfOss, readStream, {contentLength: size}).then(() => {
        });
        const imageName = args[0];
        return `![${imageName}](${imageUrlPrefixOfOss + imgBasename})`;
      }
      return all;
    })

    const outputDir = path.join(cliArgs.output, relativeDir);
    mkdirIfNeed(outputDir);
    const newFile = path.join(outputDir, path.basename(file));
    writeString(newFile, newContent);
  }).catch(error => console.log(error))
}
