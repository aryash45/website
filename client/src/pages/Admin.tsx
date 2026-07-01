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
import { Plus, Edit2, Trash2, Key, Loader2, CheckSquare } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import ImageUploader from "@/components/ImageUploader";

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
    images: [] as string[],
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
        images: payload.images && payload.images.length > 0 ? payload.images : ["/logo.png"],
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
      images: product.images || [],
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
      images: [],
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
              <Label>Product Images</Label>
              <ImageUploader
                images={formData.images}
                onChange={(images) => setFormData((p) => ({ ...p, images }))}
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