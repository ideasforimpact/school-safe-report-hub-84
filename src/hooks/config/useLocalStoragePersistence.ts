
import { useEffect } from 'react';
import { ConfigState } from './types';

export function useLocalStoragePersistence(configState: ConfigState) {
  const {
    categories,
    subcategoryMappings,
    locations,
    facilities,
    designations,
    campuses,
    classes,
    sections
  } = configState;

  // Save data to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('subcategories', JSON.stringify(subcategoryMappings));
  }, [subcategoryMappings]);

  useEffect(() => {
    localStorage.setItem('locations', JSON.stringify(locations));
  }, [locations]);

  useEffect(() => {
    localStorage.setItem('facilities', JSON.stringify(facilities));
  }, [facilities]);

  useEffect(() => {
    localStorage.setItem('designations', JSON.stringify(designations));
  }, [designations]);
  
  useEffect(() => {
    localStorage.setItem('campuses', JSON.stringify(campuses));
  }, [campuses]);
  
  useEffect(() => {
    localStorage.setItem('classes', JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem('sections', JSON.stringify(sections));
  }, [sections]);
}
