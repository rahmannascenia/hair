// QcSheet.cs — QC & Grading: LIVE LINKED to factory sheets
// With A/B/C grade percentages at EVERY level:
//   - Supervisor level (Section A)
//   - Line Leader level (Section E)
//   - Group Head level (Section F)
//   - Company level (Section G)

using System;
using System.Linq;
using ClosedXML.Excel;

namespace BarendraErpXL;

internal static class QcSheet
{
    public static void Build(XLWorkbook wb, FactoryConfig[] factoryConfigs) {
        var ws = wb.AddWorksheet("QC & Grading");
        Program.SetColumnWidths(ws, 4, 14, 14, 14, 22, 14, 12, 12, 12, 12, 12, 10, 10, 10, 14, 14);

        Program.WriteTitleBar(ws, "QUALITY CONTROL & GRADING — Live Linked + Grade % at All Levels",
            "A/B/C % at Supervisor, Line Leader, Group Head & Company levels. All data PULLED from factory sheets.", 16);

        int r = 4;

        // ════════════════════════════════════════════════════════════════
        //  SECTION A: SUPERVISOR-LEVEL QC SUMMARY (with A%/B%/C%)
        // ════════════════════════════════════════════════════════════════
        ws.Cell(r, 2).Value = "A. SUPERVISOR-LEVEL QC SUMMARY (A/B/C % per factory)";
        Program.StyleSubHeader(ws.Cell(r, 2));
        ws.Range(r, 2, r, 16).Merge();
        ws.Range(r, 2, r, 16).Style.Fill.BackgroundColor = Program.MidGrey;
        r++;

        // Factory sheet columns: B=ID, C=Name, D=Lot, E=Input, F=A-wt, G=B-wt, H=C-wt,
        //   I=Wastage, J=Balance, K=Days, L=Base Wage, M=Att Bonus, N=Total Payable
        // Supervisor: C5=Name, C8=LineLeader, C9=GroupHead, C10=Hosting, C11=Perf, C12=TotalSupPay
        // Factory tiles: F15=A%, H15=B%, J15=C%

        string[] aHdr = { "Factory ID", "Supervisor", "Lot ID",
                         "Input (kg)", "A-Wt (kg)", "B-Wt (kg)", "C-Wt (kg)",
                         "Wastage (kg)", "Balance",
                         "A %", "B %", "C %",
                         "WIP Remaining (kg)", "WIP %",
                         "Sup Pay (BDT)", "Worker Wages (BDT)", "Grand Total (BDT)" };
        for (int i = 0; i < aHdr.Length; i++) {
            ws.Cell(r, 2 + i).Value = aHdr[i];
            Program.StyleHeader(ws.Cell(r, 2 + i));
        }
        ws.Row(r).Height = 42;
        r++;

        int aStartRow = r;
        for (int i = 0; i < factoryConfigs.Length; i++) {
            var cfg = factoryConfigs[i];
            int wc = cfg.Workers.Length;
            int wStart = 19;
            int wEnd = wStart + wc - 1;
            string sn = cfg.SheetName;

            ws.Cell(r, 2).Value = cfg.FactoryId;
            ws.Cell(r, 3).Value = $"='{sn}'!C5";
            ws.Cell(r, 4).Value = $"='{sn}'!D19";
            ws.Cell(r, 5).Value = $"=SUM('{sn}'!E{wStart}:E{wEnd})";
            ws.Cell(r, 6).Value = $"=SUM('{sn}'!F{wStart}:F{wEnd})";
            ws.Cell(r, 7).Value = $"=SUM('{sn}'!G{wStart}:G{wEnd})";
            ws.Cell(r, 8).Value = $"=SUM('{sn}'!H{wStart}:H{wEnd})";
            ws.Cell(r, 9).Value = $"=SUM('{sn}'!I{wStart}:I{wEnd})";
            ws.Cell(r, 10).Value = $"=IF(ROUND(E{r}-(F{r}+G{r}+H{r}+I{r}),3)=0,\"OK\",\"MISMATCH\")";
            // A%, B%, C% — pull from factory sheet tiles
            ws.Cell(r, 11).Value = $"='{sn}'!{cfg.AGradePctRef}";
            ws.Cell(r, 12).Value = $"='{sn}'!{cfg.BGradePctRef}";
            ws.Cell(r, 13).Value = $"='{sn}'!{cfg.CGradePctRef}";
            // WIP Remaining — pull from factory sheet G17 (WIP Remaining cell)
            ws.Cell(r, 14).Value = $"='{sn}'!G17";
            // WIP % — pull from factory sheet I17
            ws.Cell(r, 15).Value = $"='{sn}'!I17";
            // Supervisor Pay
            ws.Cell(r, 16).Value = $"='{sn}'!C12";
            // Worker Wages
            ws.Cell(r, 17).Value = $"=SUM('{sn}'!L{wStart}:L{wEnd})";
            // Grand Total
            ws.Cell(r, 18).Value = $"=P{r}+Q{r}";

            for (int c = 2; c <= 18; c++) {
                Program.StyleCell(ws.Cell(r, c), i);
                if (c == 2 || c == 4) ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                if (c >= 5 && c <= 9) ws.Cell(r, c).Style.NumberFormat.Format = "#,##0.0";
                if (c == 10) { ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center; ws.Cell(r, c).Style.Font.Bold = true; }
                if (c >= 11 && c <= 13) { ws.Cell(r, c).Style.NumberFormat.Format = "0.0%"; ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center; ws.Cell(r, c).Style.Font.Bold = true; }
                if (c == 14) { ws.Cell(r, c).Style.NumberFormat.Format = "#,##0.0"; ws.Cell(r, c).Style.Font.Bold = true; ws.Cell(r, c).Style.Font.FontColor = Program.Red; }
                if (c == 15) { ws.Cell(r, c).Style.NumberFormat.Format = "0.0%"; ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center; ws.Cell(r, c).Style.Font.Bold = true; ws.Cell(r, c).Style.Font.FontColor = Program.Red; }
                if (c >= 16 && c <= 18) ws.Cell(r, c).Style.NumberFormat.Format = "#,##0";
                if (c == 18) { ws.Cell(r, c).Style.Fill.BackgroundColor = Program.Gold; ws.Cell(r, c).Style.Font.Bold = true; }
            }
            r++;
        }
        // Totals
        ws.Cell(r, 3).Value = "ALL FACTORIES";
        ws.Cell(r, 5).Value = $"=SUM(E{aStartRow}:E{r-1})";
        ws.Cell(r, 6).Value = $"=SUM(F{aStartRow}:F{r-1})";
        ws.Cell(r, 7).Value = $"=SUM(G{aStartRow}:G{r-1})";
        ws.Cell(r, 8).Value = $"=SUM(H{aStartRow}:H{r-1})";
        ws.Cell(r, 9).Value = $"=SUM(I{aStartRow}:I{r-1})";
        ws.Cell(r, 10).Value = $"=IF(ROUND(E{r}-(F{r}+G{r}+H{r}+I{r}),3)=0,\"OK\",\"MISMATCH\")";
        // Company-level A%/B%/C%
        ws.Cell(r, 11).Value = $"=IFERROR(F{r}/(F{r}+G{r}+H{r}),0)";
        ws.Cell(r, 12).Value = $"=IFERROR(G{r}/(F{r}+G{r}+H{r}),0)";
        ws.Cell(r, 13).Value = $"=IFERROR(H{r}/(F{r}+G{r}+H{r}),0)";
        // WIP totals
        ws.Cell(r, 14).Value = $"=SUM(N{aStartRow}:N{r-1})";
        ws.Cell(r, 15).Value = $"=IFERROR(N{r}/E{r},0)";
        // Pay totals
        ws.Cell(r, 16).Value = $"=SUM(P{aStartRow}:P{r-1})";
        ws.Cell(r, 17).Value = $"=SUM(Q{aStartRow}:Q{r-1})";
        ws.Cell(r, 18).Value = $"=SUM(R{aStartRow}:R{r-1})";
        for (int c = 2; c <= 18; c++) Program.StyleTotal(ws.Cell(r, c));
        ws.Cell(r, 5).Style.NumberFormat.Format = "#,##0.0";
        ws.Cell(r, 6).Style.NumberFormat.Format = "#,##0.0";
        ws.Cell(r, 7).Style.NumberFormat.Format = "#,##0.0";
        ws.Cell(r, 8).Style.NumberFormat.Format = "#,##0.0";
        ws.Cell(r, 9).Style.NumberFormat.Format = "#,##0.0";
        ws.Cell(r, 11).Style.NumberFormat.Format = "0.0%";
        ws.Cell(r, 12).Style.NumberFormat.Format = "0.0%";
        ws.Cell(r, 13).Style.NumberFormat.Format = "0.0%";
        ws.Cell(r, 14).Style.NumberFormat.Format = "#,##0.0";
        ws.Cell(r, 15).Style.NumberFormat.Format = "0.0%";
        ws.Cell(r, 16).Style.NumberFormat.Format = "#,##0";
        ws.Cell(r, 17).Style.NumberFormat.Format = "#,##0";
        ws.Cell(r, 18).Style.NumberFormat.Format = "#,##0";
        int aEndRow = r - 1;
        r += 2;

        // ════════════════════════════════════════════════════════════════
        //  SECTION B: WORKER-LEVEL QC DETAIL
        // ════════════════════════════════════════════════════════════════
        ws.Cell(r, 2).Value = "B. WORKER-LEVEL QC DETAIL (Live from Factory Sheets)";
        Program.StyleSubHeader(ws.Cell(r, 2));
        ws.Range(r, 2, r, 16).Merge();
        ws.Range(r, 2, r, 16).Style.Fill.BackgroundColor = Program.MidGrey;
        r++;

        string[] bHdr = { "Factory ID", "Worker ID", "Worker Name", "Lot ID",
                         "Input (kg)", "A-Wt (kg)", "B-Wt (kg)", "C-Wt (kg)",
                         "Wastage (kg)", "Balance", "Days Present",
                         "Base Wage (BDT)", "Total Payable (BDT)" };
        for (int i = 0; i < bHdr.Length; i++) {
            ws.Cell(r, 2 + i).Value = bHdr[i];
            Program.StyleHeader(ws.Cell(r, 2 + i));
        }
        ws.Row(r).Height = 42;
        r++;

        int bStartRow = r;
        int workerSeq = 0;
        foreach (var cfg in factoryConfigs) {
            int wc = cfg.Workers.Length;
            int wStart = 19;
            string sn = cfg.SheetName;
            for (int wi = 0; wi < wc; wi++) {
                int fRow = wStart + wi;
                ws.Cell(r, 2).Value = cfg.FactoryId;
                ws.Cell(r, 3).Value = $"='{sn}'!B{fRow}";
                ws.Cell(r, 4).Value = $"='{sn}'!C{fRow}";
                ws.Cell(r, 5).Value = $"='{sn}'!D{fRow}";
                ws.Cell(r, 6).Value = $"='{sn}'!E{fRow}";
                ws.Cell(r, 7).Value = $"='{sn}'!F{fRow}";
                ws.Cell(r, 8).Value = $"='{sn}'!G{fRow}";
                ws.Cell(r, 9).Value = $"='{sn}'!H{fRow}";
                ws.Cell(r, 10).Value = $"='{sn}'!I{fRow}";
                ws.Cell(r, 11).Value = $"='{sn}'!J{fRow}";
                ws.Cell(r, 12).Value = $"='{sn}'!K{fRow}";
                ws.Cell(r, 13).Value = $"='{sn}'!L{fRow}";
                ws.Cell(r, 14).Value = $"='{sn}'!N{fRow}";
                for (int c = 2; c <= 15; c++) {
                    Program.StyleCell(ws.Cell(r, c), workerSeq);
                    if (c == 2 || c == 5) ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                    if (c >= 6 && c <= 10) ws.Cell(r, c).Style.NumberFormat.Format = "#,##0.0";
                    if (c == 11) { ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center; ws.Cell(r, c).Style.Font.Bold = true; }
                    if (c == 12) ws.Cell(r, c).Style.NumberFormat.Format = "0";
                    if (c >= 13 && c <= 14) ws.Cell(r, c).Style.NumberFormat.Format = "#,##0";
                    if (c == 14) { ws.Cell(r, c).Style.Fill.BackgroundColor = Program.Gold; ws.Cell(r, c).Style.Font.Bold = true; }
                }
                r++;
                workerSeq++;
            }
        }
        int bEndRow = r - 1;
        r += 2;

        // ════════════════════════════════════════════════════════════════
        //  SECTION C: LOT-LEVEL CONSOLIDATION
        // ════════════════════════════════════════════════════════════════
        ws.Cell(r, 2).Value = "C. LOT-LEVEL CONSOLIDATION (Cross-Factory by Lot ID)";
        Program.StyleSubHeader(ws.Cell(r, 2));
        ws.Range(r, 2, r, 16).Merge();
        ws.Range(r, 2, r, 16).Style.Fill.BackgroundColor = Program.MidGrey;
        r++;

        string[] cHdr = { "Lot ID", "Factories", "Total Input (kg)",
                         "Total A (kg)", "Total B (kg)", "Total C (kg)",
                         "Total Wastage (kg)", "Balance",
                         "A %", "B %", "C %",
                         "Total Wages (BDT)", "Grand Total (BDT)" };
        for (int i = 0; i < cHdr.Length; i++) {
            ws.Cell(r, 2 + i).Value = cHdr[i];
            Program.StyleHeader(ws.Cell(r, 2 + i));
        }
        ws.Row(r).Height = 42;
        r++;

        int cStartRow = r;
        var lotIds = factoryConfigs.Select(c => c.LotId).Distinct().ToList();
        foreach (var lotId in lotIds) {
            var factoriesForLot = factoryConfigs.Where(c => c.LotId == lotId).ToList();
            ws.Cell(r, 2).Value = lotId;
            ws.Cell(r, 3).Value = string.Join(", ", factoriesForLot.Select(c => c.FactoryId));
            ws.Cell(r, 4).Value = "=" + string.Join("+", factoriesForLot.Select(c => { int wc = c.Workers.Length; return $"SUM('{c.SheetName}'!E19:E{18+wc})"; }));
            ws.Cell(r, 5).Value = "=" + string.Join("+", factoriesForLot.Select(c => { int wc = c.Workers.Length; return $"SUM('{c.SheetName}'!F19:F{18+wc})"; }));
            ws.Cell(r, 6).Value = "=" + string.Join("+", factoriesForLot.Select(c => { int wc = c.Workers.Length; return $"SUM('{c.SheetName}'!G19:G{18+wc})"; }));
            ws.Cell(r, 7).Value = "=" + string.Join("+", factoriesForLot.Select(c => { int wc = c.Workers.Length; return $"SUM('{c.SheetName}'!H19:H{18+wc})"; }));
            ws.Cell(r, 8).Value = "=" + string.Join("+", factoriesForLot.Select(c => { int wc = c.Workers.Length; return $"SUM('{c.SheetName}'!I19:I{18+wc})"; }));
            ws.Cell(r, 9).Value = $"=IF(ROUND(D{r}-(E{r}+F{r}+G{r}+H{r}),3)=0,\"OK\",\"MISMATCH\")";
            ws.Cell(r, 10).Value = $"=IFERROR(E{r}/(E{r}+F{r}+G{r}),0)";
            ws.Cell(r, 11).Value = $"=IFERROR(F{r}/(E{r}+F{r}+G{r}),0)";
            ws.Cell(r, 12).Value = $"=IFERROR(G{r}/(E{r}+F{r}+G{r}),0)";
            ws.Cell(r, 13).Value = "=" + string.Join("+", factoriesForLot.Select(c => { int wc = c.Workers.Length; return $"SUM('{c.SheetName}'!L19:L{18+wc})"; }));
            ws.Cell(r, 14).Value = "=" + string.Join("+", factoriesForLot.Select(c => $"'{c.SheetName}'!C12")) + $"+M{r}";
            for (int col = 2; col <= 14; col++) {
                Program.StyleCell(ws.Cell(r, col), 0);
                if (col == 2 || col == 3) ws.Cell(r, col).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                if (col >= 4 && col <= 8) ws.Cell(r, col).Style.NumberFormat.Format = "#,##0.0";
                if (col == 9) { ws.Cell(r, col).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center; ws.Cell(r, col).Style.Font.Bold = true; }
                if (col >= 10 && col <= 12) { ws.Cell(r, col).Style.NumberFormat.Format = "0.0%"; ws.Cell(r, col).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center; ws.Cell(r, col).Style.Font.Bold = true; }
                if (col >= 13 && col <= 14) ws.Cell(r, col).Style.NumberFormat.Format = "#,##0";
                if (col == 14) { ws.Cell(r, col).Style.Fill.BackgroundColor = Program.Gold; ws.Cell(r, col).Style.Font.Bold = true; }
            }
            r++;
        }
        r += 2;

        // ════════════════════════════════════════════════════════════════
        //  SECTION D: DISCREPANCY CROSS-CHECK
        // ════════════════════════════════════════════════════════════════
        ws.Cell(r, 2).Value = "D. DISCREPANCY CROSS-CHECK (Factory ↔ QC ↔ Lot Master)";
        Program.StyleSubHeader(ws.Cell(r, 2));
        ws.Range(r, 2, r, 16).Merge();
        ws.Range(r, 2, r, 16).Style.Fill.BackgroundColor = Program.MidGrey;
        r++;

        string[] dHdr = { "Factory ID", "Lot ID", "Factory Input (kg)", "QC-A Input (kg)", "QC-B Input (kg)",
                         "Match F↔A", "Match F↔B", "Status" };
        for (int i = 0; i < dHdr.Length; i++) {
            ws.Cell(r, 2 + i).Value = dHdr[i];
            Program.StyleHeader(ws.Cell(r, 2 + i));
        }
        ws.Row(r).Height = 42;
        r++;

        for (int i = 0; i < factoryConfigs.Length; i++) {
            var cfg = factoryConfigs[i];
            int wc = cfg.Workers.Length;
            string sn = cfg.SheetName;
            int aRow = aStartRow + i;
            ws.Cell(r, 2).Value = cfg.FactoryId;
            ws.Cell(r, 3).Value = cfg.LotId;
            ws.Cell(r, 4).Value = $"=SUM('{sn}'!E19:E{18+wc})";
            ws.Cell(r, 5).Value = $"=E{aRow}";
            ws.Cell(r, 6).Value = $"=SUMIF(B{bStartRow}:B{bEndRow},B{r},F{bStartRow}:F{bEndRow})";
            ws.Cell(r, 7).Value = $"=IF(ROUND(D{r}-E{r},3)=0,\"OK\",\"MISMATCH\")";
            ws.Cell(r, 8).Value = $"=IF(ROUND(D{r}-F{r},3)=0,\"OK\",\"MISMATCH\")";
            ws.Cell(r, 9).Value = $"=IF(AND(G{r}=\"OK\",H{r}=\"OK\"),\"ALL OK\",\"INVESTIGATE\")";
            for (int c = 2; c <= 9; c++) {
                Program.StyleCell(ws.Cell(r, c), i);
                if (c == 2 || c == 3) ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                if (c >= 4 && c <= 6) ws.Cell(r, c).Style.NumberFormat.Format = "#,##0.0";
                if (c >= 7 && c <= 8) { ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center; ws.Cell(r, c).Style.Font.Bold = true; }
                if (c == 9) { ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center; ws.Cell(r, c).Style.Font.Bold = true; ws.Cell(r, c).Style.Fill.BackgroundColor = Program.Gold; }
            }
            r++;
        }
        r += 2;

        // ════════════════════════════════════════════════════════════════
        //  SECTION E: LINE LEADER PERFORMANCE (A%/B%/C%)
        // ════════════════════════════════════════════════════════════════
        ws.Cell(r, 2).Value = "E. LINE LEADER PERFORMANCE (A/B/C % per Line Leader)";
        Program.StyleSubHeader(ws.Cell(r, 2));
        ws.Range(r, 2, r, 16).Merge();
        ws.Range(r, 2, r, 16).Style.Fill.BackgroundColor = Program.MidGrey;
        r++;

        string[] eHdr = { "Line Leader", "Factories", "Workers",
                         "Total A (kg)", "Total B (kg)", "Total C (kg)",
                         "A %", "B %", "C %",
                         "WIP Remaining (kg)", "WIP %",
                         "Total Wages (BDT)", "Status" };
        for (int i = 0; i < eHdr.Length; i++) {
            ws.Cell(r, 2 + i).Value = eHdr[i];
            Program.StyleHeader(ws.Cell(r, 2 + i));
        }
        ws.Row(r).Height = 42;
        r++;

        int eStartRow = r;
        var lineLeaders = factoryConfigs.Select(c => c.LineLeader).Distinct().ToList();
        foreach (var ll in lineLeaders) {
            var factoriesForLL = factoryConfigs.Where(c => c.LineLeader == ll).ToList();
            ws.Cell(r, 2).Value = ll;
            ws.Cell(r, 3).Value = string.Join(", ", factoriesForLL.Select(c => c.FactoryId));
            ws.Cell(r, 4).Value = "=" + string.Join("+", factoriesForLL.Select(c => { int wc = c.Workers.Length; return $"COUNTA('{c.SheetName}'!B19:B{18+wc})"; }));
            ws.Cell(r, 5).Value = "=" + string.Join("+", factoriesForLL.Select(c => { int wc = c.Workers.Length; return $"SUM('{c.SheetName}'!F19:F{18+wc})"; }));
            ws.Cell(r, 6).Value = "=" + string.Join("+", factoriesForLL.Select(c => { int wc = c.Workers.Length; return $"SUM('{c.SheetName}'!G19:G{18+wc})"; }));
            ws.Cell(r, 7).Value = "=" + string.Join("+", factoriesForLL.Select(c => { int wc = c.Workers.Length; return $"SUM('{c.SheetName}'!H19:H{18+wc})"; }));
            ws.Cell(r, 8).Value = $"=IFERROR(E{r}/(E{r}+F{r}+G{r}),0)";
            ws.Cell(r, 9).Value = $"=IFERROR(F{r}/(E{r}+F{r}+G{r}),0)";
            ws.Cell(r, 10).Value = $"=IFERROR(G{r}/(E{r}+F{r}+G{r}),0)";
            // WIP Remaining — sum from factory sheets G17
            ws.Cell(r, 11).Value = "=" + string.Join("+", factoriesForLL.Select(c => $"'{c.SheetName}'!G17"));
            // WIP % = WIP / Total Input
            ws.Cell(r, 12).Value = $"=IFERROR(K{r}/(" + string.Join("+", factoriesForLL.Select(c => { int wc = c.Workers.Length; return $"SUM('{c.SheetName}'!E19:E{18+wc})"; })) + "),0)";
            ws.Cell(r, 13).Value = "=" + string.Join("+", factoriesForLL.Select(c => { int wc = c.Workers.Length; return $"SUM('{c.SheetName}'!L19:L{18+wc})"; }));
            ws.Cell(r, 14).Value = $"=IF(H{r}>=FACTORY_A_MIN/100,\"ON TARGET\",\"BELOW TARGET\")";
            for (int c = 2; c <= 14; c++) {
                Program.StyleCell(ws.Cell(r, c), 0);
                if (c == 2 || c == 3) ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                if (c == 4) ws.Cell(r, c).Style.NumberFormat.Format = "0";
                if (c >= 5 && c <= 7) ws.Cell(r, c).Style.NumberFormat.Format = "#,##0.0";
                if (c >= 8 && c <= 10) { ws.Cell(r, c).Style.NumberFormat.Format = "0.0%"; ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center; ws.Cell(r, c).Style.Font.Bold = true; }
                if (c == 11) { ws.Cell(r, c).Style.NumberFormat.Format = "#,##0.0"; ws.Cell(r, c).Style.Font.Bold = true; ws.Cell(r, c).Style.Font.FontColor = Program.Red; }
                if (c == 12) { ws.Cell(r, c).Style.NumberFormat.Format = "0.0%"; ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center; ws.Cell(r, c).Style.Font.Bold = true; ws.Cell(r, c).Style.Font.FontColor = Program.Red; }
                if (c == 13) ws.Cell(r, c).Style.NumberFormat.Format = "#,##0";
                if (c == 14) { ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center; ws.Cell(r, c).Style.Font.Bold = true; ws.Cell(r, c).Style.Fill.BackgroundColor = Program.Gold; }
            }
            r++;
        }
        r += 2;

        // ════════════════════════════════════════════════════════════════
        //  SECTION F: GROUP HEAD PERFORMANCE (A%/B%/C%)
        // ════════════════════════════════════════════════════════════════
        ws.Cell(r, 2).Value = "F. GROUP HEAD PERFORMANCE (A/B/C % per Group Head)";
        Program.StyleSubHeader(ws.Cell(r, 2));
        ws.Range(r, 2, r, 16).Merge();
        ws.Range(r, 2, r, 16).Style.Fill.BackgroundColor = Program.MidGrey;
        r++;

        string[] fHdr = { "Group Head", "Factories", "Line Leaders", "Workers",
                         "Total A (kg)", "Total B (kg)", "Total C (kg)",
                         "A %", "B %", "C %",
                         "WIP Remaining (kg)", "WIP %",
                         "Total Wages (BDT)", "Status" };
        for (int i = 0; i < fHdr.Length; i++) {
            ws.Cell(r, 2 + i).Value = fHdr[i];
            Program.StyleHeader(ws.Cell(r, 2 + i));
        }
        ws.Row(r).Height = 42;
        r++;

        var groupHeads = factoryConfigs.Select(c => c.GroupHead).Distinct().ToList();
        foreach (var gh in groupHeads) {
            var factoriesForGH = factoryConfigs.Where(c => c.GroupHead == gh).ToList();
            ws.Cell(r, 2).Value = gh;
            ws.Cell(r, 3).Value = string.Join(", ", factoriesForGH.Select(c => c.FactoryId));
            ws.Cell(r, 4).Value = string.Join(", ", factoriesForGH.Select(c => c.LineLeader).Distinct());
            ws.Cell(r, 5).Value = "=" + string.Join("+", factoriesForGH.Select(c => { int wc = c.Workers.Length; return $"COUNTA('{c.SheetName}'!B19:B{18+wc})"; }));
            ws.Cell(r, 6).Value = "=" + string.Join("+", factoriesForGH.Select(c => { int wc = c.Workers.Length; return $"SUM('{c.SheetName}'!F19:F{18+wc})"; }));
            ws.Cell(r, 7).Value = "=" + string.Join("+", factoriesForGH.Select(c => { int wc = c.Workers.Length; return $"SUM('{c.SheetName}'!G19:G{18+wc})"; }));
            ws.Cell(r, 8).Value = "=" + string.Join("+", factoriesForGH.Select(c => { int wc = c.Workers.Length; return $"SUM('{c.SheetName}'!H19:H{18+wc})"; }));
            ws.Cell(r, 9).Value = $"=IFERROR(F{r}/(F{r}+G{r}+H{r}),0)";
            ws.Cell(r, 10).Value = $"=IFERROR(G{r}/(F{r}+G{r}+H{r}),0)";
            ws.Cell(r, 11).Value = $"=IFERROR(H{r}/(F{r}+G{r}+H{r}),0)";
            // WIP Remaining — sum from factory sheets G17
            ws.Cell(r, 12).Value = "=" + string.Join("+", factoriesForGH.Select(c => $"'{c.SheetName}'!G17"));
            // WIP %
            ws.Cell(r, 13).Value = $"=IFERROR(L{r}/(" + string.Join("+", factoriesForGH.Select(c => { int wc = c.Workers.Length; return $"SUM('{c.SheetName}'!E19:E{18+wc})"; })) + "),0)";
            ws.Cell(r, 14).Value = "=" + string.Join("+", factoriesForGH.Select(c => { int wc = c.Workers.Length; return $"SUM('{c.SheetName}'!L19:L{18+wc})"; }));
            ws.Cell(r, 15).Value = $"=IF(I{r}>=FACTORY_A_MIN/100,\"ON TARGET\",\"BELOW TARGET\")";
            for (int c = 2; c <= 15; c++) {
                Program.StyleCell(ws.Cell(r, c), 0);
                if (c == 2 || c == 3 || c == 4) ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                if (c == 5) ws.Cell(r, c).Style.NumberFormat.Format = "0";
                if (c >= 6 && c <= 8) ws.Cell(r, c).Style.NumberFormat.Format = "#,##0.0";
                if (c >= 9 && c <= 11) { ws.Cell(r, c).Style.NumberFormat.Format = "0.0%"; ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center; ws.Cell(r, c).Style.Font.Bold = true; }
                if (c == 12) { ws.Cell(r, c).Style.NumberFormat.Format = "#,##0.0"; ws.Cell(r, c).Style.Font.Bold = true; ws.Cell(r, c).Style.Font.FontColor = Program.Red; }
                if (c == 13) { ws.Cell(r, c).Style.NumberFormat.Format = "0.0%"; ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center; ws.Cell(r, c).Style.Font.Bold = true; ws.Cell(r, c).Style.Font.FontColor = Program.Red; }
                if (c == 14) ws.Cell(r, c).Style.NumberFormat.Format = "#,##0";
                if (c == 13) { ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center; ws.Cell(r, c).Style.Font.Bold = true; ws.Cell(r, c).Style.Fill.BackgroundColor = Program.Gold; }
            }
            r++;
        }
        r += 2;

        // ════════════════════════════════════════════════════════════════
        //  SECTION G: COMPANY-LEVEL PERFORMANCE (overall A%/B%/C%)
        // ════════════════════════════════════════════════════════════════
        ws.Cell(r, 2).Value = "G. COMPANY-LEVEL PERFORMANCE (Overall A/B/C %)";
        Program.StyleSubHeader(ws.Cell(r, 2));
        ws.Range(r, 2, r, 16).Merge();
        ws.Range(r, 2, r, 16).Style.Fill.BackgroundColor = Program.MidGrey;
        r++;

        string[] gHdr = { "Metric", "Value" };
        ws.Cell(r, 2).Value = gHdr[0]; ws.Cell(r, 3).Value = gHdr[1];
        Program.StyleHeader(ws.Cell(r, 2)); Program.StyleHeader(ws.Cell(r, 3));
        r++;

        // Build aggregate formulas across all factories
        string allWorkers = "=" + string.Join("+", factoryConfigs.Select(c => { int wc = c.Workers.Length; return $"COUNTA('{c.SheetName}'!B19:B{18+wc})"; }));
        string allInput = "=" + string.Join("+", factoryConfigs.Select(c => { int wc = c.Workers.Length; return $"SUM('{c.SheetName}'!E19:E{18+wc})"; }));
        string allASum = string.Join("+", factoryConfigs.Select(c => { int wc = c.Workers.Length; return $"SUM('{c.SheetName}'!F19:F{18+wc})"; }));
        string allBSum = string.Join("+", factoryConfigs.Select(c => { int wc = c.Workers.Length; return $"SUM('{c.SheetName}'!G19:G{18+wc})"; }));
        string allCSum = string.Join("+", factoryConfigs.Select(c => { int wc = c.Workers.Length; return $"SUM('{c.SheetName}'!H19:H{18+wc})"; }));
        string allWaste = "=" + string.Join("+", factoryConfigs.Select(c => { int wc = c.Workers.Length; return $"SUM('{c.SheetName}'!I19:I{18+wc})"; }));
        string allWages = "=" + string.Join("+", factoryConfigs.Select(c => { int wc = c.Workers.Length; return $"SUM('{c.SheetName}'!L19:L{18+wc})"; }));

        var companyMetrics = new (string label, string formula, string fmt)[] {
            ("Total Factories",       $"={factoryConfigs.Length}", "0"),
            ("Total Workers",         allWorkers, "0"),
            ("Total Input (kg)",      allInput, "#,##0.0"),
            ("Total A-Grade (kg)",    "=" + allASum, "#,##0.0"),
            ("Total B-Grade (kg)",    "=" + allBSum, "#,##0.0"),
            ("Total C-Grade (kg)",    "=" + allCSum, "#,##0.0"),
            ("Total Wastage (kg)",    allWaste, "#,##0.0"),
            ("A-Grade % (Company)",   $"=IFERROR(({allASum})/(({allASum})+({allBSum})+({allCSum})),0)", "0.0%"),
            ("B-Grade % (Company)",   $"=IFERROR(({allBSum})/(({allASum})+({allBSum})+({allCSum})),0)", "0.0%"),
            ("C-Grade % (Company)",   $"=IFERROR(({allCSum})/(({allASum})+({allBSum})+({allCSum})),0)", "0.0%"),
            ("Total Wages (BDT)",     allWages, "#,##0"),
        };
        for (int i = 0; i < companyMetrics.Length; i++) {
            ws.Cell(r, 2).Value = companyMetrics[i].label;
            ws.Cell(r, 3).Value = companyMetrics[i].formula;
            for (int c = 2; c <= 3; c++) {
                Program.StyleCell(ws.Cell(r, c), i);
                ws.Cell(r, c).Style.Alignment.Horizontal = (c == 3) ? XLAlignmentHorizontalValues.Center : XLAlignmentHorizontalValues.Left;
                if (c == 2) ws.Cell(r, c).Style.Alignment.Indent = 1;
            }
            ws.Cell(r, 3).Style.NumberFormat.Format = companyMetrics[i].fmt;
            ws.Cell(r, 3).Style.Fill.BackgroundColor = Program.Gold;
            ws.Cell(r, 3).Style.Font.Bold = true;
            r++;
        }

        Program.FreezeTop(ws);
    }
}
