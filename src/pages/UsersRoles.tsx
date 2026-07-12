import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSupabaseQuery } from "@/lib/useSupabaseQuery";
import { useSupabaseInsert, useSupabaseDelete } from "@/lib/useSupabaseMutation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

const initialUsers = [
  { id: '1', name: 'Admin User', email: 'admin@transitops.com', role: 'Super Admin', status: 'Active' },
  { id: '2', name: 'John Dispatch', email: 'john@transitops.com', role: 'Dispatcher', status: 'Active' },
  { id: '3', name: 'Sarah Fleet', email: 'sarah@transitops.com', role: 'Fleet Manager', status: 'Active' },
];

export default function UsersRolesPage() {
  const { data: usersData, isLoading } = useSupabaseQuery<User>('users', initialUsers as User[]);
  const insertMutation = useSupabaseInsert<User>('users');
  const deleteMutation = useSupabaseDelete<User>('users');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Dispatcher' });

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;

    await insertMutation.mutateAsync({
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: 'Active',
    } as any);

    setIsAddModalOpen(false);
    setNewUser({ name: '', email: '', role: 'Dispatcher' });
  };

  const users = usersData || [];

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Users & Roles</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage system access and permissions</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Invite New User</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddUser}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      value={newUser.name}
                      onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Jane Doe" 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email"
                      value={newUser.email}
                      onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))}
                      placeholder="e.g. jane@transitops.com" 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="role">Role</Label>
                    <Input 
                      id="role" 
                      value={newUser.role}
                      onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))}
                      placeholder="e.g. Dispatcher, Fleet Manager" 
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={insertMutation.isPending}>
                    {insertMutation.isPending ? 'Sending...' : 'Invite User'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-white/[0.06] bg-card/50 glass">
        <CardHeader>
          <CardTitle className="text-lg">System Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-white/[0.06] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.02]">
                <tr className="border-b border-white/[0.06]">
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">User</th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Role</th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Status</th>
                  <th className="h-10 px-4 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={4} className="h-24 text-center text-muted-foreground animate-pulse">Loading users...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={4} className="h-24 text-center text-muted-foreground">No users found.</td></tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.02] transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center font-bold">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-primary" />
                          <span>{user.role}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500">
                          {user.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            if(confirm('Remove this user?')) deleteMutation.mutate(user.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
