import { useCallback, useEffect, useRef, useState } from 'react'

type Status = 'idle' | 'loading' | 'granted' | 'denied' | 'error' | 'unsupported'
type Coordinates = { latitude: number; longitude: number }

export function useUserLocation() {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const mounted = useRef(false)

  const request = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unsupported')
      setError('Location is unavailable. Choose a city instead.')
      return
    }
    setStatus('loading')
    setError(null)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (!mounted.current) return
        setCoordinates({ latitude: coords.latitude, longitude: coords.longitude })
        setStatus('granted')
      },
      (failure) => {
        if (!mounted.current) return
        setCoordinates(null)
        setStatus(failure.code === 1 ? 'denied' : 'error')
        setError(failure.message || 'Could not get location. Choose a city instead.')
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 },
    )
  }, [])

  useEffect(() => {
    mounted.current = true
    request()
    return () => { mounted.current = false }
  }, [request])

  return { coordinates, status, error, request }
}
