// RiskSheet.cs — Risk register with likelihood × impact scoring
using System;
using ClosedXML.Excel;

namespace BarendraErpXL;

internal static class RiskSheet
{
    public static void Build(XLWorkbook wb) {
        var ws = wb.AddWorksheet("Risk Register");
        Program.SetColumnWidths(ws, 4, 8, 28, 16, 12, 12, 12, 38, 16, 14);

        Program.WriteTitleBar(ws, "RISK REGISTER",
            "Risk = Likelihood x Impact (1-5 scale each). Mitigation tracked. Status: Open / Mitigated / Closed.", 10);

        int r = 4;
        string[] hdr = { "Risk ID", "Risk Description", "Category", "Likelihood (1-5)",
                         "Impact (1-5)", "Risk Score", "Mitigation Plan", "Owner", "Status" };
        for (int i = 0; i < hdr.Length; i++) {
            ws.Cell(r, 2 + i).Value = hdr[i];
            Program.StyleHeader(ws.Cell(r, 2 + i));
        }
        ws.Row(r).Height = 32;
        r++;

        var risks = new (string id, string desc, string cat, int l, int i, string mit, string owner, string status)[] {
            ("R-01", "Material theft during field distribution (1 kg = Tk 12,000-14,000)",         "Operational", 4, 5, "Barcode/QR chain-of-custody; mandatory digital sign-off at each handoff; reduce unexplained shortage from 2% to <0.5%", "Store Keeper", "Open"),
            ("R-02", "Line Leader salary skimming (~Tk 1.5 lakh per 100 workers)",                "Financial",   3, 5, "Direct bKash B2C disbursement; eliminate intermediary cash handling; monthly worker confirmation calls", "Accountant", "Open"),
            ("R-03", "Worker grade disputes (judgement-based grading ~70% accurate)",              "Quality",     4, 3, "Grade distribution analytics; lot-quality flagging when C-grade > 50%; second-QC review for disputed A/B grades", "QC Team", "Open"),
            ("R-04", "Inventory valuation errors across 8 buckets",                                "Financial",   4, 5, "Real-time valuation; automatic cost roll-up; daily reconciliation; lot-level valuation report", "Accountant", "Open"),
            ("R-05", "Manual data entry errors (2 operators x 5,000 workers daily)",               "Operational", 5, 4, "IoT digital scale integration; mobile QC app; eliminate manual transcription; target 30 min from 8 hrs", "Production Manager", "Open"),
            ("R-06", "LC documentation errors causing customs delays",                             "Compliance",  2, 4, "LC document checklist; bank liaison; pre-shipment verification; digital LC register", "Accountant", "Mitigated"),
            ("R-07", "FX exposure on USD export sales vs BDT costs",                               "Financial",   4, 4, "Forward contracts; natural hedge where possible; monthly FX P&L posting; FX gain/loss tracking", "Owner/MD", "Open"),
            ("R-08", "Buyer-specific price list mismanagement",                                    "Commercial",  3, 4, "Buyer-wise price master layered on size-wise rate; margin analysis per buyer; price-list version control", "Owner/MD", "Open"),
            ("R-09", "Adhesive glue counterfeit substitution (USD 4-5k / 100g)",                   "Quality",     2, 5, "Separate custody controls; batch-level tracking; supplier authentication; allergy-claim prevention", "Floor Manager", "Mitigated"),
            ("R-10", "Owner-centric approval bottleneck",                                          "Governance",  4, 4, "Delegation matrix; approval thresholds by value; system-driven workflows; cross-training of key roles", "Owner/MD", "Open"),
            ("R-11", "Worker attrition / turnover above 5%/month",                                 "Workforce",   3, 3, "On-time bKash payment; attendance & performance bonus; supervisor hosting allowance; worker recognition", "HR", "Open"),
            ("R-12", "Factory A-grade % below 60% threshold (supervisor bonus forfeit)",           "Quality",     3, 3, "Daily A-grade % monitoring; worker replacement plan; supervisor coaching; quality improvement training", "Production Manager", "Open"),
            ("R-13", "Lot-quality skew (poor raw lot -> all workers C-graded)",                     "Quality",     3, 4, "Flag lots where grade distribution is skewed; investigate root cause; supplier feedback loop", "QC Team", "Open"),
            ("R-14", "Washing loss > 15% tolerance (raw -> washed)",                                "Operational", 3, 3, "Standard wash recipe per origin country; operator training; auto-alert when wastage > Settings tolerance", "Washing Lead", "Open"),
            ("R-15", "Hackling/combing loss > 15% (Phase 2 sizing)",                               "Operational", 3, 3, "Skilled hackle operators; per-job loss tracking; tool maintenance; size-mix optimization", "Floor Manager", "Open"),
            ("R-16", "Phase 1 distribution bottleneck (1:5:10:10:10 chain breakage)",              "Operational", 2, 4, "Tier coverage analytics; GPS tracking of Line Leaders; real-time distribution dashboard", "Production Manager", "Open"),
            ("R-17", "Buyer ethical-sourcing non-compliance (US/EU buyers)",                       "Compliance",  3, 5, "End-to-end lot traceability; supplier audit trail; ethical-sourcing documentation; buyer compliance reports", "Owner/MD", "Open"),
            ("R-18", "Internet connectivity gaps in field locations",                              "IT",          4, 2, "Offline-first mobile app; auto-sync when online; mobile hotspot backup; data integrity checks", "IT Lead", "Mitigated"),
        };

        int startRow = r;
        for (int i = 0; i < risks.Length; i++) {
            ws.Cell(r, 2).Value = risks[i].id;
            ws.Cell(r, 3).Value = risks[i].desc;
            ws.Cell(r, 4).Value = risks[i].cat;
            ws.Cell(r, 5).Value = risks[i].l;
            ws.Cell(r, 6).Value = risks[i].i;
            ws.Cell(r, 7).Value = $"=E{r}*F{r}";
            ws.Cell(r, 8).Value = risks[i].mit;
            ws.Cell(r, 9).Value = risks[i].owner;
            ws.Cell(r, 10).Value = risks[i].status;

            for (int c = 2; c <= 10; c++) {
                Program.StyleCell(ws.Cell(r, c), i);
                if (c == 2) ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                if (c == 4) ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                if (c == 5 || c == 6) ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                if (c == 7) {
                    ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                    ws.Cell(r, c).Style.Font.Bold = true;
                    ws.Cell(r, c).Style.Fill.BackgroundColor = Program.Gold;
                }
                if (c == 8) ws.Cell(r, c).Style.Alignment.WrapText = true;
                if (c == 9) ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                if (c == 10) {
                    ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                    ws.Cell(r, c).Style.Font.Bold = true;
                }
                if (c == 3 || c == 8) ws.Cell(r, c).Style.Alignment.Indent = 1;
            }
            ws.Row(r).Height = 42;
            r++;
        }

        // Risk summary
        r += 2;
        ws.Cell(r, 2).Value = "RISK SUMMARY BY CATEGORY";
        Program.StyleSubHeader(ws.Cell(r, 2));
        ws.Range(r, 2, r, 5).Merge();
        ws.Range(r, 2, r, 5).Style.Fill.BackgroundColor = Program.MidGrey;
        r++;
        ws.Cell(r, 2).Value = "Category"; ws.Cell(r, 3).Value = "Open Risks";
        ws.Cell(r, 4).Value = "Avg Risk Score"; ws.Cell(r, 5).Value = "Max Score";
        for (int c = 2; c <= 5; c++) Program.StyleHeader(ws.Cell(r, c));
        r++;
        int lastRisk = startRow + risks.Length - 1;
        string[] cats = { "Operational", "Financial", "Quality", "Compliance", "Commercial", "Governance", "Workforce", "IT" };
        foreach (var cat in cats) {
            ws.Cell(r, 2).Value = cat;
            ws.Cell(r, 3).Value = $"=COUNTIFS(D{startRow}:D{lastRisk},\"{cat}\",J{startRow}:J{lastRisk},\"Open\")";
            ws.Cell(r, 4).Value = $"=IFERROR(AVERAGEIFS(G{startRow}:G{lastRisk},D{startRow}:D{lastRisk},\"{cat}\"),0)";
            ws.Cell(r, 5).Value = $"=IFERROR(MAXIFS(G{startRow}:G{lastRisk},D{startRow}:D{lastRisk},\"{cat}\"),0)";
            for (int c = 2; c <= 5; c++) {
                Program.StyleCell(ws.Cell(r, c), 0);
                ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                if (c == 4 || c == 5) ws.Cell(r, c).Style.NumberFormat.Format = "0.0";
            }
            r++;
        }

        Program.FreezeTop(ws);
    }
}
