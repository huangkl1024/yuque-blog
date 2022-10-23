import AbstractYuqueExporter from "./AbstractYuqueExporter";
import {
  DefaultYuqueExporterOptions,
  DefaultYuqueExporterOptionsValidator,
  DocDetailSerializer,
  YuqueDocExporterContext,
  YuqueExporterPostProcessor
} from "./typings";
import path from "path";
import {mkdirIfNeed, writeString} from "../util/FileUtils";
import {getBookTocItemName} from "../support";


export default class DefaultYuqueExporter extends AbstractYuqueExporter<YuqueExporterPostProcessor, DefaultYuqueExporterOptions> {
  public constructor(options: DefaultYuqueExporterOptions) {
    super(options);
    this.validateOptions(options);
  }

  protected validateOptions(options: DefaultYuqueExporterOptions) {
    const validateResult = DefaultYuqueExporterOptionsValidator.validate(options);
    if (validateResult && validateResult.error) {
      throw validateResult.error;
    }
  }

  protected doExport(context: YuqueDocExporterContext): void {
    const parents = context.tocParents
      .map(item => getBookTocItemName(item))
      .join("/");
    const output = this.options.output;
    const parentPath = path.join(output, parents);
    mkdirIfNeed(parentPath);
    const docDetail = context.docDetail;
    const outputFormat = this.options.outputFormat;
    let exportContent = DefaultYuqueExporter.getExportContent(docDetail, outputFormat);
    const exportFileSuffix = DefaultYuqueExporter.getExportFileSuffix(outputFormat);
    const exportFilePath = path.join(parentPath, docDetail.title + "." + exportFileSuffix);

    for (let postProcessor of this.options.postProcessors) {
      exportContent = postProcessor.beforeDocWriting ? postProcessor.beforeDocWriting({
        ...context,
        content: exportContent,
        outputPath: exportFilePath,
        outputFormat: outputFormat
      }) : exportContent;
    }
    writeString(exportFilePath, exportContent);
  }

  private static getExportContent(docDetail: DocDetailSerializer, outputFormat: "markdown" | "html" | "lake") {
    if (outputFormat === "markdown") {
      return docDetail.body;
    }
    if (outputFormat === "html") {
      return docDetail.body_html;
    }
    if (outputFormat === "lake") {
      return docDetail.body_lake;
    }

    throw new Error(`cannot handle ${outputFormat}`);
  }

  private static getExportFileSuffix(outputFormat: "markdown" | "html" | "lake") {
    if (outputFormat === "markdown") {
      return "md";
    }
    return outputFormat;
  }
}
