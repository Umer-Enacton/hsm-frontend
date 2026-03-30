"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search,
  Wrench,
  Shield,
  Clock,
  Star,
  ArrowRight,
  CheckCircle,
  MapPin,
  IndianRupee,
  Calendar,
  HeadphonesIcon,
  Zap,
  Sparkles,
  Menu,
  CreditCard,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { api, API_ENDPOINTS } from "@/lib/api";
import { cn } from "@/lib/utils";

// Types
interface Category {
  id: number;
  name: string;
  description: string;
  image: string | null;
}

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  rating: number;
  totalReviews: number;
  estimateDuration: number;
  provider: {
    id: number;
    businessName: string;
    city: string;
    isVerified: boolean;
    rating: number;
    totalReviews: number;
  };
}

const CATEGORY_IMAGES: Record<string, string> = {
  Electrical: "/landing/cat_electrical.png",
  Plumbing: "/landing/cat_plumbing.png",
  Cleaning: "/landing/cat_cleaning.png",
  "AC Repair": "/landing/cat_ac_repair.png",
  Painting: "/landing/cat_painting.png",
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Electrical: Zap,
  Plumbing: Wrench,
  Cleaning: Sparkles,
  "AC Repair": Clock,
  Painting: Sparkles,
  General: Star,
};

export default function LandingPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredServices, setFeaturedServices] = useState<Service[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);

  // Scroll handler for glassmorphism effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get<{ categories: Category[] }>(
          API_ENDPOINTS.CATEGORIES,
        );
        setCategories(response.categories?.slice(0, 8) || []);
      } catch (error) {
        console.error("Error loading categories:", error);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // Fetch featured services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await api.get<{ services: Service[] }>(
          `${API_ENDPOINTS.SERVICES}?limit=6`,
        );
        setFeaturedServices(response.services?.slice(0, 6) || []);
      } catch (error) {
        console.error("Error loading services:", error);
      } finally {
        setIsLoadingServices(false);
      }
    };
    fetchServices();
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(
        `/customer/services?search=${encodeURIComponent(searchQuery)}`,
      );
    }
  };

  return (
    <div className="min-h-screen bg-background selection:bg-primary/10">
      {/* Navigation - Shadcn Components */}
      <header
        className={cn(
          "fixed top-0 z-100 w-full transition-all duration-300 px-4 md:px-6",
          isScrolled
            ? "py-3 bg-background/80 backdrop-blur-xl border-b border-border/50"
            : "py-6 bg-transparent",
        )}
      >
        <div className="container mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 group transition-transform active:scale-95"
          >
            <div className="relative h-10 w-10 flex items-center justify-center rounded-md bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all group-hover:shadow-primary/40 group-hover:-translate-y-0.5">
              <Image
                src="/homefixcareicon-removebg-preview-removebg-preview.png"
                alt="HomeFixCare"
                width={32}
                height={32}
                className="h-8 w-8 brightness-0 invert"
              />
            </div>
            <span className="text-xl font-black tracking-tight hidden sm:block">
              HomeFixCare
            </span>
          </Link>

          {/* Desktop Navigation Menu */}
          <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList className="gap-2">
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={navigationMenuTriggerStyle()}
                >
                  <Link href="#services">Services</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={navigationMenuTriggerStyle()}
                >
                  <Link href="#how-it-works">How it Works</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={navigationMenuTriggerStyle()}
                >
                  <Link href="#benefits">Benefits</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={navigationMenuTriggerStyle()}
                >
                  <Link href="/register?role=provider">Become a Pro</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-md px-5 font-bold hover:bg-muted"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="sm"
                className="rounded-md px-6 font-bold shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 active:scale-95"
              >
                Join Now
              </Button>
            </Link>

            {/* Mobile Menu Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden rounded-md"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="flex flex-col">
                <SheetHeader className="mb-8 border-b pb-4">
                  <SheetTitle className="flex items-center gap-2">
                    <div className="h-8 w-8 flex items-center justify-center rounded-md bg-primary text-primary-foreground">
                      <Image
                        src="/homefixcareicon-removebg-preview-removebg-preview.png"
                        alt="HomeFixCare"
                        width={24}
                        height={24}
                        className="h-6 w-6 brightness-0 invert"
                      />
                    </div>
                    <span className="text-xl font-black">HomeFixCare</span>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4">
                  {["Services", "How it Works", "Benefits", "Become a Pro"].map(
                    (item) => (
                      <Link
                        key={item}
                        href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                        className="text-lg font-bold px-2 py-2 hover:bg-muted rounded-md transition-colors"
                      >
                        {item}
                      </Link>
                    ),
                  )}
                </div>
                <div className="mt-auto pt-8 border-t space-y-4">
                  <Link href="/login" className="block w-full">
                    <Button
                      variant="outline"
                      className="w-full rounded-md font-bold"
                    >
                      Login
                    </Button>
                  </Link>
                  <Link href="/register" className="block w-full">
                    <Button className="w-full rounded-md font-bold">
                      Register
                    </Button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/landing/hero_bg.png"
            alt="Premium Home Interior"
            fill
            className="object-cover opacity-20 dark:opacity-10 scale-105"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-b from-background via-background/80 to-background" />
        </div>

        <div className="absolute top-1/4 left-1/4 h-64 w-64 bg-primary/5 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 bg-primary/5 rounded-full blur-[120px] animate-pulse delay-700" />

        <div className="container relative z-10 mx-auto px-4 text-center">
          <Badge
            variant="outline"
            className="px-4 py-1.5 rounded-md bg-primary/5 border-primary/10 mb-8 font-black tracking-widest uppercase animate-in fade-in slide-in-from-bottom-4 duration-700"
          >
            <Sparkles className="h-4 w-4 text-primary mr-2" />
            The Gold Standard of Home Services
          </Badge>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 max-w-5xl mx-auto leading-[0.95]">
            Redefining <br />
            <span className="text-primary italic">Expert</span> Home Care
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            Connect with elite, background-verified professionals tailored to
            your home&apos;s unique requirements. Punctual, precise, and
            premium.
          </p>

          {/* Search Bar - Integrated with Input and Button */}
          <div className="max-w-3xl mx-auto w-full group animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="relative flex items-center p-2 rounded-md bg-card border border-border/50 shadow-2xl shadow-primary/5 focus-within:border-primary/50 transition-all duration-300">
              <div className="grow relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type="text"
                  placeholder="What can we help you with today?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="h-14 pl-14 pr-4 bg-transparent border-none text-lg font-medium ring-0 focus-visible:ring-0 placeholder:text-muted-foreground/60 w-full"
                />
              </div>
              <Button
                onClick={handleSearch}
                className="h-14 px-8 rounded-md font-black text-base transition-all active:scale-95 flex gap-2"
              >
                Search
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <span className="text-sm font-semibold text-muted-foreground pt-1 pr-2">
                Trending:
              </span>
              {["Deep Cleaning", "AC Service", "Plumbing", "Home Painting"].map(
                (term) => (
                  <button
                    key={term}
                    onClick={() => {
                      setSearchQuery(term);
                      router.push(
                        `/customer/services?search=${encodeURIComponent(term)}`,
                      );
                    }}
                    className="px-4 py-1.5 rounded-md text-xs font-bold border border-border/50 bg-muted/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all active:scale-95"
                  >
                    {term}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section with Cards */}
      <section className="py-12 border-y bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {[
              { label: "Verified Specialists", value: "1,200+" },
              { label: "Elite Services Done", value: "25k+" },
              { label: "Client Satisfaction", value: "99.8%" },
              { label: "Response Time", value: "< 2 Hrs" },
            ].map((stat) => (
              <Card
                key={stat.label}
                className="border-none bg-transparent shadow-none text-center"
              >
                <CardContent className="p-0 group">
                  <p className="text-4xl font-black tracking-tight mb-1 group-hover:scale-105 transition-transform">
                    {stat.value}
                  </p>
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    {stat.label}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section - AspectRatio & Cards */}
      <section id="services" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="max-w-2xl">
              <Badge variant="secondary" className="px-4 py-1 rounded-md mb-4">
                <Wrench className="h-3 w-3 mr-2" />
                Specialized Verticals
              </Badge>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight">
                Crafted for Every Need
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                From intricate electrical work to meticulous deep cleaning, our
                specialists represent the pinnacle of their respective crafts.
              </p>
            </div>
            <Link href="/customer/services">
              <Button
                variant="outline"
                className="rounded-md px-8 font-black border-2"
              >
                View Full Catalog
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Cleaning",
                desc: "Home & office cleaning",
                image: "/landing/cat_cleaning.png",
                icon: Sparkles,
              },
              {
                name: "Electrical",
                desc: "Electrical services",
                image: "/landing/cat_electrical.png",
                icon: Zap,
              },
              {
                name: "Painting",
                desc: "Painting Services",
                image: "/landing/cat_painting.png",
                icon: Sparkles,
              },
              {
                name: "Carpentary",
                desc: "Carpentary services",
                image: "/landing/cat_carpentary.png",
                icon: Wrench,
              },
              {
                name: "Roofing",
                desc: "Roofing Services",
                image: "/landing/cat_roofing.png",
                icon: Shield,
              },
              {
                name: "Plumbing",
                desc: "Plumbing & water services",
                image: "/landing/cat_plumbing.png",
                icon: Wrench,
              },
            ].map((category, idx) => (
              <Link
                key={idx}
                href={`/customer/services?search=${category.name}`}
                className="group p-0"
              >
                <Card className="relative h-[360px] rounded-md overflow-hidden border border-border/50 transition-all hover:border-primary/50 bg-card p-0">
                  <AspectRatio ratio={1} className="h-full">
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-transparent transition-opacity group-hover:opacity-100" />
                    <div className="absolute inset-0 flex flex-col justify-end p-8 text-white">
                      <div className="h-12 w-12 rounded-md bg-white/10 backdrop-blur-md flex items-center justify-center mb-4 transition-transform group-hover:-translate-y-1">
                        <category.icon className="h-6 w-6" />
                      </div>
                      <p className="text-xs font-black uppercase tracking-widest text-white/60 mb-1">
                        {category.name}
                      </p>
                      <h3 className="text-3xl font-black mb-2 leading-none">
                        {category.name}
                      </h3>
                      <p className="text-sm text-white/70 font-medium opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 duration-500">
                        {category.desc}
                      </p>
                    </div>
                  </AspectRatio>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Services - Carousel */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              Top Customer Choices
            </h2>
            <p className="text-lg text-muted-foreground font-medium">
              These verified professionals have consistently exceeded our
              stringent quality benchmarks.
            </p>
          </div>

          <div className="max-w-6xl mx-auto px-12">
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent>
                {isLoadingServices
                  ? [...Array(4)].map((_, i) => (
                      <CarouselItem
                        key={i}
                        className="md:basis-1/2 lg:basis-1/2"
                      >
                        <Skeleton className="h-[240px] rounded-md" />
                      </CarouselItem>
                    ))
                  : featuredServices.map((service) => (
                      <CarouselItem
                        key={service.id}
                        className="md:basis-1/2 lg:basis-1/2"
                      >
                        <Card className="group border border-border/50 hover:border-primary/30 transition-all hover:shadow-xl hover:shadow-primary/5 rounded-md overflow-hidden h-full">
                          <CardContent className="p-0">
                            <div className="flex flex-col sm:flex-row gap-6 items-start p-8">
                              <div className="grow space-y-4">
                                <div className="flex items-center gap-3">
                                  {service.provider.isVerified && (
                                    <Badge className="bg-primary/10 text-primary border-none text-[10px] uppercase font-black tracking-widest px-3 py-1">
                                      Certified Elite
                                    </Badge>
                                  )}
                                  <div className="flex items-center gap-1.5 text-sm font-bold">
                                    <Star className="h-4 w-4 fill-primary text-primary" />
                                    <span>
                                      {Number(service.rating || 4.8).toFixed(1)}
                                    </span>
                                  </div>
                                </div>
                                <div>
                                  <h3 className="text-xl font-black mb-1 leading-tight group-hover:text-primary transition-colors">
                                    {service.name}
                                  </h3>
                                  <div className="flex items-center gap-2 text-muted-foreground font-semibold text-xs">
                                    <MapPin className="h-3.5 w-3.5" />
                                    <span>{service.provider.city}</span>
                                    <span className="opacity-30">•</span>
                                    <span>{service.provider.businessName}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="shrink-0 flex flex-col items-end justify-between min-h-[120px]">
                                <div className="text-right">
                                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">
                                    Price
                                  </p>
                                  <p className="text-3xl font-black flex items-center justify-end tracking-tighter">
                                    <IndianRupee className="h-5 w-5 stroke-3" />
                                    {service.price}
                                  </p>
                                </div>
                                <Button
                                  variant="secondary"
                                  onClick={() =>
                                    router.push(
                                      `/customer/services/${service.id}`,
                                    )
                                  }
                                  className="rounded-md px-6 h-10 font-black text-sm active:scale-95"
                                >
                                  Book Now
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </CarouselItem>
                    ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </div>
      </section>

      {/* How it Works - Cards */}
      <section
        id="how-it-works"
        className="py-24 bg-background overflow-hidden"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <Badge variant="secondary" className="mb-4 rounded-md">
              Digital Seamlessness
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
              A Frictionless Journey
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {[
              {
                step: "01",
                title: "Discovery",
                desc: "Intelligent matching with specialists based on your requirements.",
                icon: Search,
              },
              {
                step: "02",
                title: "Curated Slots",
                desc: "Choose a time that integrates perfectly with your busy schedule.",
                icon: Calendar,
              },
              {
                step: "03",
                title: "Excellence",
                desc: "Background-checked professional completes the task to perfection.",
                icon: CheckCircle,
              },
            ].map((step, i) => (
              <Card
                key={i}
                className="border-none shadow-none text-center bg-transparent group p-0"
              >
                <CardHeader className="p-0 pb-6 flex items-center justify-center">
                  <div className="relative h-[100px] w-[100px] transition-transform duration-500 group-hover:scale-110">
                    <div className="absolute inset-0 rounded-md bg-muted rotate-6 group-hover:rotate-12 transition-transform" />
                    <div className="absolute inset-0 rounded-md bg-primary flex items-center justify-center text-primary-foreground">
                      <step.icon className="h-10 w-10" />
                    </div>
                    <div className="absolute -top-2 -right-2 h-8 w-8 rounded-md bg-background border-2 border-primary flex items-center justify-center font-black text-[10px]">
                      {step.step}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 space-y-2">
                  <CardTitle className="text-2xl font-black">
                    {step.title}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground font-medium text-base">
                    {step.desc}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits - Why Us Cards */}
      <section
        id="benefits"
        className="py-24 bg-primary text-primary-foreground"
      >
        <div className="container mx-auto px-4">
          <h2 className="text-5xl font-black tracking-tight text-center mb-16">
            The HomeFixCare Distinction
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Rigorous Vetting",
                desc: "Only the top 15% of applicants pass our technical verification.",
                icon: Shield,
              },
              {
                title: "Escrow Protected",
                desc: "Your payment is held securely until you are fully satisfied.",
                icon: CreditCard,
              },
              {
                title: "Punctual Guarantee",
                desc: "We value your time. Late arrival warrants a task credit.",
                icon: Clock,
              },
              {
                title: "24/7 Concierge",
                desc: "Dedicated support team available for any coordination.",
                icon: HeadphonesIcon,
              },
            ].map((item, i) => (
              <Card
                key={i}
                className="bg-white/10 border-white/10 text-white group hover:bg-white/15 transition-colors rounded-md"
              >
                <div className="flex flex-col items-center text-center p-8 space-y-4">
                  <CardHeader className="p-0 flex flex-col items-center">
                    <div className="h-14 w-14 rounded-md bg-white/20 flex items-center justify-center mb-2 text-white">
                      <item.icon className="h-7 w-7" />
                    </div>
                    <CardTitle className="text-xl font-black">
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <p className="text-sm text-white/70 font-medium leading-relaxed">
                      {item.desc}
                    </p>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Become a Provider CTA */}
      <section id="become-a-pro" className="py-32 bg-background">
        <div className="container mx-auto px-4 text-center">
          <Card className="rounded-md bg-muted/30 border-none p-12 md:p-20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
              <Wrench className="h-64 w-64" />
            </div>
            <CardHeader className="p-0 mb-8 flex flex-col items-center">
              <CardTitle className="text-4xl md:text-6xl font-black tracking-tight mb-4">
                Propel Your Business
              </CardTitle>
              <CardDescription className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl">
                Join our elite network of specialists and reach high-value
                clients effortlessly.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register?role=provider">
                <Button
                  size="lg"
                  className="rounded-md px-10 h-16 font-black text-lg active:scale-95"
                >
                  Apply Now
                  <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-md px-10 h-16 font-black text-lg border-2"
                >
                  Log In
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/10 pt-24 pb-12 border-t">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <Link href="/" className="flex items-center gap-3">
                <div className="h-8 w-8 flex items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <Image
                    src="/homefixcareicon-removebg-preview-removebg-preview.png"
                    alt="HomeFixCare"
                    width={24}
                    height={24}
                    className="h-6 w-6 brightness-0 invert"
                  />
                </div>
                <span className="text-xl font-black">HomeFixCare</span>
              </Link>
              <p className="text-muted-foreground font-medium">
                Punctual. Precise. Premium. <br /> Elevating home care
                standards.
              </p>
            </div>
            {["Services", "Legal", "Corporate"].map((group) => (
              <div key={group}>
                <h4 className="font-black uppercase tracking-widest text-xs mb-6">
                  {group}
                </h4>
                <ul className="space-y-3">
                  {group === "Services" &&
                    [
                      "Deep Cleaning",
                      "Electrical",
                      "Plumbing",
                      "AC Repair",
                    ].map((item) => (
                      <li key={item}>
                        <button className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
                          {item}
                        </button>
                      </li>
                    ))}
                  {group === "Legal" &&
                    [
                      "Privacy Policy",
                      "Terms of Use",
                      "Vendor Policy",
                      "Cookie Policy",
                    ].map((item) => (
                      <li key={item}>
                        <button className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
                          {item}
                        </button>
                      </li>
                    ))}
                  {group === "Corporate" &&
                    ["About Us", "Our Mission", "Partnerships", "Careers"].map(
                      (item) => (
                        <li key={item}>
                          <button className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
                            {item}
                          </button>
                        </li>
                      ),
                    )}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-border/50 gap-6">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              © {new Date().getFullYear()} HomeFixCare Inc.
            </p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
            >
              Back to Top
              <ArrowRight className="h-4 w-4 -rotate-90" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
