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
  Users,
  ChevronRight,
  Quote,
  Play,
  Award,
  TrendingUp,
  ArrowUpRight,
  Sun,
  Moon,
  LogIn,
  PlusCircle,
  RefreshCw,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { api, API_ENDPOINTS } from "@/lib/api";
import { useFeaturedServices } from "@/lib/queries";
import type { CustomerService as Service } from "@/types/customer";
import { cn } from "@/lib/utils";

// Type is now imported from @/types/customer as 'Service'

export default function LandingPage() {
  const router = useRouter();
  const servicesQuery = useFeaturedServices();
  const featuredServices = servicesQuery.data || [];
  const isLoadingServices = servicesQuery.isLoading;

  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(
        `/customer/services?search=${encodeURIComponent(searchQuery)}`,
      );
    }
  };

  const categories = [
    {
      name: "Cleaning",
      desc: "Home & office deep cleaning",
      icon: Sparkles,
      color:
        "text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    },
    {
      name: "Electrical",
      desc: "Wiring, fixtures & repairs",
      icon: Zap,
      color:
        "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
    },
    {
      name: "Plumbing",
      desc: "Pipes, leaks & installations",
      icon: Wrench,
      color:
        "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    },
    {
      name: "Painting",
      desc: "Interior & exterior painting",
      icon: Sparkles,
      color:
        "text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400 border-purple-200 dark:border-purple-800",
    },
    {
      name: "Carpentry",
      desc: "Furniture & woodwork",
      icon: Wrench,
      color:
        "text-orange-600 bg-orange-50 dark:bg-orange-950/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
    },
    {
      name: "Roofing",
      desc: "Roof repair & waterproofing",
      icon: Shield,
      color:
        "text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-800",
    },
  ];

  const ThemeToggle = () => {
    const { theme, setTheme } = useTheme();
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="h-9 w-9"
      >
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ───── Navigation ───── */}
      <header
        className={cn(
          "fixed top-0 z-50 w-full transition-all duration-300",
          isScrolled
            ? "bg-background/95 backdrop-blur-md border-b shadow-sm"
            : "bg-transparent",
        )}
      >
        <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden">
              <Image
                src="/homefixcareicon-removebg-preview-removebg-preview.png"
                alt="HomeFixCare"
                width={36}
                height={36}
                className="h-9 w-9 object-cover"
              />
            </div>
            <span className="text-lg font-bold tracking-tight hidden sm:block">
              HomeFixCare
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {[
              { label: "Services", href: "#services" },
              { label: "How it Works", href: "#how-it-works" },
              { label: "Why Us", href: "#why-us" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ───── Mobile Drawer (System Standard) ───── */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm md:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[240px] bg-card border-r shadow-2xl transition-transform duration-300 ease-in-out md:hidden flex flex-col",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Sidebar Style Header */}
        <div className="flex h-16 items-center border-b px-4 gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden">
            <Image
              src="/homefixcareicon-removebg-preview-removebg-preview.png"
              alt="HomeFixCare"
              width={32}
              height={32}
              className="h-8 w-8 object-cover"
            />
          </div>
          <span className="truncate text-base font-semibold tracking-tight">
            HomeFixCare
          </span>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {[
            { label: "Services", href: "#services", icon: Wrench },
            { label: "How it Works", href: "#how-it-works", icon: Zap },
            { label: "Why Us", href: "#why-us", icon: Shield },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground text-muted-foreground"
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          ))}

          <Separator className="my-4" />

          {/* Auth Section De-cluttered */}
          <Link
            href="/login"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-accent text-muted-foreground"
          >
            <LogIn className="h-4 w-4 shrink-0" />
            <span>Sign In</span>
          </Link>
          <Link
            href="/register"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-accent text-muted-foreground"
          >
            <PlusCircle className="h-4 w-4 shrink-0" />
            <span>Register</span>
          </Link>
        </div>

        <div className="p-3 border-t">
          <div className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-muted-foreground">
            <span>Theme</span>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* ───── Mobile Menu FAB (System Standard) ───── */}
      {!isMobileMenuOpen && (
        <Button
          size="icon"
          onClick={() => setIsMobileMenuOpen(true)}
          className="fixed bottom-6 left-6 z-40 h-14 w-14 rounded-lg shadow-2xl bg-primary text-primary-foreground hover:bg-primary/90 md:hidden transition-all hover:scale-105 active:scale-95 border-2 border-background"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      )}

      {/* ───── Hero Section ───── */}
      <section className="relative pt-20 pb-12 md:pt-28 md:pb-16 overflow-hidden">
        {/* Subtle background elements */}
        <div className="absolute inset-0 bg-linear-to-b from-primary/3 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 left-10 h-[400px] w-[400px] bg-primary/5 rounded-full blur-[100px] opacity-60 pointer-events-none" />

        <div className="container max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="text-left space-y-6 animate-in fade-in slide-in-from-left duration-1000">
              <div className="space-y-3">
                <Badge
                  variant="secondary"
                  className="px-3 py-1 text-xs font-bold bg-primary/10 text-primary border-primary/20 rounded-md"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-2" />
                  India&apos;s Trusted Home Services
                </Badge>

                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] text-foreground">
                  Expert Home Services,
                  <br />
                  <span className="text-primary">Simplified</span>
                </h1>

                <p className="max-w-lg text-lg md:text-xl text-muted-foreground font-medium leading-relaxed">
                  Join 25,000+ happy homeowners. Connect with verified pros for
                  all your plumbing, electrical, and cleaning needs.
                </p>
              </div>

              {/* Refined Search */}
              <div className="relative group max-w-lg">
                <div className="relative flex items-center p-1.5 rounded-md bg-card border shadow-xl">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                    <Input
                      placeholder="What service do you need?"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="pl-10 h-12 border-none bg-transparent focus-visible:ring-0 text-base"
                    />
                  </div>
                  <Button
                    onClick={handleSearch}
                    className="h-12 px-6 rounded-md font-bold"
                  >
                    Search
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pt-1.5 mr-1">
                    Popular:
                  </span>
                  {["Cleaning", "AC Service", "Plumbing"].map((term) => (
                    <button
                      key={term}
                      onClick={() => {
                        setSearchQuery(term);
                        router.push(
                          `/customer/services?search=${encodeURIComponent(term)}`,
                        );
                      }}
                      className="px-3 py-1 rounded-md text-xs font-medium border bg-muted/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative hidden lg:block animate-in fade-in duration-1000 delay-200">
              <div className="relative aspect-4/5 w-full max-w-sm mx-auto rounded-md overflow-hidden border shadow-2xl">
                <Image
                  src="/hero_landing_page.png"
                  alt="Modern Home Interior"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/10 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 p-4 bg-background/95 backdrop-blur-md rounded-md border border-border shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Quality Assured</p>
                      <p className="text-xs text-muted-foreground font-medium">
                        Verified professional pros
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Stats Strip ───── */}
      <section className="border-y bg-muted/30 py-6 md:py-8">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                value: "1,200+",
                label: "Verified Pros",
                icon: Users,
                color: "text-blue-600",
              },
              {
                value: "25k+",
                label: "Jobs Completed",
                icon: CheckCircle,
                color: "text-emerald-600",
              },
              {
                value: "99.8%",
                label: "Satisfaction",
                icon: TrendingUp,
                color: "text-purple-600",
              },
              {
                value: "< 2 Hrs",
                label: "Avg Response",
                icon: Clock,
                color: "text-orange-600",
              },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-3">
                <div
                  className={cn(
                    "h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0",
                    stat.color,
                  )}
                >
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Service Categories ───── */}
      <section id="services" className="py-8 md:py-12">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-3 md:mb-4 gap-2">
            <div>
              <Badge variant="outline" className="mb-3">
                <Wrench className="h-3 w-3 mr-1.5" />
                Categories
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Services We Offer
              </h2>
              <p className="mt-2 text-muted-foreground max-w-lg">
                Browse our wide range of home services performed by vetted,
                insured professionals.
              </p>
            </div>
            <Link href="/customer/services">
              <Button variant="outline">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={`/customer/services?search=${cat.name}`}
              >
                <Card className="group hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
                  <CardContent className="p-5 flex items-start gap-4">
                    <div
                      className={cn(
                        "h-12 w-12 rounded-md border flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                        cat.color,
                      )}
                    >
                      <cat.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
                        {cat.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {cat.desc}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0 mt-0.5" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Featured Services ───── */}
      {isLoadingServices ? (
        <section className="py-8 md:py-12 bg-muted/20">
          <div className="container max-w-6xl mx-auto px-4 text-center">
            <div className="flex flex-col items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground italic">
                Finding the best services for you...
              </p>
            </div>
          </div>
        </section>
      ) : featuredServices.length > 0 ? (
        <section className="py-8 md:py-12 bg-muted/20">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="text-center mb-3 md:mb-4">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                Top-Rated Services
              </h2>
              <p className="text-muted-foreground">
                Handpicked services with excellent customer reviews
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredServices.slice(0, 6).map((service) => (
                <Card
                  key={service.id}
                  className="group hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
                  onClick={() =>
                    router.push(`/customer/services/${service.id}`)
                  }
                >
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                          {service.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {service.provider?.businessName}
                        </p>
                      </div>
                      {service.provider?.isVerified && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 shrink-0"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {service.description}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-foreground">
                          {Number(service.rating || 0).toFixed(1)}
                        </span>
                        <span>({service.totalReviews || 0})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{service.provider?.city || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{service.estimateDuration || 30}m</span>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold flex items-center">
                        <IndianRupee className="h-4 w-4" />
                        {service.price}
                      </span>
                      <Button size="sm" variant="secondary" className="h-8">
                        Book Now
                        <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link href="/customer/services">
                <Button variant="outline" size="lg">
                  Browse All Services
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* ───── How It Works ───── */}
      <section id="how-it-works" className="py-8 md:py-12">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="text-center mb-4 md:mb-6">
            <Badge variant="outline" className="mb-3">
              <Play className="h-3 w-3 mr-1.5" />
              How It Works
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Book a Service in 3 Steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Search & Select",
                desc: "Browse services or search for what you need. Compare providers, reviews, and prices.",
                icon: Search,
                color:
                  "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
              },
              {
                step: "2",
                title: "Pick a Time Slot",
                desc: "Choose a convenient date and time that fits your schedule. Real-time availability.",
                icon: Calendar,
                color:
                  "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800",
              },
              {
                step: "3",
                title: "Get It Done",
                desc: "A verified professional arrives on time and completes the work to your satisfaction.",
                icon: CheckCircle,
                color:
                  "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
              },
            ].map((step) => (
              <Card key={step.step} className="text-center border-dashed">
                <CardContent className="pt-8 pb-6 px-6 flex flex-col items-center">
                  <div
                    className={cn(
                      "h-16 w-16 rounded-md border flex items-center justify-center mb-5",
                      step.color,
                    )}
                  >
                    <step.icon className="h-7 w-7" />
                  </div>
                  <div className="text-xs font-bold text-muted-foreground mb-2">
                    STEP {step.step}
                  </div>
                  <CardTitle className="text-lg mb-2">{step.title}</CardTitle>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Why Choose Us ───── */}
      <section
        id="why-us"
        className="py-8 md:py-16 bg-primary dark:bg-muted/50 text-primary-foreground dark:text-foreground transition-colors duration-300"
      >
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-4 md:mb-6">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Why HomeFixCare?
            </h2>
            <p className="text-primary-foreground/70 max-w-lg mx-auto">
              We&apos;re not just another marketplace. Here&apos;s what sets us
              apart.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: "Verified Pros",
                desc: "Every provider undergoes background verification and skill assessment before joining.",
                icon: Shield,
              },
              {
                title: "Secure Payments",
                desc: "Your payment is protected. Pay only when you're satisfied with the service.",
                icon: CreditCard,
              },
              {
                title: "On-Time Guarantee",
                desc: "Professionals arrive within the booked time slot, every time.",
                icon: Clock,
              },
              {
                title: "24/7 Support",
                desc: "Our support team is available round the clock for any assistance.",
                icon: HeadphonesIcon,
              },
            ].map((item) => (
              <Card
                key={item.title}
                className="bg-white/10 border-white/10 text-white hover:bg-white/15 transition-colors"
              >
                <CardContent className="p-6 space-y-3">
                  <div className="h-11 w-11 rounded-md bg-white/15 flex items-center justify-center">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">
                    {item.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Testimonials ───── */}
      <section className="py-8 md:py-12">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-4 md:mb-6">
            <Badge variant="outline" className="mb-3">
              <Star className="h-3 w-3 mr-1.5 fill-yellow-400 text-yellow-400" />
              Testimonials
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              What Our Customers Say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                name: "Priya Sharma",
                role: "Homeowner, Mumbai",
                text: "The electrician arrived on time and fixed all the issues in one visit. Very professional service. Will definitely use again!",
                rating: 5,
              },
              {
                name: "Rajesh Kumar",
                role: "Apartment Owner, Delhi",
                text: "Booked a deep cleaning service and was amazed by the quality. The team was thorough, polite, and left the place spotless.",
                rating: 5,
              },
              {
                name: "Anita Desai",
                role: "Villa Owner, Bangalore",
                text: "Finally, a platform where I can trust the service providers. The verification process gives me peace of mind every time.",
                rating: 5,
              },
            ].map((testimonial) => (
              <Card
                key={testimonial.name}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="py-0 space-y-3">
                  <Quote className="h-8 w-8 text-primary/20" />
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    &ldquo;{testimonial.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: testimonial.rating }).map(
                      (_, index) => (
                        <Star
                          key={index}
                          className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400"
                        />
                      ),
                    )}
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                        {testimonial.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold">
                        {testimonial.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Trust Badges ───── */}
      <section className="py-12 border-y bg-muted/20">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Shield, label: "Background Verified" },
              { icon: Award, label: "Quality Assured" },
              { icon: CreditCard, label: "Secure Payments" },
              { icon: HeadphonesIcon, label: "24/7 Support" },
            ].map((badge) => (
              <div
                key={badge.label}
                className="flex flex-col items-center gap-2 text-center"
              >
                <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                  <badge.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground">
                  {badge.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Provider CTA ───── */}
      <section className="py-8 md:py-12">
        <div className="container max-w-5xl mx-auto px-4">
          <Card className="bg-muted/30 border-dashed overflow-hidden">
            <CardContent className="p-8 md:p-12 text-center space-y-6 relative">
              <div className="absolute top-4 right-4 opacity-5 pointer-events-none">
                <Wrench className="h-40 w-40" />
              </div>
              <Badge variant="secondary">
                <Users className="h-3 w-3 mr-1.5" />
                For Service Providers
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Grow Your Business With Us
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Join 1,200+ verified professionals earning more with
                HomeFixCare. Get access to a steady stream of customers in your
                area.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Link href="/register?role=provider">
                  <Button size="lg" className="px-8">
                    Apply as Provider
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="px-8">
                    Sign In
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ───── Footer ───── */}
      <footer className="border-t bg-muted/10 pt-8 pb-6">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="space-y-4">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/homefixcareicon-removebg-preview-removebg-preview.png"
                  alt="HomeFixCare"
                  width={28}
                  height={28}
                  className="h-7 w-7"
                />
                <span className="text-lg font-bold">HomeFixCare</span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Connecting homeowners with verified professionals for quality
                home services.
              </p>
            </div>
            {[
              {
                title: "Services",
                links: ["Cleaning", "Electrical", "Plumbing", "Painting"],
              },
              {
                title: "Company",
                links: ["About Us", "Careers", "Partners", "Contact"],
              },
              {
                title: "Legal",
                links: [
                  "Privacy Policy",
                  "Terms of Use",
                  "Cookie Policy",
                  "Vendor Policy",
                ],
              },
            ].map((group) => (
              <div key={group.title}>
                <h4 className="font-semibold text-sm mb-4">{group.title}</h4>
                <ul className="space-y-2.5">
                  {group.links.map((link) => (
                    <li key={link}>
                      <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        {link}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <Separator className="mb-6" />

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} HomeFixCare. All rights reserved.
            </p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              Back to Top
              <ArrowRight className="h-3 w-3 -rotate-90" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
