"use client";

import { useEffect, useRef, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	MapPin,
	Search,
	LocateFixed,
	Check,
	Loader2,
	Trash2,
	Navigation,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationPickerModalProps {
	readonly isOpen: boolean;
	readonly onClose: () => void;
	readonly initialLatitude?: number | null;
	readonly initialLongitude?: number | null;
	readonly initialAddress?: string;
	readonly initialCity?: string;
	readonly initialCountry?: string;
	readonly onConfirm: (location: {
		latitude: number | null;
		longitude: number | null;
		address?: string;
		city?: string;
		country?: string;
	}) => void;
}

interface SearchResult {
	place_id: number;
	display_name: string;
	lat: string;
	lon: string;
	address?: {
		city?: string;
		town?: string;
		village?: string;
		state?: string;
		country?: string;
	};
}

function loadLeaflet(): Promise<any> {
	if (typeof window === "undefined") return Promise.reject();
	if ((window as any).L) return Promise.resolve((window as any).L);

	return new Promise((resolve, reject) => {
		if (!document.getElementById("leaflet-css")) {
			const link = document.createElement("link");
			link.id = "leaflet-css";
			link.rel = "stylesheet";
			link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
			document.head.appendChild(link);
		}

		const existingScript = document.getElementById("leaflet-js") as HTMLScriptElement;
		if (existingScript) {
			existingScript.addEventListener("load", () => resolve((window as any).L));
			return;
		}

		const script = document.createElement("script");
		script.id = "leaflet-js";
		script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
		script.async = true;
		script.onload = () => resolve((window as any).L);
		script.onerror = reject;
		document.body.appendChild(script);
	});
}

export function LocationPickerModal({
	isOpen,
	onClose,
	initialLatitude,
	initialLongitude,
	initialAddress,
	initialCity,
	initialCountry,
	onConfirm,
}: LocationPickerModalProps) {
	const mapContainerRef = useRef<HTMLDivElement>(null);
	const mapInstanceRef = useRef<any>(null);
	const markerRef = useRef<any>(null);

	const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
		initialLatitude && initialLongitude
			? { lat: initialLatitude, lng: initialLongitude }
			: null,
	);
	const [resolvedAddress, setResolvedAddress] = useState<string>(
		initialAddress || (initialCity ? `${initialCity}, ${initialCountry || "Ghana"}` : ""),
	);
	const [city, setCity] = useState<string>(initialCity || "");
	const [country, setCountry] = useState<string>(initialCountry || "Ghana");

	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [isLocating, setIsLocating] = useState(false);
	const [isMapReady, setIsMapReady] = useState(false);

	// Initialize coords on modal open
	useEffect(() => {
		if (isOpen) {
			if (initialLatitude && initialLongitude) {
				setCoords({ lat: initialLatitude, lng: initialLongitude });
			}
			if (initialAddress) {
				setResolvedAddress(initialAddress);
			}
		}
	}, [isOpen, initialLatitude, initialLongitude, initialAddress]);

	// Initialize Leaflet map inside modal
	useEffect(() => {
		if (!isOpen) {
			setIsMapReady(false);
			if (mapInstanceRef.current) {
				mapInstanceRef.current.remove();
				mapInstanceRef.current = null;
				markerRef.current = null;
			}
			return;
		}

		let isCancelled = false;

		const timer = setTimeout(() => {
			loadLeaflet()
				.then((L) => {
					if (isCancelled || !mapContainerRef.current) return;

					if (mapInstanceRef.current) {
						mapInstanceRef.current.remove();
						mapInstanceRef.current = null;
						markerRef.current = null;
					}

					// Default center: Accra, Ghana or current coords
					const defaultLat = coords?.lat ?? 5.6037;
					const defaultLng = coords?.lng ?? -0.187;
					const defaultZoom = coords ? 15 : 12;

					const map = L.map(mapContainerRef.current, {
						center: [defaultLat, defaultLng],
						zoom: defaultZoom,
						zoomControl: false,
					});

					L.control.zoom({ position: "bottomright" }).addTo(map);

					// OpenStreetMap Standard Tiles (reliable and no API key required)
					L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
						attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
						maxZoom: 19,
					}).addTo(map);

					mapInstanceRef.current = map;

					const pinIcon = L.divIcon({
						className: "custom-event-pin",
						html: `<div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;background:#ca0808;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #ffffff;box-shadow:0 6px 14px rgba(0,0,0,0.38);cursor:grab;"><div style="width:10px;height:10px;background:#ffffff;border-radius:50%;transform:rotate(45deg);"></div></div>`,
						iconSize: [36, 36],
						iconAnchor: [18, 36],
					});

					// Reverse geocode helper
					const fetchReverseGeocode = async (lat: number, lng: number) => {
						try {
							const res = await fetch(
								`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
							);
							if (res.ok) {
								const data = await res.json();
								if (data?.display_name) {
									setResolvedAddress(data.display_name);
								}
								if (data?.address) {
									const extractedCity =
										data.address.city ||
										data.address.town ||
										data.address.village ||
										data.address.state ||
										"";
									if (extractedCity) setCity(extractedCity);
									if (data.address.country) setCountry(data.address.country);
								}
							}
						} catch {
							// Silently ignore reverse geocode failures
						}
					};

					// If coords already existed, drop marker
					if (coords) {
						const marker = L.marker([coords.lat, coords.lng], {
							icon: pinIcon,
							draggable: true,
						}).addTo(map);

						marker.on("dragend", (event: any) => {
							const pos = event.target.getLatLng();
							setCoords({ lat: pos.lat, lng: pos.lng });
							fetchReverseGeocode(pos.lat, pos.lng);
						});

						markerRef.current = marker;
					}

					// Click on map to place/move marker
					map.on("click", (e: any) => {
						const { lat, lng } = e.latlng;
						setCoords({ lat, lng });

						if (markerRef.current) {
							markerRef.current.setLatLng([lat, lng]);
						} else {
							const newMarker = L.marker([lat, lng], {
								icon: pinIcon,
								draggable: true,
							}).addTo(map);

							newMarker.on("dragend", (event: any) => {
								const pos = event.target.getLatLng();
								setCoords({ lat: pos.lat, lng: pos.lng });
								fetchReverseGeocode(pos.lat, pos.lng);
							});

							markerRef.current = newMarker;
						}

						fetchReverseGeocode(lat, lng);
					});

					// Invalidate size to guarantee perfect rendering inside the modal
					setTimeout(() => {
						map.invalidateSize();
						setIsMapReady(true);
					}, 250);
				})
				.catch((err) => {
					console.error("Failed to load map:", err);
				});
		}, 150);

		return () => {
			isCancelled = true;
			clearTimeout(timer);
		};
	}, [isOpen]);

	// Handle location search with OSM Nominatim
	const handleSearch = async (e?: React.FormEvent) => {
		if (e) e.preventDefault();
		if (!searchQuery.trim()) return;

		setIsSearching(true);
		try {
			const res = await fetch(
				`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(
					searchQuery,
				)}`,
			);
			if (res.ok) {
				const results: SearchResult[] = await res.json();
				setSearchResults(results.slice(0, 5));
			}
		} catch (err) {
			console.error("Search failed:", err);
		} finally {
			setIsSearching(false);
		}
	};

	// Select a search result
	const handleSelectResult = (result: SearchResult) => {
		const lat = parseFloat(result.lat);
		const lng = parseFloat(result.lon);

		setCoords({ lat, lng });
		setResolvedAddress(result.display_name);

		const resultCity =
			result.address?.city ||
			result.address?.town ||
			result.address?.village ||
			result.address?.state ||
			"";
		if (resultCity) setCity(resultCity);
		if (result.address?.country) setCountry(result.address.country);

		setSearchResults([]);
		setSearchQuery("");

		if (mapInstanceRef.current && (window as any).L) {
			const L = (window as any).L;
			mapInstanceRef.current.flyTo([lat, lng], 16, { duration: 1.2 });

			if (markerRef.current) {
				markerRef.current.setLatLng([lat, lng]);
			} else {
				const pinIcon = L.divIcon({
					className: "custom-event-pin",
					html: `<div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;background:#ca0808;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #ffffff;box-shadow:0 6px 14px rgba(0,0,0,0.38);cursor:grab;"><div style="width:10px;height:10px;background:#ffffff;border-radius:50%;transform:rotate(45deg);"></div></div>`,
					iconSize: [36, 36],
					iconAnchor: [18, 36],
				});

				const newMarker = L.marker([lat, lng], {
					icon: pinIcon,
					draggable: true,
				}).addTo(mapInstanceRef.current);

				markerRef.current = newMarker;
			}
		}
	};

	// Use user's current GPS location
	const handleUseCurrentLocation = () => {
		if (!navigator.geolocation) return;

		setIsLocating(true);
		navigator.geolocation.getCurrentPosition(
			async (position) => {
				const lat = position.coords.latitude;
				const lng = position.coords.longitude;

				setCoords({ lat, lng });

				if (mapInstanceRef.current && (window as any).L) {
					const L = (window as any).L;
					mapInstanceRef.current.flyTo([lat, lng], 16, { duration: 1.2 });

					if (markerRef.current) {
						markerRef.current.setLatLng([lat, lng]);
					} else {
						const pinIcon = L.divIcon({
							className: "custom-event-pin",
							html: `<div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;background:#ca0808;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #ffffff;box-shadow:0 6px 14px rgba(0,0,0,0.38);cursor:grab;"><div style="width:10px;height:10px;background:#ffffff;border-radius:50%;transform:rotate(45deg);"></div></div>`,
							iconSize: [36, 36],
							iconAnchor: [18, 36],
						});

						const newMarker = L.marker([lat, lng], {
							icon: pinIcon,
							draggable: true,
						}).addTo(mapInstanceRef.current);

						markerRef.current = newMarker;
					}
				}

				try {
					const res = await fetch(
						`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
					);
					if (res.ok) {
						const data = await res.json();
						if (data?.display_name) setResolvedAddress(data.display_name);
						if (data?.address?.city) setCity(data.address.city);
						if (data?.address?.country) setCountry(data.address.country);
					}
				} catch {
					// Ignore geocode error
				} finally {
					setIsLocating(false);
				}
			},
			() => {
				setIsLocating(false);
			},
			{ timeout: 10000 },
		);
	};

	// Clear pin
	const handleClearPin = () => {
		setCoords(null);
		setResolvedAddress("");
		if (markerRef.current && mapInstanceRef.current) {
			mapInstanceRef.current.removeLayer(markerRef.current);
			markerRef.current = null;
		}
	};

	// Confirm selection
	const handleConfirm = () => {
		if (coords) {
			onConfirm({
				latitude: coords.lat,
				longitude: coords.lng,
				address: resolvedAddress,
				city,
				country,
			});
		} else {
			onConfirm({
				latitude: null,
				longitude: null,
			});
		}
		onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-2xl sm:max-w-3xl p-0 gap-0 overflow-hidden border border-border shadow-2xl rounded-2xl">
				<DialogHeader className="p-4 sm:p-5 border-b border-border bg-card/60">
					<DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
						<MapPin className="size-5 text-primary" />
						Pin Event Location
					</DialogTitle>
					<DialogDescription className="text-xs text-muted-foreground">
						Click anywhere on the map, drag the pin, or search for a venue to set the location.
					</DialogDescription>
				</DialogHeader>

				{/* Search & Location Bar */}
				<div className="p-3 bg-muted/40 border-b border-border flex flex-col sm:flex-row gap-2 relative z-20">
					<form onSubmit={handleSearch} className="flex-1 flex gap-1.5 relative">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
							<Input
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Search venue, landmark, or street name..."
								className="pl-9 h-9 text-xs bg-background"
							/>
						</div>
						<Button
							type="submit"
							size="sm"
							variant="secondary"
							disabled={isSearching}
							className="h-9 px-3 text-xs font-medium"
						>
							{isSearching ? <Loader2 className="size-3.5 animate-spin" /> : "Search"}
						</Button>

						{/* Search Autocomplete Dropdown */}
						{searchResults.length > 0 && (
							<div className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden max-h-56 overflow-y-auto">
								{searchResults.map((result) => (
									<button
										key={result.place_id}
										type="button"
										onClick={() => handleSelectResult(result)}
										className="w-full text-left px-3.5 py-2.5 text-xs text-foreground hover:bg-primary/10 hover:text-primary transition-colors border-b border-border/40 last:border-0 flex items-start gap-2"
									>
										<Navigation className="size-3.5 mt-0.5 text-primary shrink-0" />
										<span className="line-clamp-2 leading-relaxed font-medium">
											{result.display_name}
										</span>
									</button>
								))}
							</div>
						)}
					</form>

					<Button
						type="button"
						size="sm"
						variant="outline"
						onClick={handleUseCurrentLocation}
						disabled={isLocating}
						className="h-9 px-3 text-xs gap-1.5 shrink-0 bg-background"
					>
						{isLocating ? (
							<Loader2 className="size-3.5 animate-spin" />
						) : (
							<LocateFixed className="size-3.5 text-primary" />
						)}
						<span>Current Location</span>
					</Button>
				</div>

				{/* Map Viewport */}
				<div className="relative w-full h-[360px] sm:h-[420px] bg-muted/30">
					<div ref={mapContainerRef} className="w-full h-full z-10" />

					{!isMapReady && (
						<div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/80 backdrop-blur-xs gap-2">
							<Loader2 className="size-6 text-primary animate-spin" />
							<span className="text-xs text-muted-foreground font-medium">
								Loading interactive map...
							</span>
						</div>
					)}
				</div>

				{/* Selected Location Summary (no technical lat/long shown) */}
				<div className="p-3 sm:px-5 bg-card border-t border-border flex items-center justify-between gap-3">
					<div className="flex items-center gap-2.5 min-w-0">
						<div
							className={cn(
								"size-7 rounded-full flex items-center justify-center shrink-0",
								coords ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
							)}
						>
							<MapPin className="size-3.5" />
						</div>
						<div className="min-w-0">
							<p className="text-xs font-semibold text-foreground truncate">
								{coords ? "Location pinned on map" : "No pin selected yet"}
							</p>
							<p className="text-[11px] text-muted-foreground truncate">
								{coords && resolvedAddress
									? resolvedAddress
									: coords
										? "Coordinates selected. You can drag the pin to adjust."
										: "Click on the map or search to place a pin."}
							</p>
						</div>
					</div>

					{coords && (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={handleClearPin}
							className="h-8 px-2.5 text-xs text-muted-foreground hover:text-destructive shrink-0"
						>
							<Trash2 className="size-3.5 mr-1" />
							<span>Clear</span>
						</Button>
					)}
				</div>

				{/* Footer Actions */}
				<DialogFooter className="p-3 sm:p-4 bg-muted/20 border-t border-border flex items-center justify-end gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={onClose}
						className="h-9 px-4 text-xs"
					>
						Cancel
					</Button>
					<Button
						type="button"
						size="sm"
						onClick={handleConfirm}
						className="h-9 px-5 text-xs font-semibold gap-1.5"
					>
						<Check className="size-3.5" />
						<span>Confirm Location</span>
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
