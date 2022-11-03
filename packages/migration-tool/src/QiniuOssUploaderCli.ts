import {Command} from "commander";
import {QiniuOssUploader} from "./uploader/QiniuOssUploader";

/**
 * 命令行参数对象
 */
interface CliArgs {
  dir: string;
  output: string;
  accessKey: string;
  secretKey: string;
  bucket: string;
}


/**
 * 解析命令行参数
 */
function parseCliArgs(): CliArgs {
  // 解析参数
  const program = new Command();
  program.requiredOption('-d, --dir <type>', 'dir')
    .requiredOption("-o, --output <type>", "output dir")
    .requiredOption("-a, --accessKey <type>", "qiniu oss access key")
    .requiredOption("-s, --secretKey <type>", "qiniu oss secret key")
    .requiredOption("-b, --bucket <type>", "qiniu oss bucket")
  program.parse();
  const options = program.opts();
  return {
    dir: options.dir,
    output: options.output,
    accessKey: options.accessKey,
    secretKey: options.secretKey,
    bucket: options.bucket,
  }
}

export function qiniuOssUploaderCli() {
  const cliArgs = parseCliArgs();
  const ossUploader = new QiniuOssUploader({
    ossBaseDir: "/huangkl-blog/asset/images/",
    ossImgUrlPrefix: "http://rkkinktlb.hn-bkt.clouddn.com/",
    outputDir: cliArgs.output,
    mdDir: cliArgs.dir,
    accessKey: cliArgs.accessKey,
    secretKey: cliArgs.secretKey,
    buket: cliArgs.bucket
  });
  ossUploader.upload().then(() => {
    process.exit(0);
  }).catch(errors=>console.error(errors))
}
