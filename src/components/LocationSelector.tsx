import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface LocationSelectorProps {
  onLocationSelect: (latitude: number, longitude: number) => void;
  initialLatitude?: number;
  initialLongitude?: number;
}

export default function LocationSelector({ onLocationSelect, initialLatitude, initialLongitude }: LocationSelectorProps) {
  const [latitude, setLatitude] = useState(initialLatitude?.toString() || '');
  const [longitude, setLongitude] = useState(initialLongitude?.toString() || '');
  const [loading, setLoading] = useState(false);

  const getCurrentLocation = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat.toString());
        setLongitude(lng.toString());
        onLocationSelect(lat, lng);
        setLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLoading(false);
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Classroom Location</CardTitle>
        <CardDescription>Set the location for attendance verification</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              type="number"
              step="0.000001"
              value={latitude}
              onChange={(e) => {
                setLatitude(e.target.value);
                if (longitude) {
                  onLocationSelect(parseFloat(e.target.value), parseFloat(longitude));
                }
              }}
              placeholder="0.000000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              type="number"
              step="0.000001"
              value={longitude}
              onChange={(e) => {
                setLongitude(e.target.value);
                if (latitude) {
                  onLocationSelect(parseFloat(latitude), parseFloat(e.target.value));
                }
              }}
              placeholder="0.000000"
            />
          </div>
        </div>
        <Button onClick={getCurrentLocation} disabled={loading} className="w-full">
          <MapPin className="h-4 w-4 mr-2" />
          {loading ? 'Getting Location...' : 'Use Current Location'}
        </Button>
      </CardContent>
    </Card>
  );
}
