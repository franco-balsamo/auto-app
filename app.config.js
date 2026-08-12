module.exports = {
  expo: {
    name: "auto-app",
    slug: "auto-app",
    version: "0.1.0",
    orientation: "portrait",
    scheme: "autoapp",
    userInterfaceStyle: "automatic",
    icon: "./assets/icon.png",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#23262B",
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.balsamote96.autoapp",
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "Usamos tu ubicación para mostrarte talleres, gomerías y lavaderos cercanos.",
        NSCameraUsageDescription:
          "Usamos la cámara para fotografiar facturas y documentación del vehículo (cédula, seguro, VTV).",
        NSPhotoLibraryUsageDescription:
          "Accedemos a tus fotos para adjuntar facturas y documentación del vehículo (cédula, seguro, VTV).",
      },
    },
    android: {
      package: "com.balsamote96.autoapp",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#23262B",
      },
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
      permissions: [
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.CAMERA",
        "android.permission.READ_MEDIA_IMAGES",
        "android.permission.RECORD_AUDIO",
      ],
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "Usamos tu ubicación para mostrarte talleres cercanos.",
        },
      ],
      [
        "expo-image-picker",
        {
          photosPermission:
            "Accedemos a tus fotos para adjuntar facturas y documentación del vehículo.",
          cameraPermission:
            "Usamos la cámara para fotografiar facturas y documentación del vehículo.",
        },
      ],
    ],
    extra: {
      eas: {
        projectId: "82c65977-0b55-4439-bc75-8be897bff06d",
      },
    },
    owner: "fbalsamo",
    runtimeVersion: {
      policy: "appVersion",
    },
    updates: {
      url: "https://u.expo.dev/82c65977-0b55-4439-bc75-8be897bff06d",
    },
  },
};
