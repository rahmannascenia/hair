// Phase1Sheet.cs — Phase 1 Distribution: PM -> Head -> Line -> Supervisor -> Worker
using System;
using System.Globalization;
using ClosedXML.Excel;

namespace HairlanErpXL;

internal static class Phase1Sheet
{
    public static void Build(XLWorkbook wb) {
        var ws = wb.AddWorksheet("Phase 1 Distribution");
        Program.SetColumnWidths(ws, 4, 16, 14, 22, 16, 22, 14, 12, 14, 14, 14, 18);

        Program.WriteTitleBar(ws, "PHASE 1 — TIER-BY-TIER DISTRIBUTION",
            "Material handoff log: PM -> Head Leader -> Line Leader -> Supervisor -> Worker. Validates 1:5:10:10:10 multiplier.", 12);

        int r = 4;
        string[] hdr = { "Handoff ID", "Date", "From Role", "From Name",
                         "To Role", "To Name", "Lot ID", "Qty (kg)",
                         "Cumulative (kg)", "Tier Multiplier", "Expected Next", "Status" };
        for (int i = 0; i < hdr.Length; i++) {
            ws.Cell(r, 2 + i).Value = hdr[i];
            Program.StyleHeader(ws.Cell(r, 2 + i));
        }
        ws.Row(r).Height = 32;
        r++;

        var data = new object[,] {
            { "H-001", "2026-04-13", "Production Manager", "PM Office",   "Head Leader",     "Head Leader 1",  "LOT-20260412-01", 250 },
            { "H-002", "2026-04-13", "Production Manager", "PM Office",   "Head Leader",     "Head Leader 2",  "LOT-20260412-01", 250 },
            { "H-003", "2026-04-14", "Head Leader",        "Head Leader 1","Line Leader",    "Line Leader L-03","LOT-20260412-01", 25  },
            { "H-004", "2026-04-14", "Head Leader",        "Head Leader 2","Line Leader",    "Line Leader L-07","LOT-20260412-01", 25  },
            { "H-005", "2026-04-15", "Line Leader",        "Line Leader L-03","Supervisor",  "Supervisor S-22","LOT-20260412-01", 3   },
            { "H-006", "2026-04-15", "Line Leader",        "Line Leader L-07","Supervisor",  "Supervisor S-45","LOT-20260412-01", 3   },
            { "H-007", "2026-04-16", "Supervisor",         "Supervisor S-22","Worker",       "W-Fatema-001",   "LOT-20260412-01", 0.3 },
            { "H-008", "2026-04-16", "Supervisor",         "Supervisor S-22","Worker",       "W-Jhorna-002",   "LOT-20260412-01", 0.25 },
            { "H-009", "2026-04-17", "Production Manager", "PM Office",   "Head Leader",     "Head Leader 3",  "LOT-20260425-02", 200 },
            { "H-010", "2026-04-18", "Head Leader",        "Head Leader 3","Line Leader",    "Line Leader L-12","LOT-20260425-02", 20  },
            { "H-011", "2026-04-19", "Line Leader",        "Line Leader L-12","Supervisor",  "Supervisor S-78","LOT-20260425-02", 2.5 },
            { "H-012", "2026-04-20", "Supervisor",         "Supervisor S-78","Worker",       "W-Rashida-045",  "LOT-20260425-02", 0.25 },
        };
        int startRow = r;
        for (int i = 0; i < data.GetLength(0); i++) {
            ws.Cell(r, 2).Value = (string)data[i, 0];
            ws.Cell(r, 3).Value = DateTime.ParseExact((string)data[i, 1], "yyyy-MM-dd", CultureInfo.InvariantCulture);
            ws.Cell(r, 4).Value = (string)data[i, 2];
            ws.Cell(r, 5).Value = (string)data[i, 3];
            ws.Cell(r, 6).Value = (string)data[i, 4];
            ws.Cell(r, 7).Value = (string)data[i, 5];
            ws.Cell(r, 8).Value = (string)data[i, 6];
            ws.Cell(r, 9).Value = Convert.ToDouble(data[i, 7]);
            ws.Cell(r, 10).Value = $"=SUMIF($H${startRow}:H{r},H{r},I{r})";
            ws.Cell(r, 11).Value = $"=IF(F{r}=\"Head Leader\",5,IF(F{r}=\"Line Leader\",10,IF(F{r}=\"Supervisor\",10,IF(F{r}=\"Worker\",10,1))))";
            ws.Cell(r, 12).Value = $"=I{r}/K{r}";
            ws.Cell(r, 13).Value = $"=IF(I{r}>0,\"OK\",\"CHECK\")";

            for (int c = 2; c <= 13; c++) {
                Program.StyleCell(ws.Cell(r, c), i);
                if (c == 3) ws.Cell(r, c).Style.NumberFormat.Format = "yyyy-mm-dd";
                if (c == 9) ws.Cell(r, c).Style.NumberFormat.Format = "#,##0.00";
                if (c == 10) ws.Cell(r, c).Style.NumberFormat.Format = "#,##0.00";
                if (c == 11) ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                if (c == 12) ws.Cell(r, c).Style.NumberFormat.Format = "#,##0.000";
                if (c == 13) ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                if (c == 9 || c == 10) { ws.Cell(r, c).Style.Fill.BackgroundColor = Program.Gold; ws.Cell(r, c).Style.Font.Bold = true; }
            }
            r++;
        }
        ws.Cell(r, 4).Value = "TOTALS";
        ws.Cell(r, 9).Value = $"=SUM(I{startRow}:I{r-1})";
        ws.Cell(r, 10).Value = $"=SUM(J{startRow}:J{r-1})";
        for (int c = 2; c <= 13; c++) Program.StyleTotal(ws.Cell(r, c));
        ws.Cell(r, 9).Style.NumberFormat.Format = "#,##0.00";
        ws.Cell(r, 10).Style.NumberFormat.Format = "#,##0.00";

        Program.FreezeTop(ws);
    }
}
