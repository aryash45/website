import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WishlistProvider } from "@/hooks/useWishlist";
import Home from "@/pages/Home";
import CategoryPage from "@/pages/CategoryPage";
import NewArrivals from "@/pages/NewArrivals";
import Sale from "@/pages/Sale";
import Collections from "@/pages/Collections";
import CollectionDetail from "@/pages/CollectionDetail";
import SizeGuide from "@/pages/SizeGuide";
import Help from "@/pages/Help";
import Stores from "@/pages/Stores";
import TrackOrder from "@/pages/TrackOrder";
import Login from "@/pages/Login";
import Profile from "@/pages/Profile";
import Admin from "@/pages/Admin";
import ProductDetail from "@/pages/ProductDetail";
import NotFound from "@/pages/not-found";
import ProtectedAdminRoute from "@/components/ProtectedAdminRoute";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/category/:category" component={CategoryPage} />
      <Route path="/new" component={NewArrivals} />
      <Route path="/sale" component={Sale} />
      <Route path="/collections" component={Collections} />
      <Route path="/collections/:slug" component={CollectionDetail} />
      <Route path="/size-guide" component={SizeGuide} />
      <Route path="/help" component={Help} />
      <Route path="/stores" component={Stores} />
      <Route path="/track-order" component={TrackOrder} />
      <Route path="/login" component={Login} />
      <Route path="/profile" component={Profile} />
      <Route path="/admin">
        {() => <ProtectedAdminRoute component={Admin} />}
      </Route>
      <Route path="/product/:id" component={ProductDetail} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WishlistProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </WishlistProvider>
    </QueryClientProvider>
  );
}

export default App;
