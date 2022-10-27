import Joi from "joi";

/**
 * 文档模型
 * _serializer = "v2.doc"
 */
export type DocSerializer = {
  id: number;
  /**
   * 文档路径
   */
  slug: string;
  /**
   * 标题
   */
  title: string;

  /**
   * 文档描述
   */
  description: string;

  /**
   * 文档创建人 ID
   */
  user_id: number;

  /**
   * 知识库 ID
   */
  book_id: number;
  /**
   *  描述了正文的格式 [asl, markdown, lake]
   */
  format: string;
  /**
   * 是否公开 [1 - 公开, 0 - 私密]
   */
  public: number;
  /**
   * 状态 [1 - 正常, 0 - 草稿]
   */
  status: number;
  /**
   * 喜欢数量
   */
  likes_count: number;
  /**
   * 评论数量
   */
  comments_count: number;
  /**
   * 文档内容更新时间
   */
  content_updated_at: string;
  /**
   * 创建时间
   */
  created_at: string;
  /**
   * 更新时间
   */
  updated_at: string;

  /**
   * 阅读量
   */
  read_count: number;
  first_published_at: string;
  published_at: string;
  /**
   * 字数
   */
  word_count: number;
  /**
   * 封面图地址
   */
  cover: string;
  view_status: number;
  read_status: number;
  draft_version: number;
  last_editor_id: number;
  /**
   * 自定义描述
   */
  custom_description: string;
  /**
   * 最后编辑者信息
   */
  last_editor: UserSerializer;
  book?: RepoSerializer;
  /**
   * optional_properties = hits 时出现，表示阅读量
   */
  hits?: number;
};

/**
 * 文档详情
 * _serializer = "v2.doc_detail"
 */
export type DocDetailSerializer = DocSerializer & {
  creator?: UserSerializer;
  deleted_at: string | null;
  body: string;
  body_lake: string;
  body_draft: string;
  body_draft_lake: string;

  /**
   * 可直接展示用的语雀文档 HTML
   */
  body_html: string;
};

export type CreateDocRequest = {
  /**
   * 标题，不传默认为”未命名“
   */
  title?: string;
  /**
   * 文档 Slug
   */
  slug?: string;
  /**
   * 支持 markdown、lake、html，默认为 markdown
   */
  format?: 'markdown' | 'lake' | 'html';
  /**
   * format 描述的正文内容，最大允许 5MB
   */
  body?: string;
};

export type DocUpdateRequest = {
  /**
   * 标题
   */
  title?: string;
  /**
   * 文档 Slug
   */
  slug?: string;
  /**
   * 已发布的正文 Markdown，这个字段必传
   */
  body?: string;
  /**
   * 如果在页面编辑过文档，那这时文档会转成 lake 格式，如果再用 markdown 无法进行更新，这是需要添加
   _force_asl = 1 来确保内容的正确转换。
   */
  _force_asl?: number;
};

/**
 * 原 BookSerializer，知识库
 * _serializer= "v2.book"
 * https://www.yuque.com/yuque/developer/bookserializer
 */
export type RepoSerializer = {
  id: number;
  /**
   * 知识库类型， Book（文档），Thread（话题），Design（画板）
   */
  type: 'Book' | 'Thread' | 'Design';
  slug: string;
  name: string;
  /**
   * 所属的团队/用户编号
   */
  user_id: string;

  description: string;

  /**
   * 创建者 ID
   */
  creator_id: number;

  /**
   * 知识库可见性，0 私密, 1 所有人可见, 2 空间成员可见, 3 空间所有人（含外部联系人）可见, 4 知识库成员可见
   */
  public: number;

  /**
   * 文档数量
   */
  items_count: 54;
  likes_count: 0;
  /**
   * 被 watch 数量
   */
  watches_count: number;
  content_updated_at: string;
  updated_at: string;
  created_at: string;
  /**
   * 知识库的 namespace，一般是：团队/知识库
   */
  namespace: string;
  /**
   * 用户或组织信息
   */
  user: UserSerializer | null;
};

/**
 * 原 BookDetailSerializer
 * _serializer= "v2.book_detail"
 * https://www.yuque.com/yuque/developer/bookdetailserializer
 */
export type RepoDetailSerializer = RepoSerializer & {
  toc: string | null;
  toc_yml: string | null;
  pinned_at: string | null;
  archived_at: string | null;
};

export type RepoUpdateRequest = {
  /**
   * 名称
   */
  name?: string;

  /**
   * ID
   */
  slug?: string;

  /**
   * 知识库描述
   */
  description?: string;

  /**
   * 知识库可见性，默认 1
   * 0 私密, 1 所有人可见, 2 空间成员可见, 3 空间所有人（含外部联系人）可见, 4 知识库成员可见
   */
  public?: number;
};

export type RepoCreateRequest = {
  /**
   * 名称
   */
  name: string;

  /**
   * ID
   */
  slug: string;

  /**
   * 知识库描述
   */
  description?: string;

  /**
   * 知识库可见性，默认 1
   * 0 私密, 1 所有人可见, 2 空间成员可见, 3 空间所有人（含外部联系人）可见, 4 知识库成员可见
   */
  public?: number;
  /**
   * 知识库类型，默认 Book， Book - 文库， Design - 画板
   */
  type?: 'Book' | 'Design';
};

/**
 * 用户模型
 * _serializer =  "v2.user"
 */
export type UserSerializer = {
  /**
   * 用户 ID
   */
  id: number;
  /**
   * 用户类型
   */
  type: 'User' | 'Group';
  /**
   * 账号
   */
  login: string;
  /**
   * 昵称
   */
  name: string;
  /**
   * 描述
   */
  description: string;
  /**
   * 头像地址
   */
  avatar_url: string;
  followers_count: number;
  following_count: number;
  /**
   * 创建时间，如：2016-09-08T18:55:52.000Z
   */
  created_at: string;
  /**
   * 最后更新时间，如：2016-09-08T18:55:52.000Z
   */
  updated_at: string;
};

/**
 * 用户明细类型定义
 * _serializer =  "v2.user_detail"
 */
export type UserDetailSerializer = UserSerializer & {
  /**
   * 空间 ID，为 0 则表示是个人
   */
  space_id: number;
  account_id: number;
  /**
   * 知识库数量
   */
  books_count: number;
  /**
   * 公开的知识库数量
   */
  public_books_count: number;

  /**
   * 可见性，1
   */
  public: number;
};


export const DefaultYuqueExporterOptionsValidator = Joi.object({
  yuqueOptions: Joi.any().required(),
  books: Joi.array().required().min(1),
  output: Joi.string().required(),
  outputFormat: Joi.string().required(),
  postProcessors: Joi.array().required()
});

export interface YuqueSdkOptions {
  /**
   * yuque token, https://www.yuque.com/settings/tokens
   */
  token: string;

  /**
   * yuque endpoint
   */
  endpoint?: string;

  /**
   * request user-agent
   */
  userAgent?: string;

  /**
   * default request options of [urllib](https://www.npmjs.com/package/urllib)
   */
  requestOpts?: any;

  /**
   * special how to handler response
   */
  handler?: any;
}


/**
 * 语雀导出选项
 */
export interface AbstractYuqueExporterOptions<T extends AbstractYuqueExporterPostProcessor> {
  /**
   * 语雀 token
   */
  yuqueOptions: YuqueSdkOptions;

  /**
   * 导出知识库名称列表
   */
  books: string[];

  /**
   * 后置处理器列表
   */
  postProcessors: T[];
}

/**
 * 语雀导出选项
 */
export interface DefaultYuqueExporterOptions extends AbstractYuqueExporterOptions<YuqueExporterPostProcessor> {
  /**
   * 输出目录
   */
  output: string;

  /**
   * 输出格式
   */
  outputFormat: "markdown" | "html" | "lake";
}

export interface AbstractYuqueExporterContext {
  data: Map<string, any>;
}

export interface YuqueExporterContext extends AbstractYuqueExporterContext {
  bookDetails: BookDetail[];
}

export interface YuqueBookExporterContext extends AbstractYuqueExporterContext {
  bookDetail: BookDetail;
}

export interface YuqueDocExporterContext extends AbstractYuqueExporterContext {
  bookDetail: BookDetail;
  tocParents: any[];
  docDetail: DocDetailSerializer;
}

export interface YuqueDocWritingContext extends YuqueDocExporterContext {
  content: string;
  outputPath: string;
  outputFormat: "markdown" | "html" | "lake";
}

/**
 * 语雀导出后置处理器选项
 */
export interface AbstractYuqueExporterPostProcessor {
  beforeExport?: (context: YuqueExporterContext) => void;
  beforeBookExport?: (context: YuqueBookExporterContext) => void;
  /**
   *
   * @param context
   * @return true 导出，false 不导出
   */
  beforeDocExport?: (context: YuqueDocExporterContext) => boolean;
  afterDocExport?: (context: YuqueDocExporterContext) => void;
  afterBookExport?: (context: YuqueBookExporterContext) => void;
  afterExport?: (context: YuqueExporterContext) => void;
}

export interface YuqueExporterPostProcessor extends AbstractYuqueExporterPostProcessor {
  beforeDocWriting?: (context: YuqueDocWritingContext) => string;
}


export interface BookDetail {
  book: RepoSerializer;
  toc: {
    list: any[];
    tree: any
  }
}
