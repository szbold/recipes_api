export const generateImageName = (originalName: string) =>
  "images/" + new Date().toISOString() + originalName;

// TODO - implement image resizing to a set size without changing dimensions, nice to also include webp format
