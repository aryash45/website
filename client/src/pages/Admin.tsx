import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, Key, Loader2, CheckSquare, Instagram, RefreshCw, Copy, Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export default function Admin() {
  const { toast } = useToast();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
        credentials: "include", method: "POST" });
    queryClient.clear();
    window.location.href = "/login";
  };

  return (
    <div className="container mx-auto py-8 font-poppins">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Rajouri Kids — Store Management</p>
        </div>
        <Button variant="outline" onClick={handleLogout}>Log Out</Button>
      </div>
      
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="settings">Site Settings</TabsTrigger>
          <TabsTrigger value="content">Content Blocks</TabsTrigger>
          <TabsTrigger value="instagram">Instagram Sync</TabsTrigger>
        </TabsList>
        
        <TabsContent value="products">
          <ProductsManager />
        </TabsContent>

        <TabsContent value="orders">
          <OrdersManager />
        </TabsContent>

        <TabsContent value="settings">
          <SiteSettingsManager />
        </TabsContent>
        
        <TabsContent value="content">
          <ContentBlocksManager />
        </TabsContent>
        
        <TabsContent value="instagram">
          <InstagramSyncManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// -------------------------------------------------------------
// SITE SETTINGS MANAGER
// -------------------------------------------------------------
function SiteSettingsManager() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    siteName: "Rajouri Kids",
    siteDescription: "Premium children's clothing store",
    contactEmail: "contact@rajourikids.com",
    primaryColor: "#FF6B6B"
  });

  const { data: settingsList, isLoading } = useQuery({
    queryKey: ["/api/admin/settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings", {
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to load settings");
      return res.json();
    }
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (payload: { key: string; value: any }) => {
      const res = await fetch(`/api/admin/settings/${payload.key}`, {
        credentials: "include",
        method: "PUT",
        headers: {
          "Content-Type": "application/json",},
        body: JSON.stringify({ value: payload.value })
      });
      if (!res.ok) throw new Error("Failed to save setting");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({ title: "Site Settings Saved" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    Object.entries(formData).forEach(([key, value]) => {
      saveSettingsMutation.mutate({ key, value });
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Site Settings</CardTitle>
        <CardDescription>Global variables used across the marketplace</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center animate-pulse">Loading variables...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  value={formData.siteName}
                  onChange={(e) => setFormData((p) => ({ ...p, siteName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData((p) => ({ ...p, contactEmail: e.target.value }))}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea
                  id="siteDescription"
                  value={formData.siteDescription}
                  onChange={(e) => setFormData((p) => ({ ...p, siteDescription: e.target.value }))}
                  rows={2}
                />
              </div>
            </div>
            <Button type="submit" className="mt-4" disabled={saveSettingsMutation.isPending}>
              {saveSettingsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Configuration
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

// -------------------------------------------------------------
// CONTENT BLOCKS MANAGER
// -------------------------------------------------------------
function ContentBlocksManager() {
  const { toast } = useToast();
  const [selectedBlock, setSelectedBlock] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    title: "",
    subtitle: "",
    active: true
  });

  const { data: blocks = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/content"],
    queryFn: async () => {
      const res = await fetch("/api/admin/content", {
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to load content blocks");
      return res.json();
    }
  });

  const createOrUpdateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const method = selectedBlock ? "PUT" : "POST";
      const url = selectedBlock ? `/api/admin/content/${selectedBlock.id}` : "/api/admin/content";
      
      const contentPayload = {
        name: payload.name,
        location: payload.location,
        active: payload.active,
        content: { title: payload.title, subtitle: payload.subtitle }
      };

      const res = await fetch(url, {
        credentials: "include",
        method,
        headers: {
          "Content-Type": "application/json",},
        body: JSON.stringify(contentPayload)
      });
      if (!res.ok) throw new Error("Failed to save content block");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content"] });
      toast({ title: selectedBlock ? "Content Block Updated" : "Content Block Created" });
      setIsDialogOpen(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/content/${id}`, {
        credentials: "include",
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete block");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content"] });
      toast({ title: "Content Block Removed" });
    }
  });

  const handleEdit = (block: any) => {
    setSelectedBlock(block);
    setFormData({
      name: block.name,
      location: block.location,
      title: block.content?.title || "",
      subtitle: block.content?.subtitle || "",
      active: block.active
    });
    setIsDialogOpen(true);
  };

  const handleOpenAdd = () => {
    setSelectedBlock(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      location: "",
      title: "",
      subtitle: "",
      active: true
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <div>
          <CardTitle>Content Blocks</CardTitle>
          <CardDescription>Manage editable HTML landing elements</CardDescription>
        </div>
        <Button onClick={handleOpenAdd}>
          <Plus className="h-4 w-4 mr-2" /> Add Block
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center animate-pulse">Loading blocks...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Identifier</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Heading Title</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blocks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    No content blocks configured.
                  </TableCell>
                </TableRow>
              ) : (
                blocks.map((block) => (
                  <TableRow key={block.id}>
                    <TableCell className="font-semibold">{block.name}</TableCell>
                    <TableCell>{block.location}</TableCell>
                    <TableCell>{block.content?.title || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant={block.active ? "default" : "secondary"}>
                        {block.active ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(block)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate(block.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Editor Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="font-poppins sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedBlock ? "Edit Content Block" : "Add Content Block"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createOrUpdateMutation.mutate(formData); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">System Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Page Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
                placeholder="e.g. home-hero"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="blockTitle">Headline (Title)</Label>
              <Input
                id="blockTitle"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtitle">Paragraph (Subtitle)</Label>
              <Textarea
                id="subtitle"
                value={formData.subtitle}
                onChange={(e) => setFormData((p) => ({ ...p, subtitle: e.target.value }))}
              />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="blockActive"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData((p) => ({ ...p, active: checked }))}
              />
              <Label htmlFor="blockActive">Enable block visibility</Label>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={createOrUpdateMutation.isPending}>
                {createOrUpdateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedBlock ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// -------------------------------------------------------------
// PRODUCTS CRUD MANAGER
// -------------------------------------------------------------
function ProductsManager() {
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    category: "T-Shirts",
    ageGroup: "3-5 Years",
    sizes: "XS, S, M, L",
    images: "",
    inStock: true,
    isNew: false
  });

  const { data: products = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Failed to load products");
      return res.json();
    }
  });

  const createOrUpdateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const method = selectedProduct ? "PUT" : "POST";
      const url = selectedProduct ? `/api/products/${selectedProduct.id}` : "/api/products";
      
      const payloadBody = {
        name: payload.name,
        description: payload.description || "",
        price: payload.price,
        originalPrice: payload.originalPrice || null,
        category: payload.category,
        ageGroup: payload.ageGroup,
        sizes: payload.sizes.split(",").map((s: string) => s.trim()).filter(Boolean),
        images: payload.images ? payload.images.split(",").map((i: string) => i.trim()).filter(Boolean) : ["/logo.png"],
        inStock: payload.inStock,
        isNew: payload.isNew,
        discount: payload.originalPrice 
          ? Math.round(((parseFloat(payload.originalPrice) - parseFloat(payload.price)) / parseFloat(payload.originalPrice)) * 100)
          : null
      };

      const res = await fetch(url, {
        credentials: "include",
        method,
        headers: {
          "Content-Type": "application/json",},
        body: JSON.stringify(payloadBody)
      });
      if (!res.ok) throw new Error("Failed to save product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: selectedProduct ? "Product Updated" : "Product Created" });
      setIsDialogOpen(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/products/${id}`, {
        credentials: "include",
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete product");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product Deleted" });
    }
  });

  const handleEdit = (product: any) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      originalPrice: product.originalPrice ? product.originalPrice.toString() : "",
      category: product.category,
      ageGroup: product.ageGroup,
      sizes: product.sizes.join(", "),
      images: product.images.join(", "),
      inStock: product.inStock,
      isNew: product.isNew
    });
    setIsDialogOpen(true);
  };

  const handleOpenAdd = () => {
    setSelectedProduct(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      originalPrice: "",
      category: "T-Shirts",
      ageGroup: "3-5 Years",
      sizes: "XS, S, M, L",
      images: "",
      inStock: true,
      isNew: false
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <div>
          <CardTitle>Catalog Products</CardTitle>
          <CardDescription>Inventory control panel</CardDescription>
        </div>
        <Button onClick={handleOpenAdd}>
          <Plus className="h-4 w-4 mr-2" /> Add Product
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center animate-pulse">Loading products...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Preview</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    No products in store.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="w-10 h-10 bg-muted rounded overflow-hidden">
                        <img src={product.images?.[0] || "/logo.png"} alt="" className="w-full h-full object-cover" />
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>
                      <span className="font-semibold">₹{product.price}</span>
                      {product.originalPrice && (
                        <span className="text-xs text-muted-foreground line-through ml-1.5">₹{product.originalPrice}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.inStock ? "default" : "secondary"}>
                        {product.inStock ? "In Stock" : "Out of Stock"}
                      </Badge>
                      {product.isNew && <Badge className="bg-green-600 text-white ml-1.5">New</Badge>}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate(product.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Product Editor Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="font-poppins sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProduct ? "Edit Product" : "Add Product"}</DialogTitle>
            <DialogDescription>Input item details for the marketplace catalog</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createOrUpdateMutation.mutate(formData); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prodName">Product Title *</Label>
              <Input
                id="prodName"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="prodDesc">Description</Label>
              <Textarea
                id="prodDesc"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prodPrice">Price (₹) *</Label>
                <Input
                  id="prodPrice"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData((p) => ({ ...p, price: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prodOrigPrice">Original Price (₹)</Label>
                <Input
                  id="prodOrigPrice"
                  type="number"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData((p) => ({ ...p, originalPrice: e.target.value }))}
                  placeholder="Before sale discount"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prodCategory">Category Group *</Label>
                <select
                  id="prodCategory"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.category}
                  onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
                >
                  <option value="T-Shirts">T-Shirts</option>
                  <option value="Dresses">Dresses</option>
                  <option value="Shorts">Shorts</option>
                  <option value="Jumpsuits">Jumpsuits</option>
                  <option value="Skirts">Skirts</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prodAgeGroup">Age Group Range *</Label>
                <select
                  id="prodAgeGroup"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.ageGroup}
                  onChange={(e) => setFormData((p) => ({ ...p, ageGroup: e.target.value }))}
                >
                  <option value="0-2 Years">0-2 Years</option>
                  <option value="3-5 Years">3-5 Years</option>
                  <option value="6-8 Years">6-8 Years</option>
                  <option value="9-12 Years">9-12 Years</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prodSizes">Available Sizes (comma-separated) *</Label>
              <Input
                id="prodSizes"
                value={formData.sizes}
                onChange={(e) => setFormData((p) => ({ ...p, sizes: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prodImages">Image URLs (comma-separated)</Label>
              <Input
                id="prodImages"
                value={formData.images}
                onChange={(e) => setFormData((p) => ({ ...p, images: e.target.value }))}
                placeholder="e.g. attached_assets/generated_images/Kids_mint_dress_product_59394fee.png"
              />
            </div>

            <div className="flex gap-6 pt-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="prodInStock"
                  checked={formData.inStock}
                  onCheckedChange={(checked) => setFormData((p) => ({ ...p, inStock: checked }))}
                />
                <Label htmlFor="prodInStock">In Stock</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="prodIsNew"
                  checked={formData.isNew}
                  onCheckedChange={(checked) => setFormData((p) => ({ ...p, isNew: checked }))}
                />
                <Label htmlFor="prodIsNew">New Arrival</Label>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="submit" disabled={createOrUpdateMutation.isPending}>
                {createOrUpdateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedProduct ? "Update Catalog" : "Add to Catalog"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// -------------------------------------------------------------
// ORDERS MANAGER
// -------------------------------------------------------------
function OrdersManager() {
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: orders = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/orders"],
    queryFn: async () => {
      const res = await fetch("/api/admin/orders", {
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to load orders");
      return res.json();
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        credentials: "include",
        method: "PUT",
        headers: {
          "Content-Type": "application/json",},
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: "Order Status Updated", description: `Order is now ${data.status}` });
      if (selectedOrder && selectedOrder.id === data.id) {
        setSelectedOrder((prev: any) => ({ ...prev, status: data.status }));
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update order status", variant: "destructive" });
    }
  });

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setIsDialogOpen(true);
  };

  // Calculate order statistics
  const stats = {
    total: orders.length,
    revenue: orders.reduce((sum, o) => sum + parseFloat(o.total), 0).toFixed(2),
    pending: orders.filter(o => o.status === "pending").length,
    completed: orders.filter(o => o.status === "delivered").length
  };

  return (
    <div className="space-y-6">
      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">₹{stats.revenue}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase">Pending Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase">Delivered Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orders List</CardTitle>
          <CardDescription>Monitor and fulfill client orders</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center animate-pulse">Loading orders...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total Price</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      No orders placed yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => {
                    const paymentMethod = order.shippingAddress?.paymentMethod || "cod";
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs font-semibold">{order.id.slice(0, 8)}...</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-semibold text-sm">{order.customerName}</p>
                            <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold">₹{order.total}</TableCell>
                        <TableCell className="capitalize text-xs font-semibold">{paymentMethod}</TableCell>
                        <TableCell className="text-xs">
                          {new Date(order.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short"
                          })}
                        </TableCell>
                        <TableCell>
                          <select
                            value={order.status}
                            onChange={(e) => updateStatusMutation.mutate({ orderId: order.id, status: e.target.value })}
                            className="text-xs font-semibold border rounded px-2 py-1 capitalize bg-white dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                          </select>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => handleViewOrder(order)}>
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto font-poppins">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Order Details</DialogTitle>
                <DialogDescription>Reference: {selectedOrder.id}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-4 text-sm font-open-sans">
                {/* Status selector */}
                <div className="flex justify-between items-center bg-muted/30 p-3 rounded-lg border">
                  <span className="font-bold text-xs uppercase tracking-wider text-accent-navy">Fulfillment Status</span>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => updateStatusMutation.mutate({ orderId: selectedOrder.id, status: e.target.value })}
                    className="text-xs font-bold border rounded px-3 py-1.5 capitalize bg-white dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>

                {/* Customer Details */}
                <div className="space-y-2">
                  <h4 className="font-bold font-poppins text-accent-navy border-b pb-1 text-xs uppercase tracking-widest">Customer Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Name</p>
                      <p className="font-medium text-accent-navy">{selectedOrder.customerName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium text-accent-navy">{selectedOrder.customerEmail}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p className="font-medium text-accent-navy">{selectedOrder.customerPhone || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Payment Method</p>
                      <p className="font-medium text-accent-navy capitalize">{selectedOrder.shippingAddress?.paymentMethod || "cod"}</p>
                    </div>
                  </div>
                </div>

                {/* Shipping Details */}
                <div className="space-y-2">
                  <h4 className="font-bold font-poppins text-accent-navy border-b pb-1 text-xs uppercase tracking-widest">Shipping Address</h4>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p className="text-accent-navy font-semibold">{selectedOrder.customerName}</p>
                    <p>{selectedOrder.shippingAddress?.address}</p>
                    <p>{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.zipCode}</p>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  <h4 className="font-bold font-poppins text-accent-navy border-b pb-1 text-xs uppercase tracking-widest font-bold">Items</h4>
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex gap-3 items-center">
                        <div className="w-10 h-10 bg-muted rounded overflow-hidden flex-shrink-0">
                          <img src={item.productImage} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 text-xs">
                          <p className="font-semibold line-clamp-1">{item.productName}</p>
                          <p className="text-muted-foreground">Size {item.size} • Qty {item.quantity}</p>
                        </div>
                        <span className="text-xs font-bold text-accent-navy">₹{parseFloat(item.price) * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="border-t pt-4 space-y-1.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal:</span>
                    <span>₹{selectedOrder.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping:</span>
                    <span>{parseFloat(selectedOrder.shipping) === 0 ? "Free" : `₹${selectedOrder.shipping}`}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-accent-navy pt-1.5 border-t">
                    <span>Total Price:</span>
                    <span>₹{selectedOrder.total}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// -------------------------------------------------------------
// INSTAGRAM SYNC MANAGER
// -------------------------------------------------------------
function InstagramSyncManager() {
  const { toast } = useToast();
  const [urlInput, setUrlInput] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  // Dialog state for editing draft
  const [selectedDraft, setSelectedDraft] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [extraImageUrls, setExtraImageUrls] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    category: "T-Shirts",
    ageGroup: "3-5 Years",
    sizes: "XS, S, M, L",
    images: "",
    inStock: true,
    isNew: false
  });

  const webhookUrl = `${window.location.protocol}//${window.location.host}/api/sync/instagram/webhook`;

  // Fetch drafts
  const { data: drafts = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/products/drafts"],
    queryFn: async () => {
      const res = await fetch("/api/admin/products/drafts", {
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to load drafts");
      return res.json();
    }
  });

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async ({ url, extra_image_urls }: { url: string; extra_image_urls?: string }) => {
      const res = await fetch("/api/sync/instagram/import-url", {
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url, extra_image_urls: extra_image_urls || "" })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to import URL");
      }
      return res.json();
    },
    onMutate: () => {
      setIsImporting(true);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products/drafts"] });
      toast({ 
        title: "Import Successful", 
        description: `"${data.name}" has been fetched and classified as a draft!` 
      });
      setUrlInput("");
      setExtraImageUrls("");
      setIsImporting(false);
    },
    onError: (error: any) => {
      setIsImporting(false);
      toast({ 

        title: "Import Failed", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/products/${id}/publish`, {
        credentials: "include",
        method: "PUT"
      });
      if (!res.ok) throw new Error("Failed to publish product");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products/drafts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ 
        title: "Product Live", 
        description: `"${data.name}" is now live on the storefront!` 
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to publish product", variant: "destructive" });
    }
  });

  // Edit draft mutation
  const updateDraftMutation = useMutation({
    mutationFn: async (payload: any) => {
      const payloadBody = {
        name: payload.name,
        description: payload.description || "",
        price: payload.price,
        originalPrice: payload.originalPrice || null,
        category: payload.category,
        ageGroup: payload.ageGroup,
        sizes: payload.sizes.split(",").map((s: string) => s.trim()).filter(Boolean),
        images: payload.images ? payload.images.split(",").map((i: string) => i.trim()).filter(Boolean) : ["/logo.png"],
        inStock: payload.inStock,
        isNew: payload.isNew,
        discount: payload.originalPrice 
          ? Math.round(((parseFloat(payload.originalPrice) - parseFloat(payload.price)) / parseFloat(payload.originalPrice)) * 100)
          : null
      };

      const res = await fetch(`/api/products/${selectedDraft.id}`, {
        credentials: "include",
        method: "PUT",
        headers: {
          "Content-Type": "application/json",},
        body: JSON.stringify(payloadBody)
      });
      if (!res.ok) throw new Error("Failed to update draft");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products/drafts"] });
      toast({ title: "Draft Details Updated" });
      setIsEditDialogOpen(false);
    }
  });

  // Delete draft mutation
  const deleteDraftMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to delete draft");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products/drafts"] });
      toast({ title: "Draft Discarded" });
    }
  });

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    toast({ title: "Copied!", description: "Webhook URL copied to clipboard" });
  };

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    importMutation.mutate({ url: urlInput.trim(), extra_image_urls: extraImageUrls.trim() });
  };


  const handleOpenEdit = (draft: any) => {
    setSelectedDraft(draft);
    setFormData({
      name: draft.name,
      description: draft.description || "",
      price: draft.price.toString(),
      originalPrice: draft.originalPrice ? draft.originalPrice.toString() : "",
      category: draft.category,
      ageGroup: draft.ageGroup,
      sizes: draft.sizes.join(", "),
      images: draft.images.join(", "),
      inStock: draft.inStock,
      isNew: draft.isNew
    });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Sync Controls */}
        <div className="space-y-6">
          
          {/* Manual Import Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Instagram className="h-5 w-5 text-[#E1306C]" />
                Import via Post URL
              </CardTitle>
              <CardDescription>
                Paste a public Instagram post or reel link below. Gemini AI will analyze the photo and caption to automatically suggest name, price, sizes, and category.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleImport} className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://www.instagram.com/p/..."
                    disabled={isImporting}
                    className="flex-1"
                  />
                  <Button type="submit" size="sm" disabled={isImporting || !urlInput.trim()}>
                    {isImporting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Classifying...
                      </>
                    ) : (
                      "Import"
                    )}
                  </Button>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Extra Carousel Image URLs <span className="font-normal">(for multi-image posts)</span>
                  </Label>
                  <Textarea
                    value={extraImageUrls}
                    onChange={(e) => setExtraImageUrls(e.target.value)}
                    placeholder={"Paste each slide's image URL on a new line or comma-separated:\nhttps://cdninstagram.com/slide2.jpg\nhttps://cdninstagram.com/slide3.jpg"}
                    disabled={isImporting}
                    rows={3}
                    className="text-xs font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Right-click each Instagram carousel slide → "Open image in new tab" and paste those URLs here. All images will be saved with this product.
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>


          {/* Webhook Configuration Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-primary" />
                Automated Instagram Sync
              </CardTitle>
              <CardDescription>
                Every 3 days (or whenever you post), automatically import products without manual clicks. Use a free automation tool like **Make.com** or **Zapier** to forward new posts to this webhook.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Your Store Webhook Endpoint</Label>
                <div className="flex gap-2">
                  <Input readOnly value={webhookUrl} className="bg-muted font-mono text-xs" />
                  <Button variant="outline" size="icon" onClick={handleCopyWebhook}>
                    {isCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-2 pt-2 border-t">
                <p className="font-semibold text-accent-navy text-[13px]">How to set up automatic sync in Make.com:</p>
                <ol className="list-decimal pl-4 space-y-1.5">
                  <li>Create a free account on <strong>Make.com</strong> and start a new scenario.</li>
                  <li>Add the first module: <strong>Instagram Business</strong> &rarr; <strong>Watch Media</strong> (connect your account).</li>
                  <li>If you post carousels, add a <strong>Get Media Children</strong> module to list all sub-media items.</li>
                  <li>Add an <strong>HTTP</strong> &rarr; <strong>Make a request</strong> module.</li>
                  <li>Set Method to <strong>POST</strong> and paste the webhook URL from above.</li>
                  <li>Set Body Type to <strong>Raw / JSON</strong> and map the following JSON object:
                    <pre className="bg-muted p-2 rounded mt-1 font-mono text-[10px] overflow-x-auto select-all block">
{`{
  "media_url": "{{media_url_value}}",
  "media_urls": ["{{media_url_value}}", "{{children_media_urls_array}}"],
  "caption": "{{caption_value}}",
  "id": "{{id_value}}"
}`}
                    </pre>
                    <span className="text-[11px] text-muted-foreground mt-1 block">
                      Note: You can pass a JSON array or a comma-separated list of child image URLs to <code>media_urls</code> to sync all carousel images.
                    </span>
                  </li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Pending Imports Review */}
        <div>
          <Card className="h-full">
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle>Pending AI Approvals</CardTitle>
                <CardDescription>Review and publish draft listings imported from Instagram</CardDescription>
              </div>
              <Badge variant="secondary" className="font-bold">{drafts.length} Drafts</Badge>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-12 text-center animate-pulse text-muted-foreground">Loading draft products...</div>
              ) : drafts.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed rounded-lg flex flex-col items-center justify-center space-y-2 bg-muted/10">
                  <Instagram className="h-10 w-10 text-muted-foreground/40" />
                  <p className="font-semibold text-muted-foreground">No pending drafts to approve</p>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Pasted posts or webhook updates will show up here as drafts first so you can verify prices and tags.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                  {drafts.map((draft) => (
                    <div key={draft.id} className="flex gap-4 p-3 border rounded-lg hover:bg-muted/15 transition-colors relative group">
                      <div className="w-20 h-24 bg-muted rounded-md overflow-hidden flex-shrink-0 border">
                        <img src={draft.images?.[0] || "/logo.png"} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 space-y-1.5 text-sm">
                        <div className="flex justify-between items-start gap-2">
                          <p className="font-bold text-accent-navy line-clamp-1">{draft.name}</p>
                          <span className="font-extrabold text-primary">₹{draft.price}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{draft.description || "No description provided."}</p>
                        
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <Badge variant="outline" className="text-[10px] py-0">{draft.category}</Badge>
                          <Badge variant="outline" className="text-[10px] py-0 bg-primary/5 text-primary border-primary/20">{draft.ageGroup}</Badge>
                          {draft.sizes?.slice(0, 3).map((sz: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-[9px] py-0 px-1">{sz}</Badge>
                          ))}
                          {draft.sizes?.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">+{draft.sizes.length - 3}</span>
                          )}
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t gap-2">
                          <span className="text-[10px] font-mono text-muted-foreground">Post: {draft.instagramPostId?.slice(0, 8)}...</span>
                          <div className="flex gap-1.5">
                            <Button size="sm" variant="ghost" className="text-destructive h-7 text-xs" onClick={() => deleteDraftMutation.mutate(draft.id)}>
                              Discard
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleOpenEdit(draft)}>
                              Edit
                            </Button>
                            <Button size="sm" className="h-7 text-xs" onClick={() => publishMutation.mutate(draft.id)}>
                              Publish
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Draft Editor Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="font-poppins sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Draft Product</DialogTitle>
            <DialogDescription>Review and modify the AI-generated classification before publishing live</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); updateDraftMutation.mutate(formData); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="draftName">Product Title *</Label>
              <Input
                id="draftName"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="draftDesc">Description</Label>
              <Textarea
                id="draftDesc"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="draftPrice">Price (₹) *</Label>
                <Input
                  id="draftPrice"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData((p) => ({ ...p, price: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="draftOrigPrice">Original Price (₹)</Label>
                <Input
                  id="draftOrigPrice"
                  type="number"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData((p) => ({ ...p, originalPrice: e.target.value }))}
                  placeholder="Before sale discount"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="draftCategory">Category Group *</Label>
                <select
                  id="draftCategory"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.category}
                  onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
                >
                  <option value="T-Shirts">T-Shirts</option>
                  <option value="Dresses">Dresses</option>
                  <option value="Shorts">Shorts</option>
                  <option value="Jumpsuits">Jumpsuits</option>
                  <option value="Skirts">Skirts</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="draftAgeGroup">Age Group Range *</Label>
                <select
                  id="draftAgeGroup"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.ageGroup}
                  onChange={(e) => setFormData((p) => ({ ...p, ageGroup: e.target.value }))}
                >
                  <option value="0-2 Years">0-2 Years</option>
                  <option value="3-5 Years">3-5 Years</option>
                  <option value="6-8 Years">6-8 Years</option>
                  <option value="9-12 Years">9-12 Years</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="draftSizes">Available Sizes (comma-separated) *</Label>
              <Input
                id="draftSizes"
                value={formData.sizes}
                onChange={(e) => setFormData((p) => ({ ...p, sizes: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="draftImages">Image URLs (comma-separated)</Label>
              <Input
                id="draftImages"
                value={formData.images}
                onChange={(e) => setFormData((p) => ({ ...p, images: e.target.value }))}
              />
            </div>

            <div className="flex gap-6 pt-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="draftInStock"
                  checked={formData.inStock}
                  onCheckedChange={(checked) => setFormData((p) => ({ ...p, inStock: checked }))}
                />
                <Label htmlFor="draftInStock">In Stock</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="draftIsNew"
                  checked={formData.isNew}
                  onCheckedChange={(checked) => setFormData((p) => ({ ...p, isNew: checked }))}
                />
                <Label htmlFor="draftIsNew">New Arrival</Label>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="submit" disabled={updateDraftMutation.isPending}>
                {updateDraftMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Draft
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}