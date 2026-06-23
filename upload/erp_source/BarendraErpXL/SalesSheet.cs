// SalesSheet.cs — Export sales with FX conversion and margin analysis
using System;
using System.Globalization;
using ClosedXML.Excel;

namespace BarendraErpXL;

internal static class SalesSheet
{
    public static void Build(XLWorkbook wb) {
        var ws = wb.AddWorksheet("Sales & Export");
        Program.SetColumnWidths(ws, 4, 16, 14, 14, 22, 14, 12, 12, 12, 14, 14, 14, 14, 14, 14, 14);

        Program.WriteTitleBar(ws, "SALES & EXPORT REGISTER",
            "Buyer contracts with FX conversion & margin analysis. Live USD<->BDT via Settings.", 16);

        int r = 4;
        string[] hdr = { "Contract #", "Contract Date", "Buyer", "Country", "Product Spec",
                         "Length (inch)", "Qty (kg)", "USD/kg", "USD Value",
                         "BDT Value", "Cost/kg (BDT)", "Total Cost (BDT)",
                         "Margin/kg (BDT)", "Total Margin (BDT)", "Margin %", "Status" };
        for (int i = 0; i < hdr.Length; i++) {
            ws.Cell(r, 2 + i).Value = hdr[i];
            Program.StyleHeader(ws.Cell(r, 2 + i));
        }
        ws.Row(r).Height = 32;
        r++;

        var sales = new object[,] {
            { "EXP-2026-001", "2026-06-10", "African Bulk Co",     "Nigeria",  "Color #600, 10\" weft",      10, 250,  35.00 },
            { "EXP-2026-002", "2026-06-12", "US Wig Distributors", "USA",      "Color #627, 16\" premium",   16, 80,  120.00 },
            { "EXP-2026-003", "2026-06-15", "EU Hair Boutique",    "Germany",  "Natural, 18\" premium",      18, 60,   95.00 },
            { "EXP-2026-004", "2026-06-17", "China Trade Hub",     "China",    "Color #1B, 12\" mid",        12, 200,  42.00 },
            { "EXP-2026-005", "2026-06-18", "US Wig Distributors", "USA",      "Color #600, 20\" premium",   20, 50,  165.00 },
            { "EXP-2026-006", "2026-06-19", "African Bulk Co",     "Nigeria",  "Mixed, 8\" volume",          8, 350,  18.00 },
            { "EXP-2026-007", "2026-06-20", "EU Hair Boutique",    "France",   "Color #627, 14\" long",      14, 70,   85.00 },
            { "EXP-2026-008", "2026-06-21", "China Trade Hub",     "China",    "Natural, 10\" bulk",         10, 180,  25.00 },
        };
        int startRow = r;
        for (int i = 0; i < sales.GetLength(0); i++) {
            ws.Cell(r, 2).Value = (string)sales[i, 0];
            ws.Cell(r, 3).Value = DateTime.ParseExact((string)sales[i, 1], "yyyy-MM-dd", CultureInfo.InvariantCulture);
            ws.Cell(r, 4).Value = (string)sales[i, 2];
            ws.Cell(r, 5).Value = (string)sales[i, 3];
            ws.Cell(r, 6).Value = (string)sales[i, 4];
            ws.Cell(r, 7).Value = (int)sales[i, 5];
            ws.Cell(r, 8).Value = Convert.ToDouble(sales[i, 6]);
            ws.Cell(r, 9).Value = Convert.ToDouble(sales[i, 7]);
            ws.Cell(r, 10).Value = $"=H{r}*I{r}";
            ws.Cell(r, 11).Value = $"=J{r}*FX_USD_BDT";
            ws.Cell(r, 12).Value = $"=VLOOKUP(G{r},SIZE_MASTER,2,FALSE)";
            ws.Cell(r, 13).Value = $"=L{r}*H{r}";
            ws.Cell(r, 14).Value = $"=IFERROR(K{r}/H{r}-L{r},0)";
            ws.Cell(r, 15).Value = $"=K{r}-M{r}";
            ws.Cell(r, 16).Value = $"=IFERROR(N{r}/(K{r}/H{r}),0)";
            ws.Cell(r, 17).Value = $"=IF(P{r}>0.2,\"Healthy\",\"Review\")";

            for (int c = 2; c <= 17; c++) {
                Program.StyleCell(ws.Cell(r, c), i);
                if (c == 3) ws.Cell(r, c).Style.NumberFormat.Format = "yyyy-mm-dd";
                if (c == 7) ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                if (c == 8) ws.Cell(r, c).Style.NumberFormat.Format = "#,##0.0";
                if (c == 9) ws.Cell(r, c).Style.NumberFormat.Format = "#,##0.00";
                if (c == 10) ws.Cell(r, c).Style.NumberFormat.Format = "#,##0.00";
                if (c == 11) { ws.Cell(r, c).Style.NumberFormat.Format = "#,##0"; ws.Cell(r, c).Style.Fill.BackgroundColor = Program.Gold; ws.Cell(r, c).Style.Font.Bold = true; }
                if (c == 12) ws.Cell(r, c).Style.NumberFormat.Format = "#,##0";
                if (c == 13) ws.Cell(r, c).Style.NumberFormat.Format = "#,##0";
                if (c == 14) ws.Cell(r, c).Style.NumberFormat.Format = "#,##0";
                if (c == 15) { ws.Cell(r, c).Style.NumberFormat.Format = "#,##0"; ws.Cell(r, c).Style.Fill.BackgroundColor = Program.Gold; ws.Cell(r, c).Style.Font.Bold = true; }
                if (c == 16) ws.Cell(r, c).Style.NumberFormat.Format = "0.0%";
                if (c == 17) { ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center; ws.Cell(r, c).Style.Font.Bold = true; }
            }
            r++;
        }
        ws.Cell(r, 4).Value = "TOTALS";
        ws.Cell(r, 8).Value = $"=SUM(H{startRow}:H{r-1})";
        ws.Cell(r, 10).Value = $"=SUM(J{startRow}:J{r-1})";
        ws.Cell(r, 11).Value = $"=SUM(K{startRow}:K{r-1})";
        ws.Cell(r, 13).Value = $"=SUM(M{startRow}:M{r-1})";
        ws.Cell(r, 15).Value = $"=SUM(O{startRow}:O{r-1})";
        ws.Cell(r, 16).Value = $"=IFERROR(O{r}/K{r},0)";
        for (int c = 2; c <= 17; c++) Program.StyleTotal(ws.Cell(r, c));
        ws.Cell(r, 8).Style.NumberFormat.Format = "#,##0.0";
        ws.Cell(r, 10).Style.NumberFormat.Format = "#,##0.00";
        ws.Cell(r, 11).Style.NumberFormat.Format = "#,##0";
        ws.Cell(r, 13).Style.NumberFormat.Format = "#,##0";
        ws.Cell(r, 15).Style.NumberFormat.Format = "#,##0";
        ws.Cell(r, 16).Style.NumberFormat.Format = "0.0%";

        // FX gain/loss section
        r += 3;
        ws.Cell(r, 2).Value = "FX EXPOSURE SUMMARY";
        Program.StyleSubHeader(ws.Cell(r, 2));
        ws.Range(r, 2, r, 6).Merge();
        ws.Range(r, 2, r, 6).Style.Fill.BackgroundColor = Program.MidGrey;
        r++;
        int lastSRow = startRow + sales.GetLength(0) - 1;
        var fxMetrics = new (string label, string formula, string fmt)[] {
            ("Total Export Revenue (USD)",  $"=SUM(J{startRow}:J{lastSRow})", "#,##0.00"),
            ("Total Export Revenue (BDT)",  $"=SUM(K{startRow}:K{lastSRow})", "#,##0"),
            ("Effective Realised Rate",     $"=IFERROR(SUM(K{startRow}:K{lastSRow})/SUM(J{startRow}:J{lastSRow}),0)", "#,##0.00"),
            ("Booked FX Rate (Settings)",   "=FX_USD_BDT", "#,##0.00"),
            ("FX Gain/Loss per USD",        $"=IFERROR(SUM(K{startRow}:K{lastSRow})/SUM(J{startRow}:J{lastSRow}),0)-FX_USD_BDT", "+#,##0.00;-#,##0.00;0.00"),
            ("FX Gain/Loss Total (BDT)",    $"=(IFERROR(SUM(K{startRow}:K{lastSRow})/SUM(J{startRow}:J{lastSRow}),0)-FX_USD_BDT)*SUM(J{startRow}:J{lastSRow})", "+#,##0;-#,##0;0"),
        };
        for (int i = 0; i < fxMetrics.Length; i++) {
            ws.Cell(r, 2).Value = fxMetrics[i].label;
            ws.Cell(r, 3).Value = fxMetrics[i].formula;
            for (int c = 2; c <= 3; c++) {
                Program.StyleCell(ws.Cell(r, c), i);
                if (c == 2) ws.Cell(r, c).Style.Alignment.Indent = 1;
                if (c == 3) ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            }
            ws.Cell(r, 3).Style.NumberFormat.Format = fxMetrics[i].fmt;
            ws.Cell(r, 3).Style.Fill.BackgroundColor = Program.Gold;
            ws.Cell(r, 3).Style.Font.Bold = true;
            r++;
        }

        Program.FreezeTop(ws);
    }
}
