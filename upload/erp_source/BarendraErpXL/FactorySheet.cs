// FactorySheet.cs — One sheet per home-based factory (DAILY RECORD)
//
// LAYOUT:
//   Row 1-2: Title bar (Factory ID + Supervisor + Date)
//   Row 4-8: Supervisor info block
//   Row 9-11: Hosting/Perf/Total Sup Pay
//   Row 13: Factory summary header
//   Row 14-15: KPI tiles (daily totals)
//   Row 17: Worker table header
//   Row 18+: One row per worker — DAILY grading record
//
// PER-WORKER DAILY RECORD:
//   Input Given (kg)    — what was distributed to the worker that day
//   A-Weight (kg)       — QC-graded A-grade output
//   B-Weight (kg)       — QC-graded B-grade output
//   C-Weight (kg)       — QC-graded C-grade output
//   Wastage (kg)        — torn/spoiled hair found during QC
//   Balance Check       — Input = A + B + C + Wastage (OK / MISMATCH)
//   Days Present        — for attendance bonus (monthly accumulator)
//   Base Wage           — A×RATE_A + B×RATE_B + C×RATE_C
//   Attendance Bonus    — based on days present
//   Total Payable       — Base Wage + Attendance Bonus

using System;
using System.Linq;
using ClosedXML.Excel;

namespace HairlanErpXL;

internal static class FactorySheet
{
    public static void Build(XLWorkbook wb, FactoryConfig cfg) {
        var ws = wb.AddWorksheet(cfg.SheetName);
        ws.SetTabColor(XLColor.FromHtml("#E8D66E"));
        // Columns: B=ID, C=Name, D=bKash, E=Input, F=A-wt, G=B-wt, H=C-wt, I=Wastage,
        //          J=Balance, K=Days Present, L=Base Wage, M=Att Bonus, N=Total Payable, O=Status
        Program.SetColumnWidths(ws, 3, 13, 20, 15, 12, 12, 12, 12, 12, 14, 11, 13, 12, 14, 12);

        // ── Title bar ───────────────────────────────────────────────
        ws.Row(1).Height = 32;
        ws.Row(2).Height = 18;
        var t = ws.Cell(1, 2);
        t.Value = $"DAILY FACTORY RECORD — {cfg.FactoryId} (Supervisor: {cfg.SupervisorName})";
        t.Style.Font.FontName = Program.FontName;
        t.Style.Font.FontSize = 16;
        t.Style.Font.Bold = true;
        t.Style.Font.FontColor = Program.White;
        t.Style.Fill.BackgroundColor = Program.Navy;
        t.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
        t.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        t.Style.Alignment.Indent = 1;
        ws.Range(1, 2, 1, 15).Merge();
        foreach (var col in Enumerable.Range(2, 14)) ws.Cell(1, col).Style.Fill.BackgroundColor = Program.Navy;

        var s = ws.Cell(2, 2);
        s.Value = $"Date: {cfg.RecordDate:yyyy-MM-dd}  |  Location: {cfg.Location}  |  Line Leader: {cfg.LineLeader}  |  Factory bKash: {cfg.SupervisorBkash}";
        s.Style.Font.FontName = Program.FontName;
        s.Style.Font.FontSize = 10;
        s.Style.Font.Italic = true;
        s.Style.Font.FontColor = Program.Navy;
        s.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
        ws.Range(2, 2, 2, 15).Merge();

        // ── Supervisor info block ───────────────────────────────────
        int r = 4;
        ws.Cell(r, 2).Value = "SUPERVISOR INFORMATION";
        Program.StyleSubHeader(ws.Cell(r, 2));
        ws.Range(r, 2, r, 8).Merge();
        ws.Range(r, 2, r, 8).Style.Fill.BackgroundColor = Program.MidGrey;
        r++;

        var supInfo = new (string label, string value)[] {
            ("Supervisor Name",    cfg.SupervisorName),
            ("Phone / bKash",      cfg.SupervisorBkash),
            ("Area",               cfg.Location),
            ("Line Leader",        cfg.LineLeader),
            ("Group Head",         cfg.GroupHead),
        };
        for (int i = 0; i < supInfo.Length; i++) {
            int row = r + i;
            ws.Cell(row, 2).Value = supInfo[i].label;
            ws.Cell(row, 2).Style.Font.Bold = true;
            ws.Cell(row, 2).Style.Font.FontName = Program.FontName;
            ws.Cell(row, 2).Style.Font.FontSize = 10;
            ws.Cell(row, 2).Style.Fill.BackgroundColor = Program.Light;
            ws.Cell(row, 2).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            ws.Cell(row, 2).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
            ws.Cell(row, 2).Style.Alignment.Indent = 1;

            ws.Cell(row, 3).Value = supInfo[i].value;
            ws.Cell(row, 3).Style.Font.FontName = Program.FontName;
            ws.Cell(row, 3).Style.Font.FontSize = 10;
            ws.Cell(row, 3).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            ws.Cell(row, 3).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
            ws.Cell(row, 3).Style.Alignment.Indent = 1;
        }
        r += supInfo.Length;  // r = 9

        int hostingRow = r;       // 9
        int perfRow = r + 1;      // 10
        int supPayRow = r + 2;    // 11

        ws.Cell(hostingRow, 2).Value = "Hosting Allowance (BDT)";
        ws.Cell(hostingRow, 2).Style.Font.Bold = true;
        ws.Cell(hostingRow, 2).Style.Font.FontName = Program.FontName;
        ws.Cell(hostingRow, 2).Style.Font.FontSize = 10;
        ws.Cell(hostingRow, 2).Style.Fill.BackgroundColor = Program.Light;
        ws.Cell(hostingRow, 2).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        ws.Cell(hostingRow, 2).Style.Alignment.Indent = 1;
        ws.Cell(hostingRow, 3).Value = $"=IF({cfg.AGradePctRef}>=FACTORY_A_MIN/100,SUP_MAX,SUP_MIN)";
        ws.Cell(hostingRow, 3).Style.NumberFormat.Format = "#,##0";
        ws.Cell(hostingRow, 3).Style.Fill.BackgroundColor = Program.Gold;
        ws.Cell(hostingRow, 3).Style.Font.Bold = true;
        ws.Cell(hostingRow, 3).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        ws.Cell(hostingRow, 3).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        ws.Cell(perfRow, 2).Value = "Performance Bonus (BDT)";
        ws.Cell(perfRow, 2).Style.Font.Bold = true;
        ws.Cell(perfRow, 2).Style.Font.FontName = Program.FontName;
        ws.Cell(perfRow, 2).Style.Font.FontSize = 10;
        ws.Cell(perfRow, 2).Style.Fill.BackgroundColor = Program.Light;
        ws.Cell(perfRow, 2).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        ws.Cell(perfRow, 2).Style.Alignment.Indent = 1;
        ws.Cell(perfRow, 3).Value = $"=IF({cfg.AGradePctRef}>=FACTORY_A_MIN/100,SUP_EXTRA,0)";
        ws.Cell(perfRow, 3).Style.NumberFormat.Format = "#,##0";
        ws.Cell(perfRow, 3).Style.Fill.BackgroundColor = Program.Gold;
        ws.Cell(perfRow, 3).Style.Font.Bold = true;
        ws.Cell(perfRow, 3).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        ws.Cell(perfRow, 3).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        ws.Cell(supPayRow, 2).Value = "Total Supervisor Pay (BDT)";
        ws.Cell(supPayRow, 2).Style.Font.Bold = true;
        ws.Cell(supPayRow, 2).Style.Font.FontName = Program.FontName;
        ws.Cell(supPayRow, 2).Style.Font.FontSize = 10;
        ws.Cell(supPayRow, 2).Style.Fill.BackgroundColor = Program.Light;
        ws.Cell(supPayRow, 2).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        ws.Cell(supPayRow, 2).Style.Alignment.Indent = 1;
        ws.Cell(supPayRow, 3).Value = $"=C{hostingRow}+C{perfRow}";
        ws.Cell(supPayRow, 3).Style.NumberFormat.Format = "#,##0";
        ws.Cell(supPayRow, 3).Style.Fill.BackgroundColor = Program.Gold;
        ws.Cell(supPayRow, 3).Style.Font.Bold = true;
        ws.Cell(supPayRow, 3).Style.Font.FontColor = Program.Navy;
        ws.Cell(supPayRow, 3).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        ws.Cell(supPayRow, 3).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        // ── Factory daily summary ───────────────────────────────────
        int summaryRow = 13;
        ws.Cell(summaryRow, 2).Value = "FACTORY DAILY SUMMARY (Live)";
        Program.StyleSubHeader(ws.Cell(summaryRow, 2));
        ws.Range(summaryRow, 2, summaryRow, 8).Merge();
        ws.Range(summaryRow, 2, summaryRow, 8).Style.Fill.BackgroundColor = Program.MidGrey;

        // Summary KPI tiles — row 14 labels, row 15 values
        // Tiles: Total Workers, Input Given, A-Grade %, B-Grade %, C-Grade %, Total Payable
        // Worker data: rows 19-28 (10 workers) or 19-26 (8 workers)
        int wsr = 19;
        int wer = wsr + cfg.Workers.Length - 1;
        var summaries = new (string label, string formula, string fmt)[] {
            ("Total Workers",      $"=COUNTA(B{wsr}:B{wer})",                        "0"),
            ("Input Given (kg)",   $"=SUM(E{wsr}:E{wer})",                           "#,##0.0"),
            ("A-Grade %",          $"=IFERROR(SUM(F{wsr}:F{wer})/(SUM(F{wsr}:F{wer})+SUM(G{wsr}:G{wer})+SUM(H{wsr}:H{wer})),0)", "0.0%"),
            ("B-Grade %",          $"=IFERROR(SUM(G{wsr}:G{wer})/(SUM(F{wsr}:F{wer})+SUM(G{wsr}:G{wer})+SUM(H{wsr}:H{wer})),0)", "0.0%"),
            ("C-Grade %",          $"=IFERROR(SUM(H{wsr}:H{wer})/(SUM(F{wsr}:F{wer})+SUM(G{wsr}:G{wer})+SUM(H{wsr}:H{wer})),0)", "0.0%"),
            ("Total Payable (BDT)", $"=SUM(N{wsr}:N{wer})",                          "#,##0"),
        };
        for (int i = 0; i < summaries.Length; i++) {
            int col = 2 + i * 2;
            ws.Cell(14, col).Value = summaries[i].label;
            ws.Cell(14, col).Style.Font.FontName = Program.FontName;
            ws.Cell(14, col).Style.Font.FontSize = 9;
            ws.Cell(14, col).Style.Font.Bold = true;
            ws.Cell(14, col).Style.Font.FontColor = Program.Navy;
            ws.Cell(14, col).Style.Fill.BackgroundColor = Program.White;
            ws.Cell(14, col).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            ws.Cell(14, col).Style.Border.TopBorder = XLBorderStyleValues.Medium;
            ws.Cell(14, col).Style.Border.TopBorderColor = Program.Gold;
            ws.Cell(14, col).Style.Border.LeftBorder = XLBorderStyleValues.Medium;
            ws.Cell(14, col).Style.Border.LeftBorderColor = Program.Gold;

            ws.Cell(15, col).Value = summaries[i].formula;
            ws.Cell(15, col).Style.NumberFormat.Format = summaries[i].fmt;
            ws.Cell(15, col).Style.Font.FontName = Program.FontName;
            ws.Cell(15, col).Style.Font.FontSize = 14;
            ws.Cell(15, col).Style.Font.Bold = true;
            ws.Cell(15, col).Style.Font.FontColor = Program.Gold;
            ws.Cell(15, col).Style.Fill.BackgroundColor = Program.White;
            ws.Cell(15, col).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            ws.Cell(15, col).Style.Border.BottomBorder = XLBorderStyleValues.Medium;
            ws.Cell(15, col).Style.Border.BottomBorderColor = Program.Gold;
            ws.Cell(15, col).Style.Border.LeftBorder = XLBorderStyleValues.Medium;
            ws.Cell(15, col).Style.Border.LeftBorderColor = Program.Gold;
        }
        ws.Row(14).Height = 16;
        ws.Row(15).Height = 28;

        // ── WIP Tracking section (rows 16-17) ───────────────────────
        // Row 16: header, Row 17: WIP data
        int wipRow = 16;
        ws.Cell(wipRow, 2).Value = "WIP TRACKING (Lot portion at this factory)";
        Program.StyleSubHeader(ws.Cell(wipRow, 2));
        ws.Range(wipRow, 2, wipRow, 15).Merge();
        ws.Range(wipRow, 2, wipRow, 15).Style.Fill.BackgroundColor = Program.MidGrey;

        // WIP summary row 17 — shows lot received, completed, returned, remaining
        int wipDataRow = 17;
        // Lot Received (from Line Leader) = Input Given total
        ws.Cell(wipDataRow, 2).Value = "Lot Received:";
        ws.Cell(wipDataRow, 2).Style.Font.Bold = true;
        ws.Cell(wipDataRow, 2).Style.Font.FontName = Program.FontName;
        ws.Cell(wipDataRow, 2).Style.Font.FontSize = 10;
        ws.Cell(wipDataRow, 2).Style.Alignment.Indent = 1;
        // We'll set this after worker table is built (need total row reference)
        // For now, place labels — formulas added after worker table total row is known
        ws.Cell(wipDataRow, 4).Value = "Work Completed:";
        ws.Cell(wipDataRow, 4).Style.Font.Bold = true;
        ws.Cell(wipDataRow, 4).Style.Font.FontName = Program.FontName;
        ws.Cell(wipDataRow, 4).Style.Font.FontSize = 10;
        ws.Cell(wipDataRow, 4).Style.Alignment.Indent = 1;

        ws.Cell(wipDataRow, 6).Value = "WIP Remaining:";
        ws.Cell(wipDataRow, 6).Style.Font.Bold = true;
        ws.Cell(wipDataRow, 6).Style.Font.FontName = Program.FontName;
        ws.Cell(wipDataRow, 6).Style.Font.FontSize = 10;
        ws.Cell(wipDataRow, 6).Style.Alignment.Indent = 1;

        ws.Cell(wipDataRow, 8).Value = "WIP %:";
        ws.Cell(wipDataRow, 8).Style.Font.Bold = true;
        ws.Cell(wipDataRow, 8).Style.Font.FontName = Program.FontName;
        ws.Cell(wipDataRow, 8).Style.Font.FontSize = 10;
        ws.Cell(wipDataRow, 8).Style.Alignment.Indent = 1;

        ws.Cell(wipDataRow, 10).Value = "Return to Line Leader:";
        ws.Cell(wipDataRow, 10).Style.Font.Bold = true;
        ws.Cell(wipDataRow, 10).Style.Font.FontName = Program.FontName;
        ws.Cell(wipDataRow, 10).Style.Font.FontSize = 10;
        ws.Cell(wipDataRow, 10).Style.Alignment.Indent = 1;

        ws.Cell(wipDataRow, 12).Value = "Status:";
        ws.Cell(wipDataRow, 12).Style.Font.Bold = true;
        ws.Cell(wipDataRow, 12).Style.Font.FontName = Program.FontName;
        ws.Cell(wipDataRow, 12).Style.Font.FontSize = 10;
        ws.Cell(wipDataRow, 12).Style.Alignment.Indent = 1;
        ws.Row(wipDataRow).Height = 22;

        // ── Worker table (DAILY RECORD) ─────────────────────────────
        // Columns: B=ID, C=Name, D=Lot ID, E=Input Given, F=A-wt, G=B-wt, H=C-wt,
        //          I=Wastage, J=Balance Check, K=Days Present, L=Base Wage,
        //          M=Attendance Bonus, N=Total Payable, O=Status
        // Worker table header at row 18, data starts row 19
        int workerHeaderRow = 18;
        int workerStartRow = 19;
        int workerEndRow = workerStartRow + cfg.Workers.Length - 1;

        string[] hdr = { "Worker ID", "Worker Name", "Lot ID",
                         "Input Given (kg)", "A-Weight (kg)", "B-Weight (kg)", "C-Weight (kg)",
                         "Wastage (kg)", "Balance Check",
                         "Days Present", "Base Wage (BDT)", "Attendance Bonus",
                         "Total Payable (BDT)", "Status" };
        for (int i = 0; i < hdr.Length; i++) {
            ws.Cell(workerHeaderRow, 2 + i).Value = hdr[i];
            Program.StyleHeader(ws.Cell(workerHeaderRow, 2 + i));
        }
        ws.Row(workerHeaderRow).Height = 42;

        for (int i = 0; i < cfg.Workers.Length; i++) {
            int row = workerStartRow + i;
            var w = cfg.Workers[i];
            ws.Cell(row, 2).Value = w.WorkerId;
            ws.Cell(row, 3).Value = w.Name;
            // Lot ID — links this worker's record to the Lot Master
            ws.Cell(row, 4).Value = cfg.LotId;
            // Input Given (kg) — what was distributed to the worker
            ws.Cell(row, 5).Value = w.InputGivenKg;
            // A/B/C graded weights (manually entered by QC)
            ws.Cell(row, 6).Value = w.AWeightKg;
            ws.Cell(row, 7).Value = w.BWeightKg;
            ws.Cell(row, 8).Value = w.CWeightKg;
            // Wastage found during QC
            ws.Cell(row, 9).Value = w.WastageKg;
            // Balance Check: Input = A + B + C + Wastage
            ws.Cell(row, 10).Value = $"=IF(ROUND(E{row}-(F{row}+G{row}+H{row}+I{row}),3)=0,\"OK\",\"MISMATCH\")";
            // Days Present (monthly accumulator for attendance bonus)
            ws.Cell(row, 11).Value = w.DaysPresent;
            // Base Wage = A×RATE_A + B×RATE_B + C×RATE_C
            ws.Cell(row, 12).Value = $"=F{row}*RATE_A+G{row}*RATE_B+H{row}*RATE_C";
            // Attendance Bonus
            ws.Cell(row, 13).Value = $"=IF(K{row}>=ATT_DAYS,ATT_BONUS,IF(K{row}>=ATT_DAYS-2,ATT_BONUS/2,0))";
            // Total Payable = Base Wage + Attendance Bonus
            ws.Cell(row, 14).Value = $"=L{row}+M{row}";
            // Status
            ws.Cell(row, 15).Value = $"=IF(N{row}>0,\"Pending Approval\",\"Hold\")";

            for (int c = 2; c <= 15; c++) {
                Program.StyleCell(ws.Cell(row, c), i);
                if (c >= 5 && c <= 11) ws.Cell(row, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                if (c >= 5 && c <= 9) ws.Cell(row, c).Style.NumberFormat.Format = "#,##0.0";
                if (c == 10) {
                    ws.Cell(row, c).Style.Font.Bold = true;
                    // Highlight mismatch in red
                    ws.Cell(row, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                }
                if (c == 11) ws.Cell(row, c).Style.NumberFormat.Format = "0";
                if (c >= 12 && c <= 14) ws.Cell(row, c).Style.NumberFormat.Format = "#,##0";
                if (c == 14) { ws.Cell(row, c).Style.Fill.BackgroundColor = Program.Gold; ws.Cell(row, c).Style.Font.Bold = true; }
                if (c == 15) ws.Cell(row, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            }
        }

        // Total row
        int totalRow = workerEndRow + 1;
        ws.Cell(totalRow, 3).Value = "FACTORY TOTAL";
        ws.Cell(totalRow, 5).Value = $"=SUM(E{workerStartRow}:E{workerEndRow})";
        ws.Cell(totalRow, 6).Value = $"=SUM(F{workerStartRow}:F{workerEndRow})";
        ws.Cell(totalRow, 7).Value = $"=SUM(G{workerStartRow}:G{workerEndRow})";
        ws.Cell(totalRow, 8).Value = $"=SUM(H{workerStartRow}:H{workerEndRow})";
        ws.Cell(totalRow, 9).Value = $"=SUM(I{workerStartRow}:I{workerEndRow})";
        ws.Cell(totalRow, 10).Value = $"=IF(ROUND(E{totalRow}-(F{totalRow}+G{totalRow}+H{totalRow}+I{totalRow}),3)=0,\"OK\",\"MISMATCH\")";
        ws.Cell(totalRow, 11).Value = $"=SUM(K{workerStartRow}:K{workerEndRow})";
        ws.Cell(totalRow, 12).Value = $"=SUM(L{workerStartRow}:L{workerEndRow})";
        ws.Cell(totalRow, 13).Value = $"=SUM(M{workerStartRow}:M{workerEndRow})";
        ws.Cell(totalRow, 14).Value = $"=SUM(N{workerStartRow}:N{workerEndRow})";
        for (int c = 2; c <= 15; c++) Program.StyleTotal(ws.Cell(totalRow, c));
        ws.Cell(totalRow, 5).Style.NumberFormat.Format = "#,##0.0";
        ws.Cell(totalRow, 6).Style.NumberFormat.Format = "#,##0.0";
        ws.Cell(totalRow, 7).Style.NumberFormat.Format = "#,##0.0";
        ws.Cell(totalRow, 8).Style.NumberFormat.Format = "#,##0.0";
        ws.Cell(totalRow, 9).Style.NumberFormat.Format = "#,##0.0";
        ws.Cell(totalRow, 10).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        ws.Cell(totalRow, 11).Style.NumberFormat.Format = "0";
        ws.Cell(totalRow, 12).Style.NumberFormat.Format = "#,##0";
        ws.Cell(totalRow, 13).Style.NumberFormat.Format = "#,##0";
        ws.Cell(totalRow, 14).Style.NumberFormat.Format = "#,##0";

        // ── WIP Formulas (row 17) ───────────────────────────────────
        // Lot Received = Input Given total (col E of total row)
        ws.Cell(wipDataRow, 3).Value = $"=E{totalRow}";
        ws.Cell(wipDataRow, 3).Style.NumberFormat.Format = "#,##0.0";
        ws.Cell(wipDataRow, 3).Style.Font.Bold = true;
        ws.Cell(wipDataRow, 3).Style.Font.FontColor = Program.Navy;
        ws.Cell(wipDataRow, 3).Style.Fill.BackgroundColor = Program.Light;
        ws.Cell(wipDataRow, 3).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        ws.Cell(wipDataRow, 3).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        // Work Completed = A + B + C (graded output, cols F+G+H of total row)
        ws.Cell(wipDataRow, 5).Value = $"=F{totalRow}+G{totalRow}+H{totalRow}";
        ws.Cell(wipDataRow, 5).Style.NumberFormat.Format = "#,##0.0";
        ws.Cell(wipDataRow, 5).Style.Font.Bold = true;
        ws.Cell(wipDataRow, 5).Style.Font.FontColor = Program.Navy;
        ws.Cell(wipDataRow, 5).Style.Fill.BackgroundColor = Program.Light;
        ws.Cell(wipDataRow, 5).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        ws.Cell(wipDataRow, 5).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        // WIP Remaining = Lot Received - Work Completed - Wastage
        // (what's still left to be worked on by workers — returned to supervisor)
        ws.Cell(wipDataRow, 7).Value = $"=C{wipDataRow}-E{wipDataRow}-I{totalRow}";
        ws.Cell(wipDataRow, 7).Style.NumberFormat.Format = "#,##0.0";
        ws.Cell(wipDataRow, 7).Style.Font.Bold = true;
        ws.Cell(wipDataRow, 7).Style.Font.FontColor = Program.Red;
        ws.Cell(wipDataRow, 7).Style.Fill.BackgroundColor = Program.Gold;
        ws.Cell(wipDataRow, 7).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        ws.Cell(wipDataRow, 7).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        // WIP % = WIP Remaining / Lot Received
        ws.Cell(wipDataRow, 9).Value = $"=IFERROR(G{wipDataRow}/C{wipDataRow},0)";
        ws.Cell(wipDataRow, 9).Style.NumberFormat.Format = "0.0%";
        ws.Cell(wipDataRow, 9).Style.Font.Bold = true;
        ws.Cell(wipDataRow, 9).Style.Font.FontColor = Program.Red;
        ws.Cell(wipDataRow, 9).Style.Fill.BackgroundColor = Program.Gold;
        ws.Cell(wipDataRow, 9).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        ws.Cell(wipDataRow, 9).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        // Return to Line Leader = WIP Remaining (same value — this is what supervisor returns)
        ws.Cell(wipDataRow, 11).Value = $"=G{wipDataRow}";
        ws.Cell(wipDataRow, 11).Style.NumberFormat.Format = "#,##0.0";
        ws.Cell(wipDataRow, 11).Style.Font.Bold = true;
        ws.Cell(wipDataRow, 11).Style.Font.FontColor = Program.Red;
        ws.Cell(wipDataRow, 11).Style.Fill.BackgroundColor = Program.Gold;
        ws.Cell(wipDataRow, 11).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        ws.Cell(wipDataRow, 11).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        // Status: COMPLETED if WIP = 0, IN PROGRESS if WIP > 0
        ws.Cell(wipDataRow, 13).Value = $"=IF(ROUND(G{wipDataRow},2)=0,\"COMPLETED\",\"IN PROGRESS\")";
        ws.Cell(wipDataRow, 13).Style.Font.Bold = true;
        ws.Cell(wipDataRow, 13).Style.Font.FontColor = Program.Navy;
        ws.Cell(wipDataRow, 13).Style.Fill.BackgroundColor = Program.Gold;
        ws.Cell(wipDataRow, 13).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        ws.Cell(wipDataRow, 13).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        // Grand total note
        int noteRow = totalRow + 2;
        ws.Cell(noteRow, 2).Value = "GRAND TOTAL FACTORY COST (Workers + Supervisor)";
        ws.Cell(noteRow, 2).Style.Font.Bold = true;
        ws.Cell(noteRow, 2).Style.Font.FontColor = Program.Navy;
        ws.Cell(noteRow, 2).Style.Font.FontName = Program.FontName;
        ws.Cell(noteRow, 2).Style.Font.FontSize = 11;
        ws.Range(noteRow, 2, noteRow, 13).Merge();
        ws.Cell(noteRow, 14).Value = $"=N{totalRow}+C{supPayRow}";
        ws.Cell(noteRow, 14).Style.NumberFormat.Format = "#,##0";
        ws.Cell(noteRow, 14).Style.Font.FontName = Program.FontName;
        ws.Cell(noteRow, 14).Style.Font.FontSize = 12;
        ws.Cell(noteRow, 14).Style.Font.Bold = true;
        ws.Cell(noteRow, 14).Style.Font.FontColor = Program.Navy;
        ws.Cell(noteRow, 14).Style.Fill.BackgroundColor = Program.Gold;
        ws.Cell(noteRow, 14).Style.Border.OutsideBorder = XLBorderStyleValues.Medium;
        ws.Cell(noteRow, 14).Style.Border.OutsideBorderColor = Program.Navy;
        ws.Cell(noteRow, 14).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        // Footer
        int footerRow = noteRow + 2;
        ws.Cell(footerRow, 2).Value = "Balance Check: Input Given = A-Weight + B-Weight + C-Weight + Wastage. Grade is manually assigned by QC. Wage = (A×RATE_A + B×RATE_B + C×RATE_C) + Attendance Bonus.";
        ws.Range(footerRow, 2, footerRow, 15).Merge();
        ws.Cell(footerRow, 2).Style.Font.FontName = Program.FontName;
        ws.Cell(footerRow, 2).Style.Font.FontSize = 9;
        ws.Cell(footerRow, 2).Style.Font.Italic = true;
        ws.Cell(footerRow, 2).Style.Font.FontColor = Program.Gold;

        ws.SheetView.FreezeRows(workerHeaderRow);
    }
}

// ──────────────────────────────────────────────────────────────────────────
//  Data classes
// ──────────────────────────────────────────────────────────────────────────
internal class FactoryConfig
{
    public string SheetName;
    public string FactoryId;
    public string SupervisorName;
    public string SupervisorBkash;
    public string Location;
    public string LineLeader;
    public string GroupHead;        // group head overseeing this factory
    public string LotId;           // lot being worked on (links to Lot Master)
    public string AGradePctRef;    // cell ref to A-grade % tile
    public string BGradePctRef;    // cell ref to B-grade % tile
    public string CGradePctRef;    // cell ref to C-grade % tile
    public DateTime RecordDate;    // date of this daily record
    public WorkerRow[] Workers;
}

internal class WorkerRow
{
    public string WorkerId;
    public string Name;
    public string Bkash;
    public double InputGivenKg;   // what was distributed to the worker
    public double AWeightKg;      // A-grade output (kg)
    public double BWeightKg;      // B-grade output (kg)
    public double CWeightKg;      // C-grade output (kg)
    public double WastageKg;      // wastage found during QC (kg)
    public int DaysPresent;       // monthly accumulator for attendance bonus
}
