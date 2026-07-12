import { Download, Calendar, Filter, FileText, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinancialReport } from "@/features/analytics/components/FinancialReport";
import { UtilizationReport } from "@/features/analytics/components/UtilizationReport";
import { SafetyReport } from "@/features/analytics/components/SafetyReport";
import { PageHeader } from "@/components/ui/page-header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState("Last 6 Months");
  const [filters, setFilters] = useState({ active: true, maintenance: false });

  const handleExportCSV = () => {
    // Generate some mock CSV data
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Metric,Value\\n"
      + "Total Gross Revenue,₹330000\\n"
      + "Total Fuel Expenses,₹83500\\n"
      + "Total Maintenance,₹31000";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "transitops_financial_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="flex-1 space-y-6 max-w-[1920px] mx-auto pb-10">
      <PageHeader
        title="Reports & Analytics"
        description="Deep-dive insights into fleet performance, financials, and safety."
        actions={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="shadow-sm hidden sm:flex border-white/[0.06]">
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateRange}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Select Range</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setDateRange("Last 7 Days")}>Last 7 Days</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDateRange("Last 30 Days")}>Last 30 Days</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDateRange("Last 6 Months")}>Last 6 Months</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDateRange("Year to Date")}>Year to Date</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="shadow-sm border-white/[0.06]">
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Status Filters</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem 
                  checked={filters.active} 
                  onCheckedChange={(c) => setFilters(f => ({...f, active: c}))}
                >
                  Active Vehicles
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem 
                  checked={filters.maintenance}
                  onCheckedChange={(c) => setFilters(f => ({...f, maintenance: c}))}
                >
                  In Maintenance
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Download className="mr-2 h-4 w-4" />
                  Export Report
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleExportCSV}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF}>
                  <FileText className="mr-2 h-4 w-4" />
                  Print / Save PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      <div className="px-6 sm:px-8 print:px-0">
        <Tabs defaultValue="financial" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-[400px] mb-8 bg-card shadow-sm border border-white/[0.06] print:hidden">
            <TabsTrigger value="financial">Financials</TabsTrigger>
            <TabsTrigger value="utilization">Utilization</TabsTrigger>
            <TabsTrigger value="safety">Safety</TabsTrigger>
          </TabsList>
          
          <TabsContent value="financial" className="mt-0 print:block">
            <FinancialReport />
          </TabsContent>
          
          <TabsContent value="utilization" className="mt-0 print:hidden">
            <UtilizationReport />
          </TabsContent>
          
          <TabsContent value="safety" className="mt-0 print:hidden">
            <SafetyReport />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
