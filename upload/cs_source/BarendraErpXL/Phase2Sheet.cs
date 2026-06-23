// Phase2Sheet.cs — Dhaka factory Phase 2 production: sizing, re-wash, assembly, value rollup
using System;
using System.Globalization;
using ClosedXML.Excel;

namespace BarendraErpXL;

internal static class Phase2Sheet
{
    public static void Build(XLWorkbook wb) {
        var ws = wb.AddWorksheet("Phase 2 Production");
        Program.SetColumnWidths(ws, 4, 16, 14, 12, 12, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 13, 13, 14, 12);

        Program.WriteTitleBar(ws, "PHASE 2 — FINAL PRODUCTION (Dhaka Factory)",
            "Sizing by length, re-wash, assembly. Value rollup by size-wise rate master.", 20);

        int r = 4;
        string[] hdr = { "Job ID", "Lot ID", "Date", "Input (kg)",
                         "5\" kg", "8\" kg", "10\" kg", "12\" kg", "14\" kg",
                         "16\" kg", "18\" kg", "20\" kg", "24\" kg", "30\" kg",
                         "Total Sized (kg)", "Combing Loss (kg)", "Loss %",
                         "Realisable Value (BDT)", "Cost (BDT)", "Margin (BDT)" };
        for (int i = 0; i < hdr.Length; i++) {
            ws.Cell(r, 2 + i).Value = hdr[i];
            Program.StyleHeader(ws.Cell(r, 2 + i));
        }
        ws.Row(r).Height = 32;
        r++;

        var data = new object[,] {
            { "P2-001", "LOT-20260412-01", "2026-06-15", 250,  10,  35,  45,  40,  35,  30,  20,  15,  10,   5 },
            { "P2-002", "LOT-20260425-02", "2026-06-17", 180,   8,  28,  35,  32,  28,  20,  12,   8,   5,   3 },
            { "P2-003", "LOT-20260503-03", "2026-06-19", 200,   5,  20,  30,  30,  30,  28,  22,  18,  12,   5 },
            { "P2-004", "LOT-20260518-04", "2026-06-20", 300,  15,  50,  60,  55,  45,  35,  20,  10,   6,   4 },
            { "P2-005", "LOT-20260602-05", "2026-06-21", 220,  12,  40,  45,  38,  32,  25,  15,   8,   3,   2 },
        };
        int startRow = r;
        for (int i = 0; i < data.GetLength(0); i++) {
            ws.Cell(r, 2).Value = (string)data[i, 0];
            ws.Cell(r, 3).Value = (string)data[i, 1];
            ws.Cell(r, 4).Value = DateTime.ParseExact((string)data[i, 2], "yyyy-MM-dd", CultureInfo.InvariantCulture);
            ws.Cell(r, 5).Value = Convert.ToDouble(data[i, 3]);
            for (int j = 0; j < 10; j++) {
                ws.Cell(r, 6 + j).Value = Convert.ToDouble(data[i, 4 + j]);
            }
            ws.Cell(r, 16).Value = $"=SUM(F{r}:O{r})";
            ws.Cell(r, 17).Value = $"=E{r}-P{r}";
            ws.Cell(r, 18).Value = $"=IFERROR(Q{r}/E{r},0)";
            ws.Cell(r, 19).Value = $"=F{r}*VLOOKUP(5,SIZE_MASTER,2,FALSE)"
                                 + $"+G{r}*VLOOKUP(8,SIZE_MASTER,2,FALSE)"
                                 + $"+H{r}*VLOOKUP(10,SIZE_MASTER,2,FALSE)"
                                 + $"+I{r}*VLOOKUP(12,SIZE_MASTER,2,FALSE)"
                                 + $"+J{r}*VLOOKUP(14,SIZE_MASTER,2,FALSE)"
                                 + $"+K{r}*VLOOKUP(16,SIZE_MASTER,2,FALSE)"
                                 + $"+L{r}*VLOOKUP(18,SIZE_MASTER,2,FALSE)"
                                 + $"+M{r}*VLOOKUP(20,SIZE_MASTER,2,FALSE)"
                                 + $"+N{r}*VLOOKUP(24,SIZE_MASTER,2,FALSE)"
                                 + $"+O{r}*VLOOKUP(30,SIZE_MASTER,2,FALSE)";
            ws.Cell(r, 20).Value = $"=E{r}*4000";
            ws.Cell(r, 21).Value = $"=S{r}-T{r}";

            for (int c = 2; c <= 21; c++) {
                Program.StyleCell(ws.Cell(r, c), i);
                if (c == 4) ws.Cell(r, c).Style.NumberFormat.Format = "yyyy-mm-dd";
                if (c >= 5 && c <= 17) ws.Cell(r, c).Style.NumberFormat.Format = "#,##0.0";
                if (c == 18) ws.Cell(r, c).Style.NumberFormat.Format = "0.0%";
                if (c >= 19 && c <= 21) ws.Cell(r, c).Style.NumberFormat.Format = "#,##0";
                if (c == 19) { ws.Cell(r, c).Style.Fill.BackgroundColor = Program.Gold; ws.Cell(r, c).Style.Font.Bold = true; }
                if (c == 21) { ws.Cell(r, c).Style.Fill.BackgroundColor = Program.Gold; ws.Cell(r, c).Style.Font.Bold = true; }
            }
            r++;
        }
        ws.Cell(r, 3).Value = "TOTALS";
        ws.Cell(r, 5).Value = $"=SUM(E{startRow}:E{r-1})";
        for (int c = 6; c <= 17; c++) {
            char col = (char)('A' + c - 1);
            ws.Cell(r, c).Value = $"=SUM({col}{startRow}:{col}{r-1})";
        }
        ws.Cell(r, 18).Value = $"=IFERROR(Q{r}/E{r},0)";
        ws.Cell(r, 19).Value = $"=SUM(S{startRow}:S{r-1})";
        ws.Cell(r, 20).Value = $"=SUM(T{startRow}:T{r-1})";
        ws.Cell(r, 21).Value = $"=SUM(U{startRow}:U{r-1})";
        for (int c = 2; c <= 21; c++) Program.StyleTotal(ws.Cell(r, c));
        for (int c = 5; c <= 17; c++) ws.Cell(r, c).Style.NumberFormat.Format = "#,##0.0";
        ws.Cell(r, 18).Style.NumberFormat.Format = "0.0%";
        ws.Cell(r, 19).Style.NumberFormat.Format = "#,##0";
        ws.Cell(r, 20).Style.NumberFormat.Format = "#,##0";
        ws.Cell(r, 21).Style.NumberFormat.Format = "#,##0";

        Program.FreezeTop(ws);
    }
}
