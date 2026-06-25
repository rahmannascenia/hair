// KpiSheet.cs — KPI tracker with target vs actual and traffic-light status
using System;
using System.Linq;
using ClosedXML.Excel;

namespace HairlanErpXL;

internal static class KpiSheet
{
    public static void Build(XLWorkbook wb, FactoryConfig[] factoryConfigs) {
        var ws = wb.AddWorksheet("KPI Tracker");
        Program.SetColumnWidths(ws, 4, 28, 14, 14, 14, 14, 14, 16, 14);

        Program.WriteTitleBar(ws, "KPI TRACKER — Target vs Actual",
            "All KPIs across Production, Quality, Financial & Workforce dimensions. Status: traffic-light.", 9);

        int r = 4;
        string[] hdr = { "KPI Name", "Dimension", "Frequency", "Target", "Operator",
                         "Actual", "Variance", "Status", "Owner" };
        for (int i = 0; i < hdr.Length; i++) {
            ws.Cell(r, 2 + i).Value = hdr[i];
            Program.StyleHeader(ws.Cell(r, 2 + i));
        }
        ws.Row(r).Height = 32;
        r++;

        // Build SUM formulas that aggregate across all factory sheets
        // Factory sheet columns (daily record): E=Input, F=A-wt, G=B-wt, H=C-wt, I=Wastage,
        //   K=Days Present, L=Base Wage, M=Att Bonus, N=Total Payable
        string totalWorkersFormula = "=" + string.Join("+", factoryConfigs.Select(cfg => {
            int wc = cfg.Workers.Length;
            return $"COUNTA('{cfg.SheetName}'!B19:B{18+wc})";
        }));
        string totalPayrollFormula = "=" + string.Join("+", factoryConfigs.Select(cfg => {
            int wc = cfg.Workers.Length;
            return $"SUM('{cfg.SheetName}'!N19:N{18+wc})";
        }));
        string totalWeightFormula = "=" + string.Join("+", factoryConfigs.Select(cfg => {
            int wc = cfg.Workers.Length;
            return $"SUM('{cfg.SheetName}'!F19:F{18+wc})+SUM('{cfg.SheetName}'!G19:G{18+wc})+SUM('{cfg.SheetName}'!H19:H{18+wc})";
        }));
        // Attendance: sum of Days Present (col K) across all factories / (worker count * 30)
        string attendanceFormula = "=IFERROR((" + string.Join("+", factoryConfigs.Select(cfg => {
            int wc = cfg.Workers.Length;
            return $"SUM('{cfg.SheetName}'!K19:K{18+wc})";
        })) + ")/((" + string.Join("+", factoryConfigs.Select(cfg => {
            int wc = cfg.Workers.Length;
            return $"COUNTA('{cfg.SheetName}'!B19:B{18+wc})";
        })) + ")*30),0)";

        var kpis = new (string name, string dim, string freq, string target, string op, string actual, string owner)[] {
            ("Daily Output (kg) by Factory",        "Production", "Daily",    "200",   ">=", "=ROUND(SUM('Costing Analysis'!E12:E16),0)", "Production Manager"),
            ("Cumulative Yield (Raw -> Finished)",   "Production", "Per Lot",  "75%",   ">=", "=IFERROR(SUM('Inventory (8 Buckets)'!E12)/SUM('Lot Master'!F5:F15),0)", "Production Manager"),
            ("Avg Production Cycle Time (days)",    "Production", "Per Lot",  "40",    "<=", "42", "Production Manager"),
            // Grade % KPIs — pulled from QC Section G (Company-level)
            ("A-Grade % (Company)",                 "Quality",    "Daily",    "60%",   ">=", "='QC & Grading'!C106", "QC Team"),
            ("B-Grade % (Company)",                 "Quality",    "Daily",    "30%",   "<=", "='QC & Grading'!C107", "QC Team"),
            ("C-Grade % (Company)",                 "Quality",    "Daily",    "10%",   "<=", "='QC & Grading'!C108", "QC Team"),
            ("A+B Grade % (Company)",               "Quality",    "Monthly",  "90%",   ">=", "='QC & Grading'!C106+'QC & Grading'!C107", "QC Team"),
            // Discrepancy status from QC Section D
            ("Discrepancy Status (all factories)",  "Risk",       "Daily",    "0",     "=",  "=COUNTIF('QC & Grading'!I75:I79,\"INVESTIGATE\")", "QC Team"),
            ("Grading Accuracy (estimated)",        "Quality",    "Monthly",  "85%",   ">=", "0.70", "QC Team"),
            ("Real-time Stock Visibility",          "Inventory",  "Real-time","100%",  ">=", "1.00", "Store Keeper"),
            ("Lot Traceability Coverage",           "Inventory",  "Per Lot",  "100%",  ">=", "1.00", "Store Keeper"),
            ("Inventory Valuation Accuracy",        "Inventory",  "Daily",    "98%",   ">=", "0.95", "Accountant"),
            ("Cost per kg (Factory)",               "Financial",  "Daily",    "320",   "<=", "=IFERROR(SUM('Costing Analysis'!J12:J16)/SUM('Costing Analysis'!E12:E16),0)", "Accountant"),
            ("Cost per kg (Lot)",                   "Financial",  "Per Lot",  "320",   "<=", "310", "Accountant"),
            ("Export Revenue (USD, month)",         "Financial",  "Monthly",  "50000", ">=", "=SUM('Sales & Export'!J5:J12)", "Owner/MD"),
            ("Avg Margin %",                        "Financial",  "Per Sale", "20%",   ">=", "=IFERROR(SUM('Sales & Export'!O5:O12)/SUM('Sales & Export'!K5:K12),0)", "Owner/MD"),
            ("FX Gain/Loss (BDT)",                  "Financial",  "Monthly",  "0",     ">=", "0", "Accountant"),
            ("Daily Attendance Rate",               "Workforce",  "Daily",    "92%",   ">=", attendanceFormula, "HR"),
            ("Worker Turnover Rate",                "Workforce",  "Monthly",  "5%",    "<=", "0.04", "HR"),
            ("Avg Worker Monthly Earning (BDT)",    "Workforce",  "Monthly",  "2000",  ">=", $"=IFERROR({totalPayrollFormula.Substring(1)}/{totalWorkersFormula.Substring(1)},0)", "HR"),
            ("Total Payroll Cost (BDT, month)",     "Workforce",  "Monthly",  "150000","<=", totalPayrollFormula, "Accountant"),
            ("Total Workers (all factories)",       "Workforce",  "Monthly",  "40",    ">=", totalWorkersFormula, "HR"),
            ("Total Weight Processed (kg, month)",  "Production", "Monthly",  "150",   ">=", totalWeightFormula, "Production Manager"),
            // Lot distribution balance from Lot Master
            ("Lot Distribution Balance (mismatches)","Risk",      "Daily",    "0",     "=",  "=COUNTIF('Lot Master'!Q5:Q15,\"MISMATCH\")", "Store Keeper"),
            ("Material Leakage (Shortage %)",       "Risk",       "Per Lot",  "0.5%",  "<=", "0.02", "Store Keeper"),
            ("Manual Data Entry Time (hrs/day)",    "Risk",       "Daily",    "0.5",   "<=", "8", "Data Entry Op"),
            ("bKash Disbursement Accuracy",         "Risk",       "Monthly",  "100%",  ">=", "0.995", "Accountant"),
        };

        for (int i = 0; i < kpis.Length; i++) {
            ws.Cell(r, 2).Value = kpis[i].name;
            ws.Cell(r, 3).Value = kpis[i].dim;
            ws.Cell(r, 4).Value = kpis[i].freq;
            // Target as number (parse % or number)
            string targetStr = kpis[i].target.TrimEnd('%');
            if (double.TryParse(targetStr, out double tVal)) {
                if (kpis[i].target.EndsWith("%")) {
                    ws.Cell(r, 5).Value = tVal / 100.0;
                    ws.Cell(r, 5).Style.NumberFormat.Format = "0%";
                } else {
                    ws.Cell(r, 5).Value = tVal;
                    ws.Cell(r, 5).Style.NumberFormat.Format = "#,##0";
                }
            } else {
                ws.Cell(r, 5).Value = kpis[i].target;
            }
            ws.Cell(r, 6).Value = kpis[i].op;

            // Actual
            string actualExpr = kpis[i].actual;
            if (actualExpr.StartsWith("=")) {
                ws.Cell(r, 7).Value = actualExpr;
                if (kpis[i].target.EndsWith("%")) ws.Cell(r, 7).Style.NumberFormat.Format = "0.0%";
                else ws.Cell(r, 7).Style.NumberFormat.Format = "#,##0.##";
            } else if (actualExpr.EndsWith("%")) {
                double pct = double.Parse(actualExpr.TrimEnd('%')) / 100.0;
                ws.Cell(r, 7).Value = pct;
                ws.Cell(r, 7).Style.NumberFormat.Format = "0.0%";
            } else if (double.TryParse(actualExpr, out double aVal)) {
                ws.Cell(r, 7).Value = aVal;
                ws.Cell(r, 7).Style.NumberFormat.Format = "#,##0.##";
            } else {
                ws.Cell(r, 7).Value = actualExpr;
            }

            ws.Cell(r, 8).Value = "";
            // Status formula
            string statusFormula = kpis[i].op switch {
                ">=" => $"=IF(IFERROR(VALUE(G{r}),0)>=IFERROR(VALUE(E{r}),0),\"ON TARGET\",\"OFF TARGET\")",
                "<=" => $"=IF(IFERROR(VALUE(G{r}),0)<=IFERROR(VALUE(E{r}),0),\"ON TARGET\",\"OFF TARGET\")",
                ">"  => $"=IF(IFERROR(VALUE(G{r}),0)>IFERROR(VALUE(E{r}),0),\"ON TARGET\",\"OFF TARGET\")",
                "<"  => $"=IF(IFERROR(VALUE(G{r}),0)<IFERROR(VALUE(E{r}),0),\"ON TARGET\",\"OFF TARGET\")",
                _    => "=\"-\"",
            };
            ws.Cell(r, 9).Value = statusFormula;
            ws.Cell(r, 10).Value = kpis[i].owner;

            for (int c = 2; c <= 10; c++) {
                Program.StyleCell(ws.Cell(r, c), i);
                if (c == 3 || c == 4) ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                if (c == 5 || c == 6 || c == 7) ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                if (c == 7) { ws.Cell(r, c).Style.Fill.BackgroundColor = Program.Gold; ws.Cell(r, c).Style.Font.Bold = true; }
                if (c == 9) { ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center; ws.Cell(r, c).Style.Font.Bold = true; }
                if (c == 2 || c == 10) ws.Cell(r, c).Style.Alignment.Indent = 1;
            }
            r++;
        }

        Program.FreezeTop(ws);
    }
}
