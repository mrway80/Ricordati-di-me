"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Search,
  Menu,
  X,
  User,
  LogOut,
  Settings,
  Bell,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/app/actions/auth";

interface NavbarProps {
  user: {
    id: string;
    email: string;
    fullName: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
}

export function Navbar({ user }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const isPublicPage =
    pathname === "/" ||
    pathname === "/landing" ||
    pathname === "/come-funziona" ||
    pathname === "/principi" ||
    pathname === "/ricerca";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <nav className="content-section flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
            <Heart className="h-4.5 w-4.5" />
          </div>
          <span className="font-display text-lg font-semibold text-foreground tracking-tight">
            Ricordati di Te
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {isPublicPage && (
            <>
              <NavLink href="/come-funziona" active={pathname === "/come-funziona"}>
                Come funziona
              </NavLink>
              <NavLink href="/ricerca" active={pathname === "/ricerca"}>
                Ricerca
              </NavLink>
            </>
          )}
          {user && (
            <>
              <NavLink href="/dashboard" active={pathname === "/dashboard"}>
                Dashboard
              </NavLink>
              <NavLink href="/memoriale/crea" active={pathname === "/memoriale/crea"}>
                Crea memoriale
              </NavLink>
            </>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* Search */}
              <Button
                variant="ghost"
                size="icon"
                className="hidden sm:flex text-foreground-muted hover:text-foreground"
                
              >
                <Link href="/ricerca">
                  <Search className="h-5 w-5" />
                </Link>
              </Button>

              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className="hidden sm:flex text-foreground-muted hover:text-foreground relative"
                
              >
                <Link href="/notifiche">
                  <Bell className="h-5 w-5" />
                </Link>
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger >
                  <Button variant="ghost" className="gap-2 pl-2 pr-3 h-9">
                    <Avatar user={user} size="sm" />
                    <span className="hidden lg:inline text-sm font-medium max-w-[120px] truncate">
                      {user.displayName || user.fullName || "Utente"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center gap-2 p-2">
                    <Avatar user={user} size="md" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium truncate">
                        {user.displayName || user.fullName || "Utente"}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </span>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem >
                    <Link href="/profilo" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profilo
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem >
                    <Link href="/impostazioni" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Impostazioni
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className="text-error cursor-pointer focus:text-error"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Esci
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" >
                <Link href="/login">Accedi</Link>
              </Button>
              <Button >
                <Link href="/registrati">Registrati</Link>
              </Button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-1">
          {isPublicPage && (
            <>
              <MobileNavLink href="/come-funziona" onClick={() => setMobileOpen(false)}>
                Come funziona
              </MobileNavLink>
              <MobileNavLink href="/ricerca" onClick={() => setMobileOpen(false)}>
                Ricerca
              </MobileNavLink>
            </>
          )}
          {user ? (
            <>
              <MobileNavLink href="/dashboard" onClick={() => setMobileOpen(false)}>
                Dashboard
              </MobileNavLink>
              <MobileNavLink href="/memoriale/crea" onClick={() => setMobileOpen(false)}>
                Crea memoriale
              </MobileNavLink>
              <MobileNavLink href="/profilo" onClick={() => setMobileOpen(false)}>
                Profilo
              </MobileNavLink>
              <MobileNavLink href="/impostazioni" onClick={() => setMobileOpen(false)}>
                Impostazioni
              </MobileNavLink>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              <Button variant="outline"  className="w-full">
                <Link href="/login">Accedi</Link>
              </Button>
              <Button  className="w-full">
                <Link href="/registrati">Registrati</Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        active
          ? "bg-primary/10 text-primary"
          : "text-foreground-muted hover:text-foreground hover:bg-muted"
      }`}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-3 py-2.5 rounded-md text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-muted transition-colors"
    >
      {children}
    </Link>
  );
}

function Avatar({
  user,
  size,
}: {
  user: { fullName: string | null; displayName: string | null; avatarUrl: string | null };
  size: "sm" | "md";
}) {
  const name = user.displayName || user.fullName || "U";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const sizeClasses = size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm";

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={name}
        className={`${sizeClasses} rounded-full object-cover ring-2 ring-border`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium ring-2 ring-border`}
    >
      {initials}
    </div>
  );
}
