// ============================================================================
//  Hairlan International — End-to-End ERP Workbook Generator
//  .NET 8 + ClosedXML  |  Generates HairlanInternational_ERP.xlsx
//
//  Every derived value is written as a LIVE Excel formula so the workbook
//  stays dynamic — change an input on Settings and the Dashboard, Payroll,
//  Costing, Sales, KPI and Risk sheets all re-compute on open.
//
//  Charts are added in a second pass by add_charts.py (openpyxl), because
//  ClosedXML 0.104 does not yet ship native chart support.
// ============================================================================

using System;
using System.Globalization;
using System.Linq;
using ClosedXML.Excel;

namespace HairlanErpXL;

internal static class Program
{
    // ──────────────────────────────────────────────────────────────────────
    //  DESIGN TOKENS — "Corporate Pro ERP"
    // ──────────────────────────────────────────────────────────────────────
    public static readonly XLColor Navy   = XLColor.FromHtml("#1F3864");
    public static readonly XLColor Gold   = XLColor.FromHtml("#C9A227");
    public static readonly XLColor Light  = XLColor.FromHtml("#F4F6FB");
    public static readonly XLColor MidGrey= XLColor.FromHtml("#D9DDE6");
    public static readonly XLColor Red    = XLColor.FromHtml("#C0392B");
    public static readonly XLColor Green  = XLColor.FromHtml("#1E8449");
    public static readonly XLColor Amber  = XLColor.FromHtml("#B7791F");
    public static readonly XLColor White  = XLColor.White;

    public const string FontName = "Calibri";

    // ──────────────────────────────────────────────────────────────────────
    //  STYLE HELPERS  (public static so all sheet builders can call directly)
    // ──────────────────────────────────────────────────────────────────────
    public static void StyleTitle(IXLCell c) {
        c.Style.Font.FontName = FontName;
        c.Style.Font.FontSize = 18;
        c.Style.Font.Bold = true;
        c.Style.Font.FontColor = White;
        c.Style.Fill.BackgroundColor = Navy;
        c.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        c.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
        c.Style.Alignment.Indent = 1;
    }

    public static void StyleSubtitle(IXLCell c) {
        c.Style.Font.FontName = FontName;
        c.Style.Font.FontSize = 11;
        c.Style.Font.Italic = true;
        c.Style.Font.FontColor = Navy;
        c.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        c.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
        c.Style.Alignment.Indent = 1;
    }

    public static void StyleHeader(IXLCell c) {
        c.Style.Font.FontName = FontName;
        c.Style.Font.FontSize = 11;
        c.Style.Font.Bold = true;
        c.Style.Font.FontColor = White;
        c.Style.Fill.BackgroundColor = Navy;
        c.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        c.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        c.Style.Alignment.WrapText = true;
        c.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        c.Style.Border.OutsideBorderColor = Navy;
    }

    public static void StyleSubHeader(IXLCell c) {
        c.Style.Font.FontName = FontName;
        c.Style.Font.FontSize = 10;
        c.Style.Font.Bold = true;
        c.Style.Font.FontColor = Navy;
        c.Style.Fill.BackgroundColor = MidGrey;
        c.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        c.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        c.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        c.Style.Border.OutsideBorderColor = Navy;
    }

    public static void StyleCell(IXLCell c, int rowIdx) {
        c.Style.Font.FontName = FontName;
        c.Style.Font.FontSize = 10;
        c.Style.Fill.BackgroundColor = (rowIdx % 2 == 0) ? Light : White;
        c.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        c.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        c.Style.Border.OutsideBorderColor = MidGrey;
    }

    public static void StyleTotal(IXLCell c) {
        c.Style.Font.FontName = FontName;
        c.Style.Font.FontSize = 10;
        c.Style.Font.Bold = true;
        c.Style.Font.FontColor = White;
        c.Style.Fill.BackgroundColor = Navy;
        c.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        c.Style.Border.OutsideBorderColor = Navy;
    }

    public static void SetColumnWidths(IXLWorksheet ws, params double[] widths) {
        for (int i = 0; i < widths.Length; i++)
            ws.Column(i + 1).Width = widths[i];
    }

    public static void WriteTitleBar(IXLWorksheet ws, string title, string subtitle, int lastCol) {
        ws.Row(1).Height = 32;
        ws.Row(2).Height = 18;
        var c1 = ws.Cell(1, 1);
        c1.Value = title;
        StyleTitle(c1);
        ws.Range(1, 1, 1, lastCol).Merge();
        foreach (var col in Enumerable.Range(1, lastCol))
            ws.Cell(1, col).Style.Fill.BackgroundColor = Navy;

        var c2 = ws.Cell(2, 1);
        c2.Value = subtitle;
        StyleSubtitle(c2);
        ws.Range(2, 1, 2, lastCol).Merge();
    }

    public static void FreezeTop(IXLWorksheet ws, int rows = 3) {
        ws.SheetView.FreezeRows(rows);
    }

    // ──────────────────────────────────────────────────────────────────────
    //  MAIN
    // ──────────────────────────────────────────────────────────────────────
    static void Main(string[] args) {
        Console.WriteLine("Building Hairlan International ERP workbook (v2 — per-factory sheets)...");

        using var wb = new XLWorkbook();
        wb.Properties.Author = "Z.ai";
        wb.Properties.Title = "Hairlan International — ERP Workbook (v2)";
        wb.Properties.Subject = "End-to-End Business Process Model with per-factory payroll";
        wb.Properties.Company = "Hairlan International";

        // Build factory configs first so we know how many sheets + their names
        var factoryConfigs = BuildFactoryConfigs();

        BuildCoverAndIndex(wb, factoryConfigs);
        BuildSettingsAndFx(wb, factoryConfigs);
        BuildProcurementAndLC(wb);
        BuildLotMaster(wb, factoryConfigs);
        BuildInventoryBuckets(wb);
        WashingLogSheet.Build(wb);
        Phase1Sheet.Build(wb);
        QcSheet.Build(wb, factoryConfigs);
        // NEW: one sheet per factory
        foreach (var cfg in factoryConfigs) {
            FactorySheet.Build(wb, cfg);
        }
        // UPDATED: Payroll Summary now rolls up all factory sheets
        PayrollSheet.Build(wb, factoryConfigs);
        Phase2Sheet.Build(wb);
        SizePricingSheet.Build(wb);
        CostingSheet.Build(wb, factoryConfigs);
        SalesSheet.Build(wb);
        KpiSheet.Build(wb, factoryConfigs);
        RiskSheet.Build(wb);
        DashboardSheet.Build(wb, factoryConfigs);

        // Reorder: Cover, Dashboard, Settings, ...rest
        wb.Worksheets.First(s => s.Name == "Cover & Index").Position = 1;
        wb.Worksheets.First(s => s.Name == "Dashboard").Position = 2;
        wb.Worksheets.First(s => s.Name == "Settings & FX").Position = 3;

        wb.Worksheet("Cover & Index").SetTabActive();
        wb.Worksheet("Cover & Index").SetTabColor(Navy);
        wb.Worksheet("Dashboard").SetTabColor(Gold);

        string outPath = "/home/z/my-project/download/HairlanInternational_ERP.xlsx";
        wb.SaveAs(outPath);
        Console.WriteLine($"OK Saved -> {outPath}");
        Console.WriteLine($"  Sheets: {wb.Worksheets.Count} (incl. {factoryConfigs.Length} factory sheets)");

        // Add charts via Open XML SDK (replaces Python openpyxl)
        ChartBuilder.AddCharts(outPath, factoryConfigs);
    }

    // ──────────────────────────────────────────────────────────────────────
    //  FACTORY CONFIGS — defines all home-based factory sheets (DAILY RECORD)
    //  Worker data: (WorkerId, Name, Bkash, InputGiven, A-wt, B-wt, C-wt, Wastage, DaysPresent)
    //  Constraint: Input Given = A + B + C + Wastage (balance check)
    // ──────────────────────────────────────────────────────────────────────
    static FactoryConfig[] BuildFactoryConfigs() {
        DateTime recordDate = new DateTime(2026, 6, 21);
        return new FactoryConfig[] {
            new FactoryConfig {
                SheetName = "F-01 Fatema",
                FactoryId = "F-01",
                SupervisorName = "Fatema Khatun",
                SupervisorBkash = "01711-100001",
                Location = "Dinajpur - Chirirbandar",
                LineLeader = "Line Leader L-03",
                GroupHead = "Group Head GH-01 (North)",
                AGradePctRef = "F15",
                BGradePctRef = "H15",
                CGradePctRef = "J15",
                LotId = "LOT-20260412-01",
                RecordDate = recordDate,
                Workers = BuildWorkers(new[] {
                    ("W-FAT-001", "Fatema Khatun",   "01711-200001", 5.0, 4.2, 0.6, 0.0, 0.2, 30),
                    ("W-JHO-002", "Jhorna Akter",    "01711-200002", 4.0, 2.3, 1.2, 0.0, 0.5, 28),
                    ("W-BRI-003", "BrishTi Rahman",  "01711-200003", 3.0, 0.8, 1.0, 0.3, 0.9, 26),
                    ("W-ROS-004", "Rosy Akter",      "01711-200004", 4.5, 3.5, 0.5, 0.0, 0.5, 30),
                    ("W-NUR-005", "Nurjahan Akter",  "01711-200005", 3.5, 1.0, 1.2, 0.4, 0.9, 28),
                    ("W-SAL-006", "Salma Khatun",    "01711-200006", 4.0, 2.0, 1.0, 0.2, 0.8, 27),
                    ("W-PAR-007", "Parul Akter",     "01711-200007", 2.5, 0.5, 0.8, 0.5, 0.7, 24),
                    ("W-MAH-008", "Mahmuda Khatun",  "01711-200008", 5.0, 4.0, 0.6, 0.0, 0.4, 30),
                    ("W-KHO-009", "Kohinoor Akter",  "01711-200009", 4.5, 3.5, 0.7, 0.0, 0.3, 29),
                    ("W-JAM-010", "Jahanara Begum",  "01711-200010", 3.5, 1.5, 1.0, 0.3, 0.7, 28),
                }),
            },
            new FactoryConfig {
                SheetName = "F-02 Jhorna",
                FactoryId = "F-02",
                SupervisorName = "Jhorna Akter",
                SupervisorBkash = "01711-100002",
                Location = "Dinajpur - Phulbari",
                LineLeader = "Line Leader L-07",
                GroupHead = "Group Head GH-01 (North)",
                AGradePctRef = "F15",
                BGradePctRef = "H15",
                CGradePctRef = "J15",
                LotId = "LOT-20260425-02",
                RecordDate = recordDate,
                Workers = BuildWorkers(new[] {
                    ("W-RAS-045", "Rashida Begum",   "01711-200045", 5.5, 4.5, 0.7, 0.0, 0.3, 30),
                    ("W-SAL-046", "Salma Khatun",    "01711-200046", 4.0, 2.0, 1.0, 0.3, 0.7, 27),
                    ("W-NUR-047", "Nurjahan Akter",  "01711-200047", 3.0, 0.7, 1.0, 0.5, 0.8, 25),
                    ("W-AKI-048", "Aklima Khatun",   "01711-200048", 3.0, 0.8, 1.2, 0.4, 0.6, 25),
                    ("W-SHA-049", "Shahida Begum",   "01711-200049", 4.5, 3.2, 0.6, 0.0, 0.7, 30),
                    ("W-NAF-050", "Nurun Nahar",     "01711-200050", 3.5, 1.0, 1.2, 0.5, 0.8, 26),
                    ("W-MIM-051", "Mim Akter",       "01711-200051", 4.5, 3.5, 0.6, 0.0, 0.4, 28),
                    ("W-JAH-052", "Jahanara Khatun", "01711-200052", 4.0, 2.5, 1.0, 0.1, 0.4, 29),
                    ("W-RAH-053", "Rahima Begum",    "01711-200053", 3.5, 1.5, 1.2, 0.3, 0.5, 27),
                    ("W-ZAR-054", "Zarina Akter",    "01711-200054", 5.0, 4.0, 0.5, 0.0, 0.5, 30),
                }),
            },
            new FactoryConfig {
                SheetName = "F-03 Rashida",
                FactoryId = "F-03",
                SupervisorName = "Rashida Begum",
                SupervisorBkash = "01711-100003",
                Location = "Dinajpur - Birampur",
                LineLeader = "Line Leader L-12",
                GroupHead = "Group Head GH-01 (North)",
                AGradePctRef = "F15",
                BGradePctRef = "H15",
                CGradePctRef = "J15",
                LotId = "LOT-20260503-03",
                RecordDate = recordDate,
                Workers = BuildWorkers(new[] {
                    ("W-ROS-082", "Rosy Akter",      "01711-200082", 5.5, 4.3, 0.7, 0.0, 0.5, 30),
                    ("W-AKI-083", "Aklima Khatun",   "01711-200083", 3.0, 0.8, 1.0, 0.5, 0.7, 25),
                    ("W-SHA-084", "Shahida Begum",   "01711-200084", 4.5, 3.0, 0.7, 0.0, 0.8, 29),
                    ("W-NAF-085", "Nurun Nahar",     "01711-200085", 3.5, 1.0, 1.2, 0.4, 0.9, 26),
                    ("W-MAH-086", "Mahmuda Khatun",  "01711-200086", 5.0, 4.2, 0.5, 0.0, 0.3, 30),
                    ("W-MIM-087", "Mim Akter",       "01711-200087", 4.5, 3.3, 0.7, 0.0, 0.5, 28),
                    ("W-JAH-088", "Jahanara Khatun", "01711-200088", 4.0, 2.5, 1.0, 0.0, 0.5, 29),
                    ("W-RAH-089", "Rahima Begum",    "01711-200089", 3.5, 1.5, 1.2, 0.2, 0.6, 27),
                    ("W-ZAR-090", "Zarina Akter",    "01711-200090", 5.0, 3.8, 0.6, 0.0, 0.6, 30),
                    ("W-KHO-091", "Kohinoor Akter",  "01711-200091", 4.5, 3.3, 0.8, 0.0, 0.4, 30),
                }),
            },
            new FactoryConfig {
                SheetName = "F-04 Selina",
                FactoryId = "F-04",
                SupervisorName = "Selina Akter",
                SupervisorBkash = "01711-100004",
                Location = "Naogaon - Manda",
                LineLeader = "Line Leader L-15",
                GroupHead = "Group Head GH-02 (South)",
                AGradePctRef = "F15",
                BGradePctRef = "H15",
                CGradePctRef = "J15",
                LotId = "LOT-20260518-04",
                RecordDate = recordDate,
                Workers = BuildWorkers(new[] {
                    ("W-SHA-101", "Shahida Begum",   "01711-200101", 4.5, 3.0, 0.6, 0.0, 0.9, 29),
                    ("W-NAF-102", "Nurun Nahar",     "01711-200102", 3.5, 1.0, 1.2, 0.3, 1.0, 26),
                    ("W-MAH-103", "Mahmuda Khatun",  "01711-200103", 5.0, 4.0, 0.5, 0.0, 0.5, 30),
                    ("W-MIM-104", "Mim Akter",       "01711-200104", 4.5, 3.3, 0.6, 0.0, 0.6, 28),
                    ("W-JAH-105", "Jahanara Khatun", "01711-200105", 4.0, 2.5, 0.9, 0.0, 0.6, 29),
                    ("W-RAH-106", "Rahima Begum",    "01711-200106", 3.5, 1.5, 1.0, 0.3, 0.7, 27),
                    ("W-ZAR-107", "Zarina Akter",    "01711-200107", 5.0, 3.8, 0.5, 0.0, 0.7, 30),
                    ("W-KHO-108", "Kohinoor Akter",  "01711-200108", 4.5, 3.3, 0.7, 0.0, 0.5, 30),
                }),
            },
            new FactoryConfig {
                SheetName = "F-05 Kohinoor",
                FactoryId = "F-05",
                SupervisorName = "Kohinoor Akter",
                SupervisorBkash = "01711-100005",
                Location = "Dinajpur - Ghoraghat",
                LineLeader = "Line Leader L-21",
                GroupHead = "Group Head GH-02 (South)",
                AGradePctRef = "F15",
                BGradePctRef = "H15",
                CGradePctRef = "J15",
                LotId = "LOT-20260602-05",
                RecordDate = recordDate,
                Workers = BuildWorkers(new[] {
                    ("W-ROS-121", "Rosy Akter",      "01711-200121", 5.5, 4.2, 0.7, 0.0, 0.6, 30),
                    ("W-AKI-122", "Aklima Khatun",   "01711-200122", 3.0, 0.8, 1.0, 0.4, 0.8, 25),
                    ("W-SHA-123", "Shahida Begum",   "01711-200123", 4.5, 3.0, 0.6, 0.0, 0.9, 29),
                    ("W-NAF-124", "Nurun Nahar",     "01711-200124", 3.5, 1.0, 1.2, 0.3, 1.0, 26),
                    ("W-MAH-125", "Mahmuda Khatun",  "01711-200125", 5.0, 4.0, 0.6, 0.0, 0.4, 30),
                    ("W-MIM-126", "Mim Akter",       "01711-200126", 4.5, 3.3, 0.6, 0.0, 0.6, 28),
                    ("W-JAH-127", "Jahanara Khatun", "01711-200127", 4.0, 2.5, 1.0, 0.0, 0.5, 29),
                    ("W-RAH-128", "Rahima Begum",    "01711-200128", 3.5, 1.5, 1.0, 0.3, 0.7, 27),
                    ("W-ZAR-129", "Zarina Akter",    "01711-200129", 5.0, 3.8, 0.6, 0.0, 0.6, 30),
                }),
            },
        };
    }

    static WorkerRow[] BuildWorkers(
        (string id, string name, string bkash, double input, double aWt, double bWt, double cWt, double waste, int present)[] data) {
        return data.Select(d => new WorkerRow {
            WorkerId = d.id,
            Name = d.name,
            Bkash = d.bkash,
            InputGivenKg = d.input,
            AWeightKg = d.aWt,
            BWeightKg = d.bWt,
            CWeightKg = d.cWt,
            WastageKg = d.waste,
            DaysPresent = d.present,
        }).ToArray();
    }

    // ========================================================================
    //  SHEET 1 — COVER & INDEX
    // ========================================================================
    static void BuildCoverAndIndex(XLWorkbook wb, FactoryConfig[] factoryConfigs) {
        var ws = wb.AddWorksheet("Cover & Index");
        SetColumnWidths(ws, 4, 28, 50, 18, 14, 4);

        ws.Row(2).Height = 8;
        ws.Row(3).Height = 36;
        ws.Row(4).Height = 28;
        ws.Row(5).Height = 22;
        ws.Row(6).Height = 18;

        var title = ws.Cell(3, 2); title.Value = "BARENDRA INTERNATIONAL";
        title.Style.Font.FontName = FontName; title.Style.Font.FontSize = 24;
        title.Style.Font.Bold = true; title.Style.Font.FontColor = Navy;
        title.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;

        var sub = ws.Cell(4, 2); sub.Value = "Human Hair Processing & Wig Manufacturing — Integrated ERP Workbook";
        sub.Style.Font.FontName = FontName; sub.Style.Font.FontSize = 13;
        sub.Style.Font.Italic = true; sub.Style.Font.FontColor = Gold;
        sub.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;

        var meta = ws.Cell(5, 2); meta.Value = "Head Office: Uttara, Sector 6, Dhaka  |  Main Factory: Dinajpur  |  Version 1.0  |  Issue Date: 21 June 2026";
        meta.Style.Font.FontName = FontName; meta.Style.Font.FontSize = 10;
        meta.Style.Font.FontColor = Navy;
        meta.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;

        var cls = ws.Cell(6, 2); cls.Value = "Classification: Internal — Confidential  |  Prepared For: Management — Strategic ERP Implementation";
        cls.Style.Font.FontName = FontName; cls.Style.Font.FontSize = 9;
        cls.Style.Font.Italic = true; cls.Style.Font.FontColor = XLColor.FromHtml("#666666");
        cls.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;

        ws.Range(7, 2, 7, 5).Style.Fill.BackgroundColor = Gold;

        ws.Row(9).Height = 24;
        var h = ws.Cell(9, 2); h.Value = "WORKBOOK CONTENTS";
        h.Style.Font.FontName = FontName; h.Style.Font.FontSize = 12;
        h.Style.Font.Bold = true; h.Style.Font.FontColor = White;
        h.Style.Fill.BackgroundColor = Navy;
        h.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
        h.Style.Alignment.Indent = 1;
        ws.Range(9, 2, 9, 5).Merge();
        ws.Range(9, 2, 9, 5).Style.Fill.BackgroundColor = Navy;

        ws.Row(11).Height = 22;
        StyleHeader(ws.Cell(11, 2)); ws.Cell(11, 2).Value = "#";
        StyleHeader(ws.Cell(11, 3)); ws.Cell(11, 3).Value = "Sheet Name";
        StyleHeader(ws.Cell(11, 4)); ws.Cell(11, 4).Value = "Purpose";
        StyleHeader(ws.Cell(11, 5)); ws.Cell(11, 5).Value = "Module";

        var index = new (string name, string purpose, string module)[] {
            ("Cover & Index",       "Workbook front page & navigation map",                     "Navigation"),
            ("Dashboard",           "Executive KPI tiles + 6 embedded charts",                  "Analytics"),
            ("Settings & FX",       "Exchange rate, grade rates, bonus rules, size rate master","Master Data"),
            ("Procurement & LC",    "Import LCs, local purchases, landed cost calculator",      "Procurement"),
            ("Lot Master",          "All lots — full traceability & current state",             "Inventory"),
            ("Inventory (8 Buckets)","Real-time stock position with valuation per bucket",       "Inventory"),
            ("Washing Log",         "Wash batches with input/output/wastage tracking",          "Production"),
            ("Phase 1 Distribution","Tier-by-tier handoff: PM->Head->Line->Supervisor->Worker", "Production"),
            ("QC & Grading",        "Daily A/B/C grading per worker with wage formula",         "Quality"),
            ("F-01 Fatema",         "Factory F-01 payroll — Supervisor: Fatema Khatun",         "Factory Payroll"),
            ("F-02 Jhorna",         "Factory F-02 payroll — Supervisor: Jhorna Akter",          "Factory Payroll"),
            ("F-03 Rashida",        "Factory F-03 payroll — Supervisor: Rashida Begum",         "Factory Payroll"),
            ("F-04 Selina",         "Factory F-04 payroll — Supervisor: Selina Akter",          "Factory Payroll"),
            ("F-05 Kohinoor",       "Factory F-05 payroll — Supervisor: Kohinoor Akter",        "Factory Payroll"),
            ("Payroll Summary",     "Cross-factory rollup: total workers, wages, bKash disb.",  "Payroll"),
            ("Phase 2 Production",  "Dhaka factory: sizing, re-wash, assembly, value rollup",   "Production"),
            ("Size-wise Pricing",   "Length -> BDT/kg -> USD/kg rate master",                   "Sales"),
            ("Costing Analysis",    "Per-worker / per-factory / per-kg cost analysis",          "Finance"),
            ("Sales & Export",      "Buyer contracts, FX conversion, margin analysis",          "Sales"),
            ("KPI Tracker",         "All KPIs: target vs actual with traffic-light status",     "Analytics"),
            ("Risk Register",       "Risk log with likelihood x impact scoring",                "Governance"),
        };

        for (int i = 0; i < index.Length; i++) {
            int r = 12 + i;
            var c1 = ws.Cell(r, 2); c1.Value = i + 1; StyleCell(c1, i);
            c1.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            c1.Style.Font.Bold = true; c1.Style.Font.FontColor = Navy;

            var c2 = ws.Cell(r, 3);
            c2.Value = index[i].name;
            StyleCell(c2, i);
            c2.Style.Font.Bold = true; c2.Style.Font.FontColor = Navy;
            c2.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
            c2.Style.Alignment.Indent = 1;
            // Use HYPERLINK formula for cross-sheet navigation
            c2.FormulaA1 = $"=HYPERLINK(\"#'{index[i].name}'!A1\",\"{index[i].name}\")";
            c2.Style.Font.Underline = XLFontUnderlineValues.Single;

            var c3 = ws.Cell(r, 4); c3.Value = index[i].purpose;
            StyleCell(c3, i);
            c3.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
            c3.Style.Alignment.Indent = 1;

            var c4 = ws.Cell(r, 5); c4.Value = index[i].module;
            StyleCell(c4, i);
            c4.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        }

        int footerRow = 12 + index.Length + 2;
        var f = ws.Cell(footerRow, 2);
        f.Value = "All derived values are LIVE Excel formulas. Edit only the white cells; blue/gold cells are formula-driven.";
        ws.Range(footerRow, 2, footerRow, 5).Merge();
        f.Style.Font.FontName = FontName; f.Style.Font.FontSize = 9;
        f.Style.Font.Italic = true; f.Style.Font.FontColor = Gold;
        f.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
    }

    // ========================================================================
    //  SHEET 3 — SETTINGS & FX  (single source of truth)
    // ========================================================================
    static void BuildSettingsAndFx(XLWorkbook wb, FactoryConfig[] factoryConfigs) {
        var ws = wb.AddWorksheet("Settings & FX");
        SetColumnWidths(ws, 4, 38, 18, 20, 30);

        WriteTitleBar(ws, "SETTINGS & MASTER DATA",
            "Single source of truth — edit these cells to drive the entire workbook", 5);

        int r = 4;

        // ── FX Section ──────────────────────────────────────────────
        ws.Cell(r, 2).Value = "FOREIGN EXCHANGE"; StyleSubHeader(ws.Cell(r, 2));
        ws.Range(r, 2, r, 5).Merge(); ws.Range(r, 2, r, 5).Style.Fill.BackgroundColor = MidGrey;
        r++;

        ws.Cell(r, 2).Value = "USD to BDT rate";        ws.Cell(r, 2).Style.Font.Bold = true;
        ws.Cell(r, 3).Value = 120.00;
        ws.Cell(r, 3).Style.NumberFormat.Format = "#,##0.00";
        ws.Cell(r, 3).Style.Fill.BackgroundColor = Gold;
        ws.Cell(r, 3).Style.Font.Bold = true;
        ws.Cell(r, 3).Style.Font.FontColor = Navy;
        ws.Cell(r, 4).Value = "BDT per 1 USD";
        ws.Cell(r, 4).Style.Font.Italic = true; ws.Cell(r, 4).Style.Font.FontColor = XLColor.Gray;
        int fxRow = r;
        wb.DefinedNames.Add("FX_USD_BDT", $"'Settings & FX'!$C${fxRow}");
        for (int c = 2; c <= 4; c++) ws.Cell(r, c).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        r += 2;

        // ── Grade Rates Section ─────────────────────────────────────
        ws.Cell(r, 2).Value = "WORKER GRADE RATES (BDT per kg)"; StyleSubHeader(ws.Cell(r, 2));
        ws.Range(r, 2, r, 5).Merge(); ws.Range(r, 2, r, 5).Style.Fill.BackgroundColor = MidGrey;
        r++;
        ws.Cell(r, 2).Value = "Grade"; ws.Cell(r, 3).Value = "Rate (BDT/kg)";
        ws.Cell(r, 4).Value = "Breakage Benchmark"; ws.Cell(r, 5).Value = "Notes";
        for (int c = 2; c <= 5; c++) StyleHeader(ws.Cell(r, c));
        r++;
        var grades = new (string g, double rate, string bench, string note)[] {
            ("A", 500, "< 50 g breakage/kg", "Excellent — minimal wastage"),
            ("B", 400, "50-100 g, moderate", "Acceptable; counts toward A+B bonus"),
            ("C", 300, "> 100 g / poor quality", "Below threshold; no bonus eligibility"),
        };
        int gradeARow = r, gradeBRow = r + 1, gradeCRow = r + 2;
        for (int i = 0; i < grades.Length; i++) {
            ws.Cell(r, 2).Value = grades[i].g;
            ws.Cell(r, 3).Value = grades[i].rate;
            ws.Cell(r, 4).Value = grades[i].bench;
            ws.Cell(r, 5).Value = grades[i].note;
            for (int c = 2; c <= 5; c++) {
                StyleCell(ws.Cell(r, c), i);
                ws.Cell(r, c).Style.Alignment.Horizontal = (c == 2) ? XLAlignmentHorizontalValues.Center : XLAlignmentHorizontalValues.Left;
            }
            ws.Cell(r, 3).Style.NumberFormat.Format = "#,##0";
            ws.Cell(r, 3).Style.Fill.BackgroundColor = Gold;
            ws.Cell(r, 3).Style.Font.Bold = true;
            r++;
        }
        wb.DefinedNames.Add("RATE_A", $"'Settings & FX'!$C${gradeARow}");
        wb.DefinedNames.Add("RATE_B", $"'Settings & FX'!$C${gradeBRow}");
        wb.DefinedNames.Add("RATE_C", $"'Settings & FX'!$C${gradeCRow}");
        r += 1;

        // ── Bonus & Policy Rules ────────────────────────────────────
        ws.Cell(r, 2).Value = "BONUS & POLICY RULES"; StyleSubHeader(ws.Cell(r, 2));
        ws.Range(r, 2, r, 5).Merge(); ws.Range(r, 2, r, 5).Style.Fill.BackgroundColor = MidGrey;
        r++;
        ws.Cell(r, 2).Value = "Rule"; ws.Cell(r, 3).Value = "Value";
        ws.Cell(r, 4).Value = "Unit"; ws.Cell(r, 5).Value = "Trigger";
        for (int c = 2; c <= 5; c++) StyleHeader(ws.Cell(r, c));
        r++;
        var rules = new (string rule, double val, string unit, string trigger, string name)[] {
            ("Performance bonus threshold",   90, "%",        "(A+B) weight / total weight >= threshold", "PERF_THRESHOLD"),
            ("Performance bonus amount",      300, "BDT",     "Monthly, paid when threshold met",     "PERF_BONUS"),
            ("Attendance bonus — days reqd",   30, "days",    "Worker present every working day in month","ATT_DAYS"),
            ("Attendance bonus amount",        200, "BDT",    "Monthly flat",                        "ATT_BONUS"),
            ("Supervisor hosting allowance — min", 100, "BDT/month", "Home-based supervisor base",      "SUP_MIN"),
            ("Supervisor hosting allowance — max", 400, "BDT/month", "Home-based supervisor max",       "SUP_MAX"),
            ("Supervisor performance extra",   150, "BDT/month","If factory >= 60% A-grade",          "SUP_EXTRA"),
            ("Factory A-grade minimum",         60, "%",      "Below = supervisor bonus forfeit",    "FACTORY_A_MIN"),
            ("Auto-C grade if output below",    50, "grams",  "Sub-50g output forced to C",          "AUTO_C_GRAMS"),
            ("Washing loss tolerance",          15, "%",      "Flag investigation if exceeded",      "WASH_TOL"),
            ("Hackling loss tolerance",         15, "%",      "Combing loss threshold",              "HACK_TOL"),
            ("Cost per kg target",             320, "BDT/kg", "Below target = healthy",              "COST_PER_KG_TGT"),
            ("Worker turnover target",           5, "%/month","Below = healthy",                     "TURNOVER_TGT"),
        };
        int rulesStart = r;
        for (int i = 0; i < rules.Length; i++) {
            ws.Cell(r, 2).Value = rules[i].rule;
            ws.Cell(r, 3).Value = rules[i].val;
            ws.Cell(r, 4).Value = rules[i].unit;
            ws.Cell(r, 5).Value = rules[i].trigger;
            for (int c = 2; c <= 5; c++) {
                StyleCell(ws.Cell(r, c), i);
                ws.Cell(r, c).Style.Alignment.Horizontal = (c == 3 || c == 4) ? XLAlignmentHorizontalValues.Center : XLAlignmentHorizontalValues.Left;
                if (c == 2 || c == 5) ws.Cell(r, c).Style.Alignment.Indent = 1;
            }
            ws.Cell(r, 3).Style.NumberFormat.Format = "#,##0.##";
            ws.Cell(r, 3).Style.Fill.BackgroundColor = Gold;
            ws.Cell(r, 3).Style.Font.Bold = true;
            wb.DefinedNames.Add(rules[i].name, $"'Settings & FX'!$C${r}");
            r++;
        }
        r += 1;

        // ── Size-wise Rate Master ───────────────────────────────────
        ws.Cell(r, 2).Value = "SIZE-WISE RATE MASTER (Finished Product)"; StyleSubHeader(ws.Cell(r, 2));
        ws.Range(r, 2, r, 5).Merge(); ws.Range(r, 2, r, 5).Style.Fill.BackgroundColor = MidGrey;
        r++;
        ws.Cell(r, 2).Value = "Length (inch)"; ws.Cell(r, 3).Value = "BDT per kg";
        ws.Cell(r, 4).Value = "USD per kg"; ws.Cell(r, 5).Value = "Market Segment";
        for (int c = 2; c <= 5; c++) StyleHeader(ws.Cell(r, c));
        r++;
        var sizes = new (int len, double bdt, string seg)[] {
            (5, 500,    "Short — low-end"),
            (6, 1200,   "Short"),
            (8, 5000,   "Short-medium"),
            (10,8000,   "Medium"),
            (12,12000,  "Medium-long"),
            (14,18000,  "Long"),
            (16,25000,  "Long"),
            (18,35000,  "Long-premium"),
            (20,50000,  "Premium"),
            (24,70000,  "Premium"),
            (30,90000,  "Top-tier"),
        };
        int sizeMasterStart = r;
        for (int i = 0; i < sizes.Length; i++) {
            ws.Cell(r, 2).Value = sizes[i].len;
            ws.Cell(r, 3).Value = sizes[i].bdt;
            ws.Cell(r, 4).Value = $"=C{r}/FX_USD_BDT";
            ws.Cell(r, 5).Value = sizes[i].seg;
            for (int c = 2; c <= 5; c++) {
                StyleCell(ws.Cell(r, c), i);
                ws.Cell(r, c).Style.Alignment.Horizontal = (c == 2) ? XLAlignmentHorizontalValues.Center : XLAlignmentHorizontalValues.Left;
                if (c == 5) ws.Cell(r, c).Style.Alignment.Indent = 1;
            }
            ws.Cell(r, 3).Style.NumberFormat.Format = "#,##0";
            ws.Cell(r, 4).Style.NumberFormat.Format = "#,##0.00";
            ws.Cell(r, 3).Style.Fill.BackgroundColor = Gold;
            ws.Cell(r, 3).Style.Font.Bold = true;
            r++;
        }
        int sizeMasterEnd = r - 1;
        wb.DefinedNames.Add("SIZE_MASTER", $"'Settings & FX'!$B${sizeMasterStart}:$C${sizeMasterEnd}");
        r += 1;

        // ── Buyer / Market Segments ─────────────────────────────────
        ws.Cell(r, 2).Value = "BUYER MARKET SEGMENTS"; StyleSubHeader(ws.Cell(r, 2));
        ws.Range(r, 2, r, 5).Merge(); ws.Range(r, 2, r, 5).Style.Fill.BackgroundColor = MidGrey;
        r++;
        ws.Cell(r, 2).Value = "Region"; ws.Cell(r, 3).Value = "Price Range (USD/kg)";
        ws.Cell(r, 4).Value = "Quality Tier"; ws.Cell(r, 5).Value = "Notes";
        for (int c = 2; c <= 5; c++) StyleHeader(ws.Cell(r, c));
        r++;
        var buyers = new (string region, string range, string tier, string note)[] {
            ("USA",        "50 - 105",  "Premium",   "End-use: high-end wigs & extensions"),
            ("Europe",     "30 - 80",   "Premium",   "Ethical-sourcing requirements"),
            ("China",      "20 - 60",   "Mid",       "Bulk distributor market"),
            ("Africa",     "5 - 50",    "Volume",    "High volume, lower price"),
            ("Local BD",   "300 - 2000", "Volume (BDT)", "Domestic distribution"),
        };
        for (int i = 0; i < buyers.Length; i++) {
            ws.Cell(r, 2).Value = buyers[i].region;
            ws.Cell(r, 3).Value = buyers[i].range;
            ws.Cell(r, 4).Value = buyers[i].tier;
            ws.Cell(r, 5).Value = buyers[i].note;
            for (int c = 2; c <= 5; c++) {
                StyleCell(ws.Cell(r, c), i);
                ws.Cell(r, c).Style.Alignment.Horizontal = (c == 2 || c == 3 || c == 4) ? XLAlignmentHorizontalValues.Center : XLAlignmentHorizontalValues.Left;
                if (c == 5) ws.Cell(r, c).Style.Alignment.Indent = 1;
            }
            r++;
        }

        // ── Factory List ────────────────────────────────────────────
        r += 1;
        ws.Cell(r, 2).Value = "FACTORY REGISTER (Home-based)"; StyleSubHeader(ws.Cell(r, 2));
        ws.Range(r, 2, r, 5).Merge(); ws.Range(r, 2, r, 5).Style.Fill.BackgroundColor = MidGrey;
        r++;
        ws.Cell(r, 2).Value = "Factory ID"; ws.Cell(r, 3).Value = "Supervisor";
        ws.Cell(r, 4).Value = "Location"; ws.Cell(r, 5).Value = "Sheet Name";
        for (int c = 2; c <= 5; c++) StyleHeader(ws.Cell(r, c));
        r++;
        for (int i = 0; i < factoryConfigs.Length; i++) {
            var fc = factoryConfigs[i];
            ws.Cell(r, 2).Value = fc.FactoryId;
            ws.Cell(r, 3).Value = fc.SupervisorName;
            ws.Cell(r, 4).Value = fc.Location;
            ws.Cell(r, 5).Value = fc.SheetName;
            for (int c = 2; c <= 5; c++) {
                StyleCell(ws.Cell(r, c), i);
                ws.Cell(r, c).Style.Alignment.Horizontal = (c == 2) ? XLAlignmentHorizontalValues.Center : XLAlignmentHorizontalValues.Left;
                if (c == 2) ws.Cell(r, c).Style.Font.Bold = true;
                if (c != 2) ws.Cell(r, c).Style.Alignment.Indent = 1;
            }
            r++;
        }

        FreezeTop(ws);
    }

    // ========================================================================
    //  SHEET 4 — PROCUREMENT & LC
    // ========================================================================
    static void BuildProcurementAndLC(XLWorkbook wb) {
        var ws = wb.AddWorksheet("Procurement & LC");
        SetColumnWidths(ws, 4, 14, 14, 14, 20, 10, 12, 14, 12, 14, 14, 14, 14, 14, 14);

        WriteTitleBar(ws, "PROCUREMENT & LC MANAGEMENT",
            "Import LC register + local purchases. Landed cost auto-calculated per kg.", 15);

        int r = 4;
        ws.Cell(r, 2).Value = "IMPORT LC REGISTER"; StyleSubHeader(ws.Cell(r, 2));
        ws.Range(r, 2, r, 15).Merge(); ws.Range(r, 2, r, 15).Style.Fill.BackgroundColor = MidGrey;
        r++;

        string[] headers = { "LC No", "LC Date", "Supplier", "Country", "Lot ID",
                             "Qty (kg)", "Unit USD/kg", "Goods USD", "Freight USD",
                             "Duty USD", "Bank Charges USD", "Landed USD", "Landed BDT", "Landed BDT/kg" };
        for (int i = 0; i < headers.Length; i++) {
            ws.Cell(r, 2 + i).Value = headers[i];
            StyleHeader(ws.Cell(r, 2 + i));
        }
        ws.Row(r).Height = 32;
        r++;

        var importData = new object[,] {
            { "LC-2026-001", "2026-04-12", "Rajesh Hair Exports",     "India",     "LOT-20260412-01", 500.0, 35.00 },
            { "LC-2026-002", "2026-04-25", "Tashkent Hair Co",        "Uzbekistan","LOT-20260425-02", 350.0, 22.00 },
            { "LC-2026-003", "2026-05-03", "Tajik Raw Hair Ltd",       "Tajikistan","LOT-20260503-03", 280.0, 18.50 },
            { "LC-2026-004", "2026-05-18", "Karachi Hair Traders",     "Pakistan",  "LOT-20260518-04", 420.0, 28.00 },
            { "LC-2026-005", "2026-06-02", "Yangon Hair Suppliers",    "Myanmar",   "LOT-20260602-05", 300.0, 15.00 },
            { "LC-2026-006", "2026-06-15", "Premium Hair Pvt Ltd",     "India",     "LOT-20260615-06", 200.0, 95.00 },
        };
        int importStart = r;
        for (int i = 0; i < importData.GetLength(0); i++) {
            ws.Cell(r, 2).Value = (string)importData[i, 0];
            ws.Cell(r, 3).Value = DateTime.ParseExact((string)importData[i, 1], "yyyy-MM-dd", CultureInfo.InvariantCulture);
            ws.Cell(r, 4).Value = (string)importData[i, 2];
            ws.Cell(r, 5).Value = (string)importData[i, 3];
            ws.Cell(r, 6).Value = (string)importData[i, 4];
            ws.Cell(r, 7).Value = Convert.ToDouble(importData[i, 5]);
            ws.Cell(r, 8).Value = Convert.ToDouble(importData[i, 6]);
            ws.Cell(r, 9).Value  = $"=G{r}*H{r}";
            ws.Cell(r, 10).Value = $"=ROUND(I{r}*0.03,2)";
            ws.Cell(r, 11).Value = $"=ROUND(I{r}*0.12,2)";
            ws.Cell(r, 12).Value = $"=ROUND(I{r}*0.01,2)";
            ws.Cell(r, 13).Value = $"=I{r}+J{r}+K{r}+L{r}";
            ws.Cell(r, 14).Value = $"=M{r}*FX_USD_BDT";
            ws.Cell(r, 15).Value = $"=IFERROR(N{r}/G{r},0)";
            for (int c = 2; c <= 15; c++) {
                StyleCell(ws.Cell(r, c), i);
            }
            ws.Cell(r, 3).Style.NumberFormat.Format = "yyyy-mm-dd";
            ws.Cell(r, 7).Style.NumberFormat.Format = "#,##0.0";
            ws.Cell(r, 8).Style.NumberFormat.Format = "#,##0.00";
            ws.Cell(r, 9).Style.NumberFormat.Format = "#,##0.00";
            ws.Cell(r, 10).Style.NumberFormat.Format = "#,##0.00";
            ws.Cell(r, 11).Style.NumberFormat.Format = "#,##0.00";
            ws.Cell(r, 12).Style.NumberFormat.Format = "#,##0.00";
            ws.Cell(r, 13).Style.NumberFormat.Format = "#,##0.00";
            ws.Cell(r, 14).Style.NumberFormat.Format = "#,##0.00";
            ws.Cell(r, 15).Style.NumberFormat.Format = "#,##0.00";
            ws.Cell(r, 15).Style.Fill.BackgroundColor = Gold;
            ws.Cell(r, 15).Style.Font.Bold = true;
            r++;
        }
        // Totals
        ws.Cell(r, 4).Value = "TOTALS";
        ws.Cell(r, 7).Value = $"=SUM(G{importStart}:G{r-1})";
        ws.Cell(r, 9).Value = $"=SUM(I{importStart}:I{r-1})";
        ws.Cell(r, 13).Value = $"=SUM(M{importStart}:M{r-1})";
        ws.Cell(r, 14).Value = $"=SUM(N{importStart}:N{r-1})";
        ws.Cell(r, 15).Value = $"=IFERROR(N{r}/G{r},0)";
        for (int c = 2; c <= 15; c++) StyleTotal(ws.Cell(r, c));
        ws.Cell(r, 7).Style.NumberFormat.Format = "#,##0.0";
        ws.Cell(r, 9).Style.NumberFormat.Format = "#,##0.00";
        ws.Cell(r, 13).Style.NumberFormat.Format = "#,##0.00";
        ws.Cell(r, 14).Style.NumberFormat.Format = "#,##0.00";
        ws.Cell(r, 15).Style.NumberFormat.Format = "#,##0.00";
        r += 2;

        // Local Purchase Section
        ws.Cell(r, 2).Value = "LOCAL PURCHASE REGISTER"; StyleSubHeader(ws.Cell(r, 2));
        ws.Range(r, 2, r, 15).Merge(); ws.Range(r, 2, r, 15).Style.Fill.BackgroundColor = MidGrey;
        r++;

        string[] lhdr = { "Voucher #", "Date", "Supplier", "Region", "Lot ID",
                          "Qty (kg)", "Unit BDT/kg", "Total BDT", "Payment Mode",
                          "Quality Grade", "Color Code", "Status" };
        for (int i = 0; i < lhdr.Length; i++) {
            ws.Cell(r, 2 + i).Value = lhdr[i];
            StyleHeader(ws.Cell(r, 2 + i));
        }
        ws.Row(r).Height = 32;
        r++;
        var localData = new object[,] {
            { "LPV-2026-001", "2026-04-15", "Karim Uddin",      "Narayanganj", "LOT-20260415-L01", 80.0,  1800.0 },
            { "LPV-2026-002", "2026-04-22", "Salma Begum",      "Gazipur",     "LOT-20260422-L02", 60.0,  2200.0 },
            { "LPV-2026-003", "2026-05-08", "Rohim Collector",  "Tangail",     "LOT-20260508-L03", 95.0,  1500.0 },
            { "LPV-2026-004", "2026-05-20", "Jahura Hair Agency","Dhaka",      "LOT-20260520-L04", 50.0,  12000.0 },
            { "LPV-2026-005", "2026-06-05", "Maa Shetu Traders","Narayanganj", "LOT-20260605-L05", 110.0, 2000.0 },
        };
        int localStart = r;
        for (int i = 0; i < localData.GetLength(0); i++) {
            ws.Cell(r, 2).Value = (string)localData[i, 0];
            ws.Cell(r, 3).Value = DateTime.ParseExact((string)localData[i, 1], "yyyy-MM-dd", CultureInfo.InvariantCulture);
            ws.Cell(r, 4).Value = (string)localData[i, 2];
            ws.Cell(r, 5).Value = (string)localData[i, 3];
            ws.Cell(r, 6).Value = (string)localData[i, 4];
            ws.Cell(r, 7).Value = Convert.ToDouble(localData[i, 5]);
            ws.Cell(r, 8).Value = Convert.ToDouble(localData[i, 6]);
            ws.Cell(r, 9).Value = $"=G{r}*H{r}";
            ws.Cell(r, 10).Value = "Cash";
            ws.Cell(r, 11).Value = (i % 2 == 0) ? "Standard" : "Premium";
            ws.Cell(r, 12).Value = (i % 3 == 0) ? "#600" : (i % 3 == 1 ? "#627" : "Natural");
            ws.Cell(r, 13).Value = "Received";
            for (int c = 2; c <= 13; c++) {
                StyleCell(ws.Cell(r, c), i);
                if (c == 3) ws.Cell(r, c).Style.NumberFormat.Format = "yyyy-mm-dd";
                if (c == 7) ws.Cell(r, c).Style.NumberFormat.Format = "#,##0.0";
                if (c == 8) ws.Cell(r, c).Style.NumberFormat.Format = "#,##0";
                if (c == 9) { ws.Cell(r, c).Style.NumberFormat.Format = "#,##0"; ws.Cell(r, c).Style.Fill.BackgroundColor = Gold; ws.Cell(r, c).Style.Font.Bold = true; }
            }
            r++;
        }
        ws.Cell(r, 4).Value = "TOTALS";
        ws.Cell(r, 7).Value = $"=SUM(G{localStart}:G{r-1})";
        ws.Cell(r, 9).Value = $"=SUM(I{localStart}:I{r-1})";
        for (int c = 2; c <= 13; c++) StyleTotal(ws.Cell(r, c));
        ws.Cell(r, 7).Style.NumberFormat.Format = "#,##0.0";
        ws.Cell(r, 9).Style.NumberFormat.Format = "#,##0";

        FreezeTop(ws);
    }

    // ========================================================================
    //  SHEET 5 — LOT MASTER  (linked to Procurement & LC + Factory sheets)
    // ========================================================================
    static void BuildLotMaster(XLWorkbook wb, FactoryConfig[] factoryConfigs) {
        var ws = wb.AddWorksheet("Lot Master");
        SetColumnWidths(ws, 4, 18, 14, 14, 12, 14, 14, 14, 18, 14, 14, 14, 14, 14, 14, 14);
        WriteTitleBar(ws, "LOT MASTER — Full Traceability (Live-Linked)",
            "Landed cost pulled from Procurement. Factory distribution tracked. All formula-driven.", 17);
        int r = 4;
        string[] hdr = { "Lot ID", "Created", "Source Country", "Color Code", "Raw Wt (kg)",
                         "Landed Cost/kg (BDT)", "Total Landed Cost", "Current Bucket", "Current Location",
                         "Current Qty (kg)", "Age (days)", "Current Value (BDT)",
                         "Factory Assigned", "Factory Input Used (kg)", "Distributed to Workers (kg)", "Distribution Balance", "Status" };
        for (int i = 0; i < hdr.Length; i++) {
            ws.Cell(r, 2 + i).Value = hdr[i];
            StyleHeader(ws.Cell(r, 2 + i));
        }
        ws.Row(r).Height = 42;
        r++;

        var lots = new object[,] {
            { "LOT-20260412-01", "2026-04-12", "India",     "#600", 500.0, 4200.0 },
            { "LOT-20260415-L01","2026-04-15", "Local BD",  "#627",  80.0, 1800.0 },
            { "LOT-20260422-L02","2026-04-22", "Local BD",  "Nat",   60.0, 2200.0 },
            { "LOT-20260425-02", "2026-04-25", "Uzbekistan","#1B",  350.0, 2640.0 },
            { "LOT-20260503-03", "2026-05-03", "Tajikistan","Nat",  280.0, 2220.0 },
            { "LOT-20260508-L03","2026-05-08", "Local BD",  "#600",  95.0, 1500.0 },
            { "LOT-20260518-04", "2026-05-18", "Pakistan",  "#1B",  420.0, 3360.0 },
            { "LOT-20260520-L04","2026-05-20", "Local BD",  "Nat",   50.0,12000.0 },
            { "LOT-20260602-05", "2026-06-02", "Myanmar",   "#600", 300.0, 1800.0 },
            { "LOT-20260605-L05","2026-06-05", "Local BD",  "#627", 110.0, 2000.0 },
            { "LOT-20260615-06", "2026-06-15", "India",     "Nat",  200.0,11400.0 },
        };
        int lotStart = r;
        string[] buckets = { "Washed Stock", "Distributed", "In-Factory", "Washed Stock",
                             "Distributed", "Raw Material", "Washed Stock", "Half-Finish",
                             "Distributed", "In Final Production", "Raw Material" };
        string[] locations = { "Dinajpur Wash Plant", "Head Leader - North", "Factory F-12",
                               "Dinajpur Wash Plant", "Line Leader L-07", "Dhaka Warehouse",
                               "Dinajpur Wash Plant", "Dhaka Warehouse", "Line Leader L-15",
                               "Dhaka Final Floor", "Dhaka Warehouse" };
        string[] owners = { "Washing Lead", "Head Leader 2", "Supervisor S-22", "Washing Lead",
                            "Line Leader L-07", "Store Keeper", "Washing Lead", "Store Keeper",
                            "Line Leader L-15", "Floor Manager", "Store Keeper" };

        // Build a lookup: Lot ID → Factory sheet name
        var lotToFactory = factoryConfigs.ToDictionary(c => c.LotId, c => c.SheetName);

        for (int i = 0; i < lots.GetLength(0); i++) {
            string lotId = (string)lots[i, 0];
            ws.Cell(r, 2).Value = lotId;
            ws.Cell(r, 3).Value = DateTime.ParseExact((string)lots[i, 1], "yyyy-MM-dd", CultureInfo.InvariantCulture);
            ws.Cell(r, 4).Value = (string)lots[i, 2];
            ws.Cell(r, 5).Value = (string)lots[i, 3];
            ws.Cell(r, 6).Value = Convert.ToDouble(lots[i, 4]);
            // Landed Cost/kg — VLOOKUP from Procurement & LC (col O = Landed BDT/kg, col F = Lot ID)
            // Import LC register starts at row 6, Lot ID is col F (6), Landed BDT/kg is col O (15)
            // Local purchase register: Lot ID col F (6), Unit BDT/kg col H (8)
            // Try import first, then local
            ws.Cell(r, 7).Value = $"=IFERROR(VLOOKUP(B{r},'Procurement & LC'!F6:O11,10,FALSE),IFERROR(VLOOKUP(B{r},'Procurement & LC'!F20:H24,3,FALSE),G{r}))";
            // Total Landed Cost = Raw Wt × Landed Cost/kg
            ws.Cell(r, 8).Value = $"=F{r}*G{r}";
            ws.Cell(r, 9).Value = buckets[i];
            ws.Cell(r, 10).Value = locations[i];
            double remainFactor = buckets[i] switch {
                "Raw Material" => 1.00,
                "Washed Stock" => 0.92,
                "Distributed" => 0.90,
                "In-Factory" => 0.85,
                "Half-Finish" => 0.78,
                "In Final Production" => 0.72,
                _ => 0.95
            };
            ws.Cell(r, 11).Value = $"=ROUND(F{r}*{remainFactor},1)";
            ws.Cell(r, 12).Value = $"=TODAY()-C{r}";
            double uplift = buckets[i] switch {
                "Raw Material" => 0.0,
                "Washed Stock" => 200.0,
                "Distributed" => 350.0,
                "In-Factory" => 600.0,
                "Half-Finish" => 1500.0,
                "In Final Production" => 4500.0,
                _ => 0.0
            };
            ws.Cell(r, 13).Value = $"=K{r}*(G{r}+{uplift})";

            // Factory Assigned — lookup from factory configs
            if (lotToFactory.ContainsKey(lotId)) {
                var cfg = lotToFactory[lotId];
                ws.Cell(r, 14).Value = $"=IFERROR('{cfg}'!C5,\"-\")";  // supervisor name
                // Factory Input Used (kg) — sum of input given from factory sheet col E
                int wc = lotToFactory[lotId] != null ? factoryConfigs.First(c => c.LotId == lotId).Workers.Length : 0;
                if (wc > 0) {
                    string sn = lotToFactory[lotId];
                    ws.Cell(r, 15).Value = $"=SUM('{sn}'!E19:E{18+wc})";
                    // Distributed to Workers — sum of A+B+C+Wastage
                    ws.Cell(r, 16).Value = $"=SUM('{sn}'!F19:F{18+wc})+SUM('{sn}'!G19:G{18+wc})+SUM('{sn}'!H19:H{18+wc})+SUM('{sn}'!I19:I{18+wc})";
                    // Distribution Balance: Input Used = Distributed (OK/MISMATCH)
                    ws.Cell(r, 17).Value = $"=IF(ROUND(O{r}-P{r},3)=0,\"OK\",\"MISMATCH\")";
                }
            } else {
                ws.Cell(r, 14).Value = "-";
                ws.Cell(r, 15).Value = 0;
                ws.Cell(r, 16).Value = 0;
                ws.Cell(r, 17).Value = "-";
            }

            ws.Cell(r, 18).Value = "Active";

            for (int c = 2; c <= 18; c++) {
                StyleCell(ws.Cell(r, c), i);
                if (c == 3) ws.Cell(r, c).Style.NumberFormat.Format = "yyyy-mm-dd";
                if (c == 6 || c == 11 || c == 15 || c == 16) ws.Cell(r, c).Style.NumberFormat.Format = "#,##0.0";
                if (c == 7 || c == 8 || c == 13) ws.Cell(r, c).Style.NumberFormat.Format = "#,##0";
                if (c == 8 || c == 13) { ws.Cell(r, c).Style.Fill.BackgroundColor = Gold; ws.Cell(r, c).Style.Font.Bold = true; }
                if (c == 12) ws.Cell(r, c).Style.NumberFormat.Format = "0";
                if (c == 17) { ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center; ws.Cell(r, c).Style.Font.Bold = true; }
                if (c == 18) ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            }
            r++;
        }
        // Totals
        ws.Cell(r, 5).Value = "TOTALS";
        ws.Cell(r, 6).Value = $"=SUM(F{lotStart}:F{r-1})";
        ws.Cell(r, 8).Value = $"=SUM(H{lotStart}:H{r-1})";
        ws.Cell(r, 11).Value = $"=SUM(K{lotStart}:K{r-1})";
        ws.Cell(r, 13).Value = $"=SUM(M{lotStart}:M{r-1})";
        ws.Cell(r, 15).Value = $"=SUM(O{lotStart}:O{r-1})";
        ws.Cell(r, 16).Value = $"=SUM(P{lotStart}:P{r-1})";
        for (int c = 2; c <= 18; c++) StyleTotal(ws.Cell(r, c));
        ws.Cell(r, 6).Style.NumberFormat.Format = "#,##0.0";
        ws.Cell(r, 8).Style.NumberFormat.Format = "#,##0";
        ws.Cell(r, 11).Style.NumberFormat.Format = "#,##0.0";
        ws.Cell(r, 13).Style.NumberFormat.Format = "#,##0";
        ws.Cell(r, 15).Style.NumberFormat.Format = "#,##0.0";
        ws.Cell(r, 16).Style.NumberFormat.Format = "#,##0.0";

        FreezeTop(ws);
    }

    // ========================================================================
    //  SHEET 6 — INVENTORY (8 BUCKETS)
    // ========================================================================
    static void BuildInventoryBuckets(XLWorkbook wb) {
        var ws = wb.AddWorksheet("Inventory (8 Buckets)");
        SetColumnWidths(ws, 4, 24, 28, 16, 16, 16, 18, 14);
        WriteTitleBar(ws, "INVENTORY — 8 BUCKETS (Real-Time Stock Position)",
            "Stock by inventory state with valuation. SUMIFS pulls from Lot Master.", 8);

        int r = 4;
        string[] hdr = { "Bucket #", "Bucket Name", "Description", "Qty (kg)",
                         "Unit Cost (BDT/kg)", "Total Value (BDT)", "% of Total Value", "Status" };
        for (int i = 0; i < hdr.Length; i++) {
            ws.Cell(r, 2 + i).Value = hdr[i];
            StyleHeader(ws.Cell(r, 2 + i));
        }
        ws.Row(r).Height = 32;
        r++;

        var buckets = new (int id, string name, string desc, double avgCost)[] {
            (1, "Raw Material",          "Dhaka warehouse, pre-wash",                       500),
            (2, "Washed Stock",          "Dinajpur wash plant, post-wash",                  850),
            (3, "Distributed (Field)",   "Allocated to Head/Line Leaders, in transit",      420),
            (4, "In-Factory (Home)",     "With home-based workers under supervisors",       280),
            (5, "Half-Finish Return",    "Returned to Dhaka, awaiting Phase 2",             150),
            (6, "In Final Production",   "Dhaka floor — sizing, re-wash, assembly",         95),
            (7, "Finished Goods",        "Packed, ready for export shipment",               70),
            (8, "Reject / Wastage",      "Recovered short-hair / reject material",          35),
        };
        int bStart = r;
        for (int i = 0; i < buckets.Length; i++) {
            ws.Cell(r, 2).Value = buckets[i].id;
            ws.Cell(r, 3).Value = buckets[i].name;
            ws.Cell(r, 4).Value = buckets[i].desc;
            ws.Cell(r, 5).Value = $"=SUMIFS('Lot Master'!K:K,'Lot Master'!I:I,C{r})";
            ws.Cell(r, 6).Value = buckets[i].avgCost;
            ws.Cell(r, 7).Value = $"=IFERROR(E{r}*F{r},0)";
            ws.Cell(r, 8).Value = $"=IFERROR(G{r}/SUM($G${bStart}:$G${bStart+7}),0)";
            ws.Cell(r, 9).Value = (buckets[i].id <= 6) ? "Active" : "Held";
            for (int c = 2; c <= 9; c++) {
                StyleCell(ws.Cell(r, c), i);
                if (c == 2) ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                if (c == 5) ws.Cell(r, c).Style.NumberFormat.Format = "#,##0.0";
                if (c == 6) ws.Cell(r, c).Style.NumberFormat.Format = "#,##0";
                if (c == 7) { ws.Cell(r, c).Style.NumberFormat.Format = "#,##0"; ws.Cell(r, c).Style.Fill.BackgroundColor = Gold; ws.Cell(r, c).Style.Font.Bold = true; }
                if (c == 8) ws.Cell(r, c).Style.NumberFormat.Format = "0.0%";
                if (c == 9) ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            }
            r++;
        }
        ws.Cell(r, 4).Value = "TOTAL";
        ws.Cell(r, 5).Value = $"=SUM(E{bStart}:E{r-1})";
        ws.Cell(r, 7).Value = $"=SUM(G{bStart}:G{r-1})";
        ws.Cell(r, 8).Value = $"=SUM(H{bStart}:H{r-1})";
        for (int c = 2; c <= 9; c++) StyleTotal(ws.Cell(r, c));
        ws.Cell(r, 5).Style.NumberFormat.Format = "#,##0.0";
        ws.Cell(r, 7).Style.NumberFormat.Format = "#,##0";
        ws.Cell(r, 8).Style.NumberFormat.Format = "0.0%";

        FreezeTop(ws);
    }
}
