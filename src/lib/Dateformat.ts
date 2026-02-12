interface DateFormatOptions {
  isTiming?: boolean; // optional: page/component name
}

const SHOW_TIME = false;

export const formatDate = (
  date: string | Date,
  options?: DateFormatOptions
): string => {
  const d = new Date(date);

  if (isNaN(d.getTime())) {
    throw new Error("formatDate: Invalid date value");
  }

  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();

  let result = `${day}/${month}/${year}`;

  const includeTime = SHOW_TIME && options?.isTiming === true;

  if (includeTime) {
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "pm" : "am";

    hours = hours % 12 || 12;
    result += ` ${hours}:${minutes} ${ampm}`;
  }
  return result;
};
