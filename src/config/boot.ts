// Steps listed on the start-up screen. The screen fades out once every step is marked ready.
// core / cloud / location are marked automatically by AppProvider.
// When the 3D model is added: uncomment 'model' and call markBootReady('model') from useApp() once it has loaded.
export const BOOT_STEPS = [
  { key: 'core', label: 'Starting systems' },
  { key: 'cloud', label: 'Connecting to cloud' },
  { key: 'location', label: 'Getting location' },
  // { key: 'model', label: 'Loading vehicle model' },
];
