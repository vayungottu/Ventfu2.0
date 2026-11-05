import { useCallback, useEffect, useState } from "react"

export type LocationStatus = "idle" | "prompting" | "granted" | "denied" | "unsupported"

export function useUserLocation() {
  const [status, setStatus] = useState<LocationStatus>("idle")
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null)
  const [label, setLabel] = useState<string>("")

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("unsupported")
      return
    }

    setStatus("prompting")
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setLabel("Near you")
        setStatus("granted")
      },
      () => setStatus("denied"),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    )
  }, [])

  useEffect(() => {
    request()
  }, [request])

  return { status, coordinates, label, request }
}
