// DashboardSheet.cs — Executive dashboard with KPI tiles
// Charts are added in a second pass by add_charts.py (openpyxl), since
// ClosedXML 0.104 does not ship native chart support.
using System;
using System.Linq;
using ClosedXML.Excel;

namespace HairlanErpXL;

internal static class DashboardSheet
{
    public static void Build(XLWorkbook wb, FactoryConfig[] factoryConfigs) {
        var ws = wb.AddWorksheet("Dashboard");
        Program.SetColumnWidths(ws, 2, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 2);

        // Title bar
        ws.Row(1).Height = 38;
        ws.Row(2).Height = 20;
        ws.Row(3).Height = 8;

        var t = ws.Cell(1, 2); t.Value = "BARENDRA INTERNATIONAL — EXECUTIVE DASHBOARD";
        t.Style.Font.FontName = Program.FontName; t.Style.Font.FontSize = 18;
        t.Style.Font.Bold = true; t.Style.Font.FontColor = Program.White;
        t.Style.Fill.BackgroundColor = Program.Navy;
        t.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        t.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        ws.Range(1, 2, 1, 17).Merge();
        foreach (var col in Enumerable.Range(2, 16)) ws.Cell(1, col).Style.Fill.BackgroundColor = Program.Navy;

        var s = ws.Cell(2, 2); s.Value = "Live KPIs & charts — all values driven by formulas referencing underlying sheets";
        s.Style.Font.FontName = Program.FontName; s.Style.Font.FontSize = 10;
        s.Style.Font.Italic = true; s.Style.Font.FontColor = Program.Navy;
        s.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        ws.Range(2, 2, 2, 17).Merge();

        ws.Range(3, 2, 3, 17).Style.Fill.BackgroundColor = Program.Gold;

        // ── KPI TILES (4 tiles × 2 rows = 8 tiles) ────────────────
        int tileStartRow = 5;

        // Build dynamic formulas that aggregate across all factory sheets
        // Factory sheet columns: F=A-wt, G=B-wt, H=C-wt, L=Base Wage, M=Att Bonus, N=Total Payable
        string totalWorkersTile = "=" + string.Join("+", factoryConfigs.Select(cfg => {
            int wc = cfg.Workers.Length;
            return $"COUNTA('{cfg.SheetName}'!B19:B{18+wc})";
        }));
        string totalPayrollTile = "=" + string.Join("+", factoryConfigs.Select(cfg => {
            int wc = cfg.Workers.Length;
            return $"SUM('{cfg.SheetName}'!N19:N{18+wc})";
        }));

        var tileLayout = new (int startCol, string label, string formula, string fmt, XLColor accent)[] {
            (2,  "Total Active Lots",          "=COUNTA('Lot Master'!B5:B15)",                                          "0",       Program.Gold),
            (6,  "Total Workers",              totalWorkersTile,                                                          "0",       Program.Gold),
            (10, "Daily Output (kg)",          "=ROUND(SUM('Costing Analysis'!E12:E16),0)",                              "#,##0",   Program.Gold),
            (14, "A-Grade % (Company)",        "='QC & Grading'!C106",                                                   "0.0%",    Program.Green),
            (2,  "Avg Cost / kg (BDT)",        "=IFERROR(SUM('Costing Analysis'!J12:J16)/SUM('Costing Analysis'!E12:E16),0)", "#,##0", Program.Amber),
            (6,  "Total Payroll (BDT)",        totalPayrollTile,                                                          "#,##0",   Program.Gold),
            (10, "Export Revenue (BDT)",       "=SUM('Sales & Export'!K5:K12)",                                          "#,##0",   Program.Gold),
            (14, "FX Rate (BDT/USD)",          "=FX_USD_BDT",                                                             "#,##0.00", Program.Navy),
        };

        for (int i = 0; i < tileLayout.Length; i++) {
            int row = tileStartRow + (i / 4) * 5;
            int col = tileLayout[i].startCol;

            // Label row
            ws.Row(row).Height = 20;
            ws.Cell(row, col).Value = tileLayout[i].label;
            ws.Range(row, col, row, col + 3).Merge();
            var labelCell = ws.Cell(row, col);
            labelCell.Style.Font.FontName = Program.FontName;
            labelCell.Style.Font.FontSize = 10;
            labelCell.Style.Font.Bold = true;
            labelCell.Style.Font.FontColor = Program.Navy;
            labelCell.Style.Fill.BackgroundColor = Program.White;
            labelCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            labelCell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
            labelCell.Style.Border.TopBorder = XLBorderStyleValues.Medium;
            labelCell.Style.Border.TopBorderColor = tileLayout[i].accent;
            labelCell.Style.Border.LeftBorder = XLBorderStyleValues.Medium;
            labelCell.Style.Border.LeftBorderColor = tileLayout[i].accent;
            labelCell.Style.Border.RightBorder = XLBorderStyleValues.Medium;
            labelCell.Style.Border.RightBorderColor = tileLayout[i].accent;
            for (int cc = col + 1; cc <= col + 3; cc++) {
                ws.Cell(row, cc).Style.Border.TopBorder = XLBorderStyleValues.Medium;
                ws.Cell(row, cc).Style.Border.TopBorderColor = tileLayout[i].accent;
                ws.Cell(row, cc).Style.Fill.BackgroundColor = Program.White;
            }
            ws.Cell(row, col + 3).Style.Border.RightBorder = XLBorderStyleValues.Medium;
            ws.Cell(row, col + 3).Style.Border.RightBorderColor = tileLayout[i].accent;

            // Value row
            ws.Row(row + 1).Height = 36;
            var valueCell = ws.Cell(row + 1, col);
            valueCell.Value = tileLayout[i].formula;
            valueCell.Style.NumberFormat.Format = tileLayout[i].fmt;
            ws.Range(row + 1, col, row + 1, col + 3).Merge();
            valueCell.Style.Font.FontName = Program.FontName;
            valueCell.Style.Font.FontSize = 22;
            valueCell.Style.Font.Bold = true;
            valueCell.Style.Font.FontColor = tileLayout[i].accent;
            valueCell.Style.Fill.BackgroundColor = Program.White;
            valueCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            valueCell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
            valueCell.Style.Border.LeftBorder = XLBorderStyleValues.Medium;
            valueCell.Style.Border.LeftBorderColor = tileLayout[i].accent;
            valueCell.Style.Border.RightBorder = XLBorderStyleValues.Medium;
            valueCell.Style.Border.RightBorderColor = tileLayout[i].accent;
            valueCell.Style.Border.BottomBorder = XLBorderStyleValues.Medium;
            valueCell.Style.Border.BottomBorderColor = tileLayout[i].accent;
            for (int cc = col + 1; cc <= col + 3; cc++) {
                ws.Cell(row + 1, cc).Style.Border.BottomBorder = XLBorderStyleValues.Medium;
                ws.Cell(row + 1, cc).Style.Border.BottomBorderColor = tileLayout[i].accent;
                ws.Cell(row + 1, cc).Style.Fill.BackgroundColor = Program.White;
            }
            ws.Cell(row + 1, col + 3).Style.Border.RightBorder = XLBorderStyleValues.Medium;
            ws.Cell(row + 1, col + 3).Style.Border.RightBorderColor = tileLayout[i].accent;
        }

        // Chart anchor row (charts added by Python post-processor)
        int chartHeaderRow = tileStartRow + 11;
        ws.Row(chartHeaderRow - 1).Height = 22;
        ws.Cell(chartHeaderRow - 1, 2).Value = "▼ KEY ANALYTICS (charts added by post-processor)";
        ws.Cell(chartHeaderRow - 1, 2).Style.Font.FontName = Program.FontName;
        ws.Cell(chartHeaderRow - 1, 2).Style.Font.FontSize = 11;
        ws.Cell(chartHeaderRow - 1, 2).Style.Font.Bold = true;
        ws.Cell(chartHeaderRow - 1, 2).Style.Font.FontColor = Program.White;
        ws.Cell(chartHeaderRow - 1, 2).Style.Fill.BackgroundColor = Program.Navy;
        ws.Range(chartHeaderRow - 1, 2, chartHeaderRow - 1, 17).Merge();
        ws.Range(chartHeaderRow - 1, 2, chartHeaderRow - 1, 17).Style.Fill.BackgroundColor = Program.Navy;
        ws.Cell(chartHeaderRow - 1, 2).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
        ws.Cell(chartHeaderRow - 1, 2).Style.Alignment.Indent = 1;

        // Reserve space for 6 charts (2 rows × 3 cols), each chart ~9 rows tall
        for (int rr = chartHeaderRow; rr < chartHeaderRow + 20; rr++) {
            ws.Row(rr).Height = 15;
        }

        // ── HELPER DATA BLOCK (for Python charts to reference) ─────
        // Place hidden helper data below the chart area
        int helperRow = chartHeaderRow + 22;
        ws.Cell(helperRow, 2).Value = "Helper Data — used by charts (do not delete)";
        ws.Cell(helperRow, 2).Style.Font.Italic = true;
        ws.Cell(helperRow, 2).Style.Font.FontColor = XLColor.Gray;
        helperRow++;

        // Helper: Grade distribution
        ws.Cell(helperRow, 2).Value = "Grade"; ws.Cell(helperRow, 3).Value = "Count";
        ws.Cell(helperRow + 1, 2).Value = "A"; ws.Cell(helperRow + 1, 3).Value = "=COUNTIF('QC & Grading'!L5:L16,\"A*\")";
        ws.Cell(helperRow + 2, 2).Value = "B"; ws.Cell(helperRow + 2, 3).Value = "=COUNTIF('QC & Grading'!L5:L16,\"B*\")";
        ws.Cell(helperRow + 3, 2).Value = "C"; ws.Cell(helperRow + 3, 3).Value = "=COUNTIF('QC & Grading'!L5:L16,\"C*\")";
        int gradeDataStart = helperRow;
        int gradeDataEnd = helperRow + 3;

        // Helper: Cost/kg by factory (5 factories now)
        int costHelperRow = helperRow + 5;
        ws.Cell(costHelperRow, 2).Value = "Factory"; ws.Cell(costHelperRow, 3).Value = "Cost/kg";
        for (int i = 0; i < factoryConfigs.Length; i++) {
            ws.Cell(costHelperRow + 1 + i, 2).Value = factoryConfigs[i].FactoryId;
            ws.Cell(costHelperRow + 1 + i, 3).Value = $"='Costing Analysis'!K{12+i}";
        }
        int costDataStart = costHelperRow;
        int costDataEnd = costHelperRow + factoryConfigs.Length;

        // Helper: Inventory bucket values
        int invHelperRow = costHelperRow + 11;
        ws.Cell(invHelperRow, 2).Value = "Bucket"; ws.Cell(invHelperRow, 3).Value = "Value (BDT)";
        string[] bucketNames = { "Raw Material", "Washed Stock", "Distributed (Field)", "In-Factory (Home)",
                                 "Half-Finish Return", "In Final Production", "Finished Goods", "Reject / Wastage" };
        for (int i = 0; i < 8; i++) {
            ws.Cell(invHelperRow + 1 + i, 2).Value = bucketNames[i];
            ws.Cell(invHelperRow + 1 + i, 3).Value = $"='Inventory (8 Buckets)'!G{5+i}";
        }
        int invDataStart = invHelperRow;
        int invDataEnd = invHelperRow + 8;

        // Helper: Sales by buyer
        int salesHelperRow = invHelperRow + 11;
        ws.Cell(salesHelperRow, 2).Value = "Buyer"; ws.Cell(salesHelperRow, 3).Value = "BDT";
        var buyerNames = new[] { "African Bulk Co", "US Wig Distributors", "EU Hair Boutique", "China Trade Hub" };
        for (int i = 0; i < buyerNames.Length; i++) {
            ws.Cell(salesHelperRow + 1 + i, 2).Value = buyerNames[i];
            ws.Cell(salesHelperRow + 1 + i, 3).Value = $"=SUMIF('Sales & Export'!D5:D12,\"{buyerNames[i]}\",'Sales & Export'!K5:K12)";
        }
        int salesDataStart = salesHelperRow;
        int salesDataEnd = salesHelperRow + 4;

        // Helper: Size-wise rate master
        int sizeHelperRow = salesHelperRow + 7;
        ws.Cell(sizeHelperRow, 2).Value = "Length"; ws.Cell(sizeHelperRow, 3).Value = "BDT/kg";
        int[] lengths = { 5, 8, 10, 12, 14, 16, 18, 20, 24, 30 };
        for (int i = 0; i < lengths.Length; i++) {
            ws.Cell(sizeHelperRow + 1 + i, 2).Value = $"{lengths[i]}\"";
            ws.Cell(sizeHelperRow + 1 + i, 3).Value = $"=VLOOKUP({lengths[i]},SIZE_MASTER,2,FALSE)";
        }
        int sizeDataStart = sizeHelperRow;
        int sizeDataEnd = sizeHelperRow + 10;

        // Helper: Payroll breakdown (aggregate across all factory sheets)
        int payHelperRow = sizeHelperRow + 13;
        ws.Cell(payHelperRow, 2).Value = "Component"; ws.Cell(payHelperRow, 3).Value = "Amount";
        // Base Wages (col L in factory sheets)
        ws.Cell(payHelperRow + 1, 2).Value = "Base Wages";
        ws.Cell(payHelperRow + 1, 3).Value = "=" + string.Join("+", factoryConfigs.Select(cfg => {
            int wc = cfg.Workers.Length;
            return $"SUM('{cfg.SheetName}'!L19:L{18+wc})";
        }));
        // Attendance Bonus (col M)
        ws.Cell(payHelperRow + 2, 2).Value = "Attendance Bonus";
        ws.Cell(payHelperRow + 2, 3).Value = "=" + string.Join("+", factoryConfigs.Select(cfg => {
            int wc = cfg.Workers.Length;
            return $"SUM('{cfg.SheetName}'!M19:M{18+wc})";
        }));
        // Supervisor Pay (cell C11 in each factory sheet)
        ws.Cell(payHelperRow + 3, 2).Value = "Supervisor Pay";
        ws.Cell(payHelperRow + 3, 3).Value = "=" + string.Join("+", factoryConfigs.Select(cfg => {
            return $"'{cfg.SheetName}'!C12";
        }));
        int payDataStart = payHelperRow;
        int payDataEnd = payHelperRow + 3;

        // Format helper data cells
        for (int rr = helperRow; rr <= payDataEnd; rr++) {
            for (int c = 2; c <= 3; c++) {
                ws.Cell(rr, c).Style.Font.FontName = Program.FontName;
                ws.Cell(rr, c).Style.Font.FontSize = 9;
            }
            // Hide helper rows
            ws.Row(rr).Height = 0;
            ws.Row(rr).Hide();
        }

        // Write a metadata note for the Python post-processor in a known cell
        // Place chart metadata in cells T1..T10 (hidden)
        ws.Cell(1, 20).Value = "CHART_ANCHORS";
        ws.Cell(2, 20).Value = $"GradePie|B{chartHeaderRow}|{gradeDataStart}|{gradeDataEnd}";
        ws.Cell(3, 20).Value = $"CostBar|G{chartHeaderRow}|{costDataStart}|{costDataEnd}";
        ws.Cell(4, 20).Value = $"InvBar|L{chartHeaderRow}|{invDataStart}|{invDataEnd}";
        ws.Cell(5, 20).Value = $"SalesPie|B{chartHeaderRow + 10}|{salesDataStart}|{salesDataEnd}";
        ws.Cell(6, 20).Value = $"SizeLine|G{chartHeaderRow + 10}|{sizeDataStart}|{sizeDataEnd}";
        ws.Cell(7, 20).Value = $"PayPie|L{chartHeaderRow + 10}|{payDataStart}|{payDataEnd}";
        ws.Column(20).Hide();

        // Footer
        int footerRow = chartHeaderRow + 22;
        ws.Cell(footerRow, 2).Value = "All tiles & charts driven by live formulas. Change inputs on Settings or underlying sheets -> Dashboard auto-refreshes on open.";
        ws.Range(footerRow, 2, footerRow, 17).Merge();
        ws.Cell(footerRow, 2).Style.Font.FontName = Program.FontName;
        ws.Cell(footerRow, 2).Style.Font.FontSize = 9;
        ws.Cell(footerRow, 2).Style.Font.Italic = true;
        ws.Cell(footerRow, 2).Style.Font.FontColor = Program.Gold;

        // Hide gridlines for cleaner dashboard look
        ws.PageSetup.ShowGridlines = false;
    }
}
