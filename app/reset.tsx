import { router } from "expo-router";
import * as Linking from "expo-linking";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { supabase } from "../lib/supabaseClient";

export default function Reset() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);

  useEffect(() => {
    const establishRecoverySession = async (url?: string | null) => {
      try {
        const incomingUrl = url ?? (await Linking.getInitialURL());

        if (incomingUrl) {
          const hash = incomingUrl.includes("#") ? incomingUrl.split("#")[1] : "";
          const query = incomingUrl.includes("?")
            ? incomingUrl.split("?")[1].split("#")[0]
            : "";

          const hashParams = new URLSearchParams(hash);
          const queryParams = new URLSearchParams(query);

          const accessToken =
            hashParams.get("access_token") ?? queryParams.get("access_token");
          const refreshToken =
            hashParams.get("refresh_token") ?? queryParams.get("refresh_token");
          const recoveryType =
            hashParams.get("type") ?? queryParams.get("type");

          if (recoveryType === "recovery" && accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              throw error;
            }
          }
        }

        const { data } = await supabase.auth.getSession();

        if (!data.session) {
          Alert.alert(
            "Reset link not detected",
            "Please open the password reset link from your email again."
          );
          router.replace("/auth");
        }
      } catch (error: any) {
        Alert.alert(
          "Reset link error",
          error?.message ?? "We could not verify your password reset link."
        );
        router.replace("/auth");
      } finally {
        setCheckingLink(false);
      }
    };

    establishRecoverySession();

    const subscription = Linking.addEventListener("url", ({ url }) => {
      establishRecoverySession(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleUpdatePassword = async () => {
    if (password.length < 6) {
      Alert.alert("Password too short", "Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      Alert.alert("Passwords do not match", "Please type the same password twice.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      Alert.alert("Update failed", error.message);
      return;
    }

    Alert.alert("Success", "Your password has been updated. Please sign in.");
    await supabase.auth.signOut(); // optional: force fresh login
    router.replace("/auth");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set New Password</Text>

      {checkingLink ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#111" />
          <Text style={styles.loadingText}>Verifying your reset link...</Text>
        </View>
      ) : (
        <>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="New password"
            secureTextEntry
            style={styles.input}
          />
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Confirm new password"
            secureTextEntry
            style={styles.input}
          />

          <Pressable onPress={handleUpdatePassword} style={styles.button} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? "Updating..." : "Update Password"}</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 16, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  button: {
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#111",
  },
  buttonText: { color: "white", fontWeight: "600" },
  loadingWrap: { alignItems: "center", paddingVertical: 20 },
  loadingText: { marginTop: 12, color: "#555", fontSize: 14 },
});
