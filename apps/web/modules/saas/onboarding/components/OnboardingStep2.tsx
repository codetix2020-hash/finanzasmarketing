"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@repo/auth/client";
import {
	organizationListQueryKey,
	useCreateOrganizationMutation,
} from "@saas/organizations/lib/api";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { useRouter } from "@shared/hooks/router";
import { clearCache } from "@shared/lib/cache";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@ui/components/form";
import { Input } from "@ui/components/input";
import { ArrowRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
	name: z.string().min(3).max(32),
});

type FormValues = z.infer<typeof formSchema>;

export function OnboardingStep2({ onCompleted }: { onCompleted: () => void }) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const { setActiveOrganization } = useActiveOrganization();
	const createOrganizationMutation = useCreateOrganizationMutation();
	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
		},
	});

	const onSubmit: SubmitHandler<FormValues> = async ({ name }) => {
		form.clearErrors("root");

		try {
			// Crear la organización
			const newOrganization = await createOrganizationMutation.mutateAsync({
				name,
			});

			if (!newOrganization) {
				throw new Error("Failed to create organization");
			}

			// Establecer como organización activa
			await setActiveOrganization(newOrganization.slug);

			// Invalidar queries para refrescar datos
			await queryClient.invalidateQueries({
				queryKey: organizationListQueryKey,
			});

			// Marcar onboarding como completo
			await authClient.updateUser({
				onboardingComplete: true,
			});

			// Limpiar cache
			await clearCache();

			// Redirigir al dashboard de marketing
			router.replace(`/app/${newOrganization.slug}/marketing/dashboard`);
		} catch (error: any) {
			console.error("Error creating organization:", error);
			const errorMessage = error?.message || t("organizations.createForm.notifications.error");
			form.setError("root", {
				type: "server",
				message: errorMessage,
			});
			toast.error(errorMessage);
		}
	};

	return (
		<div>
			<Form {...form}>
				<form
					className="flex flex-col items-stretch gap-8"
					onSubmit={form.handleSubmit(onSubmit)}
				>
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("organizations.createForm.name")}
								</FormLabel>
								<FormControl>
									<Input 
										{...field} 
										placeholder="Mi Empresa"
										autoComplete="organization"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<Button 
						type="submit" 
						loading={form.formState.isSubmitting}
					>
						{t("onboarding.continue")}
						<ArrowRightIcon className="ml-2 size-4" />
					</Button>
				</form>
			</Form>
		</div>
	);
}

