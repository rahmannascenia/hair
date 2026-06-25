// SizePricingSheet.cs — Size-wise rate master with live USD conversion
using System;
using ClosedXML.Excel;

namespace HairlanErpXL;

internal static class SizePricingSheet
{
    public static void Build(XLWorkbook wb) {
        var ws = wb.AddWorksheet("Size-wise Pricing");
        Program.SetColumnWidths(ws, 4, 14, 18, 16, 18, 22, 18, 18);

        Program.WriteTitleBar(ws, "SIZE-WISE PRICING MASTER",
            "Length (inch) -> BDT/kg -> USD/kg (live FX). Buyer-specific price lists layered on top.", 8);

        int r = 4;
        string[] hdr = { "Length (inch)", "BDT per kg", "USD per kg", "Premium vs 8\" (x)",
                         "Market Segment", "Min Margin (BDT/kg)", "Min Margin %" };
        for (int i = 0; i < hdr.Length; i++) {
            ws.Cell(r, 2 + i).Value = hdr[i];
            Program.StyleHeader(ws.Cell(r, 2 + i));
        }
        ws.Row(r).Height = 32;
        r++;

        var sizes = new (int len, double bdt, string seg)[] {
            (5,  500,    "Short — low-end"),
            (6,  1200,   "Short"),
            (8,  5000,   "Short-medium"),
            (10, 8000,   "Medium"),
            (12, 12000,  "Medium-long"),
            (14, 18000,  "Long"),
            (16, 25000,  "Long"),
            (18, 35000,  "Long-premium"),
            (20, 50000,  "Premium"),
            (24, 70000,  "Premium"),
            (30, 90000,  "Top-tier"),
        };
        int baseRow8 = r + 2;
        for (int i = 0; i < sizes.Length; i++) {
            ws.Cell(r, 2).Value = sizes[i].len;
            ws.Cell(r, 3).Value = sizes[i].bdt;
            ws.Cell(r, 4).Value = $"=C{r}/FX_USD_BDT";
            ws.Cell(r, 5).Value = $"=IFERROR(C{r}/C{baseRow8},0)";
            ws.Cell(r, 6).Value = sizes[i].seg;
            ws.Cell(r, 7).Value = $"=C{r}*0.25";
            ws.Cell(r, 8).Value = 0.25;

            for (int c = 2; c <= 8; c++) {
                Program.StyleCell(ws.Cell(r, c), i);
                if (c == 2) ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                if (c == 3) { ws.Cell(r, c).Style.NumberFormat.Format = "#,##0"; ws.Cell(r, c).Style.Fill.BackgroundColor = Program.Gold; ws.Cell(r, c).Style.Font.Bold = true; }
                if (c == 4) ws.Cell(r, c).Style.NumberFormat.Format = "#,##0.00";
                if (c == 5) ws.Cell(r, c).Style.NumberFormat.Format = "0.00\"x\"";
                if (c == 7) ws.Cell(r, c).Style.NumberFormat.Format = "#,##0";
                if (c == 8) { ws.Cell(r, c).Style.NumberFormat.Format = "0.0%"; ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center; }
            }
            r++;
        }

        // Buyer-specific pricing section
        r += 2;
        ws.Cell(r, 2).Value = "BUYER-SPECIFIC PRICE LIST (Premium over Rate Master)";
        Program.StyleSubHeader(ws.Cell(r, 2));
        ws.Range(r, 2, r, 8).Merge();
        ws.Range(r, 2, r, 8).Style.Fill.BackgroundColor = Program.MidGrey;
        r++;
        string[] bhdr = { "Buyer", "Country", "Length (inch)", "Base Rate (BDT/kg)",
                          "Buyer Premium %", "Final Price (BDT/kg)", "Final Price (USD/kg)" };
        for (int i = 0; i < bhdr.Length; i++) {
            ws.Cell(r, 2 + i).Value = bhdr[i];
            Program.StyleHeader(ws.Cell(r, 2 + i));
        }
        ws.Row(r).Height = 32;
        r++;

        var buyers = new (string name, string country, int len, double prem)[] {
            ("African Bulk Co",   "Nigeria",  10, -0.30),
            ("African Bulk Co",   "Nigeria",  16, -0.20),
            ("US Wig Distributors","USA",     16,  0.15),
            ("US Wig Distributors","USA",     20,  0.20),
            ("EU Hair Boutique",  "Germany",  18,  0.10),
            ("China Trade Hub",   "China",    12, -0.10),
        };
        for (int i = 0; i < buyers.Length; i++) {
            ws.Cell(r, 2).Value = buyers[i].name;
            ws.Cell(r, 3).Value = buyers[i].country;
            ws.Cell(r, 4).Value = buyers[i].len;
            ws.Cell(r, 5).Value = $"=VLOOKUP(D{r},SIZE_MASTER,2,FALSE)";
            ws.Cell(r, 6).Value = buyers[i].prem;
            ws.Cell(r, 7).Value = $"=E{r}*(1+F{r})";
            ws.Cell(r, 8).Value = $"=G{r}/FX_USD_BDT";
            for (int c = 2; c <= 8; c++) {
                Program.StyleCell(ws.Cell(r, c), i);
                if (c == 4) ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                if (c == 5) { ws.Cell(r, c).Style.NumberFormat.Format = "#,##0"; ws.Cell(r, c).Style.Fill.BackgroundColor = Program.Gold; ws.Cell(r, c).Style.Font.Bold = true; }
                if (c == 6) { ws.Cell(r, c).Style.NumberFormat.Format = "+0.0%;-0.0%;0.0%"; ws.Cell(r, c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center; }
                if (c == 7) ws.Cell(r, c).Style.NumberFormat.Format = "#,##0";
                if (c == 8) ws.Cell(r, c).Style.NumberFormat.Format = "#,##0.00";
            }
            r++;
        }

        Program.FreezeTop(ws);
    }
}
