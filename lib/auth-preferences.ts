import AsyncStorage from "@react-native-async-storage/async-storage";

const REMEMBER_ME_KEY = "splititup-remember-me";

export async function getRememberMePreference() {
  return (await AsyncStorage.getItem(REMEMBER_ME_KEY)) === "true";
}

export async function setRememberMePreference(value: boolean) {
  await AsyncStorage.setItem(REMEMBER_ME_KEY, value ? "true" : "false");
}
