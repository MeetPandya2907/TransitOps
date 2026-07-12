import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { FileText, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useSupabaseQuery } from "@/lib/useSupabaseQuery";
import { useSupabaseInsert, useSupabaseDelete } from "@/lib/useSupabaseMutation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface Document {
  id: string;
  title: string;
  type: string;
  expiryDate: string;
}

const mockDocuments: Document[] = [
  { id: 'DOC-001', title: 'Vehicle Insurance V-1001', type: 'Insurance', expiryDate: '2024-12-31' }
];

export default function DocumentsPage() {
  const { data: documentsData, isLoading } = useSupabaseQuery<Document>('documents', mockDocuments);
  const insertMutation = useSupabaseInsert<Document>('documents');
  const deleteMutation = useSupabaseDelete<Document>('documents');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDocument, setNewDocument] = useState({ title: '', type: '', expiryDate: '' });

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocument.title || !newDocument.type) return;

    await insertMutation.mutateAsync({
      title: newDocument.title,
      type: newDocument.type,
      expiryDate: newDocument.expiryDate,
    } as any);

    setIsAddModalOpen(false);
    setNewDocument({ title: '', type: '', expiryDate: '' });
  };

  const documents = documentsData || [];

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto pb-10">
      <PageHeader 
        title="Documents" 
        description="Manage vehicle and driver documentation."
        actions={
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Document</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddDocument}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Document Title</Label>
                    <Input 
                      id="title" 
                      value={newDocument.title}
                      onChange={e => setNewDocument(p => ({ ...p, title: e.target.value }))}
                      placeholder="e.g. V-1002 Registration" 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="type">Document Type</Label>
                    <Input 
                      id="type" 
                      value={newDocument.type}
                      onChange={e => setNewDocument(p => ({ ...p, type: e.target.value }))}
                      placeholder="e.g. Insurance, Registration" 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input 
                      id="expiry" 
                      type="date"
                      value={newDocument.expiryDate}
                      onChange={e => setNewDocument(p => ({ ...p, expiryDate: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={insertMutation.isPending}>
                    {insertMutation.isPending ? 'Saving...' : 'Add'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="p-6 sm:p-8 pt-0">
        {isLoading ? (
          <div className="h-32 border border-white/[0.06] rounded-xl bg-card/30 animate-pulse flex items-center justify-center">
            <span className="text-muted-foreground">Loading documents...</span>
          </div>
        ) : documents.length === 0 ? (
          <EmptyState 
            icon={FileText}
            title="No documents uploaded"
            description="Keep your fleet compliant by uploading registration, insurance, and licensing documents."
            actionLabel="Upload Document"
            onAction={() => setIsAddModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map(doc => (
              <Card key={doc.id} className="bg-card hover:shadow-md transition-shadow group">
                <CardContent className="p-5 flex justify-between items-center">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-lg">{doc.title}</span>
                    <div className="text-sm text-muted-foreground">
                      {doc.type} • {doc.expiryDate ? `Expires ${doc.expiryDate}` : 'No expiry'}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="opacity-0 group-hover:opacity-100 text-destructive transition-opacity"
                    onClick={() => {
                      if(confirm('Delete this document?')) deleteMutation.mutate(doc.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
