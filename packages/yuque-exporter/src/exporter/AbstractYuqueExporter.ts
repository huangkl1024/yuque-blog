// @ts-ignore
import YuqueSdk from "@yuque/sdk";
import {
  AbstractYuqueExporterOptions,
  AbstractYuqueExporterPostProcessor,
  BookDetail,
  DocDetailSerializer,
  RepoSerializer,
  UserDetailSerializer,
  YuqueDocExporterContext
} from "./typings";


/**
 * 语雀导出器
 */
export default abstract class AbstractYuqueExporter<E extends AbstractYuqueExporterPostProcessor, T extends AbstractYuqueExporterOptions<E>> {
  protected options: T;
  protected yuqueSdk: any;

  protected constructor(options: T) {
    this.options = options;
    this.yuqueSdk = new YuqueSdk(options.yuqueOptions);
  }

  public async export() {
    // 获取 token 对应得用户
    const curUser: UserDetailSerializer = await this.yuqueSdk.users.get();

    // 获取知识库列表
    const books: RepoSerializer[] = await this.yuqueSdk.repos.list({user: curUser.id})
    const filterBooks: RepoSerializer[] = books.filter((item: any) => this.options.books.includes(item.name));
    const bookDetails = await this.batchGetBookBookDetail(filterBooks);

    const contextData: Map<string, any> = new Map();
    const context = {
      data: contextData,
      bookDetails: bookDetails
    };
    for (let postProcessor of this.options.postProcessors) {
      if (postProcessor.beforeExport) {
        await postProcessor.beforeExport(context);
      }
    }

    for (let bookDetail of bookDetails) {
      const bookContext = {
        data: contextData,
        bookDetail: bookDetail
      };
      for (let postProcessor of this.options.postProcessors) {
        if (postProcessor.beforeBookExport) {
          await postProcessor.beforeBookExport(bookContext);
        }
      }
      await this.exportDocsOfBook(contextData, bookDetail);
      for (let postProcessor of this.options.postProcessors) {
        if (postProcessor.afterBookExport) {
          await postProcessor.afterBookExport(bookContext);
        }
      }
    }

    for (let postProcessor of this.options.postProcessors) {
      if (postProcessor.afterExport) {
        await postProcessor.afterExport(context);
      }
    }
  }

  protected async exportDocsOfBook(contextData: Map<string, any>, bookDetail: BookDetail) {
    // 导出
    const rootNode = bookDetail.toc.tree;
    const queue = [rootNode];
    const map: Map<string, any> = this.groupBookTocListByUuid(bookDetail.toc.list);
    while (queue.length > 0) {
      const curNode = queue.shift();
      if (curNode.children.length > 0) {
        queue.push(...curNode.children);
      }
      if (curNode.type !== 'DOC') {
        continue;
      }

      const tocParents: any = this.getBookTocItemParents(map, rootNode, curNode);
      const docDetail: DocDetailSerializer = await this.yuqueSdk.docs.get({
        namespace: rootNode.namespace,
        slug: curNode.slug
      });
      const context = {
        data: contextData,
        bookDetail: bookDetail,
        tocParents: tocParents,
        docDetail: docDetail
      };
      for (let postProcessor of this.options.postProcessors) {
        if (postProcessor.beforeDocExport) {
          await postProcessor.beforeDocExport(context);
        }
        await this.doExport(context);
        if (postProcessor.afterDocExport) {
          await postProcessor.afterDocExport(context);
        }
      }
    }
  }

  /**
   * 导出
   *
   * @param context {YuqueDocExporterContext}
   * @protected
   */
  protected abstract doExport(context: YuqueDocExporterContext): void;

  protected getBookTocItemParents(map: Map<string, any>, rootNode: any, curNode: any, depth = 1): any[] {
    if (curNode.parent_uuid === '') {
      return curNode.type === 'DOC' ? [rootNode] : [rootNode, curNode];
    }
    const tocParents = this.getBookTocItemParents(map, rootNode, map.get(curNode.parent_uuid), depth + 1);
    if (depth !== 1) {
      tocParents.push(curNode);
    }
    return tocParents;
  }

  protected groupBookTocListByUuid(bookTocList: any[]) {
    const map = new Map<string, any>();
    bookTocList.forEach(item => map.set(item.uuid, item));
    return map;
  }

  protected async batchGetBookBookDetail(books: RepoSerializer[]) {
    const bookDetails: BookDetail[] = [];
    for (let i = 0; i < books.length; i++) {
      const book = books[i];
      const tocList: any[] = await this.yuqueSdk.repos.getTOC({namespace: book.namespace});
      const tocTree = this.buildBookTocTree(book, tocList);
      bookDetails.push({
        book: book,
        toc: {
          list: tocList,
          tree: tocTree
        }
      });
    }
    return bookDetails;
  }

  protected buildBookTocTree(book: RepoSerializer, tocList: any[]) {
    const tocTree = {
      ...book,
      children: []
    }
    const map = new Map();
    tocList.forEach(item => map.set(item.uuid, {...item, children: []}));

    for (let tocItem of tocList) {
      const itemOfMap = map.get(tocItem.uuid);
      if (itemOfMap.parent_uuid === '') {
        // @ts-ignore
        tocTree.children.push(itemOfMap);
        continue;
      }
      const parent = map.get(itemOfMap.parent_uuid);
      parent.children.push(itemOfMap);
    }
    return tocTree;
  }
}
