// PayrollSheet.cs — Cross-factory payroll summary
// Factory sheet column mapping (daily record layout):
//   B=Worker ID, C=Name, D=Lot ID, E=Input Given, F=A-wt, G=B-wt, H=C-wt,
//   I=Wastage, J=Balance, K=Days Present, L=Base Wage, M=Att Bonus,
//   N=Total Payable, O=Status

using System;
using System.Linq;
using ClosedXML.Excel;

namespace BarendraErpXL;

internal static class PayrollSheet
{
    public static void Build(XLWorkbook wb, FactoryConfig[] factoryConfigs) {
        var ws = wb.AddWorksheet("Payroll Summary");
        Program.SetColumnWidths(ws, 4, 14, 22, 18, 12, 14, 12, 14, 14, 14, 14, 14, 14, 14);

        Program.WriteTitleBar(ws, "PAYROLL SUMMARY — All Factories (Daily)",
            "Cross-factory rollup. Each row pulls live totals from the corresponding factory sheet.", 14);

        int r = 4;
        string[] hdr = { "Factory ID", "Supervisor", "Location", "Line Leader",
                         "Workers", "Input Given (kg)", "Graded Output (kg)",
                         "Wastage (kg)", "Base Wages (BDT)", "Attendance Bonus",
                         "Workers Total (BDT)", "Supervisor Pay (BDT)",
                         "Grand Total (BDT)", "Status" };
        for (int i = 0; i < hdr.Length; i++) {
            ws.Cell(r, 2 + i).Value = hdr[i];
            Program.StyleHeader(ws.Cell(r, 2 + i));
        }
        ws.Row(r).Height = 36;
        r++;

        int startRow = r;
        for (int i = 0; i < factoryConfigs.Length; i++) {
            var cfg = factoryConfigs[i];
            int workerCount = cfg.Workers.Length;
            int wStart = 19;
            int wEnd = wStart + workerCount - 1;
            int supPayRow = 12;

            ws.Cell(r, 2).Value = cfg.FactoryId;
            ws.Cell(r, 3).Value = cfg.SupervisorName;
            ws.Cell(r, 4).Value = cfg.Location;
            ws.Cell(r, 5).Value = cfg.LineLeader;
            ws.Cell(r, 6).Value = $"=COUNTA('{cfg.SheetName}'!B{wStart}:B{wEnd})";
            // Input Given (col E)
            ws.Cell(r, 7).Value = $"=SUM('{cfg.SheetName}'!E{wStart}:E{wEnd})";
            // Graded Output = A+B+C (cols F+G+H)
            ws.Cell(r, 8).Value = $"=SUM('{cfg.SheetName}'!F{wStart}:F{wEnd})+SUM('{cfg.SheetName}'!G{wStart}:G{wEnd})+SUM('{cfg.SheetName}'!H{wStart}:H{wEnd})";
            // Wastage (col I)
            ws.Cell(r, 9).Value = $"=SUM('{cfg.SheetName}'!I{wStart}:I{wEnd})";
            // Base Wages (col L)
            ws.Cell(r, 10).Value = $"=SUM('{cfg.SheetName}'!L{wStart}:L{wEnd})";
            // Attendance Bonus (col M)
            ws.Cell(r, 11).Value = $"=SUM('{cfg.SheetName}'!M{wStart}:M{wEnd})";
            // Workers Total (col N)
            ws.Cell(r, 12).Value = $"=SUM('{cfg.SheetName}'!N{wStart}:N{wEnd})";
            // Supervisor Pay (cell C11)
            ws.Cell(r, 13).Value = $"='{cfg.SheetName}'!C{supPayRow}";
            // Grand Total = Workers Total + Supervisor Pay
            ws.Cell(r, 14).Value = $"=L{r}+M{r}";
            // Status
            ws.Cell(r, 15).Value = $"=IF(L{r}>0,\"Pending Approval\",\"Hold\")";

            for (int c = 2; c <= 15; c++) {
                Program.StyleCell(ws.Cell(r, c), i);
                if (c == 2) { ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center; ws.Cell(r, c).Style.Font.Bold = true; }
                if (c == 6) ws.Cell(r, c).Style.NumberFormat.Format = "0";
                if (c >= 7 && c <= 9) ws.Cell(r, c).Style.NumberFormat.Format = "#,##0.0";
                if (c >= 10 && c <= 14) ws.Cell(r, c).Style.NumberFormat.Format = "#,##0";
                if (c == 14) { ws.Cell(r, c).Style.Fill.BackgroundColor = Program.Gold; ws.Cell(r, c).Style.Font.Bold = true; }
                if (c == 15) ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            }
            r++;
        }

        // Totals row
        ws.Cell(r, 3).Value = "ALL FACTORIES TOTAL";
        ws.Cell(r, 6).Value = $"=SUM(F{startRow}:F{r-1})";
        ws.Cell(r, 7).Value = $"=SUM(G{startRow}:G{r-1})";
        ws.Cell(r, 8).Value = $"=SUM(H{startRow}:H{r-1})";
        ws.Cell(r, 9).Value = $"=SUM(I{startRow}:I{r-1})";
        ws.Cell(r, 10).Value = $"=SUM(J{startRow}:J{r-1})";
        ws.Cell(r, 11).Value = $"=SUM(K{startRow}:K{r-1})";
        ws.Cell(r, 12).Value = $"=SUM(L{startRow}:L{r-1})";
        ws.Cell(r, 13).Value = $"=SUM(M{startRow}:M{r-1})";
        ws.Cell(r, 14).Value = $"=SUM(N{startRow}:N{r-1})";
        for (int c = 2; c <= 15; c++) Program.StyleTotal(ws.Cell(r, c));
        ws.Cell(r, 6).Style.NumberFormat.Format = "0";
        ws.Cell(r, 7).Style.NumberFormat.Format = "#,##0.0";
        ws.Cell(r, 8).Style.NumberFormat.Format = "#,##0.0";
        ws.Cell(r, 9).Style.NumberFormat.Format = "#,##0.0";
        ws.Cell(r, 10).Style.NumberFormat.Format = "#,##0";
        ws.Cell(r, 11).Style.NumberFormat.Format = "#,##0";
        ws.Cell(r, 12).Style.NumberFormat.Format = "#,##0";
        ws.Cell(r, 13).Style.NumberFormat.Format = "#,##0";
        ws.Cell(r, 14).Style.NumberFormat.Format = "#,##0";

        // Summary metrics
        r += 3;
        ws.Cell(r, 2).Value = "DAILY PAYROLL SUMMARY (Live)";
        Program.StyleSubHeader(ws.Cell(r, 2));
        ws.Range(r, 2, r, 8).Merge();
        ws.Range(r, 2, r, 8).Style.Fill.BackgroundColor = Program.MidGrey;
        r++;

        int lastFactoryRow = startRow + factoryConfigs.Length - 1;
        var metrics = new (string label, string formula, string fmt)[] {
            ("Total Factories",            $"=COUNTA(B{startRow}:B{lastFactoryRow})", "0"),
            ("Total Workers",              $"=SUM(F{startRow}:F{lastFactoryRow})", "0"),
            ("Total Input Given (kg)",     $"=SUM(G{startRow}:G{lastFactoryRow})", "#,##0.0"),
            ("Total Graded Output (kg)",   $"=SUM(H{startRow}:H{lastFactoryRow})", "#,##0.0"),
            ("Total Wastage (kg)",         $"=SUM(I{startRow}:I{lastFactoryRow})", "#,##0.0"),
            ("Total Base Wages (BDT)",     $"=SUM(J{startRow}:J{lastFactoryRow})", "#,##0"),
            ("Total Attendance Bonus",     $"=SUM(K{startRow}:K{lastFactoryRow})", "#,##0"),
            ("Total Workers Pay (BDT)",    $"=SUM(L{startRow}:L{lastFactoryRow})", "#,##0"),
            ("Total Supervisor Pay (BDT)", $"=SUM(M{startRow}:M{lastFactoryRow})", "#,##0"),
            ("Grand Total Payroll (BDT)",  $"=SUM(N{startRow}:N{lastFactoryRow})", "#,##0"),
        };
        for (int i = 0; i < metrics.Length; i++) {
            ws.Cell(r, 2).Value = metrics[i].label;
            ws.Cell(r, 3).Value = metrics[i].formula;
            for (int c = 2; c <= 3; c++) {
                Program.StyleCell(ws.Cell(r, c), i);
                ws.Cell(r, c).Style.Alignment.Horizontal = (c == 3) ? XLAlignmentHorizontalValues.Center : XLAlignmentHorizontalValues.Left;
                if (c == 2) ws.Cell(r, c).Style.Alignment.Indent = 1;
            }
            ws.Cell(r, 3).Style.NumberFormat.Format = metrics[i].fmt;
            ws.Cell(r, 3).Style.Fill.BackgroundColor = Program.Gold;
            ws.Cell(r, 3).Style.Font.Bold = true;
            r++;
        }

        Program.FreezeTop(ws);
    }
}
