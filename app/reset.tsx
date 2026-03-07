// app/reset.tsx
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { supabase } from "../lib/supabaseClient";

export default function Reset() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  // When the reset link opens the app, Supabase will set a session automatically.
  // This screen just updates the password for the currently-authenticated user.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        Alert.alert(
          "Reset link not detected",
          "Please open the password reset link from your email again."
        );
        router.replace("/auth");
      }
    });
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
});