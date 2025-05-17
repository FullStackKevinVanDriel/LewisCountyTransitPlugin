import { useState, useEffect } from "react";

// This hook provides the current date and time in Pacific Time Zone
// in the format YYYY-MM-DD and HH:MM respectively.
// It uses the `toLocaleString` method to format the date and time
// according to the specified time zone and options.
// The date is formatted as YYYY-MM-DD and the time is formatted as HH:MM in 24-hour format.
// The hook returns an object containing the formatted date and time.
// The date and time are updated when the component using this hook mounts.
// The date and time are formatted using the `toLocaleString` method
// with the specified time zone and options.

interface DateTime {
  departureDate: string;
  departureTime: string;
}

const useDynamicDateTime = (): DateTime => {
  const [departureDate, setDepartureDate] = useState<string>("");
  const [departureTime, setDepartureTime] = useState<string>("");

  useEffect(() => {
    const now = new Date();
    const pacificOptions = { timeZone: "America/Los_Angeles" };
    const date = now
      .toLocaleString("en-CA", {
        ...pacificOptions,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      .split(", ")[0]
      .split("/")
      .join("-");
    const time = now
      .toLocaleString("en-US", {
        ...pacificOptions,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      .replace(" ", "");
    setDepartureDate(date);
    setDepartureTime(time);
  }, []);

  return { departureDate, departureTime };
};

export default useDynamicDateTime;
