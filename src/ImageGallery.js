import React from 'react';

const images = require.context('./images/icons', true);
const imageList = images.keys().reduce((acc, image) => {
  const imageName = image.replace('./', ''); // Remove the './' prefix
  acc[imageName] = images(image);
  return acc;
}, {});

export default imageList;
