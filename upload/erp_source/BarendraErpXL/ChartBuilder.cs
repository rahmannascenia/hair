// ChartBuilder.cs — Adds 6 charts to the Dashboard sheet using Open XML SDK
// Uses raw XML injection for chart parts (more reliable across SDK versions)

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using DocumentFormat.OpenXml.Packaging;

namespace HairlanErpXL;

internal static class ChartBuilder
{
    public static void AddCharts(string filePath, FactoryConfig[] factoryConfigs) {
        Console.WriteLine("Adding charts via Open XML SDK...");

        using var doc = SpreadsheetDocument.Open(filePath, true);
        var workbookPart = doc.WorkbookPart;
        var dashboardSheet = workbookPart.Workbook.Descendants<DocumentFormat.OpenXml.Spreadsheet.Sheet>()
            .FirstOrDefault(s => s.Name == "Dashboard");
        if (dashboardSheet == null) {
            Console.WriteLine("ERROR: Dashboard sheet not found");
            return;
        }
        var worksheetPart = (WorksheetPart)workbookPart.GetPartById(dashboardSheet.Id);

        // Ensure the worksheet has a drawing part
        var drawingsPart = worksheetPart.DrawingsPart;
        if (drawingsPart == null) {
            drawingsPart = worksheetPart.AddNewPart<DrawingsPart>();
            worksheetPart.Worksheet.Append(new DocumentFormat.OpenXml.Spreadsheet.Drawing {
                Id = worksheetPart.GetIdOfPart(drawingsPart)
            });
        }

        // Compute helper data positions (same as DashboardSheet.cs)
        int helperRow = 38;
        int gradeStart = helperRow;
        int gradeEnd = helperRow + 3;
        int costStart = helperRow + 5;
        int costEnd = costStart + factoryConfigs.Length;
        int invStart = costEnd + 2;
        int invEnd = invStart + 8;
        int salesStart = invEnd + 2;
        int salesEnd = salesStart + 4;
        int sizeStart = salesEnd + 2;
        int sizeEnd = sizeStart + 10;
        int payStart = sizeEnd + 2;
        int payEnd = payStart + 3;

        var chartSpecs = new (string type, string anchor, int dataStart, int dataEnd, string title)[] {
            ("pie",  "B16", gradeStart, gradeEnd, "Grade Distribution"),
            ("bar",  "G16", costStart, costEnd, "Cost per kg by Factory"),
            ("bar",  "L16", invStart, invEnd, "Inventory Value by Bucket"),
            ("pie",  "B26", salesStart, salesEnd, "Export Revenue by Buyer"),
            ("line", "G26", sizeStart, sizeEnd, "Size-wise Rate Master"),
            ("pie",  "L26", payStart, payEnd, "Payroll Breakdown"),
        };

        int chartIdx = 1;
        var drawingXml = new StringBuilder();
        drawingXml.Append("<xdr:wsDr xmlns:xdr=\"http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing\" xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\">");

        foreach (var cs in chartSpecs) {
            // Add a chart part
            var chartPart = drawingsPart.AddNewPart<ChartPart>();
            string relId = drawingsPart.GetIdOfPart(chartPart);

            // Write chart XML
            string chartXml = BuildChartXml(cs.type, cs.title, cs.dataStart, cs.dataEnd);
            using (var stream = chartPart.GetStream(FileMode.Create, FileAccess.Write))
            using (var writer = new StreamWriter(stream, Encoding.UTF8)) {
                writer.Write(chartXml);
            }

            // Add anchor to drawing XML
            var (col, row) = ParseCellRef(cs.anchor);
            drawingXml.Append(BuildAnchorXml(col, row, relId, chartIdx, cs.title));
            chartIdx++;
            Console.WriteLine($"  Added {cs.type} chart '{cs.title}' at {cs.anchor}");
        }

        drawingXml.Append("</xdr:wsDr>");

        // Write the drawing XML
        if (drawingsPart.WorksheetDrawing == null) {
            using (var stream = drawingsPart.GetStream(FileMode.Create, FileAccess.Write))
            using (var writer = new StreamWriter(stream, Encoding.UTF8)) {
                writer.Write(drawingXml.ToString());
            }
        } else {
            // Append to existing
            using (var stream = drawingsPart.GetStream(FileMode.Open, FileAccess.Write))
            using (var writer = new StreamWriter(stream, Encoding.UTF8)) {
                writer.Write(drawingXml.ToString());
            }
        }

        worksheetPart.Worksheet.Save();
        workbookPart.Workbook.Save();
        Console.WriteLine("Charts added successfully.");
    }

    static string BuildChartXml(string type, string title, int dataStart, int dataEnd) {
        string sheetName = "Dashboard";
        string dataRange = $"'{sheetName}'!$C${dataStart}:$C${dataEnd}";
        string catRange = $"'{sheetName}'!$B${dataStart + 1}:$B${dataEnd}";

        var sb = new StringBuilder();
        sb.Append("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>");
        sb.Append("<c:chartSpace xmlns:c=\"http://schemas.openxmlformats.org/drawingml/2006/chart\" xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\">");
        sb.Append("<c:roundedCorners val=\"false\"/>");
        sb.Append("<c:chart>");
        sb.Append($"<c:title><c:tx><c:rich><a:bodyPr rot=\"0\" spcFirstLastPara=\"1\" vertOverflow=\"ellipsis\" wrap=\"square\" anchor=\"ctr\" anchorCtr=\"1\"/><a:lstStyle/>");
        sb.Append($"<a:p><a:pPr><a:defRPr sz=\"1100\" b=\"1\"/><a:latin typeface=\"Calibri\"/></a:pPr>");
        sb.Append($"<a:r><a:rPr lang=\"en-US\" sz=\"1100\" b=\"1\"><a:solidFill><a:srgbClr val=\"1F3864\"/></a:solidFill><a:latin typeface=\"Calibri\"/></a:rPr><a:t>{EscapeXml(title)}</a:t></a:r>");
        sb.Append("</a:p></c:rich></c:tx><c:overlay val=\"false\"/></c:title>");
        sb.Append("<c:autoTitleDeleted val=\"false\"/>");
        sb.Append("<c:plotArea><c:layout/>");

        if (type == "pie") {
            sb.Append("<c:pie3DChart>");
            sb.Append("<c:ser>");
            sb.Append($"<c:idx val=\"0\"/><c:order val=\"0\"/>");
            sb.Append($"<c:tx><c:strRef><c:f>'{sheetName}'!$C${dataStart}</c:f></c:strRef></c:tx>");
            sb.Append($"<c:cat><c:strRef><c:f>{catRange}</c:f></c:strRef></c:cat>");
            sb.Append($"<c:val><c:numRef><c:f>{dataRange}</c:f></c:numRef></c:val>");
            sb.Append("<c:dLbls><c:showLegendKey val=\"false\"/><c:showVal val=\"false\"/><c:showCatName val=\"false\"/><c:showSerName val=\"false\"/><c:showPercent val=\"true\"/><c:showBubbleSize val=\"false\"/></c:dLbls>");
            sb.Append("</c:ser>");
            sb.Append("<c:varyColors val=\"true\"/>");
            sb.Append("</c:pie3DChart>");
        } else if (type == "bar") {
            sb.Append("<c:barChart>");
            sb.Append("<c:barDir val=\"col\"/><c:grouping val=\"clustered\"/><c:varyColors val=\"false\"/>");
            sb.Append("<c:ser>");
            sb.Append($"<c:idx val=\"0\"/><c:order val=\"0\"/>");
            sb.Append($"<c:tx><c:strRef><c:f>'{sheetName}'!$C${dataStart}</c:f></c:strRef></c:tx>");
            sb.Append("<c:spPr><a:solidFill><a:srgbClr val=\"C9A227\"/></a:solidFill></c:spPr>");
            sb.Append($"<c:cat><c:strRef><c:f>{catRange}</c:f></c:strRef></c:cat>");
            sb.Append($"<c:val><c:numRef><c:f>{dataRange}</c:f></c:numRef></c:val>");
            sb.Append("<c:dLbls><c:showVal val=\"true\"/><c:showLegendKey val=\"false\"/></c:dLbls>");
            sb.Append("</c:ser>");
            sb.Append("<c:dLbls><c:showVal val=\"true\"/><c:showLegendKey val=\"false\"/></c:dLbls>");
            sb.Append("<c:gapWidth val=\"80\"/>");
            sb.Append("</c:barChart>");
            // Axes
            sb.Append("<c:catAx><c:axId val=\"111111\"/><c:scaling><c:orientation val=\"minMax\"/></c:scaling><c:delete val=\"false\"/><c:axPos val=\"b\"/><c:crossAx val=\"222222\"/><c:crosses val=\"autoZero\"/></c:catAx>");
            sb.Append("<c:valAx><c:axId val=\"222222\"/><c:scaling><c:orientation val=\"minMax\"/></c:scaling><c:delete val=\"false\"/><c:axPos val=\"l\"/><c:crossAx val=\"111111\"/><c:crosses val=\"autoZero\"/></c:valAx>");
        } else if (type == "line") {
            sb.Append("<c:lineChart>");
            sb.Append("<c:grouping val=\"standard\"/><c:varyColors val=\"false\"/>");
            sb.Append("<c:ser>");
            sb.Append($"<c:idx val=\"0\"/><c:order val=\"0\"/>");
            sb.Append($"<c:tx><c:strRef><c:f>'{sheetName}'!$C${dataStart}</c:f></c:strRef></c:tx>");
            sb.Append("<c:spPr><a:ln w=\"25400\"><a:solidFill><a:srgbClr val=\"1F3864\"/></a:solidFill></a:ln></c:spPr>");
            sb.Append($"<c:cat><c:strRef><c:f>{catRange}</c:f></c:strRef></c:cat>");
            sb.Append($"<c:val><c:numRef><c:f>{dataRange}</c:f></c:numRef></c:val>");
            sb.Append("<c:marker><c:symbol val=\"circle\"/><c:size val=\"7\"/></c:marker>");
            sb.Append("<c:dLbls><c:showVal val=\"true\"/><c:showLegendKey val=\"false\"/></c:dLbls>");
            sb.Append("</c:ser>");
            sb.Append("<c:dLbls><c:showVal val=\"true\"/></c:dLbls>");
            sb.Append("<c:smooth val=\"false\"/>");
            sb.Append("</c:lineChart>");
            sb.Append("<c:catAx><c:axId val=\"333333\"/><c:scaling><c:orientation val=\"minMax\"/></c:scaling><c:delete val=\"false\"/><c:axPos val=\"b\"/><c:crossAx val=\"444444\"/><c:crosses val=\"autoZero\"/></c:catAx>");
            sb.Append("<c:valAx><c:axId val=\"444444\"/><c:scaling><c:orientation val=\"minMax\"/></c:scaling><c:delete val=\"false\"/><c:axPos val=\"l\"/><c:crossAx val=\"333333\"/><c:crosses val=\"autoZero\"/></c:valAx>");
        }

        sb.Append("</c:plotArea>");
        sb.Append("<c:legend><c:legendPos val=\"b\"/><c:overlay val=\"false\"/></c:legend>");
        sb.Append("<c:plotVisOnly val=\"true\"/><c:dispBlanksAs val=\"zero\"/>");
        sb.Append("</c:chart>");
        sb.Append("</c:chartSpace>");
        return sb.ToString();
    }

    static string BuildAnchorXml(int col, int row, string relId, int idx, string title) {
        var sb = new StringBuilder();
        sb.Append("<xdr:twoCellAnchor editAs=\"oneCell\">");
        sb.Append("<xdr:from>");
        sb.Append($"<xdr:col>{col}</xdr:col><xdr:colOff>0</xdr:colOff>");
        sb.Append($"<xdr:row>{row}</xdr:row><xdr:rowOff>0</xdr:rowOff>");
        sb.Append("</xdr:from>");
        sb.Append("<xdr:to>");
        sb.Append($"<xdr:col>{col + 4}</xdr:col><xdr:colOff>0</xdr:colOff>");
        sb.Append($"<xdr:row>{row + 10}</xdr:row><xdr:rowOff>0</xdr:rowOff>");
        sb.Append("</xdr:to>");
        sb.Append("<xdr:graphicFrame macro=\"\">");
        sb.Append("<xdr:nvGraphicFramePr>");
        sb.Append($"<xdr:cNvPr id=\"{idx + 100}\" name=\"Chart {idx}\"/>");
        sb.Append("<xdr:cNvGraphicFramePr/>");
        sb.Append("</xdr:nvGraphicFramePr>");
        sb.Append("<xdr:xfrm>");
        sb.Append("<a:off x=\"0\" y=\"0\"/>");
        sb.Append("<a:ext cx=\"0\" cy=\"0\"/>");
        sb.Append("</xdr:xfrm>");
        sb.Append("<a:graphic>");
        sb.Append("<a:graphicData uri=\"http://schemas.openxmlformats.org/drawingml/2006/chart\">");
        sb.Append($"<c:chart xmlns:c=\"http://schemas.openxmlformats.org/drawingml/2006/chart\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\" r:id=\"{relId}\"/>");
        sb.Append("</a:graphicData>");
        sb.Append("</a:graphic>");
        sb.Append("</xdr:graphicFrame>");
        sb.Append("<xdr:clientData/>");
        sb.Append("</xdr:twoCellAnchor>");
        return sb.ToString();
    }

    static (int col, int row) ParseCellRef(string cellRef) {
        int i = 0;
        while (i < cellRef.Length && char.IsLetter(cellRef[i])) i++;
        string colStr = cellRef.Substring(0, i);
        int row = int.Parse(cellRef.Substring(i));
        int col = 0;
        for (int j = 0; j < colStr.Length; j++) {
            col = col * 26 + (char.ToUpper(colStr[j]) - 'A' + 1);
        }
        return (col - 1, row - 1);  // 0-indexed
    }

    static string EscapeXml(string s) => s
        .Replace("&", "&amp;")
        .Replace("<", "&lt;")
        .Replace(">", "&gt;")
        .Replace("\"", "&quot;");
}
