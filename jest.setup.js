// AsyncStorage is a native module, so anything that imports the settings store — which is
// most of the app — needs its Jest mock. The package ships one.
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
