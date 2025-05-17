"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, Search, Loader2 } from "lucide-react";
import {
  GoogleMap,
  LoadScript,
  DirectionsRenderer,
  Marker,
} from "@react-google-maps/api";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
  Suggestion,
} from "use-places-autocomplete";
import useDynamicDateTime from "./dynamicdatetime";

const center = { lat: 46.5538, lng: -122.8154 };
const LIBRARIES: "places"[] = ["places"];

interface LocationInputsProps {
  onSelectFrom: (latLng: google.maps.LatLngLiteral) => void;
  onSelectTo: (latLng: google.maps.LatLngLiteral) => void;
  onError: (error: string | null) => void;
}

function LocationInputs({
  onSelectFrom,
  onSelectTo,
  onError,
}: LocationInputsProps) {
  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");
  const [fromSuggestions, setFromSuggestions] = useState<Suggestion[]>([]);
  const [toSuggestions, setToSuggestions] = useState<Suggestion[]>([]);
  const [isLoadingFrom, setIsLoadingFrom] = useState(false);
  const [isLoadingTo, setIsLoadingTo] = useState(false);
  const [isFromFocused, setIsFromFocused] = useState(false);
  const [isToFocused, setIsToFocused] = useState(false);

  const fromAutocomplete = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: { country: "us" },
      bounds: {
        north: 46.8538,
        south: 46.2538,
        east: -122.5154,
        west: -123.1154,
      },
    },
    debounce: 300,
  });

  const toAutocomplete = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: { country: "us" },
      bounds: {
        north: 46.7671,
        south: 46.3839,
        east: -121.6788,
        west: -123.2733,
      },
    },
    debounce: 300,
  });

  useEffect(() => {
    if (typeof google === "undefined" || !google.maps || !google.maps.places) {
      onError("Google Maps API not loaded.");
      return;
    }
    setFromSuggestions(fromAutocomplete.suggestions.data);
    setToSuggestions(toAutocomplete.suggestions.data);
  }, [fromAutocomplete.suggestions, toAutocomplete.suggestions, onError]);

  const handleFromSelect = async (address: string) => {
    if (!fromAutocomplete.ready) {
      onError("Google Maps Places API not ready yet.");
      return;
    }
    setFromValue(address); // Ensure the input updates immediately
    fromAutocomplete.setValue(address, false);
    fromAutocomplete.clearSuggestions();
    setIsFromFocused(false);
    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      onSelectFrom({ lat, lng });
      onError(null);
    } catch (error) {
      onError("Failed to geocode starting location.");
    }
  };

  const handleToSelect = async (address: string) => {
    if (!toAutocomplete.ready) {
      onError("Google Maps Places API not ready yet.");
      return;
    }
    setToValue(address); // Ensure the input updates immediately
    toAutocomplete.setValue(address, false);
    toAutocomplete.clearSuggestions();
    setIsToFocused(false);
    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      onSelectTo({ lat, lng });
      onError(null);
    } catch (error) {
      onError("Failed to geocode destination.");
    }
  };

  const handleCurrentLocation = async (type: "from" | "to") => {
    if (navigator.geolocation) {
      if (type === "from") setIsLoadingFrom(true);
      if (type === "to") setIsLoadingTo(true);
      if (type === "from") setFromValue("Searching...");
      if (type === "to") setToValue("Searching...");

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const latLng = { lat: latitude, lng: longitude };
          if (type === "from") onSelectFrom(latLng);
          if (type === "to") onSelectTo(latLng);

          try {
            const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
            );
            const data = await response.json();
            if (data.status === "OK" && data.results.length > 0) {
              const formattedAddress = data.results[0].formatted_address;
              if (type === "from") setFromValue(formattedAddress);
              if (type === "to") setToValue(formattedAddress);
            } else {
              if (type === "from") setFromValue("Address not found");
              if (type === "to") setToValue("Address not found");
            }
            onError(null);
          } catch (error) {
            if (type === "from") setFromValue("Error fetching address");
            if (type === "to") setToValue("Error fetching address");
            onError("Failed to fetch address.");
          } finally {
            if (type === "from") setIsLoadingFrom(false);
            if (type === "to") setIsLoadingTo(false);
            if (type === "from") setIsFromFocused(false);
            if (type === "to") setIsToFocused(false);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          if (type === "from") setFromValue("");
          if (type === "to") setToValue("");
          onError("Failed to get current location. Check browser permissions.");
          if (type === "from") setIsLoadingFrom(false);
          if (type === "to") setIsLoadingTo(false);
          if (type === "from") setIsFromFocused(false);
          if (type === "to") setIsToFocused(false);
        }
      );
    } else {
      onError("Geolocation is not supported by this browser.");
      if (type === "from") setFromValue("");
      if (type === "to") setToValue("");
      if (type === "from") setIsLoadingFrom(false);
      if (type === "to") setIsLoadingTo(false);
      if (type === "from") setIsFromFocused(false);
      if (type === "to") setIsToFocused(false);
    }
  };

  return (
    <div className="space-y-4 mb-6">
      <div className="flex items-center space-x-4">
        <MapPin className="text-blue-600 h-5 w-5 flex-shrink-0" />
        <div className="flex-1 relative">
          <label
            htmlFor="from"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            From
          </label>
          <div className="relative">
            <input
              type="text"
              id="from"
              value={fromValue}
              onChange={(e) => {
                setFromValue(e.target.value);
                fromAutocomplete.setValue(e.target.value);
                setFromSuggestions(fromAutocomplete.suggestions.data);
              }}
              onFocus={() => setIsFromFocused(true)}
              onBlur={() => {
                setTimeout(() => setIsFromFocused(false), 200);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
              placeholder="Enter starting location"
              disabled={isLoadingFrom}
            />
            {isLoadingFrom && (
              <Loader2
                className="absolute right-3 top-2.5 h-5 w-5 text-blue-600 animate-spin"
                style={{ animation: "spin 1s linear infinite" }}
              />
            )}
          </div>
          {(fromSuggestions.length > 0 || isFromFocused) &&
            fromAutocomplete.ready &&
            !isLoadingFrom && (
              <div className="mt-2 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                <ul>
                  {fromSuggestions.map((suggestion) => (
                    <li
                      key={suggestion.place_id}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleFromSelect(suggestion.description)}
                    >
                      {suggestion.description}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleCurrentLocation("from")}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-2 rounded-b-md hover:bg-blue-700"
                  disabled={isLoadingFrom}
                >
                  <MapPin className="h-5 w-5" />
                  <span>My Location</span>
                </button>
              </div>
            )}
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <MapPin className="text-blue-600 h-5 w-5 flex-shrink-0" />
        <div className="flex-1 relative">
          <label
            htmlFor="to"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            To
          </label>
          <div className="relative">
            <input
              type="text"
              id="to"
              value={toValue}
              onChange={(e) => {
                const value = e.target.value;
                setToValue(value);
                toAutocomplete.setValue(value);
              }}
              onFocus={() => setIsToFocused(true)}
              onBlur={() => {
                setTimeout(() => setIsToFocused(false), 200);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
              placeholder="Enter destination for your trip"
              disabled={isLoadingTo}
            />
            {isLoadingTo && (
              <Loader2
                className="absolute right-3 top-2.5 h-5 w-5 text-blue-600 animate-spin"
                style={{ animation: "spin 1s linear infinite" }}
              />
            )}
          </div>
          {(toSuggestions.length > 0 || isToFocused) && !isLoadingTo && (
            <div className="mt-2 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              <ul>
                {toSuggestions.map((suggestion) => (
                  <li
                    key={suggestion.place_id}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleToSelect(suggestion.description)}
                  >
                    {suggestion.description}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleCurrentLocation("to")}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-2 rounded-b-md hover:bg-blue-700"
                disabled={isLoadingTo}
              >
                <MapPin className="h-5 w-5" />
                <span>My Location</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [selectedFrom, setSelectedFrom] =
    useState<google.maps.LatLngLiteral | null>(null);
  const [selectedTo, setSelectedTo] =
    useState<google.maps.LatLngLiteral | null>(null);
  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { departureDate, departureTime } = useDynamicDateTime();
  const [userDepartureDate, setUserDepartureDate] =
    useState<string>(departureDate);
  const [userDepartureTime, setUserDepartureTime] =
    useState<string>(departureTime);

  useEffect(() => {
    setUserDepartureDate(departureDate);
    setUserDepartureTime(departureTime);
  }, [departureDate, departureTime]);

  const handleFindRoutes = () => {
    if (!selectedFrom || !selectedTo) {
      setError("Please select both starting location and destination.");
      return;
    }
    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      {
        origin: selectedFrom,
        destination: selectedTo,
        travelMode: google.maps.TravelMode.TRANSIT,
        transitOptions: {
          departureTime:
            userDepartureDate && userDepartureTime
              ? new Date(`${userDepartureDate}T${userDepartureTime}`)
              : new Date(),
        },
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
          setError(null);
        } else {
          console.error("Transit directions failed due to " + status);
          directionsService.route(
            {
              origin: selectedFrom,
              destination: selectedTo,
              travelMode: google.maps.TravelMode.DRIVING,
            },
            (fallbackResult, fallbackStatus) => {
              if (
                fallbackStatus === google.maps.DirectionsStatus.OK &&
                fallbackResult
              ) {
                setDirections(fallbackResult);
                setError(
                  "No transit routes available. Showing driving directions instead."
                );
              } else {
                console.error(
                  "Driving directions failed due to " + fallbackStatus
                );
                setError("Failed to find routes.");
              }
            }
          );
        }
      }
    );
  };

  return (
    <main className="container mx-auto px-4 py-8">
      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-6">Plan Your Trip</h2>
          {scriptLoaded ? (
            <LocationInputs
              onSelectFrom={setSelectedFrom}
              onSelectTo={setSelectedTo}
              onError={setError}
            />
          ) : (
            <p>Loading map...</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center space-x-4">
              <Calendar className="text-blue-600 h-5 w-5 flex-shrink-0" />
              <div className="flex-1">
                <label
                  htmlFor="date"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  value={userDepartureDate}
                  onChange={(e) => setUserDepartureDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Clock className="text-blue-600 h-5 w-5 flex-shrink-0" />
              <div className="flex-1">
                <label
                  htmlFor="time"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Time
                </label>
                <input
                  type="time"
                  id="time"
                  value={userDepartureTime}
                  onChange={(e) => setUserDepartureTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          <button
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
            onClick={handleFindRoutes}
          >
            <Search className="h-5 w-5" />
            <span>Find Routes</span>
          </button>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6 h-[600px]">
          <LoadScript
            googleMapsApiKey={
              window.trpSettings && window.trpSettings.apiKey
                ? window.trpSettings.apiKey
                : import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""
            }
            libraries={LIBRARIES}
            onLoad={() => setScriptLoaded(true)}
            onError={() => setError("Failed to load Google Maps API.")}
          >
            <GoogleMap
              mapContainerClassName="w-full h-full rounded-lg"
              center={center}
              zoom={11}
            >
              {selectedFrom && <Marker position={selectedFrom} />}
              {selectedTo && <Marker position={selectedTo} />}
              {directions && <DirectionsRenderer directions={directions} />}
            </GoogleMap>
          </LoadScript>
        </div>
      </div>
    </main>
  );
}

export default App;
