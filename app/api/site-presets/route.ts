import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

export async function GET() {
  try {
    const csvPath = path.join(process.cwd(), "data", "site-presets.csv");
    console.log("Reading CSV file from:", csvPath);
    
    if (!fs.existsSync(csvPath)) {
      console.log("CSV file not found");
      return NextResponse.json({ presets: [] });
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',');
    
    console.log("CSV headers:", headers);
    
    const presets = lines.slice(1).map(line => {
      const values = line.split(',');
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header.trim()] = values[index]?.trim() || '';
      });
      
      return {
        siteName: row.siteName || '',
        exemptionRate: row.exemptionRate ? Number(row.exemptionRate) : undefined,
        contactName: row.contactName || undefined,
        contactPhoneRest: row.contactPhoneRest || undefined,
        contactEmailLocal: row.contactEmailLocal || undefined,
        docsUrl: row.docsUrl || undefined,
        docsPassword: row.docsPassword || undefined,
      };
    }).filter(p => p.siteName);
    
    console.log("Parsed presets:", presets);
    
    return NextResponse.json({ presets });
  } catch (error) {
    console.error("Failed to read site presets:", error);
    return NextResponse.json({ presets: [] });
  }
}