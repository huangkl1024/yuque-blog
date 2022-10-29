import path from "path";
import DefaultYuqueExporter from "./exporter";
import {downloadFile, isBlank, listFiles, mkdirIfNeed, readString} from "common-util";
import ProgressBar from "progress";
import {getBookTocItemName, renderMarkdownContentByEjs, replace} from "./support";
import {Command} from "commander";
import matter from "gray-matter";
import fs from "fs";
import ConsistencyHash from "./support/ConsistencyHash";
import {YuqueDocWritingContext} from "./exporter/typings";


function getPathname(url: string) {
  const urlObj = new URL(url);
  return urlObj.pathname;
}

/**
 * 获取图片保存路径
 *
 * @param imageSaveDir 图片保存目录
 * @param url 图片 url
 */
export function getImageSavePath(imageSaveDir: string, url: string) {
  let pathname = getPathname(url);
  return path.join(imageSaveDir, pathname);
}

/**
 * 命令行参数对象
 */
export interface CliArgs {
  token: string;
  books: string[];
  vuepressDir: string;
  output: string;
  exportFormat: "markdown" | "html" | "lake"
}


/**
 * 解析命令行参数
 */
export function parseCliArgs(): CliArgs {
  // 解析参数
  const program = new Command();
  program.requiredOption('-t, --token <type>', 'yuque user token')
    .requiredOption('-b, --books <type...>', 'book list')
    .requiredOption('-v, --vuepressDir <type>', 'vuepress dir')
    .option('-o, --output <type>', 'output dir')
    .option('-f, --exportFormat <type>', 'export format', "markdown");
  program.parse();
  const options = program.opts();
  return {
    token: options.token,
    books: options.books,
    vuepressDir: options.vuepressDir,
    output: options.output,
    exportFormat: options.exportFormat
  }
}

// markdown 图片 url 匹配正则表达式
const markdownImagesUrlRegx = /\!\[(.*?)\]\((.*?)\)/g;
const yuqueUrlPrefix = "https://cdn.nlark.com/yuque";

function toPublicUrl(publicDir: string, savedPath: string) {
  return savedPath.substring(publicDir.length).replace(/\\/g, "/");
}

function handleMarkdownImageUrl(content: string, imageUrlMap: Map<string, string>) {
  return replace(markdownImagesUrlRegx, content, (matchers, matchContent) => {
    if (!matchContent.startsWith(yuqueUrlPrefix)) {
      return `[${matchers[0]}](${matchContent})`
    }
    const savedPath = getImageSavePath(imageSaveDir, matchContent);
    imageUrlMap.set(matchContent, savedPath);
    const newImageUrl = toPublicUrl(publicDir, savedPath);
    return `[${matchers[0]}](${newImageUrl})`;
  });
}


const cliArgs = parseCliArgs();
// 图片默认路径
const vuepressDir = cliArgs.vuepressDir;
const publicDir = path.join(vuepressDir, "./.vuepress/public");
const imageSaveDir = path.join(publicDir, "./img/posts/");
const defaultHeaderImagesDir = path.join(publicDir, "./img/header-images");
const defaultHeaderImages = listFiles(defaultHeaderImagesDir);
const consistencyHash = new ConsistencyHash(12);
defaultHeaderImages.forEach(item => consistencyHash.addPhysicalNode(item));
if (isBlank(cliArgs.output)) {
  cliArgs.output = `${vuepressDir}/posts/yuque`;
}

function keepOldConfigIfNeed(context: YuqueDocWritingContext, fontMatter: { [p: string]: any; }) {
  if (fs.existsSync(context.outputPath)) {
    const oldContent = readString(context.outputPath);
    const parsedOldContent = matter(oldContent);
    const oldFontMatter = parsedOldContent.data;
    const keepOldConfigs: string[] = oldFontMatter.keepOldConfigs;
    if (keepOldConfigs && keepOldConfigs.length > 0) {
      keepOldConfigs.filter(key => {
        const val = oldFontMatter[key as string];
        if (val !== null && val !== undefined) {
          return true;
        }
        return false;
      }).forEach(key => fontMatter[key as string] = oldFontMatter[key as string])
    }
  }
}

function randomHeaderImageIfNeed(fontMatter: { [p: string]: any; }, context: YuqueDocWritingContext) {
  if (fontMatter.headerImage === undefined || fontMatter.headerImage === null) {
    const fullPaths = context.tocParents
      .map(item => getBookTocItemName(item));
    fullPaths.push(context.docDetail.title);
    const key = fullPaths.join("/");
    fontMatter.headerImage = toPublicUrl(publicDir, consistencyHash.getPhysicalNode(key));
  }
}

function parseHeaderImage(content: string, imageUrlMap) {
  let trimContent = content.trim();
  let firstLf = trimContent.indexOf("\n");
  let headerImage = null;
  if (firstLf > -1) {
    let firstLine = trimContent.substring(0, firstLf);
    // @ts-ignore
    const matches = firstLine.match(/^\!\[(.*?)\]\((.*?)\)$/);
    if (matches !== null && matches !== undefined && matches.length > 0) {
      const url = matches[2];
      const imageSavePath = getImageSavePath(imageSaveDir, url);
      imageUrlMap.set(url, imageSavePath);
      headerImage = toPublicUrl(publicDir, imageSavePath).trim();
      content = trimContent.substring(firstLf + 1);
    }
  }
  return {content, headerImage};
}

function handleMarkdownOutputFormat(context: YuqueDocWritingContext) {
  const imageUrlMap = context.data.get("imageUrlMap");

  //解析语雀配置的 headerImage
  const __ret = parseHeaderImage(context.content, imageUrlMap);
  let content = __ret.content;
  const headerImage = __ret.headerImage;

  // 模板渲染
  content = renderMarkdownContentByEjs({
    groups: context.tocParents.map(item => getBookTocItemName(item)),
    bookDetail: context.bookDetail,
    doc: context.docDetail,
    content: content,
  });
  // 图片 url 处理
  content = handleMarkdownImageUrl(content, imageUrlMap);
  const parsedContent = matter(content);
  const fontMatter = isBlank(headerImage) ? parsedContent.data : {
    ...parsedContent.data,
    headerImage: headerImage
  };
  // 保持旧配置
  keepOldConfigIfNeed(context, fontMatter);
  // headerImage 不存在时，随机一张图片，使用一致性哈希算法
  randomHeaderImageIfNeed(fontMatter, context);
  return matter.stringify(parsedContent.content, fontMatter);
}

const yuqueExporter = new DefaultYuqueExporter({
  yuqueOptions: {
    token: cliArgs.token
  },
  books: cliArgs.books,
  output: cliArgs.output,
  outputFormat: cliArgs.exportFormat,
  postProcessors: [{
    beforeBookExport: context => {
      const bookDetail = context.bookDetail;
      const bookDir = path.join(cliArgs.output, bookDetail.book.name);
      mkdirIfNeed(bookDir);
      // 计算导出数据个数
      const total = bookDetail.toc.list.filter(item => item.type === 'DOC').length;

      // 导出进度条
      const progressBar = new ProgressBar(`exporting ${bookDetail.book.name} [:bar] :percent`, {total: total});
      context.data.set("progressBar", progressBar);

      // 存放图片 url, key: 图片 url, value:图片保存路径
      context.data.set("imageUrlMap", new Map<string, string>());
    },
    beforeDocWriting: context => {
      if (context.outputFormat === 'markdown') {
        return handleMarkdownOutputFormat(context);
      }
      return context.content;
    },
    afterDocExport: context => {
      context.data.get("progressBar").tick();
    },
    afterBookExport: context => {
      const imageUrlMap: Map<string, string> = context.data.get("imageUrlMap");
      const bookDetail = context.bookDetail;
      const imageDownloadProgressBar = new ProgressBar(`exporting ${bookDetail.book.name} images [:bar] :percent`,
        {total: imageUrlMap.size});
      for (let url of imageUrlMap.keys()) {
        // @ts-ignore
        downloadFile(url, imageUrlMap.get(url)).then(() => imageDownloadProgressBar.tick());
      }
    }
  }]
});


yuqueExporter.export().then(() => {
  console.log("header images hits:")
  console.log(consistencyHash.getHits())
});



