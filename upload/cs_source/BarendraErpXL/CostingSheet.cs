// CostingSheet.cs — Three-level costing: per-worker, per-factory, per-kg
using System;
using ClosedXML.Excel;

namespace BarendraErpXL;

internal static class CostingSheet
{
    public static void Build(XLWorkbook wb, FactoryConfig[] factoryConfigs) {
        var ws = wb.AddWorksheet("Costing Analysis");
        Program.SetColumnWidths(ws, 4, 16, 22, 14, 14, 14, 14, 14, 14, 14, 14, 16);

        Program.WriteTitleBar(ws, "COSTING ANALYSIS — Per Worker / Per Factory / Per kg",
            "Three-level cost rollup. Target: < Tk 320/kg. Status flag formula-driven.", 12);

        int r = 4;
        ws.Cell(r, 2).Value = "A. FACTORY-LEVEL COSTING (Daily Snapshot)";
        Program.StyleSubHeader(ws.Cell(r, 2));
        ws.Range(r, 2, r, 12).Merge();
        ws.Range(r, 2, r, 12).Style.Fill.BackgroundColor = Program.MidGrey;
        r++;

        string[] hdr = { "Factory ID", "Location", "Workers", "Output (kg/day)",
                         "Wages (BDT)", "Supervisor Allow (BDT)", "Fuel (BDT)",
                         "Transport (BDT)", "Total Cost (BDT)", "Cost/kg (BDT)",
                         "Target (BDT/kg)", "Status" };
        for (int i = 0; i < hdr.Length; i++) {
            ws.Cell(r, 2 + i).Value = hdr[i];
            Program.StyleHeader(ws.Cell(r, 2 + i));
        }
        ws.Row(r).Height = 32;
        r++;

        var factories = new (string id, string loc, double fuel, double transport)[] {
            ("F-01", "Dinajpur - Chirirbandar", 200, 150),
            ("F-02", "Dinajpur - Phulbari",     200, 150),
            ("F-03", "Dinajpur - Birampur",     200, 150),
            ("F-04", "Naogaon - Manda",         220, 180),
            ("F-05", "Dinajpur - Ghoraghat",    200, 150),
        };
        int factStart = r;
        for (int i = 0; i < factories.Length; i++) {
            var f = factories[i];
            // Find matching factory config to get sheet name
            var cfg = factoryConfigs[i];
            int workerCount = cfg.Workers.Length;
            int wStart = 19;  // worker data starts at row 18 in factory sheets
            int wEnd = wStart + workerCount - 1;

            ws.Cell(r, 2).Value = f.id;
            ws.Cell(r, 3).Value = f.loc;
            // Workers: pull live from factory sheet
            ws.Cell(r, 4).Value = $"=COUNTA('{cfg.SheetName}'!B{wStart}:B{wEnd})";
            // Output (kg/day) — total graded output (F+G+H) for this daily record
            ws.Cell(r, 5).Value = $"=SUM('{cfg.SheetName}'!F{wStart}:F{wEnd})+SUM('{cfg.SheetName}'!G{wStart}:G{wEnd})+SUM('{cfg.SheetName}'!H{wStart}:H{wEnd})";
            // Wages: pull live (base wages from factory sheet, col L)
            ws.Cell(r, 6).Value = $"=SUM('{cfg.SheetName}'!L{wStart}:L{wEnd})";
            // Supervisor allowance: pull from factory sheet C9 (hosting)
            ws.Cell(r, 7).Value = $"='{cfg.SheetName}'!C10";
            // Fuel
            ws.Cell(r, 8).Value = f.fuel;
            // Transport
            ws.Cell(r, 9).Value = f.transport;
            ws.Cell(r, 10).Value = $"=F{r}+G{r}+H{r}+I{r}";
            ws.Cell(r, 11).Value = $"=IFERROR(J{r}/E{r},0)";
            ws.Cell(r, 12).Value = "=COST_PER_KG_TGT";
            ws.Cell(r, 13).Value = $"=IF(K{r}<=L{r},\"ON TARGET\",\"OVER\")";

            for (int c = 2; c <= 13; c++) {
                Program.StyleCell(ws.Cell(r, c), i);
                if (c == 4) ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                if (c == 5) ws.Cell(r, c).Style.NumberFormat.Format = "#,##0.0";
                if (c >= 6 && c <= 10) ws.Cell(r, c).Style.NumberFormat.Format = "#,##0";
                if (c == 11) { ws.Cell(r, c).Style.NumberFormat.Format = "#,##0"; ws.Cell(r, c).Style.Fill.BackgroundColor = Program.Gold; ws.Cell(r, c).Style.Font.Bold = true; }
                if (c == 12) ws.Cell(r, c).Style.NumberFormat.Format = "#,##0";
                if (c == 13) { ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center; ws.Cell(r, c).Style.Font.Bold = true; }
            }
            r++;
        }
        ws.Cell(r, 3).Value = "TOTAL";
        ws.Cell(r, 4).Value = $"=SUM(D{factStart}:D{r-1})";
        ws.Cell(r, 5).Value = $"=SUM(E{factStart}:E{r-1})";
        ws.Cell(r, 6).Value = $"=SUM(F{factStart}:F{r-1})";
        ws.Cell(r, 7).Value = $"=SUM(G{factStart}:G{r-1})";
        ws.Cell(r, 8).Value = $"=SUM(H{factStart}:H{r-1})";
        ws.Cell(r, 9).Value = $"=SUM(I{factStart}:I{r-1})";
        ws.Cell(r, 10).Value = $"=SUM(J{factStart}:J{r-1})";
        ws.Cell(r, 11).Value = $"=IFERROR(J{r}/E{r},0)";
        ws.Cell(r, 12).Value = "=COST_PER_KG_TGT";
        for (int c = 2; c <= 13; c++) Program.StyleTotal(ws.Cell(r, c));
        ws.Cell(r, 4).Style.NumberFormat.Format = "0";
        ws.Cell(r, 5).Style.NumberFormat.Format = "#,##0.0";
        ws.Cell(r, 6).Style.NumberFormat.Format = "#,##0";
        ws.Cell(r, 7).Style.NumberFormat.Format = "#,##0";
        ws.Cell(r, 8).Style.NumberFormat.Format = "#,##0";
        ws.Cell(r, 9).Style.NumberFormat.Format = "#,##0";
        ws.Cell(r, 10).Style.NumberFormat.Format = "#,##0";
        ws.Cell(r, 11).Style.NumberFormat.Format = "#,##0";
        ws.Cell(r, 12).Style.NumberFormat.Format = "#,##0";
        r += 2;

        // Per-worker costing
        ws.Cell(r, 2).Value = "B. PER-WORKER COSTING (Sample)";
        Program.StyleSubHeader(ws.Cell(r, 2));
        ws.Range(r, 2, r, 12).Merge();
        ws.Range(r, 2, r, 12).Style.Fill.BackgroundColor = Program.MidGrey;
        r++;

        string[] whdr = { "Worker ID", "Worker Name", "Daily Output (g)", "Daily Wage (BDT)",
                          "Overhead/Day (BDT)", "Material Cost/Day (BDT)", "Total Cost/Day (BDT)",
                          "Cost per Gram (BDT)", "Cost per kg (BDT)", "Status" };
        for (int i = 0; i < whdr.Length; i++) {
            ws.Cell(r, 2 + i).Value = whdr[i];
            Program.StyleHeader(ws.Cell(r, 2 + i));
        }
        ws.Row(r).Height = 32;
        r++;

        var workers = new (string id, string name, int outputG, int wage, int overhead, int matCost)[] {
            ("W-FAT-001", "Fatema Khatun",   245, 90, 15, 1100),
            ("W-JHO-002", "Jhorna Akter",    200, 75, 15, 1100),
            ("W-BRI-003", "BrishTi Rahman",  150, 50, 15, 1100),
            ("W-RAS-045", "Rashida Begum",   195, 90, 15, 1100),
            ("W-MAH-079", "Mahmuda Khatun",  255, 90, 15, 1100),
            ("W-ROS-082", "Rosy Akter",      240, 90, 15, 1100),
        };
        for (int i = 0; i < workers.Length; i++) {
            ws.Cell(r, 2).Value = workers[i].id;
            ws.Cell(r, 3).Value = workers[i].name;
            ws.Cell(r, 4).Value = workers[i].outputG;
            ws.Cell(r, 5).Value = workers[i].wage;
            ws.Cell(r, 6).Value = workers[i].overhead;
            ws.Cell(r, 7).Value = workers[i].matCost;
            ws.Cell(r, 8).Value = $"=E{r}+F{r}+G{r}";
            ws.Cell(r, 9).Value = $"=IFERROR(H{r}/D{r},0)";
            ws.Cell(r, 10).Value = $"=I{r}*1000";
            ws.Cell(r, 11).Value = $"=IF(J{r}<=COST_PER_KG_TGT,\"ON TARGET\",\"OVER\")";

            for (int c = 2; c <= 11; c++) {
                Program.StyleCell(ws.Cell(r, c), i);
                if (c == 4) ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                if (c == 4) ws.Cell(r, c).Style.NumberFormat.Format = "#,##0";
                if (c >= 5 && c <= 8) ws.Cell(r, c).Style.NumberFormat.Format = "#,##0";
                if (c == 9) ws.Cell(r, c).Style.NumberFormat.Format = "#,##0.00";
                if (c == 10) { ws.Cell(r, c).Style.NumberFormat.Format = "#,##0"; ws.Cell(r, c).Style.Fill.BackgroundColor = Program.Gold; ws.Cell(r, c).Style.Font.Bold = true; }
                if (c == 11) { ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center; ws.Cell(r, c).Style.Font.Bold = true; }
            }
            r++;
        }

        Program.FreezeTop(ws);
    }
}
