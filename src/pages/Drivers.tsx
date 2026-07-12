import { Plus, SlidersHorizontal, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DriverProfileCard } from "@/features/drivers/components/DriverProfileCard";
import { mockDrivers } from "@/lib/driverData";
import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useSupabaseQuery } from "@/lib/useSupabaseQuery";
import { useSupabaseInsert } from "@/lib/useSupabaseMutation";
import type { Driver } from "@/lib/types";

export default function DriversPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: drivers, isLoading } = useSupabaseQuery<Driver>('drivers', mockDrivers);
  const insertMutation = useSupabaseInsert<Driver>('drivers');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDriver, setNewDriver] = useState({ firstName: '', lastName: '', license: '', phone: '' });

  const filteredDrivers = (drivers || []).filter(driver => 
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    driver.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriver.firstName || !newDriver.lastName || !newDriver.license) return;

    await insertMutation.mutateAsync({
      name: `${newDriver.firstName} ${newDriver.lastName}`,
      status: 'Active',
      licenseClass: 'Class A',
      safetyScore: 100,
      hoursDriven: 0,
      phone: newDriver.phone,
    } as any);

    setIsAddModalOpen(false);
    setNewDriver({ firstName: '', lastName: '', license: '', phone: '' });
  };

  return (
    <div className="flex-1 space-y-6 pb-10">
      <PageHeader
        title="Driver Directory"
        description="Manage personnel, track safety scores, and monitor compliance."
        actions={
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                Add Driver
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Driver</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddDriver}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="first-name">First Name</Label>
                      <Input 
                        id="first-name" 
                        value={newDriver.firstName}
                        onChange={e => setNewDriver(p => ({ ...p, firstName: e.target.value }))}
                        placeholder="John" 
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="last-name">Last Name</Label>
                      <Input 
                        id="last-name" 
                        value={newDriver.lastName}
                        onChange={e => setNewDriver(p => ({ ...p, lastName: e.target.value }))}
                        placeholder="Doe" 
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="license">License Number</Label>
                    <Input 
                      id="license" 
                      value={newDriver.license}
                      onChange={e => setNewDriver(p => ({ ...p, license: e.target.value }))}
                      placeholder="DL-123456789" 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      value={newDriver.phone}
                      onChange={e => setNewDriver(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+1 (555) 000-0000" 
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={insertMutation.isPending}>
                    {insertMutation.isPending ? 'Saving...' : 'Save Driver'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="px-6 sm:px-8">
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search drivers by name or ID..." 
              className="pl-9 bg-card shadow-sm h-10 border-white/[0.06]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="w-full sm:w-auto bg-card shadow-sm h-10 border-white/[0.06]">
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-64 rounded-xl bg-card/30 border border-white/[0.06] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {filteredDrivers.map(driver => (
              <DriverProfileCard key={driver.id} driver={driver} />
            ))}
            {filteredDrivers.length === 0 && (
              <div className="col-span-full">
                <EmptyState 
                  icon={User}
                  title="No drivers found"
                  description={`No drivers matching "${searchTerm}". Try a different search term.`}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
