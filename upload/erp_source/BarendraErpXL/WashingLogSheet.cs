// WashingLogSheet.cs — Wash batch tracking with input/output/wastage formulas
using System;
using System.Globalization;
using ClosedXML.Excel;

namespace HairlanErpXL;

internal static class WashingLogSheet
{
    public static void Build(XLWorkbook wb) {
        var ws = wb.AddWorksheet("Washing Log");
        Program.SetColumnWidths(ws, 4, 16, 14, 14, 14, 14, 14, 14, 14, 14, 14, 16);

        Program.WriteTitleBar(ws, "WASHING & PRE-PROCESSING LOG",
            "Each wash batch: input kg, output kg, wastage kg & %. Flagged red if > Settings tolerance.", 12);

        int r = 4;
        string[] hdr = { "Wash ID", "Wash Date", "Lot ID", "Operator",
                         "Input (kg)", "Output (kg)", "Wastage (kg)", "Wastage %",
                         "Chemicals (BDT)", "Labour (BDT)", "Cost/kg Out (BDT)", "Status" };
        for (int i = 0; i < hdr.Length; i++) {
            ws.Cell(r, 2 + i).Value = hdr[i];
            Program.StyleHeader(ws.Cell(r, 2 + i));
        }
        ws.Row(r).Height = 32;
        r++;

        var data = new object[,] {
            { "W-2026-001", "2026-04-15", "LOT-20260412-01", "Rina Begum",   500, 462 },
            { "W-2026-002", "2026-04-26", "LOT-20260425-02", "Rina Begum",   350, 322 },
            { "W-2026-003", "2026-05-04", "LOT-20260503-03", "Selina Akter", 280, 257 },
            { "W-2026-004", "2026-05-19", "LOT-20260518-04", "Selina Akter", 420, 386 },
            { "W-2026-005", "2026-06-03", "LOT-20260602-05", "Rina Begum",   300, 277 },
            { "W-2026-006", "2026-06-16", "LOT-20260615-06", "Selina Akter", 200, 181 },
            { "W-2026-007", "2026-06-18", "LOT-20260422-L02", "Rina Begum",   60,  55  },
            { "W-2026-008", "2026-06-19", "LOT-20260520-L04", "Selina Akter", 50,  46  },
        };
        int startRow = r;
        for (int i = 0; i < data.GetLength(0); i++) {
            ws.Cell(r, 2).Value = (string)data[i, 0];
            ws.Cell(r, 3).Value = DateTime.ParseExact((string)data[i, 1], "yyyy-MM-dd", CultureInfo.InvariantCulture);
            ws.Cell(r, 4).Value = (string)data[i, 2];
            ws.Cell(r, 5).Value = (string)data[i, 3];
            ws.Cell(r, 6).Value = Convert.ToDouble(data[i, 4]);
            ws.Cell(r, 7).Value = Convert.ToDouble(data[i, 5]);
            ws.Cell(r, 8).Value = $"=F{r}-G{r}";
            ws.Cell(r, 9).Value = $"=IFERROR((F{r}-G{r})/F{r},0)";
            ws.Cell(r, 10).Value = Math.Round(Convert.ToDouble(data[i, 4]) * 12, 0);
            ws.Cell(r, 11).Value = Math.Round(Convert.ToDouble(data[i, 4]) * 8, 0);
            ws.Cell(r, 12).Value = $"=IFERROR((J{r}+K{r})/G{r},0)";
            ws.Cell(r, 13).Value = $"=IF(I{r}>WASH_TOL,\"INVESTIGATE\",\"OK\")";

            for (int c = 2; c <= 13; c++) {
                Program.StyleCell(ws.Cell(r, c), i);
                if (c == 3) ws.Cell(r, c).Style.NumberFormat.Format = "yyyy-mm-dd";
                if (c == 6 || c == 7 || c == 8) ws.Cell(r, c).Style.NumberFormat.Format = "#,##0.0";
                if (c == 9) ws.Cell(r, c).Style.NumberFormat.Format = "0.0%";
                if (c == 10 || c == 11 || c == 12) ws.Cell(r, c).Style.NumberFormat.Format = "#,##0";
                if (c == 13) {
                    ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                    ws.Cell(r, c).Style.Font.Bold = true;
                }
                if (c == 8 || c == 9) { ws.Cell(r, c).Style.Fill.BackgroundColor = Program.Gold; ws.Cell(r, c).Style.Font.Bold = true; }
            }
            r++;
        }
        ws.Cell(r, 5).Value = "TOTALS";
        ws.Cell(r, 6).Value = $"=SUM(F{startRow}:F{r-1})";
        ws.Cell(r, 7).Value = $"=SUM(G{startRow}:G{r-1})";
        ws.Cell(r, 8).Value = $"=SUM(H{startRow}:H{r-1})";
        ws.Cell(r, 9).Value = $"=IFERROR(H{r}/F{r},0)";
        ws.Cell(r, 10).Value = $"=SUM(J{startRow}:J{r-1})";
        ws.Cell(r, 11).Value = $"=SUM(K{startRow}:K{r-1})";
        ws.Cell(r, 12).Value = $"=IFERROR((J{r}+K{r})/G{r},0)";
        for (int c = 2; c <= 13; c++) Program.StyleTotal(ws.Cell(r, c));
        ws.Cell(r, 6).Style.NumberFormat.Format = "#,##0.0";
        ws.Cell(r, 7).Style.NumberFormat.Format = "#,##0.0";
        ws.Cell(r, 8).Style.NumberFormat.Format = "#,##0.0";
        ws.Cell(r, 9).Style.NumberFormat.Format = "0.0%";
        ws.Cell(r, 10).Style.NumberFormat.Format = "#,##0";
        ws.Cell(r, 11).Style.NumberFormat.Format = "#,##0";
        ws.Cell(r, 12).Style.NumberFormat.Format = "#,##0";

        Program.FreezeTop(ws);
    }
}
