import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * A custom React hook to handle location search with autocomplete suggestions.
 * @param {function} onPlaceSelect - A callback function that is triggered when a place is selected.
 * It receives an object with { lat, lon, name }.
 */
export function useSearch(onPlaceSelect) {
  // State for the search input's current text
  const [searchTerm, setSearchTerm] = useState('');
  // State to hold the array of suggestion objects from the API
  const [suggestions, setSuggestions] = useState([]);
  // State to track the currently highlighted suggestion for keyboard navigation
  const [activeIndex, setActiveIndex] = useState(-1);
  // State to control the visibility of the suggestions dropdown
  const [showSuggestions, setShowSuggestions] = useState(false);
  // A ref to the suggestions container DOM element to detect outside clicks
  const suggestionsRef = useRef(null);

  /**
   * A utility function to delay the execution of a function.
   * This prevents sending an API request on every single keystroke.
   * @param {function} func - The function to debounce.
   * @param {number} delay - The delay in milliseconds.
   */
  const debounce = (func, delay) => {
    let timeout;
    return function(...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), delay);
    };
  };

  /**
   * Fetches place suggestions from the Nominatim (OpenStreetMap) API.
   * The query is biased towards India since the map is centered on Pune.
   */
  const fetchSuggestions = useCallback(async (query) => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      // Using Nominatim API for geocoding search
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&viewbox=68.1,6.5,97.4,35.5&bounded=1`
      );
      const data = await response.json();
      setSuggestions(data);
      setActiveIndex(-1); // Reset active index on new suggestions
      setShowSuggestions(true); // Show suggestions dropdown
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, []);

  // Creates a debounced version of the fetch function to avoid excessive API calls
  const debouncedFetch = useCallback(debounce(fetchSuggestions, 300), [fetchSuggestions]);

  /**
   * Handles the 'onChange' event of the search input field.
   * Updates the search term and calls the debounced fetch function.
   */
  const handleChange = (e) => {
    setSearchTerm(e.target.value);
    debouncedFetch(e.target.value);
  };

  /**
   * Finalizes the selection of a place.
   * Updates the search bar text, hides the suggestions, and calls the onPlaceSelect callback.
   * @param {object} place - The place object selected from the suggestions.
   */
  const selectPlace = (place) => {
    if (!place) return;
    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);
    setSearchTerm(place.display_name); // Update input with the full name
    setSuggestions([]);
    setShowSuggestions(false); // Hide the dropdown
    if (onPlaceSelect) {
      onPlaceSelect({ lat, lon, name: place.display_name });
    }
  };

  /**
   * Handles keyboard events for navigating and selecting suggestions.
   * - ArrowDown: Move selection down
   * - ArrowUp: Move selection up
   * - Enter: Select the highlighted suggestion
   * - Escape: Close the suggestions dropdown
   */
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        selectPlace(suggestions[activeIndex]);
      } else if (suggestions.length > 0) {
        // If user hits Enter without navigating, select the first result
        selectPlace(suggestions[0]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  /**
   * Handles the click event for the "Go" button.
   * Selects the active suggestion or the first one if none is active.
   */
  const handleGoClick = () => {
    if (activeIndex >= 0 && activeIndex < suggestions.length) {
      selectPlace(suggestions[activeIndex]);
    } else if (suggestions.length > 0) {
      selectPlace(suggestions[0]);
    }
  };

  // An effect to detect clicks outside of the suggestions list to close it.
  useEffect(() => {
    const handleClickOutside = (event) => {
      // If the click is outside the element referenced by suggestionsRef, hide the dropdown.
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    // Cleanup function to remove the event listener when the component unmounts.
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Return all the necessary state and handlers for the UI component to use.
  return {
    searchTerm,
    suggestions,
    activeIndex,
    suggestionsRef,
    showSuggestions,
    handleChange,
    handleKeyDown,
    selectPlace,
    handleGoClick,
  };
}
