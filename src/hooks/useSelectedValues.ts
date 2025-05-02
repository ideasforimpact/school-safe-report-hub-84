
interface ConfigItem {
  id: string;
  name: string;
}

export function useSelectedValues(
  categoryId: string,
  locationId: string,
  facilityId: string,
  categories: ConfigItem[],
  locations: ConfigItem[],
  facilities: ConfigItem[]
) {
  // Helper functions for display/lookup
  const getSelectedCategory = () => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : '';
  };

  const getSelectedLocation = () => {
    const location = locations.find(loc => loc.id === locationId);
    return location ? location.name : '';
  };

  const getSelectedFacility = () => {
    const facility = facilities.find(fac => fac.id === facilityId);
    return facility ? facility.name : '';
  };

  return {
    getSelectedCategory,
    getSelectedLocation,
    getSelectedFacility
  };
}
