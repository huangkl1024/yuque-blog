import path from "path";
import {readString} from "common-util";
import ejs from "ejs";
import {BookDetail, YuqueDocWritingContext} from "../exporter/typings";

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
 * @param context
 */
export function renderMarkdownContentByEjs(context: YuqueDocWritingContext) {
  const data = {
    groups: context.tocParents.map(item => getBookTocItemName(item)),
    bookDetail: context.bookDetail,
    doc: context.docDetail,
    content: context.content,
  };
  return markdownTemplate(data);
}

export function generateSidebar(bookDetails: BookDetail[]) {
  const sidebarData: any = doGenerateSidebar(bookDetails.map(item => item.toc.tree));
  const sidebarTemplate = readString(path.join(__dirname, '../ejs/sidebar.ejs'));
  return ejs.render(sidebarTemplate, {sidebarData: sidebarData});
}

export function doGenerateSidebar(tocTreeList: any[]) {
  const filterTocTreeList = tocTreeList.filter(item => item.type !== 'DOC');
  if (filterTocTreeList.length <= 0) {
    return "'structure'";
  }
  let strBuilder = '[';
  for (let i = 0; i < filterTocTreeList.length; i++) {
    const tocTree = filterTocTreeList[i];
    strBuilder += '{';
    strBuilder += 'text:' + getSidebarText(tocTree) + ',';
    strBuilder += 'prefix:' + getSidebarPrefix(tocTree) + ',';
    strBuilder += 'collapsable: true,';
    strBuilder += 'children:';
    strBuilder += doGenerateSidebar(tocTree.children);
    strBuilder += (i === filterTocTreeList.length - 1 ? '}' : '},');
  }
  strBuilder += ']';
  return strBuilder;
}

export function getBookTocItemName(bookTocItem: any): string {
  return bookTocItem.type === 'Book' ? bookTocItem.name : bookTocItem.title;
}

function getSidebarText(tocTree: any) {
  return "'" + getBookTocItemName(tocTree) + "'";
}

function getSidebarPrefix(tocTree: any) {
  return "'" + (getBookTocItemName(tocTree) + '/') + "'";
}
