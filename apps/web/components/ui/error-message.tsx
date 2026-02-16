"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@ui/components/button";

interface ErrorMessageProps {
	title?: string;
	message: string;
	onRetry?: () => void;
}

export function ErrorMessage({ title = "Algo salió mal", message, onRetry }: ErrorMessageProps) {
	return (
		<div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-xl p-6 text-center">
			<div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
				<AlertCircle className="w-6 h-6 text-red-500 dark:text-red-400" />
			</div>
			<h3 className="font-semibold text-red-800 dark:text-red-200 mb-1">{title}</h3>
			<p className="text-red-600 dark:text-red-300 text-sm mb-4">{message}</p>
			{onRetry && (
				<Button
					onClick={onRetry}
					variant="outline"
					className="border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
				>
					<RefreshCw className="w-4 h-4 mr-2" />
					Intentar de nuevo
				</Button>
			)}
		</div>
	);
}







