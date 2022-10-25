import path from "path";
import {readString} from "common-util";
import ejs from "ejs";

// markdown 模块
const markdownEjsFilePath = path.join(__dirname, "../ejs/markdown.ejs");
const markdownTemplateStr = readString(markdownEjsFilePath);
const markdownTemplate = ejs.compile(markdownTemplateStr);


export function replace(regx: RegExp, content: string, replaceFun: (matchers: any[], matchContent: string) => string) {
  // @ts-ignore
  return content.replace(regx, function (all, ...matchers) {
    try {
      return replaceFun(matchers, matchers[1]);
    } catch (e) {
      console.log(e);
    }
  });
}


/**
 * 根据 ejs 模块渲染 markdown
 * @param data
 */
export function renderMarkdownContentByEjs(data: any) {
  return markdownTemplate(data);
}

export function getBookTocItemName(bookTocItem: any): string {
  return bookTocItem.type === 'Book' ? bookTocItem.name : bookTocItem.title;
}
