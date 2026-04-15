"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Save,
  Loader2,
  CheckCircle2,
  Eye,
  Trash2,
  Edit,
  Calendar,
  FileText,
  Scale,
  Clock,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queries/query-keys";
import { api, API_ENDPOINTS } from "@/lib/api";
import { TiptapEditor } from "@/components/editor/TiptapEditor";
import { StatCard } from "@/components/admin/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface TermsCondition {
  id: number;
  version: string;
  content: string;
  effectiveDate: string;
  isActive: boolean;
  createdAt: string;
}

// Helper function to calculate next version
const getNextVersion = (versions: string[]): string => {
  if (versions.length === 0) return "1.0";

  // Parse versions and find the highest
  const parsedVersions = versions
    .map((v) => {
      const parts = v.split(".").map(Number);
      return { major: parts[0] || 0, minor: parts[1] || 0, original: v };
    })
    .sort((a, b) => {
      if (a.major !== b.major) return b.major - a.major;
      return b.minor - a.minor;
    });

  const latest = parsedVersions[0];
  const newMajor = latest.major;
  const newMinor = latest.minor + 1;

  // If minor exceeds 9, increment major and reset minor
  if (newMinor > 9) {
    return `${latest.major + 1}.0`;
  }

  return `${newMajor}.${newMinor}`;
};

export default function AdminTermsPage() {
  const queryClient = useQueryClient();

  const { data: termsData, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.ADMIN_TERMS_CONDITIONS],
    queryFn: async () => {
      const response = await api.get<{ terms: TermsCondition[] }>(
        API_ENDPOINTS.ADMIN_TERMS_VERSIONS
      );
      return response.terms || [];
    },
  });

  const terms = termsData || [];

  const [editingTerms, setEditingTerms] = useState<TermsCondition | null>(null);
  const [newVersion, setNewVersion] = useState("");
  const [newContent, setNewContent] = useState("");
  const [previewTerms, setPreviewTerms] = useState<TermsCondition | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [termsToDelete, setTermsToDelete] = useState<TermsCondition | null>(null);
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [termsToActivate, setTermsToActivate] = useState<TermsCondition | null>(null);

  // Auto-calculate next version when creating new
  useEffect(() => {
    if (!editingTerms && terms.length > 0) {
      const versions = terms.map((t) => t.version);
      setNewVersion(getNextVersion(versions));
    } else if (!editingTerms && terms.length === 0) {
      setNewVersion("1.0");
    }
  }, [terms, editingTerms]);

  const createMutation = useMutation({
    mutationFn: async (payload: { version: string; content: string }) => {
      await api.post(API_ENDPOINTS.ADMIN_TERMS_VERSIONS, payload);
    },
    onSuccess: () => {
      toast.success("Terms version created successfully");
      setNewVersion("");
      setNewContent("");
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_TERMS_CONDITIONS] });
    },
    onError: (error: any) => {
      console.error("Error creating terms:", error);
      toast.error(error.response?.data?.message || "Failed to create terms");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: number; content: string }) => {
      await api.put(API_ENDPOINTS.ADMIN_TERMS_UPDATE(payload.id), {
        content: payload.content,
      });
    },
    onSuccess: () => {
      toast.success("Terms updated successfully");
      setEditingTerms(null);
      setNewContent("");
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_TERMS_CONDITIONS] });
    },
    onError: (error: any) => {
      console.error("Error updating terms:", error);
      toast.error(error.response?.data?.message || "Failed to update terms");
    },
  });

  const activateMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.post(API_ENDPOINTS.ADMIN_TERMS_ACTIVATE(id), {});
    },
    onSuccess: () => {
      toast.success("Terms activated and notifications sent to all users");
      setActivateDialogOpen(false);
      setTermsToActivate(null);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_TERMS_CONDITIONS] });
    },
    onError: (error: any) => {
      console.error("Error activating terms:", error);
      toast.error(error.response?.data?.message || "Failed to activate terms");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(API_ENDPOINTS.ADMIN_TERMS_DELETE(id));
    },
    onSuccess: () => {
      toast.success("Terms deleted successfully");
      setDeleteDialogOpen(false);
      setTermsToDelete(null);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_TERMS_CONDITIONS] });
    },
    onError: (error: any) => {
      console.error("Error deleting terms:", error);
      toast.error(error.response?.data?.message || "Failed to delete terms");
    },
  });

  const handleCreate = () => {
    if (!newContent) {
      toast.error("Content is required");
      return;
    }
    createMutation.mutate({ version: newVersion, content: newContent });
  };

  const handleUpdate = () => {
    if (!editingTerms) return;
    updateMutation.mutate({ id: editingTerms.id, content: newContent });
  };

  const handleActivate = () => {
    if (!termsToActivate) return;
    activateMutation.mutate(termsToActivate.id);
  };

  const handleDelete = () => {
    if (!termsToDelete) return;
    deleteMutation.mutate(termsToDelete.id);
  };

  const isSaving =
    createMutation.isPending ||
    updateMutation.isPending ||
    activateMutation.isPending ||
    deleteMutation.isPending;

  const startEdit = (termsItem: TermsCondition) => {
    setEditingTerms(termsItem);
    setNewContent(termsItem.content);
    setPreviewTerms(null);
  };

  const startCreate = () => {
    setEditingTerms(null);
    setNewContent("");
    // Version is auto-calculated by useEffect
  };

  const startPreview = (termsItem: TermsCondition) => {
    setPreviewTerms(termsItem);
    setIsPreviewOpen(true);
  };

  const confirmDelete = (termsItem: TermsCondition) => {
    setTermsToDelete(termsItem);
    setDeleteDialogOpen(true);
  };

  const confirmActivate = (termsItem: TermsCondition) => {
    setTermsToActivate(termsItem);
    setActivateDialogOpen(true);
  };

  const activeTerms = terms.find((t) => t.isActive);
  const nextVersion = editingTerms ? null : getNextVersion(terms.map((t) => t.version));

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-32 bg-muted rounded-xl"></div>
          <div className="h-32 bg-muted rounded-xl"></div>
        </div>
        <div className="h-[400px] bg-muted rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Terms & Conditions Management
          </h1>
          <p className="text-muted-foreground">
            Create and manage terms & conditions versions
          </p>
        </div>
        <Button onClick={startCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          New Version
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard
          title="Total Versions"
          value={terms.length}
          icon={FileText}
          variant="purple"
        />
        <StatCard
          title="Active Version"
          value={activeTerms?.version || "None"}
          icon={Scale}
          variant="emerald"
        />
      </div>

      {/* Active Terms Preview Card */}
      {activeTerms && (
        <Card className="border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Currently Active: Version {activeTerms.version}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Calendar className="h-3 w-3" />
                  Effective: {new Date(activeTerms.effectiveDate).toLocaleDateString()}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => startPreview(activeTerms)}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                Preview
              </Button>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Editor Section */}
      <Card>
        <CardHeader>
          <CardTitle>
            {editingTerms ? `Editing Version ${editingTerms.version}` : "Create New Version"}
          </CardTitle>
          <CardDescription>
            {editingTerms
              ? "Modify the content of this terms & conditions version"
              : "Create a new terms & conditions version with rich text formatting"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Content</Label>
            <TiptapEditor
              content={newContent}
              onChange={setNewContent}
              placeholder="Start writing your terms & conditions content..."
              className="min-h-[400px]"
            />
          </div>

          <div className="flex items-center gap-2">
            {editingTerms ? (
              <>
                <Button
                  onClick={handleUpdate}
                  disabled={isSaving || !newContent}
                  className="gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={startCreate}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                onClick={handleCreate}
                disabled={isSaving || !newContent}
                className="gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create Version
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* All Versions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Versions</CardTitle>
          <CardDescription>
            View and manage all terms & conditions versions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {terms.length === 0 ? (
            <div className="text-center py-8">
              <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No terms versions found. Create your first version above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Version</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Effective Date</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {terms.map((termsItem) => (
                    <TableRow key={termsItem.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {termsItem.version}
                          {termsItem.isActive && (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Active
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {termsItem.isActive ? (
                          <Badge variant="outline" className="gap-1 border-emerald-200 text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {new Date(termsItem.effectiveDate).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(termsItem.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startPreview(termsItem)}
                            title="Preview"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startEdit(termsItem)}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {!termsItem.isActive && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => confirmActivate(termsItem)}
                              title="Activate"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                          {!termsItem.isActive && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => confirmDelete(termsItem)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview: Version {previewTerms?.version}
            </DialogTitle>
            <DialogDescription>
              Effective: {previewTerms && new Date(previewTerms.effectiveDate).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          <div
            className="prose prose-sm sm:prose-base dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: previewTerms?.content || "" }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Terms Version</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete version {termsToDelete?.version}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setTermsToDelete(null);
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activate Confirmation Dialog */}
      <Dialog open={activateDialogOpen} onOpenChange={setActivateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activate Terms Version</DialogTitle>
            <DialogDescription>
              Are you sure you want to activate version {termsToActivate?.version}? This will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Deactivate the currently active version</li>
                <li>Send notifications to ALL users</li>
                <li>Make this version visible to all users</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActivateDialogOpen(false);
                setTermsToActivate(null);
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleActivate}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Activating...
                </>
              ) : (
                "Activate & Notify Users"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
