import Link from "next/link";
import { ShieldX, Home, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <ShieldX className="h-10 w-10 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
          <CardDescription>
            You don&apos;t have permission to access this page. Please contact
            your administrator if you believe this is an error.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This page requires specific permissions that your current account
            doesn&apos;t have.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Link href="/" className="w-full">
            <Button className="w-full" variant="default">
              <Home className="mr-2 h-4 w-4" />
              Go to Home
            </Button>
          </Link>
          <Link href="/login" className="w-full">
            <Button className="w-full" variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Login with Different Account
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
