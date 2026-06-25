# Hairlan International ERP Workbook Generator

## Requirements
- .NET 8 SDK (`dotnet --version` should show 8.x)
- Python 3 with `openpyxl` and `formulas` packages (`pip install openpyxl formulas`)

## How to Regenerate the .xlsx

### Step 1: Restore NuGet packages
```bash
cd HairlanErpXL
dotnet restore
```

### Step 2: Build and run
```bash
dotnet run
```
This generates `/home/z/my-project/download/HairlanInternational_ERP.xlsx` with all 21 sheets and 6 charts.

### Step 3: Fix formula caching (REQUIRED)
ClosedXML stores formulas as shared strings, not real formula cells. This step converts them to real formulas with cached values so they display immediately in Excel/LibreOffice/Google Sheets.

```bash
python3 fix_formulas_v3.py
```

## Output
- **File**: `HairlanInternational_ERP.xlsx` (~100 KB)
- **Sheets**: 21 (Cover, Dashboard, Settings, Procurement, Lot Master, Inventory, Washing, Phase 1, QC, 5 Factory sheets, Payroll Summary, Phase 2, Size Pricing, Costing, Sales, KPI, Risk)
- **Charts**: 6 (Grade Pie, Cost/kg Bar, Inventory Bar, Sales Pie, Size Line, Payroll Pie)
- **Formulas**: ~1400 live cross-sheet formulas with cached values

## Source Files

| File | Purpose |
|---|---|
| `Program.cs` | Main entry point + Cover, Settings, Procurement, Lot Master, Inventory sheets |
| `FactorySheet.cs` | Per-factory daily record sheet (5 factories) with WIP tracking |
| `QcSheet.cs` | QC & Grading with 7 sections (Supervisor, Worker, Lot, Discrepancy, Line Leader, Group Head, Company) |
| `PayrollSheet.cs` | Cross-factory payroll summary |
| `CostingSheet.cs` | Per-factory costing analysis |
| `KpiSheet.cs` | KPI tracker with live cross-sheet formulas |
| `DashboardSheet.cs` | Executive dashboard with KPI tiles + helper data for charts |
| `ChartBuilder.cs` | Adds 6 native charts via Open XML SDK |
| `WashingLogSheet.cs` | Washing batch tracking |
| `Phase1Sheet.cs` | Phase 1 distribution hierarchy |
| `Phase2Sheet.cs` | Phase 2 factory production (sizing, assembly) |
| `SizePricingSheet.cs` | Size-wise rate master with buyer-specific pricing |
| `SalesSheet.cs` | Export sales register with FX conversion |
| `RiskSheet.cs` | Risk register with likelihood × impact scoring |
| `fix_formulas_v3.py` | Python post-processor: converts shared-string formulas to real formulas with cached values |

## Key Architecture

- **Factory sheets** are the source of truth (worker-level daily records with A/B/C weights, wastage, WIP)
- **QC sheet** pulls live from factory sheets (no duplicate data)
- **Lot Master** pulls landed cost from Procurement & distribution from factory sheets
- **Dashboard/KPI/Payroll/Costing** all pull from factory sheets and QC sections
- **WIP tracking** at every level: Factory → Line Leader → Group Head → Company
- **Grade %** (A/B/C) at every level: Supervisor → Line Leader → Group Head → Company
- **Discrepancy cross-check**: Factory input vs QC summary vs QC detail

## Customization

To add more factories, edit `BuildFactoryConfigs()` in `Program.cs` and add new `FactoryConfig` entries.
To change grade rates, edit the `Settings & FX` sheet section in `BuildSettingsAndFx()`.
