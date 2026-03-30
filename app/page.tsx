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
  Wallet,
  Star,
  ArrowRight,
  CheckCircle,
  MapPin,
  IndianRupee,
  Calendar,
  HeadphonesIcon,
  Zap,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api, API_ENDPOINTS } from "@/lib/api";

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

const CATEGORY_COLORS: Record<string, string> = {
  Electrical: "bg-amber-500",
  Plumbing: "bg-blue-500",
  Cleaning: "bg-green-500",
  "AC Repair": "bg-cyan-500",
  Carpentry: "bg-orange-500",
  Painting: "bg-pink-500",
  General: "bg-slate-500",
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Electrical: Zap,
  Plumbing: Wrench,
  Cleaning: Sparkles,
  "AC Repair": Clock,
  Carpentry: null,
  Painting: null,
  General: Star,
};

export default function LandingPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredServices, setFeaturedServices] = useState<Service[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get<{ categories: Category[] }>(
          API_ENDPOINTS.CATEGORIES,
        );
        setCategories(response.categories?.slice(0, 9) || []);
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
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/homefixcareicon-removebg-preview-removebg-preview.png"
              alt="HomeFixCare"
              width={40}
              height={40}
              className="h-10 w-10"
            />
            <span className="text-xl font-bold hidden sm:block">
              HomeFixCare
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link
              href="#services"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Services
            </Link>
            <Link
              href="#how-it-works"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              How it Works
            </Link>
            <Link
              href="#why-us"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Why Us
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6">
              <Sparkles className="mr-1 h-3 w-3" />
              Trusted Home Services Platform
            </Badge>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl md:text-6xl lg:text-7xl max-w-3xl">
              Your Home,
              <br />
              Our Expertise
            </h1>
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl max-w-2xl">
              Connect with verified professionals for all your home service
              needs. Quick, reliable, and affordable services at your doorstep.
            </p>

            {/* Search Bar */}
            <div className="mt-10 flex flex-col sm:flex-row gap-3 w-full max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="What service do you need?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="h-12 pl-12 text-base"
                />
              </div>
              <Button onClick={handleSearch} size="lg" className="h-12 px-8">
                Search
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="mt-12 grid grid-cols-3 gap-8 sm:gap-12 w-full max-w-lg">
              <div className="flex flex-col items-center">
                <p className="text-3xl sm:text-4xl font-bold">500+</p>
                <p className="text-sm text-muted-foreground text-center mt-1">
                  Verified Pros
                </p>
              </div>
              <div className="flex flex-col items-center">
                <p className="text-3xl sm:text-4xl font-bold">10K+</p>
                <p className="text-sm text-muted-foreground text-center mt-1">
                  Happy Customers
                </p>
              </div>
              <div className="flex flex-col items-center">
                <p className="text-3xl sm:text-4xl font-bold">4.8</p>
                <p className="text-sm text-muted-foreground text-center mt-1">
                  Avg Rating
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="services" className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              <Wrench className="mr-1 h-3 w-3" />
              Categories
            </Badge>
            <h2 className="text-3xl font-black sm:text-4xl">
              Browse by Category
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Find the perfect service provider for your specific needs
            </p>
          </div>

          {isLoadingCategories ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {[...Array(9)].map((_, i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
                  <Skeleton className="h-5 w-3/4 mx-auto mb-2" />
                  <Skeleton className="h-4 w-full" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {categories.map((category) => {
                const Icon = CATEGORY_ICONS[category.name] || Star;
                const bgColor =
                  CATEGORY_COLORS[category.name] || "bg-slate-500";

                return (
                  <Link
                    key={category.id}
                    href={`/customer/services?category=${category.id}`}
                  >
                    <Card className="group hover:shadow-lg transition-all cursor-pointer">
                      <CardContent className="p-6 text-center">
                        <div
                          className={`h-16 w-16 rounded-2xl ${bgColor} mx-auto mb-4 flex items-center justify-center`}
                        >
                          {Icon && <Icon className="h-8 w-8 text-white" />}
                        </div>
                        <h3 className="font-semibold text-sm mb-1">
                          {category.name}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {category.description}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="text-center mt-10">
            <Link href="/customer/services">
              <Button size="lg" className="px-8">
                View All Services
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              <Star className="mr-1 h-3 w-3" />
              Featured
            </Badge>
            <h2 className="text-3xl font-black sm:text-4xl">
              Popular Services
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Top-rated services from our trusted providers
            </p>
          </div>

          {isLoadingServices ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-4" />
                  <Skeleton className="h-10 w-full" />
                </Card>
              ))}
            </div>
          ) : featuredServices.length === 0 ? (
            <Card className="max-w-md mx-auto">
              <CardContent className="py-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No services available</h3>
                <p className="text-sm text-muted-foreground">
                  Check back later as new providers are joining
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {featuredServices.map((service) => (
                <Card
                  key={service.id}
                  className="group hover:shadow-lg transition-all cursor-pointer"
                  onClick={() =>
                    router.push(`/customer/services/${service.id}`)
                  }
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg line-clamp-1">
                          {service.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {service.provider.businessName}
                        </p>
                      </div>
                      {service.provider.isVerified && (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                          <Shield className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {service.description}
                    </p>

                    <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium text-foreground">
                          {Number(
                            service.rating || service.provider.rating || 0,
                          ).toFixed(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{service.provider.city}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{service.estimateDuration || 30}m</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <span className="text-2xl font-bold flex items-center">
                          <IndianRupee className="h-5 w-5" />
                          {service.price}
                        </span>
                      </div>
                      <Button size="sm">Book Now</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Link href="/customer/services">
              <Button size="lg" variant="outline" className="px-8">
                Explore All Services
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              <Zap className="mr-1 h-3 w-3" />
              Simple Process
            </Badge>
            <h2 className="text-3xl font-black sm:text-4xl">How It Works</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Get your home services in just 3 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="relative inline-block">
                <div className="h-20 w-20 rounded-2xl bg-blue-500 flex items-center justify-center mx-auto mb-6">
                  <Search className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                  1
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">Search Service</h3>
              <p className="text-muted-foreground">
                Browse through our wide range of home services and find what you
                need
              </p>
            </div>

            <div className="text-center">
              <div className="relative inline-block">
                <div className="h-20 w-20 rounded-2xl bg-purple-500 flex items-center justify-center mx-auto mb-6">
                  <Calendar className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                  2
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">Book Slot</h3>
              <p className="text-muted-foreground">
                Choose your preferred date and time slot that works best for you
              </p>
            </div>

            <div className="text-center">
              <div className="relative inline-block">
                <div className="h-20 w-20 rounded-2xl bg-green-500 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                  3
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">Get Service</h3>
              <p className="text-muted-foreground">
                Verified professional arrives at your doorstep to complete the
                job
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section id="why-us" className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              <Shield className="mr-1 h-3 w-3" />
              Trust & Quality
            </Badge>
            <h2 className="text-3xl font-black sm:text-4xl">
              Why Choose HomeFixCare?
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              We're committed to providing the best home service experience
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <Card className="hover:shadow-lg transition-all">
              <CardContent className="p-6 text-center">
                <div className="h-14 w-14 rounded-xl bg-green-500 flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">Verified Providers</h3>
                <p className="text-sm text-muted-foreground">
                  All professionals are background checked and verified
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all">
              <CardContent className="p-6 text-center">
                <div className="h-14 w-14 rounded-xl bg-blue-500 flex items-center justify-center mx-auto mb-4">
                  <Wallet className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">Best Prices</h3>
                <p className="text-sm text-muted-foreground">
                  Competitive pricing with no hidden charges
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all">
              <CardContent className="p-6 text-center">
                <div className="h-14 w-14 rounded-xl bg-purple-500 flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">On-Time Service</h3>
                <p className="text-sm text-muted-foreground">
                  Punctual professionals who value your time
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all">
              <CardContent className="p-6 text-center">
                <div className="h-14 w-14 rounded-xl bg-pink-500 flex items-center justify-center mx-auto mb-4">
                  <HeadphonesIcon className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">24/7 Support</h3>
                <p className="text-sm text-muted-foreground">
                  Always here to help with any issues or concerns
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {/* <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <Card className="border-0 shadow-lg max-w-4xl mx-auto">
            <div className="bg-primary p-8 md:p-12">
              <div className="text-center text-primary-foreground">
                <h2 className="text-3xl font-black mb-4">
                  Ready to Get Started?
                </h2>
                <p className="text-primary-foreground/80 mb-8 text-lg max-w-xl mx-auto">
                  Join thousands of happy customers who trust HomeFixCare for their home services
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/register" className="flex-1 sm:flex-none">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto bg-primary-foreground text-primary hover:bg-primary-foreground/90 px-8"
                    >
                      Create Account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/customer/services" className="flex-1 sm:flex-none">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 px-8"
                    >
                      Browse Services
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section> */}

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/homefixcareicon-removebg-preview-removebg-preview.png"
                  alt="HomeFixCare"
                  width={32}
                  height={32}
                  className="h-8 w-8"
                />
                <span className="text-lg font-bold">HomeFixCare</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your trusted partner for all home service needs
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">For Customers</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="/customer/services"
                    className="hover:text-foreground transition-colors"
                  >
                    Browse Services
                  </Link>
                </li>
                <li>
                  <Link
                    href="/customer/bookings"
                    className="hover:text-foreground transition-colors"
                  >
                    My Bookings
                  </Link>
                </li>
                <li>
                  <Link
                    href="/customer/profile"
                    className="hover:text-foreground transition-colors"
                  >
                    Profile
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">For Providers</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="/register"
                    className="hover:text-foreground transition-colors"
                  >
                    Become a Provider
                  </Link>
                </li>
                <li>
                  <Link
                    href="/provider/dashboard"
                    className="hover:text-foreground transition-colors"
                  >
                    Provider Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/provider/business"
                    className="hover:text-foreground transition-colors"
                  >
                    Business Profile
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="/terms"
                    className="hover:text-foreground transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-foreground transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="hover:text-foreground transition-colors"
                  >
                    Login
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} HomeFixCare. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="/terms"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
