"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@repo/auth/client";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { toast } from "sonner";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Step 1: User name
  const [userName, setUserName] = useState("");
  
  // Step 2: Organization
  const [orgName, setOrgName] = useState("");

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      toast.error("Por favor ingresa tu nombre");
      return;
    }
    
    setIsLoading(true);
    try {
      // Update user name
      await authClient.updateUser({
        name: userName.trim(),
      });
      setStep(2);
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Error al guardar el nombre");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || orgName.trim().length < 3) {
      toast.error("El nombre de la organización debe tener al menos 3 caracteres");
      return;
    }
    
    setIsLoading(true);
    try {
      // Generate slug from org name
      const slug = orgName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 32);
      
      // Ensure slug is unique by adding timestamp
      const uniqueSlug = `${slug}-${Date.now().toString(36)}`;
      
      // Create organization
      const { data: newOrg, error } = await authClient.organization.create({
        name: orgName.trim(),
        slug: uniqueSlug,
      });

      if (error) {
        throw new Error(error.message || "Error creating organization");
      }

      if (!newOrg) {
        throw new Error("No se pudo crear la organización");
      }

      // Set as active organization
      await authClient.organization.setActive({
        organizationId: newOrg.id,
      });

      // Mark onboarding as complete
      await authClient.updateUser({
        onboardingComplete: true,
      });

      toast.success("¡Organización creada exitosamente!");
      
      // Redirect to dashboard
      router.push(`/app/${newOrg.slug}/marketing/dashboard`);
      
    } catch (error: any) {
      console.error("Error creating organization:", error);
      toast.error(error.message || "Error al crear la organización");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {step === 1 ? "Bienvenido a MarketingOS" : "Crea tu organización"}
          </CardTitle>
          <CardDescription>
            {step === 1 
              ? "Cuéntanos un poco sobre ti" 
              : "Tu espacio de trabajo para automatizar tu marketing"}
          </CardDescription>
          <div className="flex justify-center gap-2 mt-4">
            <div className={`h-2 w-16 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`h-2 w-16 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          </div>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Tu nombre
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Guardando..." : "Continuar"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleStep2Submit} className="space-y-4">
              <div>
                <label htmlFor="orgName" className="block text-sm font-medium mb-2">
                  Nombre de tu empresa u organización
                </label>
                <Input
                  id="orgName"
                  type="text"
                  placeholder="Mi Empresa"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Mínimo 3 caracteres
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setStep(1)}
                  disabled={isLoading}
                >
                  Atrás
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? "Creando..." : "Crear y continuar"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
