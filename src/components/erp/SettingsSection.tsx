'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface SettingsData {
  id: string;
  fxUsdBdt: number;
  rateA: number;
  rateB: number;
  rateC: number;
  washTol: number;
  hackTol: number;
  costPerKgTgt: number;
  factoryAMin: number;
  supMax: number;
  supMin: number;
  supExtra: number;
  perfThreshold: number;
  perfBonus: number;
  attDays: number;
  attBonus: number;
  autoCGrams: number;
  turnoverTgt: number;
}

const NAVY = '#1F3864';
const GOLD = '#C9A227';

const defaultSettings: SettingsData = {
  id: 'default',
  fxUsdBdt: 120.0,
  rateA: 500.0,
  rateB: 400.0,
  rateC: 300.0,
  washTol: 0.15,
  hackTol: 0.15,
  costPerKgTgt: 320.0,
  factoryAMin: 0.60,
  supMax: 400.0,
  supMin: 100.0,
  supExtra: 150.0,
  perfThreshold: 90,
  perfBonus: 300,
  attDays: 30,
  attBonus: 200,
  autoCGrams: 50,
  turnoverTgt: 5.0,
};

const fieldGroups: { title: string; fields: { key: keyof SettingsData; label: string; suffix?: string; step?: number }[] }[] = [
  {
    title: 'Foreign Exchange & Rates',
    fields: [
      { key: 'fxUsdBdt', label: 'FX Rate (USD/BDT)', step: 0.01 },
      { key: 'rateA', label: 'Rate A (BDT/kg)', suffix: 'BDT/kg' },
      { key: 'rateB', label: 'Rate B (BDT/kg)', suffix: 'BDT/kg' },
      { key: 'rateC', label: 'Rate C (BDT/kg)', suffix: 'BDT/kg' },
    ],
  },
  {
    title: 'Quality & Costing Targets',
    fields: [
      { key: 'washTol', label: 'Wash Loss Tolerance', suffix: '%', step: 0.01 },
      { key: 'hackTol', label: 'Hackling Loss Tolerance', suffix: '%', step: 0.01 },
      { key: 'costPerKgTgt', label: 'Cost/kg Target', suffix: 'BDT/kg' },
      { key: 'factoryAMin', label: 'Factory A-Grade Min %', suffix: '%', step: 0.01 },
    ],
  },
  {
    title: 'Supervisor & Worker Policies',
    fields: [
      { key: 'supMax', label: 'Supervisor Max Pay', suffix: 'BDT' },
      { key: 'supMin', label: 'Supervisor Min Pay', suffix: 'BDT' },
      { key: 'supExtra', label: 'Supervisor Extra Bonus', suffix: 'BDT' },
      { key: 'perfThreshold', label: 'Performance Bonus Threshold', suffix: '%' },
      { key: 'perfBonus', label: 'Performance Bonus Amount', suffix: 'BDT' },
      { key: 'autoCGrams', label: 'Auto C-Grade Threshold', suffix: 'g' },
      { key: 'turnoverTgt', label: 'Worker Turnover Target', suffix: '%' },
      { key: 'attDays', label: 'Attendance Days Threshold', suffix: 'days' },
      { key: 'attBonus', label: 'Attendance Bonus', suffix: 'BDT' },
    ],
  },
];

export default function SettingsSection() {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (data && data.id) setSettings(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (key: keyof SettingsData, value: string) => {
    const numVal = parseFloat(value);
    if (!isNaN(numVal)) {
      setSettings(prev => ({ ...prev, [key]: numVal }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        toast({ title: 'Settings saved successfully', description: 'All values have been updated.' });
      } else {
        toast({ title: 'Error saving settings', description: 'Please try again.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error saving settings', description: 'Network error.', variant: 'destructive' });
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold" style={{ color: NAVY }}>Settings</h2>
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold" style={{ color: NAVY }}>System Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 18 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : (
            <div className="space-y-6">
              {fieldGroups.map(group => (
                <div key={group.title}>
                  <h3 className="text-sm font-semibold mb-3" style={{ color: NAVY }}>{group.title}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {group.fields.map(f => (
                      <div key={f.key} className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">
                          {f.label}
                          {f.suffix && <span className="ml-1 opacity-60">({f.suffix})</span>}
                        </Label>
                        <Input
                          type="number"
                          step={f.step || 1}
                          value={settings[f.key]}
                          onChange={e => handleChange(f.key, e.target.value)}
                          className="h-9"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="px-8 text-white font-semibold"
              style={{ backgroundColor: NAVY }}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}