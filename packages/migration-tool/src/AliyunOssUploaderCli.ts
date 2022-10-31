import {Command} from "commander";
import {AliyunOssUploader} from "./uploader/AliyunOssUploader";

/**
 * 命令行参数对象
 */
interface CliArgs {
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
function parseCliArgs(): CliArgs {
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

export function aliYunOssUploaderCli() {
  const cliArgs = parseCliArgs();
  const ossUploader = new AliyunOssUploader({
    baseDir: "/huangkl-blog/asset/images/",
    outputDir: cliArgs.output,
    mdDir: cliArgs.dir,
    region: cliArgs.region,
    accessKeyId: cliArgs.accessKeyId,
    accessKeySecret: cliArgs.accessKeySecret,
    bucket: cliArgs.bucket
  });
  ossUploader.upload().then((result) => {
    process.exit();
  });
}
