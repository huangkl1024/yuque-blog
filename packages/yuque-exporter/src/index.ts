import path from "path";
import DefaultYuqueExporter from "./exporter";
import {listFiles, mkdirIfNeed, readString} from "./util/FileUtils";
import ProgressBar from "progress";
import {getBookTocItemName, renderMarkdownContentByEjs, replace} from "./support";
import {downloadFile} from "./util/HttpUtils";
import {Command} from "commander";
import {isBlank} from "./util/StrUtils";
import matter from "gray-matter";
import fs from "fs";
import ConsistencyHash from "./support/ConsistencyHash";


// 图片默认路径
const vuepressBlogDir = "../../vuepress-blog";
const publicDir = path.join(__dirname, `${vuepressBlogDir}/docs/.vuepress/public`);
const imageSaveDir = path.join(publicDir, "./img/posts");
const defaultHeaderImagesDir = path.join(publicDir, "./img/header-images");
const defaultHeaderImages = listFiles(defaultHeaderImagesDir);
const consistencyHash = new ConsistencyHash(4);
defaultHeaderImages.forEach(item => consistencyHash.addPhysicalNode(item));

/**
 * 获取图片保存路径
 *
 * @param url 图片 url
 */
export function getImageSavePath(url: string) {
  const urlObj = new URL(url);
  return path.join(imageSaveDir, urlObj.pathname);
}

/**
 * 命令行参数对象
 */
export interface CliArgs {
  token: string;
  books: string[];
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
    .option('-o, --output <type>', 'output dir')
    .option('-f, --exportFormat <type>', 'export format', "markdown");
  program.parse();
  const options = program.opts();
  return {
    token: options.token,
    books: options.books,
    output: isBlank(options.output) ? path.join(__dirname, `${vuepressBlogDir}/docs/posts/yuque`) : options.output,
    exportFormat: options.exportFormat
  }
}

// markdown 图片 url 匹配正则表达式
const markdownImagesUrlRegx = /\!\[(.*?)\]\((.*?)\)/g;
const yuqueUrlPrefix = "https://cdn.nlark.com/yuque";

function toPublicUrl(savedPath: string) {
  return savedPath.substring(publicDir.length).replace(/\\/g, "/");
}

function handleMarkdownImageUrl(content: string, imageUrlMap: Map<string, string>) {
  return replace(markdownImagesUrlRegx, content, (matchers, matchContent) => {
    if (!matchContent.startsWith(yuqueUrlPrefix)) {
      return `[${matchers[0]}](${matchContent})`
    }
    const savedPath = getImageSavePath(matchContent);
    imageUrlMap.set(matchContent, savedPath);
    const newImageUrl = toPublicUrl(savedPath);
    return `[${matchers[0]}](${newImageUrl})`;
  });
}


const cliArgs = parseCliArgs();

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
      let content = renderMarkdownContentByEjs(context);
      if (context.outputFormat === 'markdown') {
        const imageUrlMap = context.data.get("imageUrlMap");
        content = handleMarkdownImageUrl(content, imageUrlMap);
        const parsedContent = matter(content);
        const fontMatter = parsedContent.data;
        // 保持旧配置
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

        // TODO 解析语雀配置的 headerImage

        // headerImage 不存在时，随机一张图片，使用一致性哈希算法
        if (fontMatter.headerImage === undefined || fontMatter.headerImage === null) {
          const fullPaths = context.tocParents
            .map(item => getBookTocItemName(item));
          fullPaths.push(context.docDetail.title);
          const key = fullPaths.join("/");
          fontMatter.headerImage = toPublicUrl(consistencyHash.getPhysicalNode(key));
        }
        content = matter.stringify(parsedContent.content, fontMatter);
      }
      return content;
    },
    afterDocExport: context => {
      context.data.get("progressBar").tick();
    },
    afterBookExport: context => {
      const imageUrlMap: Map<string, string> = context.data.get("imageUrlMap");
      const bookDetail = context.bookDetail;
      const progressBar = new ProgressBar(`exporting ${bookDetail.book.name} images [:bar] :percent`,
        {total: imageUrlMap.size});
      for (let url of imageUrlMap.keys()) {
        // @ts-ignore
        downloadFile(url, imageUrlMap.get(url)).then(() => progressBar.tick());
      }
    }
  }]
});


yuqueExporter.export().then(() => {
})



