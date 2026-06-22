import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShoppingCart, { type CartItem } from "@/components/ShoppingCart";
import { useCart, useUpdateCartItem, useRemoveCartItem } from "@/lib/products";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { HelpCircle, Mail, Phone, MapPin, MessageSquare, Send } from "lucide-react";

export default function Help() {
  const { data: cartData } = useCart();
  const updateCartQuantityMutation = useUpdateCartItem();
  const removeCartItemMutation = useRemoveCartItem();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { toast } = useToast();

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) return;
    
    toast({
      title: "Message Sent!",
      description: "Thank you for contacting us! We've received your query and will reply within 24 hours."
    });
    setContactName("");
    setContactEmail("");
    setContactMessage("");
  };

  // Map API cart response to the frontend representation
  const cartItems: CartItem[] = (cartData?.items || []).map((item: any) => ({
    id: item.id,
    productId: item.productId,
    name: item.product.name,
    price: parseFloat(item.product.price),
    size: item.size,
    quantity: item.quantity,
    image: item.product.images[0] || '',
    ageGroup: item.product.ageGroup
  }));

  const faqs = [
    {
      q: "What is your shipping policy?",
      a: "We offer Free Shipping all across India on orders above ₹999. For orders under ₹999, a flat shipping fee of ₹99 is applied. Deliveries typically take between 3-7 business days depending on your location."
    },
    {
      q: "Can I pay using Cash on Delivery (COD)?",
      a: "Yes! We support Cash on Delivery (COD) for all orders without any extra surcharge. You can pay our delivery partner directly when you receive the package."
    },
    {
      q: "What is your return & exchange policy?",
      a: "We offer a hassle-free 7-day return and exchange policy. Items must be unused, unwashed, and in their original packaging with all tags attached. Please contact customer support to initiate a return request."
    },
    {
      q: "How do I choose the correct size?",
      a: "Please refer to our Size Guide page, which details sizing metrics by age, height range, and weight. If you're unsure, we always recommend ordering one size larger for kids wear."
    },
    {
      q: "How do I track my order?",
      a: "Navigate to the 'Track Order' page from the footer navigation. Input your Order ID and the Email address used during checkout to see the real-time shipping stage of your order."
    }
  ];

  return (
    <div className="min-h-screen bg-background" data-testid="page-help">
      <Header
        cartItemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
      />

      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h1 className="text-4xl font-bold font-poppins mb-4 flex items-center justify-center gap-2">
            <HelpCircle className="h-10 w-10 text-primary animate-pulse" />
            Help & FAQ
          </h1>
          <p className="text-muted-foreground font-open-sans">
            Need assistance? Have questions? Find all answers regarding shipping, ordering, and sizing below.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* FAQ Accordion & Contact Form */}
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold font-poppins mb-4">Frequently Asked Questions</h2>
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, idx) => (
                    <AccordionItem key={idx} value={`faq-${idx}`}>
                      <AccordionTrigger className="text-left font-semibold font-poppins hover:no-underline">
                        {faq.q}
                      </AccordionTrigger>
                      <AccordionContent className="font-open-sans text-muted-foreground leading-relaxed text-sm pt-2">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Us</CardTitle>
                <CardDescription>Have a specific question? Send us a message directly.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactName">Your Name *</Label>
                      <Input
                        id="contactName"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        required
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Email Address *</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        required
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactMessage">Message *</Label>
                    <Textarea
                      id="contactMessage"
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      required
                      placeholder="Type your question or support query here..."
                      rows={4}
                    />
                  </div>
                  <Button type="submit" className="flex items-center gap-2 bg-primary hover:bg-accent-coral text-white">
                    <Send className="h-4 w-4" />
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Details & WhatsApp Widget */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-6 font-poppins">
                <div>
                  <h3 className="text-lg font-bold mb-1">Still need help?</h3>
                  <p className="text-muted-foreground text-sm font-open-sans">
                    Reach out to our customer support team directly. We are happy to help!
                  </p>
                </div>
                
                <div className="space-y-4 text-sm font-open-sans">
                  <div className="flex gap-3 items-center">
                    <div className="bg-primary/10 p-2.5 rounded-full text-primary flex-shrink-0">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-xs text-muted-foreground uppercase">Email Us</p>
                      <a href="mailto:support@rajourikids.com" className="text-primary hover:underline font-semibold">
                        support@rajourikids.com
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-3 items-center">
                    <div className="bg-primary/10 p-2.5 rounded-full text-primary flex-shrink-0">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-xs text-muted-foreground uppercase">Call Us</p>
                      <a href="tel:+919876543210" className="text-primary hover:underline font-semibold">
                        +91 98765 43210
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
                    <div className="bg-primary/10 p-2.5 rounded-full text-primary mt-1 flex-shrink-0">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-xs text-muted-foreground uppercase">Corporate Office</p>
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        Mahajan Garments, Rajouri Garden Main Market, New Delhi, 110027
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* WhatsApp Widget Card */}
            <Card className="border-green-200 dark:border-green-900 bg-green-50/30 dark:bg-green-950/10">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white mx-auto shadow-md">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-base text-green-900 dark:text-green-300">WhatsApp Chat Support</h4>
                  <p className="text-xs text-muted-foreground font-open-sans">
                    Have any instant queries about sizing, fabric quality or delivery updates? Chat with us now!
                  </p>
                </div>
                <a 
                  href="https://wa.me/919876543210" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="block w-full"
                >
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold rounded-full gap-2">
                    <span className="material-symbols-outlined text-sm">chat</span>
                    Chat on WhatsApp
                  </Button>
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />

      <ShoppingCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={(itemId, quantity) => {
          updateCartQuantityMutation.mutate({ id: itemId, quantity });
        }}
        onRemoveItem={(itemId) => {
          removeCartItemMutation.mutate(itemId);
        }}
        onCheckout={() => setIsCartOpen(false)}
      />
    </div>
  );
}
