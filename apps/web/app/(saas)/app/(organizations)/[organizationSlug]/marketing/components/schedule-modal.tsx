"use client";

import { useState } from "react";
import {
	format,
	addHours,
	setHours,
	setMinutes,
	isBefore,
	startOfDay,
} from "date-fns";
import { es } from "date-fns/locale";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { Button } from "@ui/components/button";
import { Calendar } from "@ui/components/calendar";
import { Label } from "@ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Badge } from "@ui/components/badge";
import {
	Clock,
	Calendar as CalendarIcon,
	Instagram,
	Facebook,
	Sparkles,
	Loader2,
	Sun,
	Sunset,
	Moon,
} from "lucide-react";
import { toast } from "sonner";

interface ScheduleModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	postId?: string;
	platform?: string;
	onScheduled?: (scheduledAt: Date) => void;
}

// Horas sugeridas con contexto
const suggestedTimes = [
	{
		time: "09:00",
		label: "Mañana",
		icon: Sun,
		description: "Inicio del día",
	},
	{
		time: "12:00",
		label: "Mediodía",
		icon: Sun,
		description: "Pausa almuerzo",
	},
	{
		time: "14:00",
		label: "Tarde",
		icon: Sunset,
		description: "Post-almuerzo",
	},
	{
		time: "18:00",
		label: "Fin del día",
		icon: Sunset,
		description: "Salida trabajo",
	},
	{
		time: "20:00",
		label: "Noche",
		icon: Moon,
		description: "Máximo engagement",
	},
	{
		time: "21:00",
		label: "Prime time",
		icon: Moon,
		description: "Hora pico redes",
	},
];

// Mejores horarios por plataforma
const bestTimes: Record<string, string[]> = {
	instagram: ["12:00", "18:00", "21:00"],
	facebook: ["09:00", "13:00", "16:00"],
	stories: ["08:00", "12:00", "20:00"],
	tiktok: ["19:00", "21:00", "22:00"],
};

export function ScheduleModal({
	open,
	onOpenChange,
	postId,
	platform = "instagram",
	onScheduled,
}: ScheduleModalProps) {
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(
		addHours(new Date(), 1),
	);
	const [selectedHour, setSelectedHour] = useState("12");
	const [selectedMinute, setSelectedMinute] = useState("00");
	const [isScheduling, setIsScheduling] = useState(false);

	// Generar opciones de hora
	const hours = Array.from({ length: 24 }, (_, i) =>
		i.toString().padStart(2, "0"),
	);
	const minuteOptions = ["00", "15", "30", "45"];

	// Fecha y hora combinadas
	const getScheduledDateTime = (): Date | null => {
		if (!selectedDate) return null;

		let dateTime = new Date(selectedDate);
		dateTime = setHours(dateTime, parseInt(selectedHour));
		dateTime = setMinutes(dateTime, parseInt(selectedMinute));

		return dateTime;
	};

	const scheduledDateTime = getScheduledDateTime();
	const isValidDateTime =
		scheduledDateTime && !isBefore(scheduledDateTime, new Date());

	// Seleccionar hora sugerida
	const selectSuggestedTime = (time: string) => {
		const [hour, minute] = time.split(":");
		setSelectedHour(hour);
		setSelectedMinute(minute);
	};

	// Programar
	const handleSchedule = async () => {
		if (!scheduledDateTime || !isValidDateTime) {
			toast.error("Selecciona una fecha y hora válida");
			return;
		}

		setIsScheduling(true);

		try {
			if (postId) {
				// Actualizar post existente
				const response = await fetch(
					`/api/marketing/generated-posts/${postId}`,
					{
						method: "PATCH",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							status: "scheduled",
							scheduledAt: scheduledDateTime.toISOString(),
						}),
					},
				);

				if (!response.ok) throw new Error("Failed to schedule");
			}

			toast.success(
				`Programado para ${format(scheduledDateTime, "d 'de' MMMM 'a las' HH:mm", { locale: es })}`,
			);

			onScheduled?.(scheduledDateTime);
			onOpenChange(false);
		} catch (error) {
			console.error(error);
			toast.error("Error al programar");
		} finally {
			setIsScheduling(false);
		}
	};

	const platformBestTimes = bestTimes[platform] || bestTimes.instagram;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
				{/* Header con gradiente */}
				<div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
					<DialogHeader>
						<DialogTitle className="text-xl text-white flex items-center gap-2">
							<CalendarIcon className="h-5 w-5" />
							Programar publicación
						</DialogTitle>
						<DialogDescription className="text-blue-100">
							Elige cuándo quieres que se publique tu contenido
						</DialogDescription>
					</DialogHeader>
				</div>

				<div className="p-6 space-y-6">
					{/* Calendario */}
					<div className="flex justify-center">
						<Calendar
							mode="single"
							selected={selectedDate}
							onSelect={setSelectedDate}
							disabled={(date) =>
								isBefore(
									startOfDay(date),
									startOfDay(new Date()),
								)
							}
							locale={es}
							className="rounded-xl border"
						/>
					</div>

					{/* Selector de hora */}
					<div className="space-y-3">
						<Label className="text-sm font-medium">
							Hora de publicación
						</Label>

						<div className="flex gap-2 items-center">
							<Select
								value={selectedHour}
								onValueChange={setSelectedHour}
							>
								<SelectTrigger className="w-24">
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="max-h-48">
									{hours.map((h) => (
										<SelectItem key={h} value={h}>
											{h}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							<span className="text-xl font-bold text-gray-400">
								:
							</span>

							<Select
								value={selectedMinute}
								onValueChange={setSelectedMinute}
							>
								<SelectTrigger className="w-24">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{minuteOptions.map((m) => (
										<SelectItem key={m} value={m}>
											{m}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							<div className="flex-1 text-right">
								{scheduledDateTime && isValidDateTime && (
									<Badge
										variant="secondary"
										className="text-sm"
									>
										{format(
											scheduledDateTime,
											"EEEE d MMM",
											{ locale: es },
										)}
									</Badge>
								)}
							</div>
						</div>
					</div>

					{/* Horas sugeridas */}
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<Label className="text-sm font-medium">
								Horas sugeridas
							</Label>
							<div className="flex items-center gap-1 text-xs text-gray-500">
								{platform === "instagram" && (
									<Instagram className="h-3 w-3" />
								)}
								{platform === "facebook" && (
									<Facebook className="h-3 w-3" />
								)}
								Mejor para {platform}
							</div>
						</div>

						<div className="grid grid-cols-3 gap-2">
							{suggestedTimes.map((item) => {
								const Icon = item.icon;
								const isBest = platformBestTimes.includes(
									item.time,
								);
								const isSelected =
									`${selectedHour}:${selectedMinute}` ===
									item.time;

								return (
									<button
										key={item.time}
										onClick={() =>
											selectSuggestedTime(item.time)
										}
										className={`relative p-3 rounded-xl border-2 text-left transition-all ${
											isSelected
												? "border-blue-500 bg-blue-50"
												: "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
										}`}
									>
										{isBest && (
											<div className="absolute -top-1 -right-1">
												<Sparkles className="h-4 w-4 text-amber-500" />
											</div>
										)}
										<div className="flex items-center gap-2">
											<Icon
												className={`h-4 w-4 ${isSelected ? "text-blue-600" : "text-gray-400"}`}
											/>
											<span
												className={`font-semibold ${isSelected ? "text-blue-600" : "text-gray-700"}`}
											>
												{item.time}
											</span>
										</div>
										<p className="text-xs text-gray-500 mt-1">
											{item.label}
										</p>
									</button>
								);
							})}
						</div>
					</div>

					{/* Aviso si la hora ya pasó */}
					{scheduledDateTime && !isValidDateTime && (
						<div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
							⚠️ Esta hora ya pasó. Selecciona una hora futura.
						</div>
					)}
				</div>

				<DialogFooter className="p-6 pt-0 gap-2">
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						className="rounded-xl"
					>
						Cancelar
					</Button>
					<Button
						onClick={handleSchedule}
						disabled={!isValidDateTime || isScheduling}
						className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
					>
						{isScheduling ? (
							<>
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								Programando...
							</>
						) : (
							<>
								<Clock className="h-4 w-4 mr-2" />
								Programar
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

