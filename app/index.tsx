import { Redirect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { supabase } from "../lib/supabaseClient";

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(!!data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSignedIn(!!session);
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.root}>
        <LinearGradient colors={["#0F0C29", "#1a1a4e", "#24243e"]} style={StyleSheet.absoluteFillObject} />
      </View>
    );
  }

  // If logged in -> go to tabs. If not -> go to auth screen.
  return signedIn ? <Redirect href="/(tabs)" /> : <Redirect href="/auth" />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0F0C29",
  },
});
